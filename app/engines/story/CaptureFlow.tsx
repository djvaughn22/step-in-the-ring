"use client";

// Tell your story — Record it / Write it.
//
// Two equal doors into one protected workflow:
//   Raw Source → Proposed Interpretation → Author Edited → Approved Fiction
//   → Manuscript. Every rule lives in the engines (source.engine.ts,
//   capture.engine.ts); this file is presentation. The author always sees
//   what is original, what was suggested, what they edited, what they
//   approved, and what stays private.

import { useEffect, useMemo, useRef, useState } from "react";
import { uid, labelFor, type StoryProject } from "./story.engine";
import {
  addAuthorDirection, addAuthorIngredient, addSourceVersion, answerQuestion,
  attachProposedDirections, attachProposedIngredients, CAPTURE_KIND_LABELS,
  currentSourceText, editDirection, editIngredient, INGREDIENT_KIND_LABELS,
  linkMapping, nextActionFor, nextQuestion, PROPOSAL_STATE_LABELS,
  rejectAllProposedDirections, savedForLater, sceneSeed, setDirectionState,
  setIngredientState, setManualTranscript, sourceStage, SOURCE_STAGE_LABELS,
  updateSourceMeta,
  type IngredientKind, type ProposalState,
  type SceneDirection, type SourceMaterial,
} from "./source.engine";
import {
  addApprovedSceneToManuscript, addSpokenSource, addTypedSource, findSource,
  updateSourceIn,
} from "./capture.engine";
import {
  addMapping, addSource as addVaultSource, createVault,
  linkSourceMaterialToMapping, SOURCE_KINDS, type SourceKind, type SourceVaultV1,
} from "./vault.engine";
import { loadVault, saveVault } from "./vault.store";
import { cachedAudio, persistAudio, storageHealth } from "./db";
import { recordingSupported, transcriptionSupported, VoiceRecorder, type RecordingResult } from "./recorder";
import type { PanelStyles } from "./StudioPanels";

interface FlowProps {
  project: StoryProject;
  card: React.CSSProperties;
  s: PanelStyles;
  persist: (next: StoryProject, message?: string) => void;
  say: (m: string) => void;
  onOpenSource: (id: string) => void;
  onOpenScene: (sceneId: string) => void;
  onOpenVault: () => void;
}

const stateChip = (state: ProposalState): React.CSSProperties => ({
  display: "inline-block", borderRadius: 999, padding: "2px 9px",
  fontSize: 11, fontWeight: 800, letterSpacing: "0.02em",
  border: "1px solid var(--line)",
  background: state === "author-approved" ? "var(--gold)" : "var(--surface)",
  color: state === "author-approved" ? "#111" : state === "rejected" ? "var(--muted)" : "inherit",
});

function fmtDuration(ms: number): string {
  const sec = Math.round(ms / 1000);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Capture — the two equal doors
// ---------------------------------------------------------------------------

export function CapturePanel({
  project, card, s, persist, say, onOpenSource,
  mode,
}: FlowProps & { mode: "record" | "write" }) {
  return mode === "record"
    ? <RecordPanel project={project} card={card} s={s} persist={persist} say={say} onOpenSource={onOpenSource} />
    : <WritePanel project={project} card={card} s={s} persist={persist} say={say} onOpenSource={onOpenSource} />;
}

type CaptureProps = Pick<FlowProps, "project" | "card" | "s" | "persist" | "say" | "onOpenSource">;

function RecordPanel({ project, card, s, persist, say, onOpenSource }: CaptureProps) {
  // The recorder instance lives in state so render reads are legal; the ref
  // mirror exists only for the unmount cleanup.
  const [recorder, setRecorder] = useState<VoiceRecorder | null>(null);
  const cleanupRef = useRef<VoiceRecorder | null>(null);
  const [, forceRender] = useState(0);
  const [result, setResult] = useState<RecordingResult | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [title, setTitle] = useState("");
  const [era, setEra] = useState("");
  const [micError, setMicError] = useState("");
  const [saving, setSaving] = useState(false);

  const supported = recordingSupported();

  useEffect(() => () => { cleanupRef.current?.cancel(); }, []);
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  const begin = async () => {
    setMicError("");
    const r = new VoiceRecorder(() => forceRender((x) => x + 1));
    cleanupRef.current = r;
    setRecorder(r);
    try {
      await r.start();
    } catch {
      cleanupRef.current = null;
      setRecorder(null);
      setMicError("The microphone was blocked. Allow microphone access for this site and try again — or switch to Write it.");
    }
  };

  const finish = async () => {
    if (!recorder) return;
    const res = await recorder.finish();
    cleanupRef.current = null;
    setRecorder(null);
    if (!res.blob) { say("Nothing was recorded."); return; }
    setResult(res);
    setAudioUrl(URL.createObjectURL(res.blob));
  };

  const cancel = () => {
    recorder?.cancel();
    cleanupRef.current = null;
    setRecorder(null);
    setResult(null);
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(""); }
    say("Recording discarded — nothing was kept.");
  };

  const save = async () => {
    if (!result?.blob || saving) return;
    setSaving(true);
    const audioId = uid();
    const stored = await persistAudio({
      id: audioId, projectId: project.id, blob: result.blob,
      mimeType: result.mimeType, durationMs: result.durationMs,
      createdAt: new Date().toISOString(),
    });
    const made = addSpokenSource(project, {
      title,
      audioId,
      audioMimeType: result.mimeType,
      audioDurationMs: result.durationMs,
      transcript: result.transcript,
      transcriptSupported: result.transcriptionSupported,
      era,
    });
    persist(
      made.project,
      stored
        ? "Recording saved — the original audio and transcript are preserved exactly."
        : "Source saved — but this browser could not store the audio durably. The transcript is safe; export a backup soon.",
    );
    setSaving(false);
    onOpenSource(made.source.id);
  };

  // ---- review screen after finishing ----
  if (result) {
    return (
      <div style={card}>
        <p style={s.kicker}>Record it — review before saving</p>
        <audio controls src={audioUrl} style={{ width: "100%", marginBottom: 10 }} />
        <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 8px" }}>
          {fmtDuration(result.durationMs)} · the original recording is preserved exactly as spoken.
        </p>
        {result.transcript ? (
          <>
            <span style={s.label}>Word-for-word transcript (raw — you can correct it after saving)</span>
            <pre style={s.verbatim}>{result.transcript}</pre>
          </>
        ) : (
          <p style={s.help}>
            {result.transcriptionSupported
              ? "Transcription didn't work this time. The recording is safe — after saving, you can type the word-for-word transcript yourself."
              : "This browser can't transcribe speech. The recording is safe — after saving, you can type the word-for-word transcript yourself."}
          </p>
        )}
        <span style={s.label}>Working title (optional)</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The porch conversation" style={s.input} />
        <div style={{ marginTop: 8 }}>
          <input value={era} onChange={(e) => setEra(e.target.value)} placeholder="Rough era (optional)" style={s.input} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          <button type="button" style={s.btn} disabled={saving} onClick={save}>Save this source</button>
          <button type="button" style={s.btnQuiet} onClick={cancel}>Discard</button>
        </div>
      </div>
    );
  }

  // ---- recording screen ----
  return (
    <div style={card}>
      <p style={s.kicker}>Record it</p>
      {!supported && (
        <p style={s.help}>This browser can&apos;t record audio. Use Write it instead — it&apos;s the same workflow.</p>
      )}
      {micError && <p style={{ ...s.help, color: "var(--gold)" }}>{micError}</p>}
      {!recorder && supported && (
        <>
          <p style={s.help}>
            Just talk — any order, any era, exactly how it comes. The original recording is
            preserved forever, and a word-for-word transcript is kept alongside it.
            {!transcriptionSupported() && " (This browser can't transcribe — you'll be able to type the transcript after recording.)"}
          </p>
          <button type="button" style={{ ...s.btn, fontSize: 16, padding: "14px 22px" }} onClick={begin}>
            ● Start recording
          </button>
        </>
      )}
      {recorder && (recorder.state === "recording" || recorder.state === "paused" || recorder.state === "requesting") && (
        <>
          <p style={{ fontSize: 15, fontWeight: 900, margin: "0 0 8px" }}>
            {recorder.state === "requesting" ? "Waiting for the microphone…" : recorder.state === "paused" ? "⏸ Paused" : "● Recording…"}
          </p>
          {recorder.liveTranscript && (
            <pre style={{ ...s.verbatim, maxHeight: 160, overflowY: "auto", marginBottom: 8 }}>{recorder.liveTranscript}</pre>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {recorder.state === "recording" && <button type="button" style={s.btnQuiet} onClick={() => { recorder.pause(); }}>Pause</button>}
            {recorder.state === "paused" && <button type="button" style={s.btnQuiet} onClick={() => { recorder.resume(); }}>Resume</button>}
            <button type="button" style={s.btn} onClick={finish}>Finish</button>
            <button type="button" style={s.btnQuiet} onClick={cancel}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}

function WritePanel({ project, card, s, persist, say, onOpenSource }: CaptureProps) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [era, setEra] = useState("");
  const [pasted, setPasted] = useState(false);

  const save = (draft: boolean) => {
    if (!text.trim()) { say("Write or paste something first."); return; }
    const made = addTypedSource(project, text, { title, era, pasted, draft });
    if (!made.source) return;
    persist(
      made.project,
      draft
        ? "Saved as an unfinished entry — finish it whenever you're ready."
        : "Saved — the exact text you submitted is preserved permanently.",
    );
    onOpenSource(made.source.id);
  };

  return (
    <div style={card}>
      <p style={s.kicker}>Write it</p>
      <p style={s.help}>
        A memory, existing notes, a scene you already wrote, journal material, research, a fragment —
        exactly how it comes. The original is preserved forever; later edits become separate versions.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPaste={() => { if (!text.trim()) setPasted(true); }}
        placeholder="Start anywhere. Spelling and order don't matter — this is source, not manuscript."
        style={{ ...s.input, minHeight: 160, resize: "vertical" }}
      />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Working title (optional)" style={{ ...s.input, flex: 1, minWidth: 160 }} />
        <input value={era} onChange={(e) => setEra(e.target.value)} placeholder="Rough era (optional)" style={{ ...s.input, flex: 1, minWidth: 140 }} />
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
        <input type="checkbox" checked={pasted} onChange={(e) => setPasted(e.target.checked)} />
        This is pasted from somewhere else (notes, journal, an old draft)
      </label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        <button type="button" style={s.btn} onClick={() => save(false)}>Save this source</button>
        <button type="button" style={s.btnQuiet} onClick={() => save(true)}>Save unfinished — come back later</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The source room — one working unit, one screen
// ---------------------------------------------------------------------------

export function SourceRoom({
  project, card, s, persist, say, onOpenScene, onOpenVault, sourceId,
}: FlowProps & { sourceId: string }) {
  const source = findSource(project, sourceId);
  const [manualTranscript, setManualTranscriptText] = useState("");
  const [editText, setEditText] = useState("");
  const [editNote, setEditNote] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [answer, setAnswer] = useState("");
  const [editingIngredient, setEditingIngredient] = useState("");
  const [ingredientDraft, setIngredientDraft] = useState("");
  const [ownKind, setOwnKind] = useState<IngredientKind>("emotional-truth");
  const [ownText, setOwnText] = useState("");

  const vault = loadVault(project.id);

  const update = (fn: (x: SourceMaterial) => SourceMaterial, msg?: string) => {
    persist(updateSourceIn(project, sourceId, fn), msg);
  };

  // Original audio playback — the blob is read-only; only a URL is created.
  const audioId = source?.audioId ?? "";
  const audioUrl = useMemo(() => {
    if (!audioId) return "";
    const rec = cachedAudio(audioId);
    return rec ? URL.createObjectURL(rec.blob) : "";
  }, [audioId]);
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  const question = useMemo(() => {
    if (!source) return null;
    const later = savedForLater(source);
    return later[0] ?? nextQuestion(source);
  }, [source]);

  if (!source) return <div style={card}><p style={s.help}>That source no longer exists.</p></div>;

  const stage = sourceStage(source);
  const linkedMappings = vault ? vault.mappings.filter((m) => source.mappingIds.includes(m.id) || m.sourceMaterialIds.includes(source.id)) : [];
  const fictionLabel = (() => {
    for (const m of linkedMappings) {
      if (m.fiction) { const l = labelFor(project, m.fiction); if (!l.startsWith("(")) return l; }
      if (m.workingLabel) return m.workingLabel;
    }
    return "";
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* ---- header ---- */}
      <div style={card}>
        <p style={s.kicker}>{source.id} · {CAPTURE_KIND_LABELS[source.kind]}</p>
        <h2 style={{ fontSize: 19, fontWeight: 900, margin: "0 0 4px" }}>{source.title}</h2>
        <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0 }}>
          {SOURCE_STAGE_LABELS[stage]} · next: {nextActionFor(source)}
        </p>
        {source.draft && (
          <button type="button" style={{ ...s.btn, marginTop: 8 }}
            onClick={() => update((x) => updateSourceMeta(x, { draft: false }), "Marked finished — the workflow is open.")}>
            Mark this entry finished
          </button>
        )}
      </div>

      {/* ---- original ---- */}
      <div style={card}>
        <p style={s.sectionTitle}>Original — never edited</p>
        {source.kind === "spoken" && (
          <>
            {audioUrl
              ? <audio controls src={audioUrl} style={{ width: "100%", marginBottom: 8 }} />
              : source.audioId
                ? <p style={s.help}>The recording isn&apos;t available in this browser right now.</p>
                : <p style={s.help}>No audio was stored for this source.</p>}
            {source.audioDurationMs > 0 && (
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 8px" }}>
                Original recording · {fmtDuration(source.audioDurationMs)} · captured {source.capturedAt.slice(0, 10)}
              </p>
            )}
          </>
        )}
        {source.original !== "" ? (
          <>
            <span style={s.label}>
              {source.kind === "spoken"
                ? `Word-for-word transcript (${source.transcriptStatus === "manual" ? "typed by you" : "live"}) — preserved as-is`
                : "Exactly as submitted — preserved as-is"}
            </span>
            <pre style={s.verbatim}>{source.original}</pre>
          </>
        ) : (
          <>
            <p style={s.help}>
              Transcription {source.transcriptStatus === "unsupported" ? "isn't available in this browser" : "failed"} —
              the recording above is safe. Listen and type the word-for-word transcript here. Once saved, it is
              permanent; corrections become separate versions.
            </p>
            <textarea value={manualTranscript} onChange={(e) => setManualTranscriptText(e.target.value)}
              placeholder="Type exactly what was said." style={{ ...s.input, minHeight: 120, resize: "vertical" }} />
            <button type="button" style={{ ...s.btn, marginTop: 8 }}
              onClick={() => {
                if (!manualTranscript.trim()) { say("Type the transcript first."); return; }
                update((x) => setManualTranscript(x, manualTranscript), "Transcript saved — it is now the permanent original.");
                setManualTranscriptText("");
              }}>
              Save word-for-word transcript
            </button>
          </>
        )}
      </div>

      {/* ---- versions ---- */}
      {source.original !== "" && (
        <div style={card}>
          <p style={s.sectionTitle}>
            {source.kind === "spoken" ? "Corrected transcript" : "Edited versions"} ({source.versions.length})
          </p>
          <p style={s.help}>
            Fix names, spelling, punctuation — or tighten the text. Each save is a new version;
            the original above never changes.
          </p>
          {source.versions.map((v, i) => (
            <details key={v.id} open={i === source.versions.length - 1} style={{ marginBottom: 8 }}>
              <summary style={{ fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                Version {i + 1}{i === source.versions.length - 1 ? " (current)" : ""} · {v.savedAt.slice(0, 10)}{v.note ? ` · ${v.note}` : ""}
              </summary>
              <pre style={{ ...s.verbatim, marginTop: 6 }}>{v.text}</pre>
            </details>
          ))}
          {showEdit ? (
            <>
              <textarea value={editText} onChange={(e) => setEditText(e.target.value)} style={{ ...s.input, minHeight: 120, resize: "vertical" }} />
              <input value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="What changed (optional)" style={{ ...s.input, marginTop: 6 }} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button type="button" style={s.btn}
                  onClick={() => {
                    if (!editText.trim()) { say("Nothing to save."); return; }
                    update((x) => addSourceVersion(x, editText, editNote), "New version saved — the original is untouched.");
                    setShowEdit(false); setEditText(""); setEditNote("");
                  }}>
                  Save as new version
                </button>
                <button type="button" style={s.btnQuiet} onClick={() => setShowEdit(false)}>Cancel</button>
              </div>
            </>
          ) : (
            <button type="button" style={s.btnQuiet}
              onClick={() => { setEditText(currentSourceText(source)); setShowEdit(true); }}>
              {source.kind === "spoken" ? "Correct the transcript" : "Edit as a new version"}
            </button>
          )}
        </div>
      )}

      {/* ---- one question at a time ---- */}
      {source.original !== "" && !source.draft && question && (
        <div style={card}>
          <p style={s.kicker}>One question — answer, skip, or keep going</p>
          <p style={{ fontSize: 16, fontWeight: 900, margin: "0 0 8px" }}>{question.text}</p>
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
            placeholder="In your own words — a sentence is plenty." style={{ ...s.input, minHeight: 60, resize: "vertical" }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <button type="button" style={s.btn}
              onClick={() => {
                if (!answer.trim()) { say("Write an answer — or skip."); return; }
                update((x) => answerQuestion(x, question, answer), "Answer saved.");
                setAnswer("");
              }}>
              Answer
            </button>
            <button type="button" style={s.btnQuiet}
              onClick={() => { update((x) => answerQuestion(x, question, "", "skipped"), "Skipped — no pressure."); setAnswer(""); }}>
              Skip
            </button>
            <button type="button" style={s.btnQuiet}
              onClick={() => { update((x) => answerQuestion(x, question, "", "saved-for-later"), "Saved for later."); setAnswer(""); }}>
              Save for later
            </button>
          </div>
          <p style={{ ...s.help, margin: "8px 0 0" }}>
            Everything below stays available — answering is optional, always.
          </p>
        </div>
      )}
      {source.answers.filter((a) => a.status === "answered").length > 0 && (
        <div style={card}>
          <p style={s.sectionTitle}>Your answers</p>
          {source.answers.filter((a) => a.status === "answered").map((a) => (
            <div key={a.questionId} style={{ padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
              <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 2px" }}>{a.question}</p>
              <p style={{ fontSize: 13.5, margin: 0 }}>{a.answer}</p>
            </div>
          ))}
        </div>
      )}

      {/* ---- ingredients ---- */}
      {source.original !== "" && !source.draft && (
        <div style={card}>
          <p style={s.sectionTitle}>Story ingredients</p>
          <p style={s.help}>
            Everything here starts as a suggestion drawn from your own words. Nothing is treated
            as fact — approve, reject, edit, or leave each one undecided.
          </p>
          {source.ingredients.map((i) => (
            <div key={i.id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 10, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 900 }}>{INGREDIENT_KIND_LABELS[i.kind]}</span>
                <span style={stateChip(i.state)}>{i.origin === "author" && i.state === "author-approved" ? "Yours" : PROPOSAL_STATE_LABELS[i.state]}</span>
              </div>
              {editingIngredient === i.id ? (
                <>
                  <textarea value={ingredientDraft} onChange={(e) => setIngredientDraft(e.target.value)} style={{ ...s.input, minHeight: 56, resize: "vertical", marginTop: 6 }} />
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <button type="button" style={{ ...s.btn, padding: "5px 10px", fontSize: 12.5 }}
                      onClick={() => { update((x) => editIngredient(x, i.id, ingredientDraft), "Edited — recorded as yours."); setEditingIngredient(""); }}>
                      Save edit
                    </button>
                    <button type="button" style={{ ...s.btnQuiet, padding: "5px 10px", fontSize: 12.5 }} onClick={() => setEditingIngredient("")}>Cancel</button>
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 13.5, margin: "6px 0 0", lineHeight: 1.5, opacity: i.state === "rejected" ? 0.55 : 1 }}>{i.text}</p>
              )}
              {editingIngredient !== i.id && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                  {i.state !== "author-approved" && (
                    <button type="button" style={{ ...s.btnQuiet, padding: "4px 9px", fontSize: 12 }}
                      onClick={() => update((x) => setIngredientState(x, i.id, "author-approved"), "Approved by you.")}>
                      Approve
                    </button>
                  )}
                  <button type="button" style={{ ...s.btnQuiet, padding: "4px 9px", fontSize: 12 }}
                    onClick={() => { setEditingIngredient(i.id); setIngredientDraft(i.text); }}>
                    Edit
                  </button>
                  {i.state !== "rejected" && (
                    <button type="button" style={{ ...s.btnQuiet, padding: "4px 9px", fontSize: 12 }}
                      onClick={() => update((x) => setIngredientState(x, i.id, "rejected"))}>
                      Reject
                    </button>
                  )}
                  {(i.state === "rejected" || i.state === "author-approved") && (
                    <button type="button" style={{ ...s.btnQuiet, padding: "4px 9px", fontSize: 12 }}
                      onClick={() => update((x) => setIngredientState(x, i.id, "undecided"))}>
                      Undecide
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            <button type="button" style={source.ingredients.length === 0 ? s.btn : s.btnQuiet}
              onClick={() => update((x) => attachProposedIngredients(x), "Suggestions added — every one awaits your decision.")}>
              {source.ingredients.length === 0 ? "Suggest story ingredients" : "Suggest more"}
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            <select value={ownKind} onChange={(e) => setOwnKind(e.target.value as IngredientKind)} style={{ ...s.input, width: "auto" }}>
              {Object.entries(INGREDIENT_KIND_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <input value={ownText} onChange={(e) => setOwnText(e.target.value)} placeholder="Add your own ingredient…" style={{ ...s.input, flex: 1, minWidth: 180 }} />
            <button type="button" style={s.btnQuiet}
              onClick={() => {
                if (!ownText.trim()) return;
                update((x) => addAuthorIngredient(x, ownKind, ownText), "Added — yours, approved from the start.");
                setOwnText("");
              }}>
              Add
            </button>
          </div>
        </div>
      )}

      {/* ---- Real-to-Fiction Bridge ---- */}
      {source.original !== "" && !source.draft && (
        <BridgeCard
          project={project} card={card} s={s} persist={persist} say={say}
          source={source} vault={vault} linkedMappings={linkedMappings}
          onOpenVault={onOpenVault} update={update}
        />
      )}

      {/* ---- scene directions ---- */}
      {source.original !== "" && !source.draft && (
        <DirectionsCard
          project={project} card={card} s={s} persist={persist} say={say}
          source={source} fictionLabel={fictionLabel} bridged={source.mappingIds.length > 0}
          update={update} onOpenScene={onOpenScene} sourceId={sourceId}
        />
      )}

      {/* ---- history ---- */}
      <div style={card}>
        <details>
          <summary style={{ fontSize: 13, fontWeight: 800, cursor: "pointer" }}>History ({source.history.length})</summary>
          {source.history.map((h, i) => (
            <p key={i} style={{ ...s.help, margin: "6px 0 0" }}>{h.at.slice(0, 16).replace("T", " ")} — {h.note}</p>
          ))}
        </details>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bridge card
// ---------------------------------------------------------------------------

function BridgeCard({
  project, card, s, say, source, vault, linkedMappings, onOpenVault, update,
}: Pick<FlowProps, "project" | "card" | "s" | "persist" | "say"> & {
  source: SourceMaterial;
  vault: SourceVaultV1 | null;
  linkedMappings: { id: string; workingLabel: string; sourceIds: string[] }[];
  onOpenVault: () => void;
  update: (fn: (x: SourceMaterial) => SourceMaterial, msg?: string) => void;
}) {
  const [realName, setRealName] = useState("");
  const [realKind, setRealKind] = useState<SourceKind>("person");
  const [workingLabel, setWorkingLabel] = useState("");
  const [linkExisting, setLinkExisting] = useState("");

  const createMapping = async () => {
    if (!realName.trim()) { say("Name the real person, place, or experience — it stays in the private legend."); return; }
    const v = vault ?? createVault(project.id);
    const added = addVaultSource(v, realKind, realName);
    if (!added.source) return;
    const mapped = addMapping(added.vault, [added.source.id], {
      workingLabel: workingLabel.trim() || `From ${source.id}`,
      sourceMaterialIds: [source.id],
    });
    if (!mapped.mapping) return;
    const ok = await saveVault(mapped.vault);
    if (!ok) { say("The private legend could not be saved — check storage and try again."); return; }
    update((x) => linkMapping(x, mapped.mapping!.id), `Bridge crossed — ${mapped.mapping.id} recorded in the private legend.`);
    setRealName(""); setWorkingLabel("");
  };

  const linkExistingMapping = async () => {
    if (!vault || !linkExisting) return;
    const v = linkSourceMaterialToMapping(vault, linkExisting, source.id);
    const ok = await saveVault(v);
    if (!ok) { say("The private legend could not be saved."); return; }
    update((x) => linkMapping(x, linkExisting), "Linked to an existing mapping.");
    setLinkExisting("");
  };

  return (
    <div style={card}>
      <p style={s.sectionTitle}>🔒 Real-to-Fiction Bridge</p>
      <p style={s.help}>
        Before this material becomes fiction, record what it draws from. The mapping lives in the
        private legend — it never travels with the manuscript, exports, or anything shareable.
        Many-to-many is normal: several memories can feed one character; one person can feed several.
      </p>
      {linkedMappings.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {linkedMappings.map((m) => (
            <p key={m.id} style={{ fontSize: 13, margin: "0 0 4px" }}>
              ✓ {m.id}{m.workingLabel ? ` — ${m.workingLabel}` : ""} <span style={{ color: "var(--muted)" }}>(details in the private legend)</span>
            </p>
          ))}
        </div>
      )}
      <span style={s.label}>Cross the bridge — who or what is behind this?</span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <select value={realKind} onChange={(e) => setRealKind(e.target.value as SourceKind)} style={{ ...s.input, width: "auto" }}>
          {SOURCE_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
        </select>
        <input value={realName} onChange={(e) => setRealName(e.target.value)} placeholder="Real name / identity (private)" style={{ ...s.input, flex: 1, minWidth: 170 }} />
      </div>
      <input value={workingLabel} onChange={(e) => setWorkingLabel(e.target.value)}
        placeholder="Working label for the fictional side (optional) — e.g. 'the grandfather figure'" style={{ ...s.input, marginTop: 6 }} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        <button type="button" style={s.btn} onClick={createMapping}>Record the mapping</button>
        {vault && vault.mappings.some((m) => !source.mappingIds.includes(m.id)) && (
          <>
            <select value={linkExisting} onChange={(e) => setLinkExisting(e.target.value)} style={{ ...s.input, width: "auto" }}>
              <option value="">…or link an existing mapping</option>
              {vault.mappings.filter((m) => !source.mappingIds.includes(m.id)).map((m) => (
                <option key={m.id} value={m.id}>{m.id}{m.workingLabel ? ` — ${m.workingLabel}` : ""}</option>
              ))}
            </select>
            {linkExisting && <button type="button" style={s.btnQuiet} onClick={linkExistingMapping}>Link</button>}
          </>
        )}
        <button type="button" style={s.btnQuiet} onClick={onOpenVault}>Open the private legend</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Directions card
// ---------------------------------------------------------------------------

function DirectionsCard({
  project, card, s, say, source, fictionLabel, bridged, update, onOpenScene, sourceId, persist,
}: Pick<FlowProps, "project" | "card" | "s" | "persist" | "say"> & {
  source: SourceMaterial;
  fictionLabel: string;
  bridged: boolean;
  update: (fn: (x: SourceMaterial) => SourceMaterial, msg?: string) => void;
  onOpenScene: (sceneId: string) => void;
  sourceId: string;
}) {
  const [editingId, setEditingId] = useState("");
  const [draft, setDraft] = useState<Partial<Record<"approach" | "whoseScene" | "whatHappens" | "want" | "obstacle" | "change" | "serves", string>>>({});
  const [ownOpen, setOwnOpen] = useState(false);
  const [own, setOwn] = useState({ whoseScene: "", whatHappens: "", want: "", obstacle: "", change: "" });
  const [sceneForDirection, setSceneForDirection] = useState("");
  const [sceneText, setSceneText] = useState("");
  const [sceneTitle, setSceneTitle] = useState("");
  const [chapterId, setChapterId] = useState("");

  const visible = source.directions.filter((d) => d.state !== "rejected");
  const approvedNoScene = source.directions.filter((d) => d.state === "author-approved" && !d.sceneId);

  if (!bridged && source.directions.length === 0) {
    return (
      <div style={card}>
        <p style={s.sectionTitle}>Scene directions</p>
        <p style={s.help}>
          Cross the Real-to-Fiction Bridge first — the private mapping is what keeps real identities
          out of the fiction. Then Story Partner can propose three genuinely different scene directions.
        </p>
      </div>
    );
  }

  const directionCard = (d: SceneDirection) => {
    const editing = editingId === d.id;
    const field = (key: keyof typeof draft, label: string, value: string) => (
      <div style={{ marginTop: 6 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--muted)" }}>{label}</span>
        {editing ? (
          <textarea value={draft[key] ?? value} onChange={(e) => setDraft((cur) => ({ ...cur, [key]: e.target.value }))}
            style={{ ...s.input, minHeight: 40, resize: "vertical" }} />
        ) : (
          <p style={{ fontSize: 13.5, margin: "2px 0 0", lineHeight: 1.5 }}>{value || "—"}</p>
        )}
      </div>
    );
    return (
      <div key={d.id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 12, marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 900 }}>{d.approach}</span>
          <span style={stateChip(d.state)}>
            {d.origin === "author" ? "Yours" : PROPOSAL_STATE_LABELS[d.state]}{d.sceneId ? " · in manuscript" : ""}
          </span>
        </div>
        {field("whoseScene", "Whose scene it is", d.whoseScene)}
        {field("whatHappens", "What happens", d.whatHappens)}
        {field("want", "What they want", d.want)}
        {field("obstacle", "What stands in the way", d.obstacle)}
        {field("change", "What changes", d.change)}
        {field("serves", "Why it may serve the larger story", d.serves)}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
          {editing ? (
            <>
              <button type="button" style={{ ...s.btn, padding: "5px 10px", fontSize: 12.5 }}
                onClick={() => { update((x) => editDirection(x, d.id, draft), "Direction edited — recorded as yours."); setEditingId(""); setDraft({}); }}>
                Save edits
              </button>
              <button type="button" style={{ ...s.btnQuiet, padding: "5px 10px", fontSize: 12.5 }} onClick={() => { setEditingId(""); setDraft({}); }}>Cancel</button>
            </>
          ) : (
            <>
              {!d.sceneId && d.state !== "author-approved" && (
                <button type="button" style={{ ...s.btn, padding: "5px 10px", fontSize: 12.5 }}
                  onClick={() => update((x) => setDirectionState(x, d.id, "author-approved"), "Direction approved by you — now write the scene below.")}>
                  Approve this direction
                </button>
              )}
              {!d.sceneId && (
                <button type="button" style={{ ...s.btnQuiet, padding: "5px 10px", fontSize: 12.5 }}
                  onClick={() => { setEditingId(d.id); setDraft({}); }}>
                  Edit
                </button>
              )}
              {!d.sceneId && d.state !== "rejected" && (
                <button type="button" style={{ ...s.btnQuiet, padding: "5px 10px", fontSize: 12.5 }}
                  onClick={() => update((x) => setDirectionState(x, d.id, "rejected"))}>
                  Reject
                </button>
              )}
              {d.sceneId && (
                <button type="button" style={{ ...s.btnQuiet, padding: "5px 10px", fontSize: 12.5 }} onClick={() => onOpenScene(d.sceneId)}>
                  Open the scene
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={card}>
      <p style={s.sectionTitle}>Scene directions</p>
      {visible.length === 0 && (
        <p style={s.help}>
          Three genuinely different ways this material could become a scene — different viewpoints,
          chronology, and stakes. You choose, combine, edit, reject all three, or write your own.
        </p>
      )}
      {visible.map(directionCard)}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" style={source.directions.length === 0 ? s.btn : s.btnQuiet}
          onClick={() => update((x) => attachProposedDirections(x, fictionLabel), "Three directions suggested — all awaiting your decision.")}>
          {source.directions.length === 0 ? "Propose three scene directions" : "Propose three different directions"}
        </button>
        {source.directions.some((d) => d.state === "proposed" || d.state === "undecided") && (
          <button type="button" style={s.btnQuiet}
            onClick={() => update((x) => rejectAllProposedDirections(x), "All open suggestions rejected.")}>
            Reject all suggestions
          </button>
        )}
        <button type="button" style={s.btnQuiet} onClick={() => setOwnOpen((o) => !o)}>Write my own direction</button>
      </div>

      {ownOpen && (
        <div style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 12, marginTop: 10 }}>
          <span style={s.label}>Your direction — yours from the first word</span>
          <input value={own.whoseScene} onChange={(e) => setOwn({ ...own, whoseScene: e.target.value })} placeholder="Whose scene is it?" style={{ ...s.input, marginBottom: 6 }} />
          <textarea value={own.whatHappens} onChange={(e) => setOwn({ ...own, whatHappens: e.target.value })} placeholder="What happens?" style={{ ...s.input, minHeight: 56, resize: "vertical", marginBottom: 6 }} />
          <input value={own.want} onChange={(e) => setOwn({ ...own, want: e.target.value })} placeholder="What do they want? (optional)" style={{ ...s.input, marginBottom: 6 }} />
          <input value={own.obstacle} onChange={(e) => setOwn({ ...own, obstacle: e.target.value })} placeholder="What stands in the way? (optional)" style={{ ...s.input, marginBottom: 6 }} />
          <input value={own.change} onChange={(e) => setOwn({ ...own, change: e.target.value })} placeholder="What changes? (optional)" style={s.input} />
          <button type="button" style={{ ...s.btn, marginTop: 8 }}
            onClick={() => {
              if (!own.whatHappens.trim()) { say("Say what happens — one sentence is enough."); return; }
              update((x) => addAuthorDirection(x, own), "Your direction saved — approved by definition.");
              setOwn({ whoseScene: "", whatHappens: "", want: "", obstacle: "", change: "" });
              setOwnOpen(false);
            }}>
            Save my direction
          </button>
        </div>
      )}

      {/* ---- approved direction → scene text → manuscript ---- */}
      {approvedNoScene.length > 0 && (
        <div style={{ borderTop: "1px solid var(--line)", marginTop: 12, paddingTop: 12 }}>
          <p style={s.sectionTitle}>Write the scene, then approve it for the manuscript</p>
          <p style={s.help}>
            Only what you approve here enters the manuscript. The starting text below is a scaffold —
            rewrite it into your prose. Real names and private details stay behind the bridge.
          </p>
          <select value={sceneForDirection}
            onChange={(e) => {
              setSceneForDirection(e.target.value);
              const d = approvedNoScene.find((x) => x.id === e.target.value);
              if (d) { setSceneText(sceneSeed(d)); setSceneTitle(""); }
            }}
            style={{ ...s.input, width: "auto", marginBottom: 8 }}>
            <option value="">Which approved direction?</option>
            {approvedNoScene.map((d) => <option key={d.id} value={d.id}>{d.approach}</option>)}
          </select>
          {sceneForDirection && (
            <>
              <span style={s.label}>Scene text — yours to shape; approving it is what moves it forward</span>
              <textarea value={sceneText} onChange={(e) => setSceneText(e.target.value)} style={{ ...s.input, minHeight: 140, resize: "vertical" }} />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                <input value={sceneTitle} onChange={(e) => setSceneTitle(e.target.value)} placeholder="Scene title (optional)" style={{ ...s.input, flex: 1, minWidth: 160 }} />
                {project.chapters.length > 0 && (
                  <select value={chapterId} onChange={(e) => setChapterId(e.target.value)} style={{ ...s.input, width: "auto" }}>
                    <option value="">Chapter: {project.chapters.length ? "choose…" : ""}</option>
                    {project.chapters.map((c) => <option key={c.id} value={c.id}>{c.workingTitle}</option>)}
                  </select>
                )}
              </div>
              <button type="button" style={{ ...s.btn, marginTop: 10 }}
                onClick={() => {
                  const r = addApprovedSceneToManuscript(project, sourceId, sceneForDirection, sceneText, { sceneTitle, chapterId });
                  if (!r.sceneId) { say(r.reason); return; }
                  persist(r.project, r.reason);
                  setSceneForDirection(""); setSceneText(""); setSceneTitle("");
                }}>
                ✓ Approve & add to manuscript
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Storage health note — honest, small
// ---------------------------------------------------------------------------

export function storageNote(): string {
  const h = storageHealth();
  if (h === "indexeddb") return "";
  if (h === "localstorage-only") return "This browser is running on fallback storage — recordings can't be kept durably here. Text is safe; export backups often.";
  return "Nothing can be stored durably in this browser — export a backup before closing.";
}
