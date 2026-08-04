// Story Partner — source material capture. Pure logic, no imports.
//
// "Tell your story. Record it, or write it." Both paths land here as a
// SourceMaterial: the exact original is preserved, later edits become
// separate versions, and everything Story Partner proposes stays a labeled
// suggestion until the author decides.
//
// Laws that must not regress:
// 1. `original` is write-once. For a typed or pasted source it is the exact
//    submitted text. For a spoken source it is the word-for-word transcript.
//    No function in this module changes it after it is set — corrections and
//    edits are appended as separate versions.
// 2. A source's audio recording is never modified by anything here — this
//    module only carries its id and metadata; the blob lives in storage.
// 3. Source IDs (SM-0001) are stable for the life of the project and never
//    contain names or content.
// 4. Every proposal (ingredient, scene direction) starts as state "proposed"
//    with origin "story-partner", and only explicit author actions move it.
// 5. Guided questions are always skippable. Skipping is recorded, never
//    punished, and the flow continues without an answer.

export type SourceKindOfCapture = "spoken" | "typed" | "pasted";

export const CAPTURE_KIND_LABELS: Record<SourceKindOfCapture, string> = {
  spoken: "Spoken — recorded",
  typed: "Typed in Story Partner",
  pasted: "Pasted from elsewhere",
};

/**
 * How the word-for-word transcript of a spoken source came to be.
 * - "none"        — typed/pasted sources; the original IS the typed text
 * - "live"        — produced by in-browser speech recognition while recording
 * - "manual"      — recognition failed or was unsupported; the author typed it
 * - "failed"      — recognition failed and no manual transcript exists yet
 * - "unsupported" — this browser can't transcribe and no manual transcript yet
 */
export type TranscriptStatus = "none" | "live" | "manual" | "failed" | "unsupported";

export interface SourceVersion {
  id: string;
  text: string;
  note: string; // what this version changes, optional
  savedAt: string;
}

export type AnswerStatus = "answered" | "skipped" | "saved-for-later";

export interface GuidedAnswer {
  questionId: string;
  /** The question text as asked — kept so the record stands alone. */
  question: string;
  answer: string; // "" when skipped or saved for later
  status: AnswerStatus;
  at: string;
}

export type IngredientKind =
  | "emotional-truth" | "central-conflict" | "desire" | "fear" | "pressure"
  | "relationship-tension" | "setting" | "turning-point" | "symbolic-object"
  | "unresolved-question" | "theme" | "fictional-transformation"
  | "character-influence" | "scene-use";

export const INGREDIENT_KIND_LABELS: Record<IngredientKind, string> = {
  "emotional-truth": "Emotional truth",
  "central-conflict": "Central conflict",
  desire: "Desire",
  fear: "Fear",
  pressure: "Pressure",
  "relationship-tension": "Relationship tension",
  setting: "Setting",
  "turning-point": "Turning point",
  "symbolic-object": "Symbolic object",
  "unresolved-question": "Unresolved question",
  theme: "Theme",
  "fictional-transformation": "Possible fictional transformation",
  "character-influence": "Possible character influence",
  "scene-use": "Possible scene use",
};

/**
 * The author-approval contract used by everything proposed in this module.
 * "proposed" and "undecided" are never treated as author work.
 */
export type ProposalState = "proposed" | "undecided" | "author-edited" | "author-approved" | "rejected";

export const PROPOSAL_STATE_LABELS: Record<ProposalState, string> = {
  proposed: "Suggested by Story Partner",
  undecided: "Undecided",
  "author-edited": "Edited by Author",
  "author-approved": "Approved by Author",
  rejected: "Rejected",
};

export interface Ingredient {
  id: string;
  kind: IngredientKind;
  /** What Story Partner suggested — preserved verbatim, never edited. */
  proposedText: string;
  /** The author's current text. Editing it moves state to "author-edited". */
  text: string;
  state: ProposalState;
  origin: "story-partner" | "author";
  updatedAt: string;
}

export interface SceneDirection {
  id: string;
  /** The structural axis that makes this direction different from its siblings. */
  approach: string;
  whoseScene: string;
  whatHappens: string;
  want: string;      // what the viewpoint character wants
  obstacle: string;  // what stands in the way
  change: string;    // what changes by the end
  serves: string;    // why this direction may serve the larger story
  state: ProposalState;
  origin: "story-partner" | "author";
  /** Which proposal round produced it — "Propose alternatives" starts a new round. */
  round: number;
  /** Scene created from this direction after explicit approval. "" = none. */
  sceneId: string;
  updatedAt: string;
}

export interface SourceHistoryEntry {
  at: string;
  note: string;
}

export interface SourceMaterial {
  /** Stable private ID like SM-0001. Never contains names or content. */
  id: string;
  kind: SourceKindOfCapture;
  title: string; // author's working label
  capturedAt: string;
  /** True while a typed entry is saved unfinished. */
  draft: boolean;
  /** Write-once verbatim original (law 1). "" only while a spoken source awaits its transcript. */
  original: string;
  era: string;
  sensitivity: "private" | "sensitive";
  // Spoken path
  audioId: string; // storage key of the original recording, "" = none saved
  audioMimeType: string;
  audioDurationMs: number;
  transcriptStatus: TranscriptStatus;
  /** Append-only edited versions (corrected transcript / edited source). */
  versions: SourceVersion[];
  answers: GuidedAnswer[];
  ingredients: Ingredient[];
  directions: SceneDirection[];
  /** Real-to-Fiction Legend mappings this source passed through (private lineage). */
  mappingIds: string[];
  directionRound: number;
  archived: boolean;
  createdAt: string;
  /** Append-only. */
  history: SourceHistoryEntry[];
}

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

function now(): string {
  return new Date().toISOString();
}

function shortId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function sourceIdFor(n: number): string {
  return `SM-${String(n).padStart(4, "0")}`;
}

export function sourceIdNumber(id: string): number {
  const m = /^SM-(\d{4,})$/.exec(id);
  return m ? parseInt(m[1], 10) : 0;
}

function baseSource(id: string, kind: SourceKindOfCapture, title: string): SourceMaterial {
  const t = now();
  return {
    id, kind, title: title.trim() || "Untitled source", capturedAt: t, draft: false,
    original: "", era: "", sensitivity: "private",
    audioId: "", audioMimeType: "", audioDurationMs: 0,
    transcriptStatus: "none",
    versions: [], answers: [], ingredients: [], directions: [],
    mappingIds: [], directionRound: 0, archived: false, createdAt: t,
    history: [{ at: t, note: `Captured (${CAPTURE_KIND_LABELS[kind]}).` }],
  };
}

/** Typed or pasted source. The submitted text is preserved exactly — untrimmed. */
export function createTypedSource(
  id: string,
  text: string,
  opts: { title?: string; pasted?: boolean; draft?: boolean; era?: string } = {},
): SourceMaterial | null {
  if (!text.trim()) return null;
  const s = baseSource(id, opts.pasted ? "pasted" : "typed", opts.title ?? "");
  return { ...s, original: text, draft: opts.draft === true, era: (opts.era ?? "").trim() };
}

/** Spoken source. `transcript` is the word-for-word live transcript, or null when transcription failed. */
export function createSpokenSource(
  id: string,
  opts: {
    title?: string;
    audioId?: string;
    audioMimeType?: string;
    audioDurationMs?: number;
    transcript: string | null;
    transcriptSupported: boolean;
    era?: string;
  },
): SourceMaterial {
  const s = baseSource(id, "spoken", opts.title ?? "");
  const transcript = (opts.transcript ?? "").trim();
  return {
    ...s,
    original: transcript,
    era: (opts.era ?? "").trim(),
    audioId: opts.audioId ?? "",
    audioMimeType: opts.audioMimeType ?? "",
    audioDurationMs: opts.audioDurationMs ?? 0,
    transcriptStatus: transcript ? "live" : opts.transcriptSupported ? "failed" : "unsupported",
  };
}

// ---------------------------------------------------------------------------
// Write-once original + append-only versions (laws 1 & 2)
// ---------------------------------------------------------------------------

/**
 * Recovery path: a spoken source whose transcription failed gets its
 * word-for-word transcript typed by the author. Allowed ONLY while the
 * original is still empty — once set, the original is permanent.
 */
export function setManualTranscript(s: SourceMaterial, transcript: string): SourceMaterial {
  const clean = transcript.trim();
  if (s.kind !== "spoken" || s.original !== "" || !clean) return s;
  return {
    ...s,
    original: transcript,
    transcriptStatus: "manual",
    history: [...s.history, { at: now(), note: "Word-for-word transcript typed by the author." }],
  };
}

/** Append an edited version. The original is untouched — always. */
export function addSourceVersion(s: SourceMaterial, text: string, note = ""): SourceMaterial {
  const clean = text.trim();
  if (!clean) return s;
  const label = note.trim() || (s.kind === "spoken" ? "Corrected transcript" : "Edited version");
  return {
    ...s,
    versions: [...s.versions, { id: shortId(), text, note: label, savedAt: now() }],
    history: [...s.history, { at: now(), note: `${label} saved as version ${s.versions.length + 1}.` }],
  };
}

/** The author's working text: the newest version, or the original. */
export function currentSourceText(s: SourceMaterial): string {
  return s.versions.length ? s.versions[s.versions.length - 1].text : s.original;
}

export function updateSourceMeta(
  s: SourceMaterial,
  changes: Partial<Pick<SourceMaterial, "title" | "era" | "sensitivity" | "draft" | "archived">>,
): SourceMaterial {
  const next = { ...s, ...changes };
  next.title = next.title.trim() || s.title;
  return next;
}

// ---------------------------------------------------------------------------
// Processing state — derived from the data, so it can never drift
// ---------------------------------------------------------------------------

export type SourceStage =
  | "draft" | "awaiting-transcript" | "captured" | "questioned"
  | "interpreted" | "bridged" | "directed" | "in-manuscript" | "archived";

export const SOURCE_STAGE_LABELS: Record<SourceStage, string> = {
  draft: "Unfinished draft",
  "awaiting-transcript": "Needs its transcript",
  captured: "Captured — original preserved",
  questioned: "Questions in progress",
  interpreted: "Ingredients under review",
  bridged: "Through the Real-to-Fiction Bridge",
  directed: "Scene direction approved",
  "in-manuscript": "In the manuscript",
  archived: "Archived",
};

export function sourceStage(s: SourceMaterial): SourceStage {
  if (s.archived) return "archived";
  if (s.draft) return "draft";
  if (s.original === "") return "awaiting-transcript";
  if (s.directions.some((d) => d.sceneId)) return "in-manuscript";
  if (s.directions.some((d) => d.state === "author-approved")) return "directed";
  if (s.mappingIds.length > 0) return "bridged";
  if (s.ingredients.length > 0) return "interpreted";
  if (s.answers.length > 0) return "questioned";
  return "captured";
}

/** The next useful action for this source — shown on the home screen. */
export function nextActionFor(s: SourceMaterial): string {
  switch (sourceStage(s)) {
    case "draft": return "Finish the unfinished entry";
    case "awaiting-transcript": return "Type the word-for-word transcript";
    case "captured": return "Answer one question, or review ingredients";
    case "questioned": return "Review proposed story ingredients";
    case "interpreted": return "Decide on ingredients, then cross the Real-to-Fiction Bridge";
    case "bridged": return "Choose a scene direction";
    case "directed": return "Edit the scene and approve it for the manuscript";
    case "in-manuscript": return "Done — the approved scene is in the manuscript";
    case "archived": return "Archived";
  }
}

// ---------------------------------------------------------------------------
// Text signals — small, deterministic, honest heuristics
// ---------------------------------------------------------------------------

const EMOTION_WORDS = ["afraid", "angry", "ashamed", "cried", "cry", "fear", "feared", "grief", "guilt", "happy", "hurt", "joy", "lonely", "loss", "love", "loved", "miss", "missed", "peace", "proud", "regret", "sad", "scared", "shame", "sorrow", "tears", "terrified", "worried"];
const PEOPLE_WORDS = ["aunt", "brother", "cousin", "dad", "daughter", "father", "friend", "grandma", "grandpa", "grandfather", "grandmother", "husband", "mom", "mother", "neighbor", "pastor", "sister", "son", "teacher", "uncle", "wife"];
const CONFLICT_MARKERS = ["against", "argued", "argument", "but ", "couldn't", "fight", "fought", "never", "refused", "wouldn't"];
const DESIRE_MARKERS = ["dreamed", "hoped", "longed", "prayed for", "wanted", "wished"];
const FEAR_MARKERS = ["afraid", "dread", "feared", "scared", "terrified", "worried"];
const PRESSURE_MARKERS = ["deadline", "forced", "had to", "must", "no choice", "owed"];
const PLACE_WORDS = ["car", "church", "farm", "field", "home", "hospital", "house", "kitchen", "porch", "river", "road", "room", "school", "shop", "town", "truck", "yard"];
const TURNING_MARKERS = ["after that", "everything changed", "first time", "from then on", "last time", "suddenly", "that day", "that night"];
const OBJECT_WORDS = ["bible", "box", "door", "guitar", "key", "letter", "note", "photo", "photograph", "piano", "ring", "table", "watch"];
const WONDER_MARKERS = ["never found out", "never knew", "never understood", "still wonder", "wonder why"];
const FAITH_WORDS = ["believed", "church", "faith", "forgive", "forgave", "god", "grace", "pray", "prayed", "prayer"];

function sentencesOf(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

/** Word-boundary match: single words match whole words; phrases match as-is. */
function hasMarker(text: string, marker: string): boolean {
  const low = text.toLowerCase();
  if (marker.includes(" ")) return low.includes(marker);
  return new RegExp(`\\b${marker}\\b`).test(low);
}

function firstSentenceWith(sentences: string[], markers: string[]): { sentence: string; marker: string } | null {
  for (const sentence of sentences) {
    for (const marker of markers) {
      if (hasMarker(sentence, marker)) return { sentence, marker };
    }
  }
  return null;
}

export interface TextSignals {
  hasEmotion: boolean;
  hasPeople: boolean;
  hasConflict: boolean;
  hasChange: boolean;
  hasWonder: boolean;
  hasFaith: boolean;
}

export function textSignals(text: string): TextSignals {
  const any = (markers: string[]) => markers.some((m) => hasMarker(text, m));
  return {
    hasEmotion: any(EMOTION_WORDS),
    hasPeople: any(PEOPLE_WORDS),
    hasConflict: any(CONFLICT_MARKERS),
    hasChange: any(TURNING_MARKERS),
    hasWonder: any(WONDER_MARKERS) || text.includes("?"),
    hasFaith: any(FAITH_WORDS),
  };
}

// ---------------------------------------------------------------------------
// One question at a time — responsive to the material, always skippable (law 5)
// ---------------------------------------------------------------------------

export interface GuidedQuestion {
  id: string;
  text: string;
  /** Ingredient kind an answer most naturally feeds. */
  feeds: IngredientKind;
}

export const QUESTION_BANK: GuidedQuestion[] = [
  { id: "q-stay", text: "What made this moment stay with you?", feeds: "emotional-truth" },
  { id: "q-emotion", text: "What emotion must survive in the fictional version?", feeds: "emotional-truth" },
  { id: "q-change", text: "What changed because of it?", feeds: "turning-point" },
  { id: "q-believe", text: "What did you believe before it happened?", feeds: "theme" },
  { id: "q-unsaid", text: "What was left unsaid?", feeds: "relationship-tension" },
  { id: "q-lose", text: "Who had the most to lose?", feeds: "character-influence" },
  { id: "q-literal", text: "Which literal detail must not appear in the story?", feeds: "fictional-transformation" },
  { id: "q-reader", text: "What do you want the reader to understand?", feeds: "theme" },
  { id: "q-kind", text: "Is this mainly about a person, a relationship, a decision, a loss, a hope, a fear, or a turning point?", feeds: "scene-use" },
];

/**
 * Pick the next question for THIS material — not a fixed interrogation.
 * Deterministic: signals in the text pull related questions forward; questions
 * already answered, skipped, or saved for later are never repeated.
 */
export function nextQuestion(s: SourceMaterial): GuidedQuestion | null {
  const asked = new Set(s.answers.map((a) => a.questionId));
  const remaining = QUESTION_BANK.filter((q) => !asked.has(q.id));
  if (remaining.length === 0) return null;

  const sig = textSignals(currentSourceText(s));
  const score = (q: GuidedQuestion): number => {
    switch (q.id) {
      case "q-stay": return 5; // the natural opener
      case "q-emotion": return sig.hasEmotion ? 6 : 3;
      case "q-unsaid": return sig.hasPeople ? 6 : 2;
      case "q-lose": return sig.hasPeople && sig.hasConflict ? 6 : 2;
      case "q-change": return sig.hasChange ? 6 : 3;
      case "q-believe": return sig.hasFaith ? 5 : 2;
      case "q-reader": return 2;
      case "q-literal": return s.answers.length >= 2 ? 4 : 1; // later, once trust is built
      case "q-kind": return 1;
      default: return 1;
    }
  };
  return [...remaining].sort((a, b) => score(b) - score(a))[0];
}

/** Record an answer, a skip, or a save-for-later. The flow continues either way. */
export function answerQuestion(
  s: SourceMaterial,
  question: GuidedQuestion,
  answer: string,
  status: AnswerStatus = "answered",
): SourceMaterial {
  if (s.answers.some((a) => a.questionId === question.id && a.status !== "saved-for-later")) return s;
  const clean = answer.trim();
  const record: GuidedAnswer = {
    questionId: question.id,
    question: question.text,
    answer: status === "answered" ? clean : "",
    status: status === "answered" && !clean ? "skipped" : status,
    at: now(),
  };
  // A saved-for-later question can be answered later — replace its record then.
  return { ...s, answers: [...s.answers.filter((a) => a.questionId !== question.id), record] };
}

/** A question previously saved for later, if any — offered before new ones. */
export function savedForLater(s: SourceMaterial): GuidedQuestion[] {
  return QUESTION_BANK.filter((q) => s.answers.some((a) => a.questionId === q.id && a.status === "saved-for-later"));
}

// ---------------------------------------------------------------------------
// Proposed story ingredients — every one a labeled suggestion (law 4)
// ---------------------------------------------------------------------------

function makeProposal(kind: IngredientKind, text: string): Ingredient {
  return {
    id: shortId(), kind, proposedText: text, text,
    state: "proposed", origin: "story-partner", updatedAt: now(),
  };
}

function clip(sentence: string, max = 160): string {
  return sentence.length <= max ? sentence : `${sentence.slice(0, max - 1)}…`;
}

/**
 * Deterministic proposals drawn from the author's own words and answers.
 * One per ingredient kind at most. Nothing here is treated as fact — the
 * author approves, rejects, edits, or leaves each one undecided.
 */
export function proposeIngredients(s: SourceMaterial): Ingredient[] {
  const text = currentSourceText(s);
  const sentences = sentencesOf(text);
  const out: Ingredient[] = [];
  const used = new Set<IngredientKind>(s.ingredients.map((i) => i.kind));
  const add = (kind: IngredientKind, proposal: string) => {
    if (used.has(kind)) return;
    used.add(kind);
    out.push(makeProposal(kind, proposal));
  };

  // Answers first — the author's own reflections are the best material.
  for (const a of s.answers) {
    if (a.status !== "answered" || !a.answer) continue;
    const q = QUESTION_BANK.find((x) => x.id === a.questionId);
    if (!q) continue;
    add(q.feeds, `From your answer to “${q.text}” — ${clip(a.answer)}`);
  }

  const emotional = firstSentenceWith(sentences, EMOTION_WORDS);
  if (emotional) add("emotional-truth", `The feeling in “${clip(emotional.sentence)}” may be the emotional truth this story must keep.`);

  const conflict = firstSentenceWith(sentences, CONFLICT_MARKERS);
  if (conflict) add("central-conflict", `A conflict may live in “${clip(conflict.sentence)}”.`);

  const desire = firstSentenceWith(sentences, DESIRE_MARKERS);
  if (desire) add("desire", `Someone wants something here: “${clip(desire.sentence)}”.`);

  const fear = firstSentenceWith(sentences, FEAR_MARKERS);
  if (fear) add("fear", `A fear worth naming: “${clip(fear.sentence)}”.`);

  const pressure = firstSentenceWith(sentences, PRESSURE_MARKERS);
  if (pressure) add("pressure", `Outside pressure shows in “${clip(pressure.sentence)}”.`);

  const tension = firstSentenceWith(sentences, PEOPLE_WORDS);
  if (tension && textSignals(text).hasConflict) {
    add("relationship-tension", `The tension between people in “${clip(tension.sentence)}” could drive a relationship arc.`);
  }

  const place = firstSentenceWith(sentences, PLACE_WORDS);
  if (place) add("setting", `A concrete setting to keep or transform: “${clip(place.sentence)}”.`);

  const turning = firstSentenceWith(sentences, TURNING_MARKERS);
  if (turning) add("turning-point", `This may be a turning point: “${clip(turning.sentence)}”.`);

  const object = firstSentenceWith(sentences, OBJECT_WORDS);
  if (object) add("symbolic-object", `An object that could carry meaning: “${clip(object.sentence)}”.`);

  const wonder = firstSentenceWith(sentences, WONDER_MARKERS) ?? (sentences.find((x) => x.endsWith("?")) ? { sentence: sentences.find((x) => x.endsWith("?"))!, marker: "?" } : null);
  if (wonder) add("unresolved-question", `An unresolved question sits in “${clip(wonder.sentence)}”.`);

  // Always leave the author with something to react to.
  if (sentences.length > 0) {
    add("theme", `A theme this source could carry, in your words: “${clip(sentences[0])}”.`);
    add("scene-use", "This could become a scene set close to the moment itself — or the moment could echo inside a different scene entirely.");
    add("fictional-transformation", "The literal details (names, places, dates) can all change while the feeling stays true.");
  }

  return out;
}

/** Attach freshly proposed ingredients. Existing ingredients are never replaced. */
export function attachProposedIngredients(s: SourceMaterial): SourceMaterial {
  const proposals = proposeIngredients(s);
  if (proposals.length === 0) return s;
  return {
    ...s,
    ingredients: [...s.ingredients, ...proposals],
    history: [...s.history, { at: now(), note: `${proposals.length} story ingredients suggested — all awaiting the author's decision.` }],
  };
}

export function setIngredientState(s: SourceMaterial, ingredientId: string, state: ProposalState): SourceMaterial {
  return {
    ...s,
    ingredients: s.ingredients.map((i) => (i.id === ingredientId ? { ...i, state, updatedAt: now() } : i)),
  };
}

/** Author edit: text changes, proposedText stays verbatim, state records the edit. */
export function editIngredient(s: SourceMaterial, ingredientId: string, text: string): SourceMaterial {
  const clean = text.trim();
  if (!clean) return s;
  return {
    ...s,
    ingredients: s.ingredients.map((i) =>
      i.id === ingredientId ? { ...i, text: clean, state: i.state === "author-approved" ? "author-approved" : "author-edited", updatedAt: now() } : i,
    ),
  };
}

/** The author's own ingredient — origin "author", approved by definition. */
export function addAuthorIngredient(s: SourceMaterial, kind: IngredientKind, text: string): SourceMaterial {
  const clean = text.trim();
  if (!clean) return s;
  const ing: Ingredient = {
    id: shortId(), kind, proposedText: "", text: clean,
    state: "author-approved", origin: "author", updatedAt: now(),
  };
  return { ...s, ingredients: [...s.ingredients, ing] };
}

// ---------------------------------------------------------------------------
// Real-to-Fiction Bridge lineage (the mapping itself lives in the vault)
// ---------------------------------------------------------------------------

export function linkMapping(s: SourceMaterial, mappingId: string): SourceMaterial {
  if (!mappingId || s.mappingIds.includes(mappingId)) return s;
  return {
    ...s,
    mappingIds: [...s.mappingIds, mappingId],
    history: [...s.history, { at: now(), note: "Crossed the Real-to-Fiction Bridge — mapping recorded in the private legend." }],
  };
}

export function unlinkMapping(s: SourceMaterial, mappingId: string): SourceMaterial {
  if (!s.mappingIds.includes(mappingId)) return s;
  return { ...s, mappingIds: s.mappingIds.filter((m) => m !== mappingId) };
}

// ---------------------------------------------------------------------------
// Three scene directions — genuinely different, never auto-approved (law 4)
// ---------------------------------------------------------------------------

function approvedOrEdited(s: SourceMaterial, kind: IngredientKind): string {
  const hit =
    s.ingredients.find((i) => i.kind === kind && i.state === "author-approved") ??
    s.ingredients.find((i) => i.kind === kind && i.state === "author-edited");
  return hit ? hit.text : "";
}

function answerTo(s: SourceMaterial, questionId: string): string {
  return s.answers.find((a) => a.questionId === questionId && a.status === "answered")?.answer ?? "";
}

interface DirectionAxis {
  approach: string;
  whoseScene: (ctx: DirectionContext) => string;
  whatHappens: (ctx: DirectionContext) => string;
  want: (ctx: DirectionContext) => string;
  obstacle: (ctx: DirectionContext) => string;
  change: (ctx: DirectionContext) => string;
  serves: (ctx: DirectionContext) => string;
}

interface DirectionContext {
  emotion: string;
  conflict: string;
  desire: string;
  turning: string;
  theme: string;
  fictionLabel: string; // fictional character/place from the bridge, "" = undecided
}

const or = (x: string, fallback: string) => (x ? x : fallback);

/**
 * Six structural axes; each proposal round serves three of them. The axes vary
 * viewpoint, chronology, visible vs. hidden conflict, and who holds power —
 * so the three are different by construction, not by rephrasing.
 */
const DIRECTION_AXES: DirectionAxis[] = [
  {
    approach: "Inside the moment — live through it as it happens, conflict in the open",
    whoseScene: (c) => or(c.fictionLabel, "The character at the center of this moment"),
    whatHappens: (c) => `The scene stays inside the moment itself, in real time. ${or(c.conflict, "The pressure of the situation is visible on the surface")}. Nothing is softened by hindsight.`,
    want: (c) => or(c.desire, "To get through the moment without losing what matters most"),
    obstacle: (c) => or(c.conflict, "The situation itself — and what the other person will not say"),
    change: (c) => or(c.turning, "By the last line, something has shifted that cannot shift back"),
    serves: (c) => `It plants the emotional ground truth early${c.theme ? ` — ${c.theme}` : ""} — so later books can echo it without re-explaining it.`,
  },
  {
    approach: "The witness — seen from the side, the real conflict hidden under the surface",
    whoseScene: () => "A character watching — the one with the most to lose and the least power to act",
    whatHappens: (c) => `The event happens at the edge of the frame. The witness reads faces and silences; the visible action is ordinary while ${or(c.conflict.toLowerCase(), "the real conflict")} stays underneath. The reader learns the stakes before anyone says them.`,
    want: () => "To be let inside — to be told the truth instead of overhearing it",
    obstacle: (c) => or(c.emotion, "Everyone protecting everyone else from what they already know"),
    change: () => "The witness stops waiting to be told and decides what they believe on their own",
    serves: () => "It builds a second viewpoint character the saga can return to, and lets the reader carry knowledge the characters don't share.",
  },
  {
    approach: "The echo — years later, the moment resurfaces; power has traded places",
    whoseScene: (c) => `${or(c.fictionLabel, "The character this moment shaped")}, years afterward`,
    whatHappens: (c) => `Long after the event, something small brings it back. The scene braids then and now: what actually happened, and what the years did with it. ${or(c.turning, "What changed that day is finally visible only from this distance")}.`,
    want: () => "To make peace with the memory — or to finally act on it",
    obstacle: () => "Time itself: what was never said then cannot simply be said now",
    change: (c) => or(c.emotion, "The feeling is named at last — and naming it costs something"),
    serves: (c) => `It gives the saga a long arc: the same truth${c.theme ? ` (${c.theme})` : ""} seen twice, which is where a spiritual question can surface without preaching.`,
  },
  {
    approach: "The night before — anticipation, when the outcome is still unknown",
    whoseScene: (c) => or(c.fictionLabel, "The character heading into this moment"),
    whatHappens: (c) => `Set entirely before the event. Preparation, small rituals, the last ordinary hour. ${or(c.desire, "What they hope for")} sits next to what the reader may already dread. The event itself never appears on the page.`,
    want: (c) => or(c.desire, "For tomorrow to go the way they've rehearsed it"),
    obstacle: () => "Nothing yet — which is the tension: the obstacle is coming and can't be met early",
    change: () => "A small choice made this night that will matter enormously later",
    serves: () => "It lets a book earn a hard moment by making the reader love the ordinary life it interrupts.",
  },
  {
    approach: "The other side — the same moment from the person who caused it",
    whoseScene: () => "The character on the other side of this memory — the one who did or decided",
    whatHappens: (c) => `The same event, inverted. What looked like ${or(c.conflict.toLowerCase(), "opposition")} from outside has its own logic inside. The scene doesn't excuse — it explains, and lets the reader hold both truths at once.`,
    want: () => "To do what they believe is right — or to hide that they no longer believe it",
    obstacle: (c) => or(c.emotion, "Their own conscience, and the person watching them"),
    change: () => "A crack appears in their certainty that later scenes can widen",
    serves: () => "Composite antagonists become human. Cross-book continuity gets a second engine: the same events, two ledgers.",
  },
  {
    approach: "The retelling — the story told aloud to someone new, edited by the teller",
    whoseScene: (c) => or(c.fictionLabel, "The character who owns this memory"),
    whatHappens: (c) => `The character tells this story to someone who wasn't there — and the reader notices what gets left out. The gaps carry ${or(c.emotion.toLowerCase(), "the weight")}. The listener asks one question the teller can't answer.`,
    want: () => "To be understood without having to say the unsayable part",
    obstacle: () => "The listener's innocent questions, each one a step closer to the omission",
    change: (c) => or(c.turning, "The teller either closes the story early — or crosses the line and tells the truth"),
    serves: () => "Dialogue-forward and audiobook-friendly; it dramatizes how memory itself edits, which is the saga's quiet subject.",
  },
];

export function proposeDirections(s: SourceMaterial, fictionLabel = ""): SceneDirection[] {
  const ctx: DirectionContext = {
    emotion: or(approvedOrEdited(s, "emotional-truth"), answerTo(s, "q-emotion") || answerTo(s, "q-stay")),
    conflict: approvedOrEdited(s, "central-conflict"),
    desire: approvedOrEdited(s, "desire"),
    turning: or(approvedOrEdited(s, "turning-point"), answerTo(s, "q-change")),
    theme: or(approvedOrEdited(s, "theme"), answerTo(s, "q-reader")),
    fictionLabel,
  };
  const round = s.directionRound;
  const t = now();
  return [0, 1, 2].map((i) => {
    const axis = DIRECTION_AXES[(round * 3 + i) % DIRECTION_AXES.length];
    return {
      id: shortId(),
      approach: axis.approach,
      whoseScene: axis.whoseScene(ctx),
      whatHappens: axis.whatHappens(ctx),
      want: axis.want(ctx),
      obstacle: axis.obstacle(ctx),
      change: axis.change(ctx),
      serves: axis.serves(ctx),
      state: "proposed" as const,
      origin: "story-partner" as const,
      round,
      sceneId: "",
      updatedAt: t,
    };
  });
}

/** Attach a fresh round of three directions. Earlier rounds are kept as history. */
export function attachProposedDirections(s: SourceMaterial, fictionLabel = ""): SourceMaterial {
  const trio = proposeDirections(s, fictionLabel);
  return {
    ...s,
    directions: [...s.directions, ...trio],
    directionRound: s.directionRound + 1,
    history: [...s.history, { at: now(), note: "Three scene directions suggested — the author chooses, combines, edits, or rejects." }],
  };
}

export function setDirectionState(s: SourceMaterial, directionId: string, state: ProposalState): SourceMaterial {
  return {
    ...s,
    directions: s.directions.map((d) => {
      if (d.id !== directionId) return d;
      // A direction already in the manuscript can't be un-approved from here.
      if (d.sceneId && state !== "author-approved") return d;
      return { ...d, state, updatedAt: now() };
    }),
  };
}

export function rejectAllProposedDirections(s: SourceMaterial): SourceMaterial {
  return {
    ...s,
    directions: s.directions.map((d) =>
      d.state === "proposed" || d.state === "undecided" ? { ...d, state: "rejected" as const, updatedAt: now() } : d,
    ),
  };
}

const DIRECTION_FIELDS = ["approach", "whoseScene", "whatHappens", "want", "obstacle", "change", "serves"] as const;
export type DirectionField = (typeof DIRECTION_FIELDS)[number];

/** Author edit of a direction — state records the edit; approval stays explicit. */
export function editDirection(
  s: SourceMaterial,
  directionId: string,
  changes: Partial<Record<DirectionField, string>>,
): SourceMaterial {
  return {
    ...s,
    directions: s.directions.map((d) => {
      if (d.id !== directionId) return d;
      const next = { ...d };
      for (const f of DIRECTION_FIELDS) {
        const v = changes[f];
        if (typeof v === "string" && v.trim()) next[f] = v.trim();
      }
      if (next.state !== "author-approved") next.state = "author-edited";
      next.updatedAt = now();
      return next;
    }),
  };
}

/** The author's own direction — theirs from the first word. */
export function addAuthorDirection(
  s: SourceMaterial,
  fields: Partial<Record<DirectionField, string>> & { whatHappens: string },
): SourceMaterial {
  if (!fields.whatHappens.trim()) return s;
  const t = now();
  const d: SceneDirection = {
    id: shortId(),
    approach: (fields.approach ?? "").trim() || "The author's own direction",
    whoseScene: (fields.whoseScene ?? "").trim(),
    whatHappens: fields.whatHappens.trim(),
    want: (fields.want ?? "").trim(),
    obstacle: (fields.obstacle ?? "").trim(),
    change: (fields.change ?? "").trim(),
    serves: (fields.serves ?? "").trim(),
    state: "author-approved",
    origin: "author",
    round: s.directionRound,
    sceneId: "",
    updatedAt: t,
  };
  return { ...s, directions: [...s.directions, d] };
}

/**
 * A plain starting paragraph the author edits into prose. Shown ONLY under a
 * "Suggested by Story Partner" label — it is never treated as finished work.
 */
export function sceneSeed(d: SceneDirection): string {
  const bits = [d.whatHappens, d.want && `What they want: ${d.want}.`, d.obstacle && `In the way: ${d.obstacle}.`, d.change && `By the end: ${d.change}.`]
    .filter(Boolean);
  return bits.join(" ");
}

// ---------------------------------------------------------------------------
// Sanitize — rebuild from untrusted data; never throws
// ---------------------------------------------------------------------------

const isStr = (x: unknown): x is string => typeof x === "string";
const strOr = (x: unknown, fallback = ""): string => (isStr(x) ? x : fallback);
const arr = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);

const CAPTURE_KINDS: SourceKindOfCapture[] = ["spoken", "typed", "pasted"];
const TRANSCRIPT_STATUSES: TranscriptStatus[] = ["none", "live", "manual", "failed", "unsupported"];
const PROPOSAL_STATES: ProposalState[] = ["proposed", "undecided", "author-edited", "author-approved", "rejected"];
const ANSWER_STATUSES: AnswerStatus[] = ["answered", "skipped", "saved-for-later"];
const INGREDIENT_KINDS = Object.keys(INGREDIENT_KIND_LABELS) as IngredientKind[];

export function sanitizeSource(data: unknown): SourceMaterial | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (!isStr(d.id) || !/^SM-\d{4,}$/.test(d.id)) return null;
  if (!CAPTURE_KINDS.includes(d.kind as SourceKindOfCapture)) return null;

  const versions: SourceVersion[] = [];
  for (const raw of arr(d.versions)) {
    const v = raw as Record<string, unknown>;
    if (!v || !isStr(v.text) || !v.text.trim()) continue;
    versions.push({ id: strOr(v.id) || shortId(), text: v.text, note: strOr(v.note), savedAt: strOr(v.savedAt) });
  }

  const answers: GuidedAnswer[] = [];
  for (const raw of arr(d.answers)) {
    const a = raw as Record<string, unknown>;
    if (!a || !isStr(a.questionId) || !isStr(a.question)) continue;
    if (answers.some((x) => x.questionId === a.questionId)) continue;
    answers.push({
      questionId: a.questionId, question: a.question, answer: strOr(a.answer),
      status: ANSWER_STATUSES.includes(a.status as AnswerStatus) ? (a.status as AnswerStatus) : "answered",
      at: strOr(a.at),
    });
  }

  const ingredients: Ingredient[] = [];
  for (const raw of arr(d.ingredients)) {
    const i = raw as Record<string, unknown>;
    if (!i || !isStr(i.text) || !INGREDIENT_KINDS.includes(i.kind as IngredientKind)) continue;
    ingredients.push({
      id: strOr(i.id) || shortId(), kind: i.kind as IngredientKind,
      proposedText: strOr(i.proposedText), text: i.text,
      state: PROPOSAL_STATES.includes(i.state as ProposalState) ? (i.state as ProposalState) : "proposed",
      origin: i.origin === "author" ? "author" : "story-partner",
      updatedAt: strOr(i.updatedAt),
    });
  }

  const directions: SceneDirection[] = [];
  for (const raw of arr(d.directions)) {
    const x = raw as Record<string, unknown>;
    if (!x || !isStr(x.whatHappens)) continue;
    directions.push({
      id: strOr(x.id) || shortId(),
      approach: strOr(x.approach), whoseScene: strOr(x.whoseScene), whatHappens: x.whatHappens,
      want: strOr(x.want), obstacle: strOr(x.obstacle), change: strOr(x.change), serves: strOr(x.serves),
      state: PROPOSAL_STATES.includes(x.state as ProposalState) ? (x.state as ProposalState) : "proposed",
      origin: x.origin === "author" ? "author" : "story-partner",
      round: typeof x.round === "number" && Number.isFinite(x.round) ? x.round : 0,
      sceneId: strOr(x.sceneId),
      updatedAt: strOr(x.updatedAt),
    });
  }

  const history: SourceHistoryEntry[] = [];
  for (const raw of arr(d.history)) {
    const h = raw as Record<string, unknown>;
    if (!h || !isStr(h.note)) continue;
    history.push({ at: strOr(h.at), note: h.note });
  }

  return {
    id: d.id,
    kind: d.kind as SourceKindOfCapture,
    title: strOr(d.title).trim() || "Untitled source",
    capturedAt: strOr(d.capturedAt),
    draft: d.draft === true,
    original: strOr(d.original),
    era: strOr(d.era),
    sensitivity: d.sensitivity === "sensitive" ? "sensitive" : "private",
    audioId: strOr(d.audioId),
    audioMimeType: strOr(d.audioMimeType),
    audioDurationMs: typeof d.audioDurationMs === "number" && Number.isFinite(d.audioDurationMs) ? d.audioDurationMs : 0,
    transcriptStatus: TRANSCRIPT_STATUSES.includes(d.transcriptStatus as TranscriptStatus) ? (d.transcriptStatus as TranscriptStatus) : "none",
    versions, answers, ingredients, directions,
    mappingIds: arr(d.mappingIds).filter(isStr),
    directionRound: typeof d.directionRound === "number" && Number.isFinite(d.directionRound) ? d.directionRound : 0,
    archived: d.archived === true,
    createdAt: strOr(d.createdAt),
    history,
  };
}
