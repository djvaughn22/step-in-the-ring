// In-browser voice capture for Story Partner. Client-only.
//
// MediaRecorder captures the original audio; the browser's own speech
// recognition (when it exists) produces a live word-for-word transcript in
// parallel. Nothing here touches the network beyond what the browser's
// built-in recognition service does on its own — no API keys, no uploads.
//
// Honest failure model: recording can succeed while transcription fails.
// The caller gets the audio either way, plus `transcript: null` and
// `transcriptionSupported` so the UI can offer the manual-transcript path.

export type RecorderState = "idle" | "requesting" | "recording" | "paused" | "stopped";

export interface RecordingResult {
  blob: Blob | null; // null when the recording was cancelled or produced nothing
  mimeType: string;
  durationMs: number;
  /** Word-for-word live transcript, or null when recognition failed/unsupported. */
  transcript: string | null;
  transcriptionSupported: boolean;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

function recognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition as new () => SpeechRecognitionLike) ??
         (w.webkitSpeechRecognition as new () => SpeechRecognitionLike) ?? null;
}

export function recordingSupported(): boolean {
  return typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia;
}

export function transcriptionSupported(): boolean {
  return recognitionCtor() !== null;
}

export class VoiceRecorder {
  state: RecorderState = "idle";
  /** Live transcript so far (finalized + interim) — for display while recording. */
  liveTranscript = "";
  private finalTranscript = "";
  private interim = "";
  private transcriptFailed = false;
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private recognition: SpeechRecognitionLike | null = null;
  private recognitionShouldRun = false;
  private chunks: Blob[] = [];
  private startedAt = 0;
  private accumulatedMs = 0;
  private onChange: () => void;

  constructor(onChange: () => void = () => {}) {
    this.onChange = onChange;
  }

  async start(): Promise<void> {
    if (this.state !== "idle") return;
    this.state = "requesting";
    this.onChange();
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      this.state = "idle";
      this.onChange();
      throw new Error("microphone-denied");
    }
    const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", ""].find(
      (t) => t === "" || MediaRecorder.isTypeSupported(t),
    );
    this.recorder = mimeType ? new MediaRecorder(this.stream, { mimeType }) : new MediaRecorder(this.stream);
    this.chunks = [];
    this.recorder.ondataavailable = (e) => { if (e.data.size > 0) this.chunks.push(e.data); };
    this.recorder.start(500);
    this.startedAt = Date.now();
    this.accumulatedMs = 0;
    this.state = "recording";
    this.startRecognition();
    this.onChange();
  }

  private startRecognition(): void {
    const Ctor = recognitionCtor();
    if (!Ctor || this.transcriptFailed) return;
    try {
      const rec = new Ctor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-US";
      rec.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const r = event.results[i];
          if (r.isFinal) this.finalTranscript += `${r[0].transcript} `;
          else interim += r[0].transcript;
        }
        this.interim = interim;
        this.liveTranscript = `${this.finalTranscript}${this.interim}`.trim();
        this.onChange();
      };
      rec.onerror = (event) => {
        // "no-speech" and "aborted" are routine; anything else means the
        // transcript can no longer claim to be word-for-word.
        if (event.error !== "no-speech" && event.error !== "aborted") {
          this.transcriptFailed = true;
          this.recognitionShouldRun = false;
          this.onChange();
        }
      };
      rec.onend = () => {
        // Recognition services stop themselves periodically — restart while recording.
        if (this.recognitionShouldRun && this.state === "recording" && !this.transcriptFailed) {
          try { rec.start(); } catch { /* already restarted elsewhere */ }
        }
      };
      this.recognition = rec;
      this.recognitionShouldRun = true;
      rec.start();
    } catch {
      this.transcriptFailed = true;
    }
  }

  private stopRecognition(abort: boolean): void {
    this.recognitionShouldRun = false;
    if (!this.recognition) return;
    try {
      if (abort) this.recognition.abort();
      else this.recognition.stop();
    } catch { /* already stopped */ }
    this.recognition = null;
  }

  pause(): void {
    if (this.state !== "recording" || !this.recorder) return;
    try { this.recorder.pause(); } catch { return; }
    this.accumulatedMs += Date.now() - this.startedAt;
    this.stopRecognition(false);
    this.state = "paused";
    this.onChange();
  }

  resume(): void {
    if (this.state !== "paused" || !this.recorder) return;
    try { this.recorder.resume(); } catch { return; }
    this.startedAt = Date.now();
    this.state = "recording";
    this.startRecognition();
    this.onChange();
  }

  /** Stop and discard everything. Nothing is kept. */
  cancel(): void {
    this.stopRecognition(true);
    try { this.recorder?.stop(); } catch { /* already stopped */ }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.chunks = [];
    this.finalTranscript = "";
    this.interim = "";
    this.liveTranscript = "";
    this.recorder = null;
    this.stream = null;
    this.state = "stopped";
    this.onChange();
  }

  /** Stop and hand back the original recording plus the live transcript. */
  finish(): Promise<RecordingResult> {
    return new Promise((resolve) => {
      const wasRecording = this.state === "recording";
      const durationMs = this.accumulatedMs + (wasRecording ? Date.now() - this.startedAt : 0);
      this.stopRecognition(false);
      const supported = transcriptionSupported();
      const settle = () => {
        this.stream?.getTracks().forEach((t) => t.stop());
        this.stream = null;
        this.state = "stopped";
        const mimeType = this.recorder?.mimeType || "audio/webm";
        const blob = this.chunks.length ? new Blob(this.chunks, { type: mimeType }) : null;
        this.recorder = null;
        const transcript = this.transcriptFailed ? null : this.finalTranscript.trim() || null;
        this.onChange();
        resolve({ blob, mimeType, durationMs, transcript, transcriptionSupported: supported });
      };
      if (!this.recorder || this.recorder.state === "inactive") {
        settle();
        return;
      }
      this.recorder.onstop = settle;
      try { this.recorder.stop(); } catch { settle(); }
    });
  }
}
