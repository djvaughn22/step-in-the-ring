// Story Partner — pure logic.
//
// A private working story room: memories and manuscript grow together,
// iteratively, one focus at a time (character / relationship / storyline /
// scene / chapter). The author owns every creative decision.
//
// Laws that must not regress:
// 1. A memory's original text is permanently preserved. No function in this
//    file can change it after capture — cleanups, summaries and fictions are
//    saved separately.
// 2. Nothing pasted back from an outside AI becomes canon automatically. Only
//    an explicit "established fact" or "approved decision" classification is
//    canon.
// 3. Scene drafts are append-only. A new revision never replaces an old one.
// 4. Reordering chapters or scenes moves references — it never duplicates or
//    loses the underlying records.
// 5. A published edition is immutable. There is deliberately no function in
//    this file that edits or deletes one — a correction is a NEW edition.
// 6. Constitution rules keep their full amendment history: every change
//    records the previous text, the reason, and the date.
// 7. Spiritual-world rules always carry one of four truth labels — direct
//    Scripture, chosen interpretation, fictional invention, open question —
//    and fictional invention is never presented as doctrine.

export type FocusKind = "character" | "relationship" | "storyline" | "scene" | "chapter";

export const FOCUS_KIND_LABELS: Record<FocusKind, string> = {
  character: "Character",
  relationship: "Relationship",
  storyline: "Storyline",
  scene: "Scene",
  chapter: "Chapter",
};

export interface LinkRef {
  kind: FocusKind;
  id: string;
}

// ---------------------------------------------------------------------------
// Notes — one mechanism for everything the author establishes, wonders, or
// proposes. `canon` marks what counts as decided story truth.
// ---------------------------------------------------------------------------

export type NoteKind =
  | "fact"          // established story fact (canon)
  | "decision"      // approved fictionalization decision: real → fiction, and why (canon)
  | "possibility"   // proposed fictional detail — NOT canon until promoted
  | "question"      // open question to explore
  | "contradiction" // two things that can't both be true yet
  | "scene-idea"    // a scene that could exist
  | "working";      // working note / interpretation / cleanup of source material

export const NOTE_KINDS: { id: NoteKind; label: string; canon: boolean; help: string }[] = [
  { id: "fact", label: "Established story fact", canon: true, help: "Decided truth inside the novel." },
  { id: "decision", label: "Fictionalization decision", canon: true, help: "What changes from real life, and why." },
  { id: "possibility", label: "Fictional possibility", canon: false, help: "A proposal. Not canon until you decide." },
  { id: "question", label: "Open question", canon: false, help: "Something to explore." },
  { id: "contradiction", label: "Contradiction", canon: false, help: "Two things that can't both be true yet." },
  { id: "scene-idea", label: "Scene idea", canon: false, help: "A scene that could exist." },
  { id: "working", label: "Working note", canon: false, help: "Interpretation or cleanup — separate from the original memory." },
];

export const NOTE_KIND_BY_ID = new Map(NOTE_KINDS.map((k) => [k.id, k]));

export interface StoryNote {
  id: string;
  kind: NoteKind;
  text: string;
  attachedTo: LinkRef[];
  status: "open" | "resolved";
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

export interface MemoryRecord {
  id: string;
  /** Verbatim capture. Permanently preserved — nothing in this file mutates it. */
  original: string;
  capturedAt: string;
  era: string; // rough life era, optional free text
  /** The author's cleanup/interpretation — always separate from the original. */
  workingNotes: string;
  links: LinkRef[]; // zero, one, or many — never a forced primary
}

/**
 * Human, angelic, demonic, or other. Non-human characters exist inside the
 * Spiritual-World Constitution's rules — their fictional mechanics are
 * invention, never doctrine.
 */
export type CharacterClassification = "human" | "angel" | "demon" | "other";

export const CHARACTER_CLASSIFICATIONS: { id: CharacterClassification; label: string }[] = [
  { id: "human", label: "Human" },
  { id: "angel", label: "Angel (fictional portrayal)" },
  { id: "demon", label: "Demon (fictional portrayal)" },
  { id: "other", label: "Other" },
];

export interface CharacterRecord {
  id: string;
  name: string;
  description: string;
  /** Private notes about the real person(s) behind the character. */
  realBasis: string;
  classification: CharacterClassification;
  /** How the name is said aloud — the audiobook is the primary experience. */
  pronunciation: string;
  /** Speaking rhythm, vocabulary, narrator voice notes. */
  voiceNotes: string;
  createdAt: string;
}

export interface RelationshipRecord {
  id: string;
  title: string;
  participantIds: string[]; // character ids
  description: string;
  createdAt: string;
}

export interface StorylineRecord {
  id: string;
  name: string;
  summary: string;
  createdAt: string;
}

export interface SceneDraft {
  id: string;
  text: string;
  note: string; // what changed in this revision, optional
  savedAt: string;
}

export interface SceneRecord {
  id: string;
  title: string;
  purpose: string;
  links: LinkRef[]; // characters / relationships / storylines this scene serves
  /** Append-only. drafts[drafts.length - 1] is the current version. */
  drafts: SceneDraft[];
  createdAt: string;
}

export type ChapterStatus = "planned" | "drafting" | "drafted" | "revised";

export const CHAPTER_STATUSES: { id: ChapterStatus; label: string }[] = [
  { id: "planned", label: "Planned" },
  { id: "drafting", label: "Drafting" },
  { id: "drafted", label: "Drafted" },
  { id: "revised", label: "Revised" },
];

/**
 * Review ladder — where a chapter stands on the road to publication. Distinct
 * from ChapterStatus (writing progress). Generated text NEVER advances itself:
 * every step past "generated-draft" is an owner action.
 */
export type ReviewState =
  | "none"
  | "generated-draft"
  | "owner-reading"
  | "owner-edited"
  | "continuity-checked"
  | "identity-checked"
  | "theology-reviewed"
  | "audio-reviewed"
  | "copyedited"
  | "approved"
  | "published"
  | "superseded";

export const REVIEW_STATES: { id: ReviewState; label: string }[] = [
  { id: "none", label: "—" },
  { id: "generated-draft", label: "Generated draft (not author-approved)" },
  { id: "owner-reading", label: "Owner reading" },
  { id: "owner-edited", label: "Owner edited" },
  { id: "continuity-checked", label: "Continuity checked" },
  { id: "identity-checked", label: "Identity-protection checked" },
  { id: "theology-reviewed", label: "Theologically reviewed" },
  { id: "audio-reviewed", label: "Audio reviewed" },
  { id: "copyedited", label: "Copyedited" },
  { id: "approved", label: "Approved" },
  { id: "published", label: "Published" },
  { id: "superseded", label: "Superseded" },
];

export interface ChapterAudio {
  /** How names/terms in this chapter are pronounced — for the narrator. */
  pronunciationNotes: string;
  narratorNotes: string;
  reviewed: boolean;
}

export interface ChapterRecord {
  id: string;
  workingTitle: string;
  purpose: string;
  viewpointCharacterId: string; // "" = undecided; the one focal character (third person)
  bookId: string; // "" = not yet assigned to a book on the series board
  storylineIds: string[];
  sceneIds: string[]; // ordered references — the scene records live in project.scenes
  status: ChapterStatus;
  reviewState: ReviewState;
  audio: ChapterAudio;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Series board — the saga is planned as connected books (seven to start),
// without forcing every book to be outlined before Book One begins.
// ---------------------------------------------------------------------------

export type BookStatus =
  | "idea" | "planning" | "outlining" | "drafting" | "editing"
  | "audio" | "publication-candidate" | "published";

export const BOOK_STATUSES: { id: BookStatus; label: string }[] = [
  { id: "idea", label: "Idea" },
  { id: "planning", label: "Planning" },
  { id: "outlining", label: "Outlining" },
  { id: "drafting", label: "Drafting" },
  { id: "editing", label: "Editing" },
  { id: "audio", label: "Audio pass" },
  { id: "publication-candidate", label: "Publication candidate" },
  { id: "published", label: "Published" },
];

export interface BookRecord {
  id: string;
  workingTitle: string;
  finalTitle: string;
  timeSpan: string;
  humanConflict: string;
  systemsConflict: string; // technology / infrastructure layer
  spiritualConflict: string;
  faithQuestion: string;
  beginningState: string;
  endingState: string;
  closingHook: string;
  setupForLater: string; // what this book must plant for later books
  status: BookStatus;
  notes: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Constitutions — durable, versioned rules. The Series Constitution governs
// craft and boundaries; the Spiritual-World Constitution additionally labels
// every rule with one of four truth classifications.
// ---------------------------------------------------------------------------

export type SpiritualClassification = "scripture" | "interpretation" | "fiction" | "open-question";

export const SPIRITUAL_CLASSIFICATIONS: { id: SpiritualClassification; label: string }[] = [
  { id: "scripture", label: "Direct biblical teaching" },
  { id: "interpretation", label: "Chosen theological interpretation" },
  { id: "fiction", label: "Fictional narrative invention" },
  { id: "open-question", label: "Unresolved theological question" },
];

export interface RuleAmendment {
  previousText: string;
  reason: string;
  changedAt: string;
}

export interface ConstitutionRule {
  id: string;
  area: string; // e.g. "Point of view", "Violence boundaries", "Limits of angels"
  text: string;
  /** Set on spiritual-world rules only. */
  classification?: SpiritualClassification;
  history: RuleAmendment[]; // newest first — never trimmed
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Research ledger — a claim is never more proven than its status says.
// ---------------------------------------------------------------------------

export type ResearchStatus =
  | "raw-idea" | "story-concept" | "research-question" | "preliminary-finding"
  | "verified-finding" | "expert-disagreement" | "known-limitation"
  | "fictional-extrapolation" | "deliberate-invention" | "story-rule";

export const RESEARCH_STATUSES: { id: ResearchStatus; label: string; proven: boolean }[] = [
  { id: "raw-idea", label: "Raw idea", proven: false },
  { id: "story-concept", label: "Story concept", proven: false },
  { id: "research-question", label: "Research question", proven: false },
  { id: "preliminary-finding", label: "Preliminary finding", proven: false },
  { id: "verified-finding", label: "Verified finding", proven: true },
  { id: "expert-disagreement", label: "Expert disagreement", proven: false },
  { id: "known-limitation", label: "Known limitation", proven: false },
  { id: "fictional-extrapolation", label: "Fictional extrapolation", proven: false },
  { id: "deliberate-invention", label: "Deliberate fictional invention", proven: false },
  { id: "story-rule", label: "Established story-world rule (fiction)", proven: false },
];

export interface ResearchStatusChange {
  from: ResearchStatus;
  to: ResearchStatus;
  changedAt: string;
}

export interface ResearchClaim {
  id: string;
  topic: string; // e.g. "solar-assisted narrow-route vehicles"
  text: string;
  status: ResearchStatus;
  sources: string; // notes on where this came from, with dates
  notes: string; // contradictory evidence, expert questions, confidence
  history: ResearchStatusChange[];
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Published editions — immutable snapshots of exactly what was released.
// ---------------------------------------------------------------------------

export interface PublishedEdition {
  id: string;
  /** e.g. "First Edition", "Corrected First Edition", "Audiobook Edition". */
  name: string;
  bookId: string; // "" when the edition spans the whole project
  manuscript: string; // the exact compiled text at publication
  wordCount: number;
  sourceNote: string; // which revision/checkpoint this came from
  publishedAt: string;
}

export interface StoryProject {
  version: 2;
  id: string;
  title: string;
  premise: string;
  createdAt: string;
  updatedAt: string;
  lastExportAt: string; // "" = never exported
  memories: MemoryRecord[];
  characters: CharacterRecord[];
  relationships: RelationshipRecord[];
  storylines: StorylineRecord[];
  scenes: SceneRecord[];
  chapters: ChapterRecord[];
  notes: StoryNote[];
  books: BookRecord[];
  constitution: ConstitutionRule[]; // Series Constitution
  spiritual: ConstitutionRule[]; // Spiritual-World Constitution (classified)
  research: ResearchClaim[];
  editions: PublishedEdition[]; // immutable — see law 5
}

/** Compatibility alias — sanitizeProject migrates stored v1 data forward. */
export type StoryProjectV1 = StoryProject;

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function now(): string {
  return new Date().toISOString();
}

function touch(p: StoryProject): StoryProject {
  return { ...p, updatedAt: now() };
}

export function createProject(title: string, premise = ""): StoryProject {
  const t = now();
  return {
    version: 2,
    id: uid(),
    title: title.trim() || "Untitled novel",
    premise: premise.trim(),
    createdAt: t,
    updatedAt: t,
    lastExportAt: "",
    memories: [],
    characters: [],
    relationships: [],
    storylines: [],
    scenes: [],
    chapters: [],
    notes: [],
    books: [],
    constitution: [],
    spiritual: [],
    research: [],
    editions: [],
  };
}

const sameRef = (a: LinkRef, b: LinkRef) => a.kind === b.kind && a.id === b.id;

function dedupeRefs(refs: LinkRef[]): LinkRef[] {
  const out: LinkRef[] = [];
  for (const r of refs) if (!out.some((x) => sameRef(x, r))) out.push(r);
  return out;
}

// ---------------------------------------------------------------------------
// Memories — original text is write-once
// ---------------------------------------------------------------------------

export function addMemory(
  p: StoryProject,
  original: string,
  opts: { era?: string; links?: LinkRef[] } = {},
): { project: StoryProject; memory: MemoryRecord | null } {
  const text = original.trim();
  if (!text) return { project: p, memory: null };
  const memory: MemoryRecord = {
    id: uid(),
    original: text,
    capturedAt: now(),
    era: (opts.era ?? "").trim(),
    workingNotes: "",
    links: dedupeRefs(opts.links ?? []),
  };
  return { project: touch({ ...p, memories: [memory, ...p.memories] }), memory };
}

/**
 * Amend everything about a memory EXCEPT its original text. There is
 * deliberately no function that changes `original` or `capturedAt`.
 */
export function amendMemory(
  p: StoryProject,
  memoryId: string,
  changes: { era?: string; workingNotes?: string; links?: LinkRef[] },
): StoryProject {
  return touch({
    ...p,
    memories: p.memories.map((m) =>
      m.id === memoryId
        ? {
            ...m,
            era: changes.era !== undefined ? changes.era : m.era,
            workingNotes: changes.workingNotes !== undefined ? changes.workingNotes : m.workingNotes,
            links: changes.links !== undefined ? dedupeRefs(changes.links) : m.links,
          }
        : m,
    ),
  });
}

export function toggleMemoryLink(p: StoryProject, memoryId: string, ref: LinkRef): StoryProject {
  const m = p.memories.find((x) => x.id === memoryId);
  if (!m) return p;
  const has = m.links.some((x) => sameRef(x, ref));
  return amendMemory(p, memoryId, { links: has ? m.links.filter((x) => !sameRef(x, ref)) : [...m.links, ref] });
}

// ---------------------------------------------------------------------------
// Focus records
// ---------------------------------------------------------------------------

export function addCharacter(p: StoryProject, name: string): { project: StoryProject; record: CharacterRecord | null } {
  const clean = name.trim();
  if (!clean) return { project: p, record: null };
  const record: CharacterRecord = {
    id: uid(), name: clean, description: "", realBasis: "",
    classification: "human", pronunciation: "", voiceNotes: "", createdAt: now(),
  };
  return { project: touch({ ...p, characters: [...p.characters, record] }), record };
}

export function updateCharacter(
  p: StoryProject,
  id: string,
  changes: Partial<Pick<CharacterRecord, "name" | "description" | "realBasis" | "classification" | "pronunciation" | "voiceNotes">>,
): StoryProject {
  return touch({ ...p, characters: p.characters.map((c) => (c.id === id ? { ...c, ...changes } : c)) });
}

export function addRelationship(p: StoryProject, title: string, participantIds: string[] = []): { project: StoryProject; record: RelationshipRecord | null } {
  const clean = title.trim();
  if (!clean) return { project: p, record: null };
  const valid = participantIds.filter((id) => p.characters.some((c) => c.id === id));
  const record: RelationshipRecord = { id: uid(), title: clean, participantIds: valid, description: "", createdAt: now() };
  return { project: touch({ ...p, relationships: [...p.relationships, record] }), record };
}

export function updateRelationship(
  p: StoryProject,
  id: string,
  changes: Partial<Pick<RelationshipRecord, "title" | "description" | "participantIds">>,
): StoryProject {
  return touch({
    ...p,
    relationships: p.relationships.map((r) => {
      if (r.id !== id) return r;
      const next = { ...r, ...changes };
      next.participantIds = (next.participantIds ?? []).filter((cid) => p.characters.some((c) => c.id === cid));
      return next;
    }),
  });
}

export function addStoryline(p: StoryProject, name: string): { project: StoryProject; record: StorylineRecord | null } {
  const clean = name.trim();
  if (!clean) return { project: p, record: null };
  const record: StorylineRecord = { id: uid(), name: clean, summary: "", createdAt: now() };
  return { project: touch({ ...p, storylines: [...p.storylines, record] }), record };
}

export function updateStoryline(
  p: StoryProject,
  id: string,
  changes: Partial<Pick<StorylineRecord, "name" | "summary">>,
): StoryProject {
  return touch({ ...p, storylines: p.storylines.map((s) => (s.id === id ? { ...s, ...changes } : s)) });
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export function addNote(
  p: StoryProject,
  kind: NoteKind,
  text: string,
  attachedTo: LinkRef[] = [],
): { project: StoryProject; note: StoryNote | null } {
  const clean = text.trim();
  if (!clean) return { project: p, note: null };
  const note: StoryNote = { id: uid(), kind, text: clean, attachedTo: dedupeRefs(attachedTo), status: "open", createdAt: now() };
  return { project: touch({ ...p, notes: [note, ...p.notes] }), note };
}

export function setNoteStatus(p: StoryProject, noteId: string, status: "open" | "resolved"): StoryProject {
  return touch({ ...p, notes: p.notes.map((n) => (n.id === noteId ? { ...n, status } : n)) });
}

/** Promote a possibility into canon — an explicit author decision, never automatic. */
export function promoteNote(p: StoryProject, noteId: string, to: "fact" | "decision"): StoryProject {
  return touch({ ...p, notes: p.notes.map((n) => (n.id === noteId ? { ...n, kind: to } : n)) });
}

export function deleteNote(p: StoryProject, noteId: string): StoryProject {
  return touch({ ...p, notes: p.notes.filter((n) => n.id !== noteId) });
}

// ---------------------------------------------------------------------------
// Scenes — drafts are append-only
// ---------------------------------------------------------------------------

export function addScene(p: StoryProject, title: string, links: LinkRef[] = []): { project: StoryProject; record: SceneRecord | null } {
  const clean = title.trim();
  if (!clean) return { project: p, record: null };
  const record: SceneRecord = { id: uid(), title: clean, purpose: "", links: dedupeRefs(links), drafts: [], createdAt: now() };
  return { project: touch({ ...p, scenes: [...p.scenes, record] }), record };
}

export function updateScene(
  p: StoryProject,
  id: string,
  changes: Partial<Pick<SceneRecord, "title" | "purpose" | "links">>,
): StoryProject {
  return touch({
    ...p,
    scenes: p.scenes.map((s) =>
      s.id === id ? { ...s, ...changes, links: changes.links !== undefined ? dedupeRefs(changes.links) : s.links } : s,
    ),
  });
}

/** Append a new revision. Earlier drafts are never modified or removed. */
export function addDraft(p: StoryProject, sceneId: string, text: string, note = ""): StoryProject {
  const clean = text.trim();
  if (!clean) return p;
  return touch({
    ...p,
    scenes: p.scenes.map((s) =>
      s.id === sceneId
        ? { ...s, drafts: [...s.drafts, { id: uid(), text: clean, note: note.trim(), savedAt: now() }] }
        : s,
    ),
  });
}

export function currentDraft(scene: SceneRecord): SceneDraft | null {
  return scene.drafts.length ? scene.drafts[scene.drafts.length - 1] : null;
}

// ---------------------------------------------------------------------------
// Chapters — ordered references, moves never duplicate or lose records
// ---------------------------------------------------------------------------

export function addChapter(p: StoryProject, workingTitle: string): { project: StoryProject; record: ChapterRecord | null } {
  const clean = workingTitle.trim();
  if (!clean) return { project: p, record: null };
  const record: ChapterRecord = {
    id: uid(), workingTitle: clean, purpose: "", viewpointCharacterId: "", bookId: "",
    storylineIds: [], sceneIds: [], status: "planned", reviewState: "none",
    audio: { pronunciationNotes: "", narratorNotes: "", reviewed: false }, createdAt: now(),
  };
  return { project: touch({ ...p, chapters: [...p.chapters, record] }), record };
}

export function updateChapter(
  p: StoryProject,
  id: string,
  changes: Partial<Pick<ChapterRecord, "workingTitle" | "purpose" | "viewpointCharacterId" | "bookId" | "storylineIds" | "status" | "reviewState" | "audio">>,
): StoryProject {
  return touch({ ...p, chapters: p.chapters.map((c) => (c.id === id ? { ...c, ...changes } : c)) });
}

/** Place a scene in a chapter. A scene lives in at most one chapter, so it is removed from any other. */
export function placeSceneInChapter(p: StoryProject, chapterId: string, sceneId: string): StoryProject {
  if (!p.scenes.some((s) => s.id === sceneId) || !p.chapters.some((c) => c.id === chapterId)) return p;
  return touch({
    ...p,
    chapters: p.chapters.map((c) => {
      const without = c.sceneIds.filter((id) => id !== sceneId);
      return c.id === chapterId ? { ...c, sceneIds: [...without, sceneId] } : { ...c, sceneIds: without };
    }),
  });
}

export function removeSceneFromChapter(p: StoryProject, chapterId: string, sceneId: string): StoryProject {
  return touch({
    ...p,
    chapters: p.chapters.map((c) => (c.id === chapterId ? { ...c, sceneIds: c.sceneIds.filter((id) => id !== sceneId) } : c)),
  });
}

function moveInArray<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const target = index + dir;
  if (index < 0 || target < 0 || target >= arr.length) return arr;
  const next = [...arr];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function moveChapter(p: StoryProject, chapterId: string, dir: -1 | 1): StoryProject {
  const index = p.chapters.findIndex((c) => c.id === chapterId);
  const next = moveInArray(p.chapters, index, dir);
  return next === p.chapters ? p : touch({ ...p, chapters: next });
}

export function moveSceneInChapter(p: StoryProject, chapterId: string, sceneId: string, dir: -1 | 1): StoryProject {
  return touch({
    ...p,
    chapters: p.chapters.map((c) => {
      if (c.id !== chapterId) return c;
      const index = c.sceneIds.indexOf(sceneId);
      return { ...c, sceneIds: moveInArray(c.sceneIds, index, dir) };
    }),
  });
}

// ---------------------------------------------------------------------------
// The Room — gather everything relevant to one focus
// ---------------------------------------------------------------------------

export interface FocusMaterial {
  ref: LinkRef;
  label: string;
  memories: MemoryRecord[];
  notes: Record<NoteKind, StoryNote[]>;
  scenes: SceneRecord[];
  chapters: ChapterRecord[];
}

export function labelFor(p: StoryProject, ref: LinkRef): string {
  switch (ref.kind) {
    case "character": return p.characters.find((c) => c.id === ref.id)?.name ?? "(missing character)";
    case "relationship": return p.relationships.find((r) => r.id === ref.id)?.title ?? "(missing relationship)";
    case "storyline": return p.storylines.find((s) => s.id === ref.id)?.name ?? "(missing storyline)";
    case "scene": return p.scenes.find((s) => s.id === ref.id)?.title ?? "(missing scene)";
    case "chapter": return p.chapters.find((c) => c.id === ref.id)?.workingTitle ?? "(missing chapter)";
  }
}

export function gatherFocus(p: StoryProject, ref: LinkRef): FocusMaterial {
  const linked = (links: LinkRef[]) => links.some((x) => sameRef(x, ref));

  const memories = p.memories.filter((m) => linked(m.links));

  const notes = {} as Record<NoteKind, StoryNote[]>;
  for (const k of NOTE_KINDS) notes[k.id] = [];
  for (const n of p.notes) if (linked(n.attachedTo)) notes[n.kind].push(n);

  let scenes: SceneRecord[];
  if (ref.kind === "scene") {
    scenes = p.scenes.filter((s) => s.id === ref.id);
  } else if (ref.kind === "chapter") {
    const ch = p.chapters.find((c) => c.id === ref.id);
    scenes = (ch?.sceneIds ?? [])
      .map((id) => p.scenes.find((s) => s.id === id))
      .filter((s): s is SceneRecord => !!s);
  } else {
    scenes = p.scenes.filter((s) => linked(s.links));
  }

  const sceneIds = new Set(scenes.map((s) => s.id));
  let chapters: ChapterRecord[];
  if (ref.kind === "chapter") {
    chapters = p.chapters.filter((c) => c.id === ref.id);
  } else if (ref.kind === "storyline") {
    chapters = p.chapters.filter((c) => c.storylineIds.includes(ref.id) || c.sceneIds.some((id) => sceneIds.has(id)));
  } else {
    chapters = p.chapters.filter((c) => c.sceneIds.some((id) => sceneIds.has(id)));
  }

  return { ref, label: labelFor(p, ref), memories, notes, scenes, chapters };
}

// ---------------------------------------------------------------------------
// Briefing pack — the structured handoff to the author's own AI
// ---------------------------------------------------------------------------

export const BRIEFING_WARNING =
  "Do not invent new facts and present them as if they came from my memories. " +
  "Anything you propose that is not in the source material above must be clearly " +
  "labeled as a proposal. I am the author; I decide what becomes part of the novel.";

function packSection(title: string, body: string): string {
  return `## ${title}\n\n${body.trim() || "None yet."}\n`;
}

export function briefingPack(p: StoryProject, ref: LinkRef, task: string): string {
  const f = gatherFocus(p, ref);

  let focusDetail = `${FOCUS_KIND_LABELS[ref.kind]}: ${f.label}`;
  if (ref.kind === "character") {
    const c = p.characters.find((x) => x.id === ref.id);
    if (c?.description) focusDetail += `\nDescription: ${c.description}`;
  } else if (ref.kind === "relationship") {
    const r = p.relationships.find((x) => x.id === ref.id);
    if (r) {
      const names = r.participantIds.map((id) => p.characters.find((c) => c.id === id)?.name).filter(Boolean);
      if (names.length) focusDetail += `\nBetween: ${names.join(" and ")}`;
      if (r.description) focusDetail += `\nDescription: ${r.description}`;
    }
  } else if (ref.kind === "storyline") {
    const s = p.storylines.find((x) => x.id === ref.id);
    if (s?.summary) focusDetail += `\nSummary: ${s.summary}`;
  } else if (ref.kind === "scene") {
    const s = p.scenes.find((x) => x.id === ref.id);
    if (s?.purpose) focusDetail += `\nPurpose: ${s.purpose}`;
  } else if (ref.kind === "chapter") {
    const c = p.chapters.find((x) => x.id === ref.id);
    if (c?.purpose) focusDetail += `\nPurpose: ${c.purpose}`;
  }

  const memoryBlock = f.memories
    .map((m, i) => {
      const era = m.era ? ` — era: ${m.era}` : "";
      let block = `### Memory ${i + 1}${era}\n\n[VERBATIM — do not alter]\n${m.original}`;
      if (m.workingNotes.trim()) block += `\n\n[Author's working notes — interpretation, not source]\n${m.workingNotes}`;
      return block;
    })
    .join("\n\n");

  const noteBlock = (kinds: NoteKind[], openOnly = false) =>
    kinds
      .flatMap((k) => f.notes[k].filter((n) => !openOnly || n.status === "open").map((n) => `- (${NOTE_KIND_BY_ID.get(k)!.label}) ${n.text}`))
      .join("\n");

  const scene = ref.kind === "scene" ? p.scenes.find((x) => x.id === ref.id) : null;
  const draft = scene ? currentDraft(scene) : null;
  const draftBlock = draft ? `Current draft of "${scene!.title}" (revision ${scene!.drafts.length}):\n\n${draft.text}` : "";

  const parts = [
    `# Story Partner briefing — ${p.title}`,
    packSection(
      "1. Project instructions",
      `This is a novel: fiction inspired by real memories. The author owns every creative decision. ` +
        `Emotional truth matters more than historical accuracy; names, places, timelines and events may be fictionalized. ` +
        `Your role is a developmental story partner — question, strengthen, propose. Never take over the story.`,
    ),
    packSection("2. Current focus", focusDetail),
    packSection("3. Verbatim source memories", memoryBlock),
    packSection("4. Established fictional facts", noteBlock(["fact"])),
    packSection("5. Approved fictionalization decisions", noteBlock(["decision"])),
    packSection("6. Open questions and contradictions", noteBlock(["question", "contradiction"], true)),
    packSection("7. Existing scene draft", draftBlock),
    packSection("8. Your task", task),
    packSection("9. Rules for your response", BRIEFING_WARNING),
  ];
  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Paste-back — the author classifies what to keep. Nothing is canon by default.
// ---------------------------------------------------------------------------

export type PasteClassification =
  | "working"
  | "possibility"
  | "decision"
  | "fact"
  | "question"
  | "scene-draft"
  | "scene-revision"
  | "memory";

export const PASTE_CLASSIFICATIONS: { id: PasteClassification; label: string; canon: boolean; needsScene: boolean }[] = [
  { id: "working", label: "Working note", canon: false, needsScene: false },
  { id: "possibility", label: "Proposed fictional detail (not canon)", canon: false, needsScene: false },
  { id: "decision", label: "Approved fictionalization decision (canon)", canon: true, needsScene: false },
  { id: "fact", label: "Established story fact (canon)", canon: true, needsScene: false },
  { id: "question", label: "Open question", canon: false, needsScene: false },
  { id: "scene-draft", label: "Draft of a new scene", canon: false, needsScene: false },
  { id: "scene-revision", label: "New revision of an existing scene", canon: false, needsScene: true },
  { id: "memory", label: "New memory (my own words)", canon: false, needsScene: false },
];

export function applyPasteBack(
  p: StoryProject,
  ref: LinkRef,
  classification: PasteClassification,
  text: string,
  opts: { sceneId?: string; sceneTitle?: string; revisionNote?: string } = {},
): { project: StoryProject; saved: string } {
  const clean = text.trim();
  if (!clean) return { project: p, saved: "" };

  switch (classification) {
    case "working":
    case "possibility":
    case "decision":
    case "fact":
    case "question": {
      const { project } = addNote(p, classification, clean, [ref]);
      const label = PASTE_CLASSIFICATIONS.find((c) => c.id === classification)!.label;
      return { project, saved: label };
    }
    case "scene-draft": {
      const title = (opts.sceneTitle ?? "").trim() || `New scene (${labelFor(p, ref)})`;
      const { project: withScene, record } = addScene(p, title, [ref]);
      if (!record) return { project: p, saved: "" };
      return { project: addDraft(withScene, record.id, clean, opts.revisionNote ?? "pasted back from story partner"), saved: `Scene "${title}" with first draft` };
    }
    case "scene-revision": {
      const scene = p.scenes.find((s) => s.id === opts.sceneId);
      if (!scene) return { project: p, saved: "" };
      return { project: addDraft(p, scene.id, clean, opts.revisionNote ?? "pasted back from story partner"), saved: `Revision ${scene.drafts.length + 1} of "${scene.title}"` };
    }
    case "memory": {
      const { project } = addMemory(p, clean, { links: [ref] });
      return { project, saved: "New memory" };
    }
  }
}

// ---------------------------------------------------------------------------
// Series board
// ---------------------------------------------------------------------------

export function addBook(p: StoryProject, workingTitle: string): { project: StoryProject; record: BookRecord | null } {
  const clean = workingTitle.trim();
  if (!clean) return { project: p, record: null };
  const record: BookRecord = {
    id: uid(), workingTitle: clean, finalTitle: "", timeSpan: "",
    humanConflict: "", systemsConflict: "", spiritualConflict: "", faithQuestion: "",
    beginningState: "", endingState: "", closingHook: "", setupForLater: "",
    status: "idea", notes: "", createdAt: now(),
  };
  return { project: touch({ ...p, books: [...p.books, record] }), record };
}

export function updateBook(
  p: StoryProject,
  id: string,
  changes: Partial<Omit<BookRecord, "id" | "createdAt">>,
): StoryProject {
  return touch({ ...p, books: p.books.map((b) => (b.id === id ? { ...b, ...changes } : b)) });
}

/** Series order is array order — moving a book never touches its chapters. */
export function moveBook(p: StoryProject, id: string, dir: -1 | 1): StoryProject {
  const index = p.books.findIndex((b) => b.id === id);
  const target = index + dir;
  if (index < 0 || target < 0 || target >= p.books.length) return p;
  const next = [...p.books];
  [next[index], next[target]] = [next[target], next[index]];
  return touch({ ...p, books: next });
}

export function chaptersInBook(p: StoryProject, bookId: string): ChapterRecord[] {
  return p.chapters.filter((c) => c.bookId === bookId);
}

// ---------------------------------------------------------------------------
// Constitutions — amendments keep full history (law 6); spiritual rules are
// always classified (law 7)
// ---------------------------------------------------------------------------

type ConstitutionKey = "constitution" | "spiritual";

export function addRule(
  p: StoryProject,
  which: ConstitutionKey,
  area: string,
  text: string,
  classification?: SpiritualClassification,
): { project: StoryProject; rule: ConstitutionRule | null } {
  const cleanArea = area.trim();
  const cleanText = text.trim();
  if (!cleanArea || !cleanText) return { project: p, rule: null };
  const t = now();
  const rule: ConstitutionRule = {
    id: uid(), area: cleanArea, text: cleanText,
    // Spiritual rules must carry a truth label; "open-question" is the honest default.
    ...(which === "spiritual" ? { classification: classification ?? "open-question" } : {}),
    history: [], createdAt: t, updatedAt: t,
  };
  return { project: touch({ ...p, [which]: [...p[which], rule] }), rule };
}

/** Amend a rule. The previous text and the stated reason go into history — always. */
export function amendRule(
  p: StoryProject,
  which: ConstitutionKey,
  id: string,
  newText: string,
  reason: string,
  classification?: SpiritualClassification,
): StoryProject {
  const clean = newText.trim();
  if (!clean) return p;
  return touch({
    ...p,
    [which]: p[which].map((r) =>
      r.id === id
        ? {
            ...r,
            text: clean,
            ...(which === "spiritual" && classification ? { classification } : {}),
            history: [{ previousText: r.text, reason: reason.trim() || "(no reason recorded)", changedAt: now() }, ...r.history],
            updatedAt: now(),
          }
        : r,
    ),
  });
}

// ---------------------------------------------------------------------------
// Research ledger
// ---------------------------------------------------------------------------

export function addResearchClaim(p: StoryProject, topic: string, text: string): { project: StoryProject; claim: ResearchClaim | null } {
  const cleanTopic = topic.trim();
  const cleanText = text.trim();
  if (!cleanTopic || !cleanText) return { project: p, claim: null };
  const claim: ResearchClaim = {
    id: uid(), topic: cleanTopic, text: cleanText, status: "raw-idea",
    sources: "", notes: "", history: [], createdAt: now(),
  };
  return { project: touch({ ...p, research: [claim, ...p.research] }), claim };
}

export function updateResearchClaim(
  p: StoryProject,
  id: string,
  changes: Partial<Pick<ResearchClaim, "topic" | "text" | "sources" | "notes">>,
): StoryProject {
  return touch({ ...p, research: p.research.map((c) => (c.id === id ? { ...c, ...changes } : c)) });
}

/** Status moves are recorded — a claim can never quietly become "verified". */
export function setResearchStatus(p: StoryProject, id: string, to: ResearchStatus): StoryProject {
  return touch({
    ...p,
    research: p.research.map((c) =>
      c.id === id && c.status !== to
        ? { ...c, status: to, history: [{ from: c.status, to, changedAt: now() }, ...c.history] }
        : c,
    ),
  });
}

// ---------------------------------------------------------------------------
// Manuscript compile + published editions (immutable — law 5)
// ---------------------------------------------------------------------------

export function wordCountOf(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

export function projectWordCount(p: StoryProject): number {
  return p.scenes.reduce((sum, s) => {
    const d = currentDraft(s);
    return sum + (d ? wordCountOf(d.text) : 0);
  }, 0);
}

/**
 * Compile the manuscript in reading order (chapters, then their scenes'
 * CURRENT drafts). `audio: true` adds narrator orientation blocks —
 * viewpoint, pronunciation, narrator notes — before each chapter.
 */
export function manuscriptMarkdown(p: StoryProject, opts: { bookId?: string; audio?: boolean } = {}): string {
  const chapters = opts.bookId ? p.chapters.filter((c) => c.bookId === opts.bookId) : p.chapters;
  const book = opts.bookId ? p.books.find((b) => b.id === opts.bookId) : null;
  const title = book ? (book.finalTitle || book.workingTitle) : p.title;

  const parts: string[] = [`# ${title}`];
  chapters.forEach((ch, i) => {
    parts.push(`\n## Chapter ${i + 1} — ${ch.workingTitle}`);
    if (opts.audio) {
      const pov = p.characters.find((c) => c.id === ch.viewpointCharacterId)?.name ?? "(undecided)";
      const lines = [`Viewpoint: ${pov}`];
      if (ch.audio.pronunciationNotes.trim()) lines.push(`Pronunciation: ${ch.audio.pronunciationNotes.trim()}`);
      if (ch.audio.narratorNotes.trim()) lines.push(`Narrator notes: ${ch.audio.narratorNotes.trim()}`);
      parts.push(`\n[NARRATOR — not part of the text]\n${lines.join("\n")}`);
    }
    for (const sid of ch.sceneIds) {
      const scene = p.scenes.find((s) => s.id === sid);
      const d = scene ? currentDraft(scene) : null;
      if (d) parts.push(`\n${d.text}`);
    }
  });
  return parts.join("\n");
}

/**
 * Freeze a published edition. The snapshot is exactly what was released;
 * there is NO function anywhere that edits or deletes one afterwards. A
 * correction is a new edition with its own name.
 */
export function createEdition(
  p: StoryProject,
  name: string,
  opts: { bookId?: string; sourceNote?: string; audio?: boolean } = {},
): { project: StoryProject; edition: PublishedEdition | null } {
  const clean = name.trim();
  if (!clean) return { project: p, edition: null };
  const manuscript = manuscriptMarkdown(p, { bookId: opts.bookId, audio: opts.audio });
  const edition: PublishedEdition = {
    id: uid(), name: clean, bookId: opts.bookId ?? "", manuscript,
    wordCount: wordCountOf(manuscript), sourceNote: (opts.sourceNote ?? "").trim(), publishedAt: now(),
  };
  return { project: touch({ ...p, editions: [...p.editions, edition] }), edition };
}

// ---------------------------------------------------------------------------
// Continuity + audio-clarity warnings — they flag, they never rewrite
// ---------------------------------------------------------------------------

export interface CraftWarning {
  chapterId: string; // "" = project-wide
  text: string;
}

/** Similar-sounding names confuse listeners — flag pairs, author decides. */
function soundsAlike(a: string, b: string): boolean {
  const na = a.trim().toLowerCase().split(/\s+/)[0] ?? "";
  const nb = b.trim().toLowerCase().split(/\s+/)[0] ?? "";
  if (!na || !nb || na === nb) return na === nb && na !== "";
  if (na[0] !== nb[0]) return false;
  const shorter = na.length <= nb.length ? na : nb;
  const longer = na.length <= nb.length ? nb : na;
  return longer.startsWith(shorter.slice(0, Math.max(3, shorter.length - 1)));
}

export function craftWarnings(p: StoryProject): CraftWarning[] {
  const out: CraftWarning[] = [];

  for (const ch of p.chapters) {
    if (ch.status !== "planned" && !ch.viewpointCharacterId) {
      out.push({ chapterId: ch.id, text: `"${ch.workingTitle}" has no viewpoint character — every chapter needs exactly one.` });
    }
    if ((ch.status === "drafted" || ch.status === "revised") && ch.sceneIds.length === 0) {
      out.push({ chapterId: ch.id, text: `"${ch.workingTitle}" is marked ${ch.status} but contains no scenes.` });
    }
  }

  for (let i = 0; i < p.characters.length; i++) {
    for (let j = i + 1; j < p.characters.length; j++) {
      const a = p.characters[i];
      const b = p.characters[j];
      if (soundsAlike(a.name, b.name)) {
        out.push({ chapterId: "", text: `"${a.name}" and "${b.name}" may be hard to tell apart when heard aloud.` });
      }
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// Export / import
// ---------------------------------------------------------------------------

export const EXPORT_FORMAT = "story-partner-export";

export function exportPayload(p: StoryProject): string {
  return JSON.stringify({ format: EXPORT_FORMAT, formatVersion: 2, exportedAt: now(), project: p }, null, 2);
}

export function markExported(p: StoryProject): StoryProject {
  // Deliberately does not touch updatedAt — exporting is not a content change.
  return { ...p, lastExportAt: now() };
}

const isStr = (x: unknown): x is string => typeof x === "string";
const strOr = (x: unknown, fallback = ""): string => (isStr(x) ? x : fallback);
const arr = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);

const FOCUS_KINDS: FocusKind[] = ["character", "relationship", "storyline", "scene", "chapter"];

function cleanRefs(x: unknown): LinkRef[] {
  return dedupeRefs(
    arr(x)
      .map((r) => r as Partial<LinkRef>)
      .filter((r): r is LinkRef => !!r && FOCUS_KINDS.includes(r.kind as FocusKind) && isStr(r.id))
      .map((r) => ({ kind: r.kind, id: r.id })),
  );
}

/**
 * Rebuild a StoryProject from untrusted data (storage or import file).
 * Filters invalid records, dedupes ids, drops dangling references. Returns
 * null when there is no usable project at all. Never throws.
 */
export function sanitizeProject(data: unknown): StoryProject | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (!isStr(d.id) || !isStr(d.title)) return null;

  const seen = new Set<string>();
  const fresh = (id: unknown): string | null => {
    if (!isStr(id) || !id || seen.has(id)) return null;
    seen.add(id);
    return id;
  };

  const memories: MemoryRecord[] = [];
  for (const raw of arr(d.memories)) {
    const m = raw as Record<string, unknown>;
    const id = fresh(m?.id);
    if (!id || !isStr(m.original) || !m.original.trim()) continue;
    memories.push({
      id, original: m.original, capturedAt: strOr(m.capturedAt), era: strOr(m.era),
      workingNotes: strOr(m.workingNotes), links: cleanRefs(m.links),
    });
  }

  const characters: CharacterRecord[] = [];
  for (const raw of arr(d.characters)) {
    const c = raw as Record<string, unknown>;
    const id = fresh(c?.id);
    if (!id || !isStr(c.name)) continue;
    characters.push({
      id, name: c.name, description: strOr(c.description), realBasis: strOr(c.realBasis),
      classification: CHARACTER_CLASSIFICATIONS.some((x) => x.id === c.classification) ? (c.classification as CharacterClassification) : "human",
      pronunciation: strOr(c.pronunciation), voiceNotes: strOr(c.voiceNotes), createdAt: strOr(c.createdAt),
    });
  }

  const relationships: RelationshipRecord[] = [];
  for (const raw of arr(d.relationships)) {
    const r = raw as Record<string, unknown>;
    const id = fresh(r?.id);
    if (!id || !isStr(r.title)) continue;
    relationships.push({
      id, title: r.title, description: strOr(r.description), createdAt: strOr(r.createdAt),
      participantIds: arr(r.participantIds).filter((x): x is string => isStr(x) && characters.some((c) => c.id === x)),
    });
  }

  const storylines: StorylineRecord[] = [];
  for (const raw of arr(d.storylines)) {
    const s = raw as Record<string, unknown>;
    const id = fresh(s?.id);
    if (!id || !isStr(s.name)) continue;
    storylines.push({ id, name: s.name, summary: strOr(s.summary), createdAt: strOr(s.createdAt) });
  }

  const scenes: SceneRecord[] = [];
  for (const raw of arr(d.scenes)) {
    const s = raw as Record<string, unknown>;
    const id = fresh(s?.id);
    if (!id || !isStr(s.title)) continue;
    const drafts: SceneDraft[] = [];
    for (const dr of arr(s.drafts)) {
      const v = dr as Record<string, unknown>;
      if (!v || !isStr(v.text)) continue;
      drafts.push({ id: strOr(v.id) || uid(), text: v.text, note: strOr(v.note), savedAt: strOr(v.savedAt) });
    }
    scenes.push({ id, title: s.title, purpose: strOr(s.purpose), links: cleanRefs(s.links), drafts, createdAt: strOr(s.createdAt) });
  }

  const chapters: ChapterRecord[] = [];
  for (const raw of arr(d.chapters)) {
    const c = raw as Record<string, unknown>;
    const id = fresh(c?.id);
    if (!id || !isStr(c.workingTitle)) continue;
    const status = CHAPTER_STATUSES.some((s) => s.id === c.status) ? (c.status as ChapterStatus) : "planned";
    const placed = new Set(chapters.flatMap((ch) => ch.sceneIds));
    const audioRaw = (c.audio ?? {}) as Record<string, unknown>;
    chapters.push({
      id, workingTitle: c.workingTitle, purpose: strOr(c.purpose),
      viewpointCharacterId: isStr(c.viewpointCharacterId) && characters.some((x) => x.id === c.viewpointCharacterId) ? c.viewpointCharacterId : "",
      bookId: strOr(c.bookId), // validated against books below, after books parse
      storylineIds: arr(c.storylineIds).filter((x): x is string => isStr(x) && storylines.some((s) => s.id === x)),
      sceneIds: arr(c.sceneIds).filter((x): x is string => isStr(x) && scenes.some((s) => s.id === x) && !placed.has(x)),
      status,
      reviewState: REVIEW_STATES.some((s) => s.id === c.reviewState) ? (c.reviewState as ReviewState) : "none",
      audio: {
        pronunciationNotes: strOr(audioRaw.pronunciationNotes),
        narratorNotes: strOr(audioRaw.narratorNotes),
        reviewed: audioRaw.reviewed === true,
      },
      createdAt: strOr(c.createdAt),
    });
  }

  const books: BookRecord[] = [];
  for (const raw of arr(d.books)) {
    const b = raw as Record<string, unknown>;
    const id = fresh(b?.id);
    if (!id || !isStr(b.workingTitle)) continue;
    books.push({
      id, workingTitle: b.workingTitle, finalTitle: strOr(b.finalTitle), timeSpan: strOr(b.timeSpan),
      humanConflict: strOr(b.humanConflict), systemsConflict: strOr(b.systemsConflict),
      spiritualConflict: strOr(b.spiritualConflict), faithQuestion: strOr(b.faithQuestion),
      beginningState: strOr(b.beginningState), endingState: strOr(b.endingState),
      closingHook: strOr(b.closingHook), setupForLater: strOr(b.setupForLater),
      status: BOOK_STATUSES.some((s) => s.id === b.status) ? (b.status as BookStatus) : "idea",
      notes: strOr(b.notes), createdAt: strOr(b.createdAt),
    });
  }
  for (const ch of chapters) {
    if (ch.bookId && !books.some((b) => b.id === ch.bookId)) ch.bookId = "";
  }

  const parseRules = (input: unknown, spiritual: boolean): ConstitutionRule[] => {
    const rules: ConstitutionRule[] = [];
    for (const raw of arr(input)) {
      const r = raw as Record<string, unknown>;
      const id = fresh(r?.id);
      if (!id || !isStr(r.area) || !isStr(r.text)) continue;
      const history: RuleAmendment[] = [];
      for (const h of arr(r.history)) {
        const a = h as Record<string, unknown>;
        if (!isStr(a?.previousText)) continue;
        history.push({ previousText: a.previousText, reason: strOr(a.reason), changedAt: strOr(a.changedAt) });
      }
      rules.push({
        id, area: r.area, text: r.text,
        ...(spiritual
          ? { classification: SPIRITUAL_CLASSIFICATIONS.some((c) => c.id === r.classification) ? (r.classification as SpiritualClassification) : "open-question" }
          : {}),
        history, createdAt: strOr(r.createdAt), updatedAt: strOr(r.updatedAt),
      });
    }
    return rules;
  };

  const research: ResearchClaim[] = [];
  for (const raw of arr(d.research)) {
    const r = raw as Record<string, unknown>;
    const id = fresh(r?.id);
    if (!id || !isStr(r.topic) || !isStr(r.text)) continue;
    const history: ResearchStatusChange[] = [];
    for (const h of arr(r.history)) {
      const a = h as Record<string, unknown>;
      if (!RESEARCH_STATUSES.some((s) => s.id === a?.from) || !RESEARCH_STATUSES.some((s) => s.id === a?.to)) continue;
      history.push({ from: a.from as ResearchStatus, to: a.to as ResearchStatus, changedAt: strOr(a.changedAt) });
    }
    research.push({
      id, topic: r.topic, text: r.text,
      status: RESEARCH_STATUSES.some((s) => s.id === r.status) ? (r.status as ResearchStatus) : "raw-idea",
      sources: strOr(r.sources), notes: strOr(r.notes), history, createdAt: strOr(r.createdAt),
    });
  }

  const editions: PublishedEdition[] = [];
  for (const raw of arr(d.editions)) {
    const e = raw as Record<string, unknown>;
    const id = fresh(e?.id);
    if (!id || !isStr(e.name) || !isStr(e.manuscript)) continue;
    editions.push({
      id, name: e.name, bookId: strOr(e.bookId), manuscript: e.manuscript,
      wordCount: typeof e.wordCount === "number" && Number.isFinite(e.wordCount) ? e.wordCount : wordCountOf(e.manuscript),
      sourceNote: strOr(e.sourceNote), publishedAt: strOr(e.publishedAt),
    });
  }

  const notes: StoryNote[] = [];
  for (const raw of arr(d.notes)) {
    const n = raw as Record<string, unknown>;
    const id = fresh(n?.id);
    if (!id || !isStr(n.text) || !NOTE_KIND_BY_ID.has(n.kind as NoteKind)) continue;
    notes.push({
      id, kind: n.kind as NoteKind, text: n.text, attachedTo: cleanRefs(n.attachedTo),
      status: n.status === "resolved" ? "resolved" : "open", createdAt: strOr(n.createdAt),
    });
  }

  // Always returns the CURRENT schema (version 2). Feeding it a stored v1
  // project IS the migration: new sections default to empty, nothing is lost.
  return {
    version: 2,
    id: d.id,
    title: d.title.trim() || "Untitled novel",
    premise: strOr(d.premise),
    createdAt: strOr(d.createdAt),
    updatedAt: strOr(d.updatedAt),
    lastExportAt: strOr(d.lastExportAt),
    memories, characters, relationships, storylines, scenes, chapters, notes,
    books, constitution: parseRules(d.constitution, false), spiritual: parseRules(d.spiritual, true),
    research, editions,
  };
}

export type ImportResult = { ok: true; project: StoryProject } | { ok: false; error: string };

export function parseImport(raw: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }
  const d = data as Record<string, unknown>;
  if (!d || d.format !== EXPORT_FORMAT) {
    return { ok: false, error: "That file isn't a Story Partner export." };
  }
  const project = sanitizeProject(d.project);
  if (!project) return { ok: false, error: "The export file doesn't contain a usable project." };
  return { ok: true, project };
}

// ---------------------------------------------------------------------------
// Export reminder — gentle, and only once real work has accumulated
// ---------------------------------------------------------------------------

export function countRecords(p: StoryProject): number {
  return (
    p.memories.length + p.characters.length + p.relationships.length +
    p.storylines.length + p.scenes.length + p.chapters.length + p.notes.length
  );
}

const REMINDER_MIN_RECORDS = 8;
const REMINDER_STALE_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

/** Returns a gentle warning string, or null when no reminder is due. */
export function exportReminder(p: StoryProject, nowIso: string = now()): string | null {
  if (countRecords(p) < REMINDER_MIN_RECORDS) return null;
  if (!p.lastExportAt) {
    return "This project lives only in this browser and has never been exported. A cleared browser would lose it — export a backup.";
  }
  const unexportedChanges = p.updatedAt > p.lastExportAt;
  const stale = new Date(nowIso).getTime() - new Date(p.lastExportAt).getTime() > REMINDER_STALE_MS;
  if (unexportedChanges && stale) {
    return "There are changes since your last export, and it's been a few days. A fresh backup would protect them.";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Honest privacy explanation — shown in the UI, kept here so tests can pin it
// ---------------------------------------------------------------------------

export const PRIVACY_EXPLANATION =
  "Your project is stored only in this browser on this device — it is not intentionally " +
  "sent to or stored on the Step In The Ring server. That cuts both ways: clearing browser " +
  "data can erase the project, and anyone who can open this browser profile may be able to " +
  "open it too. Material you copy into ChatGPT is governed by your own ChatGPT account and " +
  "its privacy settings. The Engine Room access gate limits casual access to this page — it " +
  "is not a security boundary. Export backups regularly.";
