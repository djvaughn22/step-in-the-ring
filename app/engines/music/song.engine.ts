/**
 * Song Project model — "Bring Your Song to Life".
 *
 * A creator may arrive AFTER creation has already started: words came, a
 * melody is forming, equipment exists. This model preserves what the creator
 * already has before telling them what to do, and never takes over authorship.
 *
 * Hard rules encoded here, not just displayed:
 *  - The original raw source is preserved exactly once and never mutated.
 *    Editing happens on a separate working copy.
 *  - Hook candidates only ever have origin "creator" — the engine does not
 *    generate hooks and never labels the creator's phrases as AI output.
 *  - Unknown is a valid state for key, tempo, time signature, and notes.
 *  - Proof artifacts are creator-confirmed; the browser cannot open local
 *    files, so nothing here claims to have verified one.
 *  - Version One requires real evidence AND an explicit creator decision.
 *
 * Pure functions only — persistence lives in song.store.ts, UI in SongStudio.
 */

// ---------------------------------------------------------------------------
// Element knowledge states — where a musical fact currently lives.
// ---------------------------------------------------------------------------

export type ElementState =
  | "unknown"
  | "not-decided"
  | "will-determine"
  | "in-head"
  | "in-voice-memo"
  | "in-other-app"
  | "in-daw"
  | "confirmed";

export const ELEMENT_STATE_LABELS: Record<ElementState, string> = {
  unknown: "Unknown",
  "not-decided": "Not decided",
  "will-determine": "I will determine this",
  "in-head": "Captured in my head",
  "in-voice-memo": "Captured in a voice memo",
  "in-other-app": "Entered into another app",
  "in-daw": "Recorded in the DAW",
  confirmed: "Confirmed",
};

const ELEMENT_STATES = Object.keys(ELEMENT_STATE_LABELS) as ElementState[];

// ---------------------------------------------------------------------------
// Starting state — what already exists when the creator arrives.
// ---------------------------------------------------------------------------

export type StartingElement =
  | "nothing"
  | "song-idea"
  | "lyrics"
  | "hook"
  | "melody-in-head"
  | "rhythm"
  | "chords"
  | "beat"
  | "voice-memo"
  | "partial-recording"
  | "midi-notes"
  | "daw-project"
  | "rough-demo";

export const STARTING_ELEMENT_LABELS: Record<StartingElement, string> = {
  nothing: "I am starting from nothing",
  "song-idea": "I have a general song idea",
  lyrics: "I have words or lyrics",
  hook: "I have a hook",
  "melody-in-head": "I hear a melody",
  rhythm: "I have a rhythm",
  chords: "I have chords",
  beat: "I have a beat",
  "voice-memo": "I have a voice memo or recording",
  "partial-recording": "I have a partial recording",
  "midi-notes": "I have MIDI notes",
  "daw-project": "I have a DAW project",
  "rough-demo": "I have a rough song already",
};

const STARTING_ELEMENTS = Object.keys(STARTING_ELEMENT_LABELS) as StartingElement[];

// ---------------------------------------------------------------------------
// Creator boundaries — these change what the engine offers, they are not
// decorative. The UI reads visibleGuidance(), which is driven by these.
// ---------------------------------------------------------------------------

export interface CreatorBoundaries {
  /** Preserve my original words. */
  preserveOriginalWords: boolean;
  /** Allow the engine to write lyrics for me. Off = no lyric-writing actions exist. */
  allowLyricWriting: boolean;
  /** Allow the engine to replace my melody. Off = melody stays the creator's. */
  allowMelodyReplacement: boolean;
  /** Do not change testimony or theological meaning. */
  preserveMeaning: boolean;
  /** Ask before suggesting wording. */
  askBeforeWordingSuggestions: boolean;
  allowProductionGuidance: boolean;
  allowArrangementGuidance: boolean;
  allowTheoryTeaching: boolean;
  allowChordExperiments: boolean;
  /** Authorship stays with the creator. Always true; recorded, not negotiable. */
  authorshipStaysWithCreator: true;
}

export function defaultBoundaries(): CreatorBoundaries {
  return {
    preserveOriginalWords: true,
    allowLyricWriting: false,
    allowMelodyReplacement: false,
    preserveMeaning: true,
    askBeforeWordingSuggestions: true,
    allowProductionGuidance: true,
    allowArrangementGuidance: true,
    allowTheoryTeaching: true,
    allowChordExperiments: true,
    authorshipStaysWithCreator: true,
  };
}

/** What guidance the UI is allowed to show, derived from boundaries. */
export interface VisibleGuidance {
  lyricWriting: boolean;
  wordingSuggestions: boolean;
  production: boolean;
  arrangement: boolean;
  theory: boolean;
  chords: boolean;
}

export function visibleGuidance(p: SongProjectV1): VisibleGuidance {
  const b = p.boundaries;
  return {
    lyricWriting: b.allowLyricWriting,
    wordingSuggestions: !b.askBeforeWordingSuggestions,
    production: b.allowProductionGuidance,
    arrangement: b.allowArrangementGuidance,
    theory: b.allowTheoryTeaching,
    chords: b.allowChordExperiments,
  };
}

// ---------------------------------------------------------------------------
// Core record pieces
// ---------------------------------------------------------------------------

/** The exact text as it arrived. Written once, never mutated. */
export interface OriginalSource {
  text: string;
  preservedAt: string;
}

export interface VoiceMemoState {
  status: "none" | "captured";
  /** Filename or reference the creator saved it under — their device, their file. */
  reference: string;
  strongestParts: string;
  capturedAt?: string;
}

export interface MusicalFact {
  state: ElementState;
  /** Only meaningful once the creator supplies it; never invented. */
  value: string;
}

export interface NoteEntry {
  id: string;
  /** Which part of the song these notes cover (e.g. a hook phrase). */
  section: string;
  /** Note names, MIDI numbers, or a rough sequence — creator's own words. */
  notes: string;
  rhythm: string;
  confidence: "guess" | "close" | "confident";
  addedAt: string;
}

export interface NotesWork {
  /** The app the creator uses to determine notes ("i will come up with notes in my app"). */
  appUsed: string;
  entries: NoteEntry[];
  transferredToDaw: boolean;
  /** Screenshot filename or other reference, if any. */
  reference: string;
}

export interface HookCandidate {
  id: string;
  text: string;
  /** Always "creator". The engine does not write hooks. */
  origin: "creator";
  status: "candidate" | "confirmed" | "rejected" | "decide-later";
  melodicPeak: boolean;
  emotionalPeak: boolean;
}

export type SectionKind =
  | "intro" | "verse" | "pre-chorus" | "chorus" | "post-chorus"
  | "bridge" | "instrumental" | "breakdown" | "outro" | "fragment" | "custom";

export const SECTION_KIND_LABELS: Record<SectionKind, string> = {
  intro: "Intro",
  verse: "Verse",
  "pre-chorus": "Pre-chorus",
  chorus: "Chorus",
  "post-chorus": "Post-chorus",
  bridge: "Bridge",
  instrumental: "Instrumental",
  breakdown: "Breakdown",
  outro: "Outro",
  fragment: "Unassigned fragment",
  custom: "Custom section",
};

const SECTION_KINDS = Object.keys(SECTION_KIND_LABELS) as SectionKind[];

export interface SongSection {
  id: string;
  kind: SectionKind;
  label: string;
  /** Text copied from the working copy — moving sections never edits the source. */
  content: string;
  /** Creator's production intent: quiet / building / full / etc. */
  energy: string;
}

export type ProofType =
  | "voice-memo"
  | "mpc-beats-project"
  | "bandlab-project"
  | "garageband-project"
  | "daw-project"
  | "wav" | "mp3" | "m4a" | "midi"
  | "project-folder" | "screenshot" | "file-reference" | "export-note" | "local-path";

export const PROOF_TYPE_LABELS: Record<ProofType, string> = {
  "voice-memo": "Voice memo",
  "mpc-beats-project": "MPC Beats project",
  "bandlab-project": "BandLab project",
  "garageband-project": "GarageBand project",
  "daw-project": "Other DAW project",
  wav: "WAV file",
  mp3: "MP3 file",
  m4a: "M4A file",
  midi: "MIDI file",
  "project-folder": "Project folder",
  screenshot: "Screenshot",
  "file-reference": "File reference",
  "export-note": "Export note",
  "local-path": "Local path",
};

const PROOF_TYPES = Object.keys(PROOF_TYPE_LABELS) as ProofType[];

/** Proof types that are a real playable audio artifact. */
export const PLAYABLE_AUDIO_TYPES: ProofType[] = ["wav", "mp3", "m4a"];
/** Proof types that are a real project in music software. */
export const PROJECT_PROOF_TYPES: ProofType[] = [
  "mpc-beats-project", "bandlab-project", "garageband-project", "daw-project", "project-folder",
];

export interface ProofArtifact {
  id: string;
  type: ProofType;
  /** Filename, project name, or path the creator points at. */
  reference: string;
  note: string;
  addedAt: string;
  /**
   * Always "creator-confirmed". The browser cannot open files saved by other
   * apps, so the engine never claims it opened, analyzed, or validated one.
   */
  verification: "creator-confirmed";
}

export type SoftwarePath = "mpc-beats" | "bandlab" | "garageband" | "other" | "undecided";

export const SOFTWARE_LABELS: Record<SoftwarePath, string> = {
  "mpc-beats": "MPC Beats",
  bandlab: "BandLab",
  garageband: "GarageBand",
  other: "Other software",
  undecided: "Not decided yet",
};

const SOFTWARE_PATHS = Object.keys(SOFTWARE_LABELS) as SoftwarePath[];

export interface VersionOneDecision {
  declaredAt: string;
  whatWorked: string;
  nextImprovement: string;
}

// ---------------------------------------------------------------------------
// The song project record
// ---------------------------------------------------------------------------

export const SONG_PROJECT_VERSION = 1;

export interface SongProjectV1 {
  version: 1;
  id: string;
  workingTitle: string;
  createdAt: string;
  updatedAt: string;

  startingState: StartingElement[];
  equipment: string[];
  software: SoftwarePath;
  boundaries: CreatorBoundaries;

  /** Set once via preserveOriginalSource(); null until the creator pastes it. */
  originalSource: OriginalSource | null;
  /** Separate editable copy. Editing this never touches originalSource. */
  workingCopy: string;

  melodyState: ElementState;
  voiceMemo: VoiceMemoState;
  notesWork: NotesWork;
  key: MusicalFact;
  tempo: MusicalFact;
  timeSignature: MusicalFact;

  hookCandidates: HookCandidate[];
  sections: SongSection[];

  /** Per-project checklist ticks for the software walkthrough. */
  softwareChecklist: Record<string, boolean>;
  scratchVocal: "none" | "recorded";
  playsEndToEnd: boolean;
  /** Placeholders are allowed in a rough draft but must be identified. */
  placeholdersNote: string;

  proofs: ProofArtifact[];
  sessionNotes: string;
  versionOne: VersionOneDecision | null;
}

let counter = 0;
export function songUid(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createSongProject(input: {
  workingTitle?: string;
  startingState?: StartingElement[];
  equipment?: string[];
  software?: SoftwarePath;
  now?: string;
}): SongProjectV1 {
  const now = input.now ?? new Date().toISOString();
  return {
    version: 1,
    id: songUid(),
    workingTitle: input.workingTitle?.trim() || "Untitled song",
    createdAt: now,
    updatedAt: now,
    startingState: input.startingState ?? [],
    equipment: input.equipment ?? [],
    software: input.software ?? "undecided",
    boundaries: defaultBoundaries(),
    originalSource: null,
    workingCopy: "",
    melodyState: "unknown",
    voiceMemo: { status: "none", reference: "", strongestParts: "" },
    notesWork: { appUsed: "", entries: [], transferredToDaw: false, reference: "" },
    key: { state: "unknown", value: "" },
    tempo: { state: "unknown", value: "" },
    timeSignature: { state: "unknown", value: "" },
    hookCandidates: [],
    sections: [],
    softwareChecklist: {},
    scratchVocal: "none",
    playsEndToEnd: false,
    placeholdersNote: "",
    proofs: [],
    sessionNotes: "",
    versionOne: null,
  };
}

// ---------------------------------------------------------------------------
// Source preservation — write once, never overwrite.
// ---------------------------------------------------------------------------

/**
 * Preserves the raw source exactly as pasted. If a source is already
 * preserved, the project is returned UNCHANGED — the artifact of the moment
 * the song arrived must always remain recoverable.
 */
export function preserveOriginalSource(p: SongProjectV1, text: string, now?: string): SongProjectV1 {
  if (p.originalSource) return p;
  if (!text) return p;
  return { ...p, originalSource: { text, preservedAt: now ?? new Date().toISOString() } };
}

/** Creates the editable working copy from the preserved source. */
export function makeWorkingCopy(p: SongProjectV1): SongProjectV1 {
  if (!p.originalSource || p.workingCopy) return p;
  return { ...p, workingCopy: p.originalSource.text };
}

/** Edits only the working copy. The original source is untouched by design. */
export function updateWorkingCopy(p: SongProjectV1, text: string): SongProjectV1 {
  return { ...p, workingCopy: text };
}

// ---------------------------------------------------------------------------
// Hooks — creator-provided only.
// ---------------------------------------------------------------------------

export function addHookCandidate(p: SongProjectV1, text: string): SongProjectV1 {
  const t = text.trim();
  if (!t) return p;
  const hook: HookCandidate = {
    id: songUid(), text: t, origin: "creator",
    status: "candidate", melodicPeak: false, emotionalPeak: false,
  };
  return { ...p, hookCandidates: [...p.hookCandidates, hook] };
}

export function updateHook(p: SongProjectV1, id: string, patch: Partial<Omit<HookCandidate, "id" | "origin" | "text">>): SongProjectV1 {
  return {
    ...p,
    hookCandidates: p.hookCandidates.map((h) => (h.id === id ? { ...h, ...patch, origin: "creator" } : h)),
  };
}

export function removeHook(p: SongProjectV1, id: string): SongProjectV1 {
  return { ...p, hookCandidates: p.hookCandidates.filter((h) => h.id !== id) };
}

// ---------------------------------------------------------------------------
// Arrangement — organizing never rewrites the words or the source.
// ---------------------------------------------------------------------------

export function addSection(p: SongProjectV1, kind: SectionKind, content: string, label?: string): SongProjectV1 {
  const section: SongSection = {
    id: songUid(), kind,
    label: label?.trim() || SECTION_KIND_LABELS[kind],
    content, energy: "",
  };
  return { ...p, sections: [...p.sections, section] };
}

export function updateSection(p: SongProjectV1, id: string, patch: Partial<Omit<SongSection, "id">>): SongProjectV1 {
  return { ...p, sections: p.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) };
}

export function moveSection(p: SongProjectV1, id: string, dir: -1 | 1): SongProjectV1 {
  const i = p.sections.findIndex((s) => s.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= p.sections.length) return p;
  const sections = [...p.sections];
  [sections[i], sections[j]] = [sections[j], sections[i]];
  return { ...p, sections };
}

export function duplicateSection(p: SongProjectV1, id: string): SongProjectV1 {
  const i = p.sections.findIndex((s) => s.id === id);
  if (i < 0) return p;
  const copy = { ...p.sections[i], id: songUid() };
  const sections = [...p.sections];
  sections.splice(i + 1, 0, copy);
  return { ...p, sections };
}

export function removeSection(p: SongProjectV1, id: string): SongProjectV1 {
  return { ...p, sections: p.sections.filter((s) => s.id !== id) };
}

// ---------------------------------------------------------------------------
// Proof artifacts — always creator-confirmed, never engine-verified.
// ---------------------------------------------------------------------------

export function addProof(p: SongProjectV1, type: ProofType, reference: string, note = ""): SongProjectV1 {
  const ref = reference.trim();
  if (!ref) return p;
  const proof: ProofArtifact = {
    id: songUid(), type, reference: ref, note,
    addedAt: new Date().toISOString(),
    verification: "creator-confirmed",
  };
  return { ...p, proofs: [...p.proofs, proof] };
}

export function removeProof(p: SongProjectV1, id: string): SongProjectV1 {
  return { ...p, proofs: p.proofs.filter((x) => x.id !== id) };
}

export function hasProofOfType(p: SongProjectV1, types: ProofType[]): boolean {
  return p.proofs.some((x) => types.includes(x.type));
}

// ---------------------------------------------------------------------------
// Milestones — honest names, derived from real state.
// ---------------------------------------------------------------------------

export interface Milestone {
  id: string;
  label: string;
  done: boolean;
}

export function milestones(p: SongProjectV1): Milestone[] {
  const melodyCaptured =
    p.voiceMemo.status === "captured" ||
    ["in-voice-memo", "in-other-app", "in-daw", "confirmed"].includes(p.melodyState);
  const projectProof = hasProofOfType(p, PROJECT_PROOF_TYPES);
  const audioProof = hasProofOfType(p, PLAYABLE_AUDIO_TYPES);
  return [
    { id: "spark-preserved", label: "Spark preserved", done: !!p.originalSource },
    { id: "melody-captured", label: "Melody captured", done: melodyCaptured },
    { id: "notes-partly-identified", label: "Notes partly identified", done: p.notesWork.entries.length > 0 },
    { id: "melody-recorded", label: "Melody recorded", done: projectProof },
    { id: "first-playable-proof", label: "First playable proof", done: projectProof && p.playsEndToEnd },
    { id: "full-rough-draft", label: "Full rough draft", done: p.sections.length > 0 && p.playsEndToEnd },
    { id: "version-one-exported", label: "Version One exported", done: audioProof },
    { id: "finished-by-creator", label: "Version One — declared by creator", done: !!p.versionOne },
  ];
}

// ---------------------------------------------------------------------------
// Version One — evidence plus an explicit creator decision.
// ---------------------------------------------------------------------------

export interface VersionOneCheck {
  ok: boolean;
  missing: string[];
}

/**
 * A lyric sheet, a plan, a viewed checklist, a title, or displayed advice
 * never completes a song. Real musical output must exist, and the creator
 * must still explicitly choose to declare Version One.
 */
export function canDeclareVersionOne(p: SongProjectV1): VersionOneCheck {
  const missing: string[] = [];
  if (!p.originalSource) missing.push("Original source preserved");
  const melodyCaptured =
    p.voiceMemo.status === "captured" ||
    ["in-voice-memo", "in-other-app", "in-daw", "confirmed"].includes(p.melodyState);
  if (!melodyCaptured) missing.push("Melody captured (voice memo, app, or DAW)");
  if (p.notesWork.entries.length === 0) missing.push("Notes entered, recorded, or documented");
  if (!hasProofOfType(p, PROJECT_PROOF_TYPES)) missing.push("A real music software project saved (proof)");
  if (p.scratchVocal !== "recorded") missing.push("A scratch or first vocal");
  if (!p.playsEndToEnd) missing.push("The song plays from beginning to end");
  if (!hasProofOfType(p, PLAYABLE_AUDIO_TYPES)) missing.push("One playable audio file (WAV / MP3 / M4A proof)");
  return { ok: missing.length === 0, missing };
}

export function declareVersionOne(
  p: SongProjectV1,
  whatWorked: string,
  nextImprovement: string,
  now?: string,
): SongProjectV1 {
  const check = canDeclareVersionOne(p);
  if (!check.ok || !whatWorked.trim() || !nextImprovement.trim()) return p;
  return {
    ...p,
    versionOne: {
      declaredAt: now ?? new Date().toISOString(),
      whatWorked: whatWorked.trim(),
      nextImprovement: nextImprovement.trim(),
    },
  };
}

// ---------------------------------------------------------------------------
// Stage + next action — one primary next step, based on what actually exists.
// ---------------------------------------------------------------------------

export type SongStage = "spark" | "melody" | "notes" | "record" | "arrange" | "finish" | "done";

export const STAGE_LABELS: Record<SongStage, string> = {
  spark: "Preserve the Spark",
  melody: "Capture the Melody",
  notes: "Find the Notes",
  record: "Record It",
  arrange: "Shape Without Taking Over",
  finish: "Version One",
  done: "Ready for another pass",
};

export interface NextAction {
  stage: SongStage;
  title: string;
  detail: string;
}

export function nextAction(p: SongProjectV1): NextAction {
  if (p.versionOne) {
    return {
      stage: "done",
      title: "Ready for another pass",
      detail: "Version One is yours. When you want to improve it, start the next pass — better takes, more instruments, or a real mix.",
    };
  }
  const hasLyrics = p.startingState.includes("lyrics") || p.startingState.includes("hook") || p.startingState.includes("song-idea");
  if (!p.originalSource && hasLyrics) {
    return {
      stage: "spark",
      title: "Preserve your words exactly as they arrived",
      detail: "Paste the raw words below. Grammar, spelling, and punctuation stay untouched — this is the artifact of the moment the song arrived.",
    };
  }
  const melodyCaptured =
    p.voiceMemo.status === "captured" ||
    ["in-voice-memo", "in-other-app", "in-daw", "confirmed"].includes(p.melodyState);
  const melodyExists = p.melodyState !== "unknown" || p.startingState.includes("melody-in-head") || p.startingState.includes("voice-memo");
  if (melodyExists && !melodyCaptured) {
    return {
      stage: "melody",
      title: "Record the melody before changing it",
      detail: "Open a voice recorder and sing or hum the whole idea — straight through unfinished parts. Save it with a name you'll recognize, then record that name here.",
    };
  }
  if (melodyCaptured && p.notesWork.entries.length === 0) {
    return {
      stage: "notes",
      title: "Identify or enter the notes for your clearest section",
      detail: "Use your music app to find the notes for the section you hear best — a confirmed hook is a great place to start. Rough is fine; unknown is allowed.",
    };
  }
  if (!hasProofOfType(p, PROJECT_PROOF_TYPES)) {
    const sw = SOFTWARE_LABELS[p.software];
    return {
      stage: "record",
      title: `Record the melody in ${p.software === "undecided" ? "your music software" : sw} with a simple instrument`,
      detail: "Simple keys or piano, your melody, then save the project immediately with a clear name. No drums required first.",
    };
  }
  if (p.scratchVocal !== "recorded") {
    return {
      stage: "record",
      title: "Add a scratch vocal",
      detail: "Sing your existing words over the melody. Unfinished sections stay unfinished — humming and placeholders count.",
    };
  }
  if (p.sections.length === 0) {
    return {
      stage: "arrange",
      title: "Rough arrangement from beginning to end",
      detail: "Lay the song out in sections. Use humming, repeated phrases, or silence as placeholders where parts are missing.",
    };
  }
  if (!p.playsEndToEnd) {
    return {
      stage: "arrange",
      title: "Get it playing beginning to end",
      detail: "Placeholders are allowed — just note where they are. When the project plays start to finish, mark it here.",
    };
  }
  if (!hasProofOfType(p, PLAYABLE_AUDIO_TYPES)) {
    return {
      stage: "finish",
      title: "Export or record one playable audio file",
      detail: "Bounce the project to WAV or MP3 (or record playback). Add the filename as proof.",
    };
  }
  return {
    stage: "finish",
    title: "Declare Version One when you decide it's ready",
    detail: "All the evidence exists. Write down what worked and the next improvement, then make the call — it's your call, not the engine's.",
  };
}

export function stageOf(p: SongProjectV1): SongStage {
  return nextAction(p).stage;
}

// ---------------------------------------------------------------------------
// Software walkthroughs — song-first, melody before drums.
// ---------------------------------------------------------------------------

export interface ChecklistItem {
  id: string;
  label: string;
  detail?: string;
}

/** MPK Mini + MPC Beats: capture the song that already exists. Drums are optional and later. */
export const MPC_SONG_CHECKLIST: ChecklistItem[] = [
  { id: "m1", label: "Connect the MPK Mini by USB", detail: "Plug it straight into the computer. Recent models need no driver." },
  { id: "m2", label: "Open MPC Beats", detail: "Free from Akai — see the setup path if it isn't installed yet." },
  { id: "m3", label: "Confirm key presses register", detail: "Press a few keys. If nothing sounds, check Preferences → MIDI and enable the MPK Mini as an input." },
  { id: "m4", label: "Create a blank project", detail: "Empty project — no beat template needed. This song starts from your melody, not from drums." },
  { id: "m5", label: "Load a simple temporary instrument", detail: "Piano, electric piano, organ, keys, or a pad. It's a stand-in — you can change it later." },
  { id: "m6", label: "Set a temporary tempo or leave it undecided", detail: "If you don't know the tempo yet, that's a valid answer. Record freely and settle it later." },
  { id: "m7", label: "Record the strongest melody section first", detail: "The part you hear most clearly — often your hook. Loop it, take it a few times, keep the best." },
  { id: "m8", label: "Record the other sections", detail: "Rough is fine. Placeholders are fine. Keep going to the end of the idea." },
  { id: "m9", label: "Save the project immediately", detail: "Before anything else. Losing a captured melody hurts more than any wrong note." },
  { id: "m10", label: "Name the project clearly", detail: "Use the working title so future-you can find it." },
  { id: "m11", label: "Add a scratch vocal", detail: "Sing the words over the melody. A phone recording pointed at the speakers also counts as a start." },
  { id: "m12", label: "Play it back", detail: "Listen once, start to finish. Note what's strongest — don't fix anything yet." },
  { id: "m13", label: "Record the project name here as proof", detail: "The engine can't see your files; your confirmation plus the name is the honest record." },
  { id: "m14", label: "Export or record playable audio when ready", detail: "File → Export to WAV or MP3. This becomes your Version One artifact." },
];

/** Generic song-capture walkthrough for BandLab / GarageBand / other software. */
export const GENERIC_SONG_CHECKLIST: ChecklistItem[] = [
  { id: "g1", label: "Open your music software and create a blank project" },
  { id: "g2", label: "Pick one simple instrument (keys, piano, or pad)", detail: "No drums required first — this song starts from your melody." },
  { id: "g3", label: "Record the strongest melody section first" },
  { id: "g4", label: "Record the remaining sections, placeholders allowed" },
  { id: "g5", label: "Save the project with your working title" },
  { id: "g6", label: "Add a scratch vocal over the melody" },
  { id: "g7", label: "Play it back start to finish" },
  { id: "g8", label: "Record the project name here as proof" },
  { id: "g9", label: "Export playable audio when ready" },
];

export function checklistFor(software: SoftwarePath): ChecklistItem[] {
  return software === "mpc-beats" ? MPC_SONG_CHECKLIST : GENERIC_SONG_CHECKLIST;
}

// ---------------------------------------------------------------------------
// The production stages, in plain language (teaching, one at a time).
// ---------------------------------------------------------------------------

export const PRODUCTION_STAGES: { name: string; plain: string }[] = [
  { name: "Capture", plain: "Preserve the words, melody, rhythm, or idea before it disappears." },
  { name: "Arrange", plain: "Decide the order and repetition of song sections." },
  { name: "Produce", plain: "Choose instruments, sounds, energy, dynamics, and musical layers." },
  { name: "Record", plain: "Create usable vocal and instrumental performances." },
  { name: "Mix", plain: "Balance the recorded parts so they work together." },
  { name: "Finish", plain: "Export the version the creator decides is complete." },
];

// ---------------------------------------------------------------------------
// Resume summary
// ---------------------------------------------------------------------------

export interface ResumeSummary {
  title: string;
  stageLabel: string;
  lastSaved: string;
  unknowns: string[];
  proofCount: number;
  next: NextAction;
}

export function resumeSummary(p: SongProjectV1): ResumeSummary {
  const unknowns: string[] = [];
  if (!["confirmed"].includes(p.key.state) && !p.key.value) unknowns.push("key");
  if (!["confirmed"].includes(p.tempo.state) && !p.tempo.value) unknowns.push("tempo");
  if (!["confirmed"].includes(p.timeSignature.state) && !p.timeSignature.value) unknowns.push("time signature");
  return {
    title: p.workingTitle,
    stageLabel: STAGE_LABELS[stageOf(p)],
    lastSaved: p.updatedAt,
    unknowns,
    proofCount: p.proofs.length,
    next: nextAction(p),
  };
}

// ---------------------------------------------------------------------------
// Safe parse + migration — never destroy an existing record.
// ---------------------------------------------------------------------------

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function bool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}
function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

function parseFact(v: unknown): MusicalFact {
  const o = (v ?? {}) as Record<string, unknown>;
  return { state: oneOf(o.state, ELEMENT_STATES, "unknown"), value: str(o.value) };
}

/**
 * Parses an unknown stored value into a valid SongProjectV1, filling any
 * missing fields with safe defaults. Returns null only when the value isn't
 * a song project at all. Unknown extra fields are dropped, known data kept.
 */
export function parseSongProject(v: unknown): SongProjectV1 | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return null;

  const src = o.originalSource as Record<string, unknown> | null | undefined;
  const memo = (o.voiceMemo ?? {}) as Record<string, unknown>;
  const notes = (o.notesWork ?? {}) as Record<string, unknown>;
  const v1 = o.versionOne as Record<string, unknown> | null | undefined;
  const bounds = (o.boundaries ?? {}) as Record<string, unknown>;
  const defaults = defaultBoundaries();

  return {
    version: 1,
    id: o.id,
    workingTitle: str(o.workingTitle, "Untitled song"),
    createdAt: str(o.createdAt, new Date().toISOString()),
    updatedAt: str(o.updatedAt, new Date().toISOString()),
    startingState: Array.isArray(o.startingState)
      ? (o.startingState.filter((x) => (STARTING_ELEMENTS as string[]).includes(x as string)) as StartingElement[])
      : [],
    equipment: Array.isArray(o.equipment) ? o.equipment.filter((x): x is string => typeof x === "string") : [],
    software: oneOf(o.software, SOFTWARE_PATHS, "undecided"),
    boundaries: {
      preserveOriginalWords: bool(bounds.preserveOriginalWords, defaults.preserveOriginalWords),
      allowLyricWriting: bool(bounds.allowLyricWriting, defaults.allowLyricWriting),
      allowMelodyReplacement: bool(bounds.allowMelodyReplacement, defaults.allowMelodyReplacement),
      preserveMeaning: bool(bounds.preserveMeaning, defaults.preserveMeaning),
      askBeforeWordingSuggestions: bool(bounds.askBeforeWordingSuggestions, defaults.askBeforeWordingSuggestions),
      allowProductionGuidance: bool(bounds.allowProductionGuidance, defaults.allowProductionGuidance),
      allowArrangementGuidance: bool(bounds.allowArrangementGuidance, defaults.allowArrangementGuidance),
      allowTheoryTeaching: bool(bounds.allowTheoryTeaching, defaults.allowTheoryTeaching),
      allowChordExperiments: bool(bounds.allowChordExperiments, defaults.allowChordExperiments),
      authorshipStaysWithCreator: true,
    },
    originalSource:
      src && typeof src.text === "string" && src.text
        ? { text: src.text, preservedAt: str(src.preservedAt, new Date().toISOString()) }
        : null,
    workingCopy: str(o.workingCopy),
    melodyState: oneOf(o.melodyState, ELEMENT_STATES, "unknown"),
    voiceMemo: {
      status: oneOf(memo.status, ["none", "captured"] as const, "none"),
      reference: str(memo.reference),
      strongestParts: str(memo.strongestParts),
      capturedAt: typeof memo.capturedAt === "string" ? memo.capturedAt : undefined,
    },
    notesWork: {
      appUsed: str(notes.appUsed),
      entries: Array.isArray(notes.entries)
        ? notes.entries.flatMap((e): NoteEntry[] => {
            if (!e || typeof e !== "object") return [];
            const n = e as Record<string, unknown>;
            if (typeof n.id !== "string") return [];
            return [{
              id: n.id,
              section: str(n.section),
              notes: str(n.notes),
              rhythm: str(n.rhythm),
              confidence: oneOf(n.confidence, ["guess", "close", "confident"] as const, "guess"),
              addedAt: str(n.addedAt, new Date().toISOString()),
            }];
          })
        : [],
      transferredToDaw: bool(notes.transferredToDaw),
      reference: str(notes.reference),
    },
    key: parseFact(o.key),
    tempo: parseFact(o.tempo),
    timeSignature: parseFact(o.timeSignature),
    hookCandidates: Array.isArray(o.hookCandidates)
      ? o.hookCandidates.flatMap((h): HookCandidate[] => {
          if (!h || typeof h !== "object") return [];
          const x = h as Record<string, unknown>;
          if (typeof x.id !== "string" || typeof x.text !== "string") return [];
          return [{
            id: x.id, text: x.text, origin: "creator",
            status: oneOf(x.status, ["candidate", "confirmed", "rejected", "decide-later"] as const, "candidate"),
            melodicPeak: bool(x.melodicPeak),
            emotionalPeak: bool(x.emotionalPeak),
          }];
        })
      : [],
    sections: Array.isArray(o.sections)
      ? o.sections.flatMap((s): SongSection[] => {
          if (!s || typeof s !== "object") return [];
          const x = s as Record<string, unknown>;
          if (typeof x.id !== "string") return [];
          const kind = oneOf(x.kind, SECTION_KINDS, "fragment");
          return [{
            id: x.id, kind,
            label: str(x.label, SECTION_KIND_LABELS[kind]),
            content: str(x.content),
            energy: str(x.energy),
          }];
        })
      : [],
    softwareChecklist:
      o.softwareChecklist && typeof o.softwareChecklist === "object"
        ? Object.fromEntries(
            Object.entries(o.softwareChecklist as Record<string, unknown>).filter(
              (kv): kv is [string, boolean] => typeof kv[1] === "boolean",
            ),
          )
        : {},
    scratchVocal: oneOf(o.scratchVocal, ["none", "recorded"] as const, "none"),
    playsEndToEnd: bool(o.playsEndToEnd),
    placeholdersNote: str(o.placeholdersNote),
    proofs: Array.isArray(o.proofs)
      ? o.proofs.flatMap((pr): ProofArtifact[] => {
          if (!pr || typeof pr !== "object") return [];
          const x = pr as Record<string, unknown>;
          if (typeof x.id !== "string" || typeof x.reference !== "string" || !x.reference) return [];
          return [{
            id: x.id,
            type: oneOf(x.type, PROOF_TYPES, "file-reference"),
            reference: x.reference,
            note: str(x.note),
            addedAt: str(x.addedAt, new Date().toISOString()),
            verification: "creator-confirmed",
          }];
        })
      : [],
    sessionNotes: str(o.sessionNotes),
    versionOne:
      v1 && typeof v1.declaredAt === "string"
        ? {
            declaredAt: v1.declaredAt,
            whatWorked: str(v1.whatWorked),
            nextImprovement: str(v1.nextImprovement),
          }
        : null,
  };
}
