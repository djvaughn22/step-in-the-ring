// Story Partner — the capture workflow at the project level.
//
// Raw Source → Proposed Interpretation → Author Edited → Approved Fiction →
// Manuscript → Published Snapshot. No stage overwrites an earlier stage, and
// nothing generated enters the manuscript without an explicit author approval.
//
// Laws that must not regress:
// 1. Adding a source allocates the next stable SM id from the project counter.
//    The counter only grows; ids are never reused, renumbered, or derived
//    from content.
// 2. addApprovedSceneToManuscript refuses any direction that is not
//    "author-approved", and it is idempotent: calling it twice for the same
//    direction returns the same scene — never a duplicate.
// 3. The manuscript compile (manuscriptMarkdown) contains chapter titles and
//    scene prose only. manuscriptLeakScan is the belt-and-suspenders check
//    that no private id, real identity, or source text slipped into an export.

import {
  addDraft, addScene, manuscriptMarkdown, placeSceneInChapter, uid,
  type StoryProject,
} from "./story.engine";
import {
  createSpokenSource, createTypedSource, sourceIdFor, sourceStage,
  type SourceMaterial,
} from "./source.engine";
import type { SourceVaultV1 } from "./vault.engine";

function now(): string {
  return new Date().toISOString();
}

function touch(p: StoryProject): StoryProject {
  return { ...p, updatedAt: now() };
}

// ---------------------------------------------------------------------------
// Adding sources — both paths allocate the same stable ids (law 1)
// ---------------------------------------------------------------------------

export function addTypedSource(
  p: StoryProject,
  text: string,
  opts: { title?: string; pasted?: boolean; draft?: boolean; era?: string } = {},
): { project: StoryProject; source: SourceMaterial | null } {
  const id = sourceIdFor(p.sourceCounter + 1);
  const source = createTypedSource(id, text, opts);
  if (!source) return { project: p, source: null };
  return {
    project: touch({ ...p, sources: [source, ...p.sources], sourceCounter: p.sourceCounter + 1 }),
    source,
  };
}

export function addSpokenSource(
  p: StoryProject,
  opts: {
    title?: string;
    audioId?: string;
    audioMimeType?: string;
    audioDurationMs?: number;
    transcript: string | null;
    transcriptSupported: boolean;
    era?: string;
  },
): { project: StoryProject; source: SourceMaterial } {
  const id = sourceIdFor(p.sourceCounter + 1);
  const source = createSpokenSource(id, opts);
  return {
    project: touch({ ...p, sources: [source, ...p.sources], sourceCounter: p.sourceCounter + 1 }),
    source,
  };
}

/** Apply a source.engine transformation to one source, immutably. */
export function updateSourceIn(
  p: StoryProject,
  sourceId: string,
  fn: (s: SourceMaterial) => SourceMaterial,
): StoryProject {
  const before = p.sources.find((s) => s.id === sourceId);
  if (!before) return p;
  const after = fn(before);
  if (after === before) return p;
  return touch({ ...p, sources: p.sources.map((s) => (s.id === sourceId ? after : s)) });
}

export function findSource(p: StoryProject, sourceId: string): SourceMaterial | null {
  return p.sources.find((s) => s.id === sourceId) ?? null;
}

// ---------------------------------------------------------------------------
// Manuscript gate (law 2)
// ---------------------------------------------------------------------------

export interface ManuscriptAddResult {
  project: StoryProject;
  sceneId: string;   // "" when refused
  created: boolean;  // false when refused OR when already added (idempotent)
  reason: string;    // human-readable outcome
}

/**
 * The only door from the capture workflow into the manuscript. Requires an
 * explicitly author-approved direction and author-owned scene text. Repeat
 * calls return the existing scene (never a duplicate).
 */
export function addApprovedSceneToManuscript(
  p: StoryProject,
  sourceId: string,
  directionId: string,
  sceneText: string,
  opts: { sceneTitle?: string; chapterId?: string } = {},
): ManuscriptAddResult {
  const source = findSource(p, sourceId);
  const direction = source?.directions.find((d) => d.id === directionId);
  if (!source || !direction) {
    return { project: p, sceneId: "", created: false, reason: "That direction no longer exists." };
  }
  if (direction.sceneId && p.scenes.some((s) => s.id === direction.sceneId)) {
    return {
      project: p, sceneId: direction.sceneId, created: false,
      reason: "Already in the manuscript — nothing was duplicated.",
    };
  }
  if (direction.state !== "author-approved") {
    return {
      project: p, sceneId: "", created: false,
      reason: "Only an author-approved direction can enter the manuscript. Approve it first.",
    };
  }
  const clean = sceneText.trim();
  if (!clean) {
    return { project: p, sceneId: "", created: false, reason: "Write the scene text first." };
  }

  const title = (opts.sceneTitle ?? "").trim() || direction.approach.split("—")[0].trim() || "New scene";
  const made = addScene(p, title, []);
  if (!made.record) return { project: p, sceneId: "", created: false, reason: "Could not create the scene." };
  let project = addDraft(made.project, made.record.id, clean, "Approved by Author");

  // Place it in a chapter so it compiles into the manuscript.
  let chapterId = opts.chapterId && project.chapters.some((c) => c.id === opts.chapterId) ? opts.chapterId : "";
  if (!chapterId && project.chapters.length > 0) chapterId = project.chapters[project.chapters.length - 1].id;
  if (!chapterId) {
    const ch = {
      id: uid(), workingTitle: "Chapter one", purpose: "", viewpointCharacterId: "", bookId: "",
      storylineIds: [], sceneIds: [], status: "drafting" as const, reviewState: "none" as const,
      audio: { pronunciationNotes: "", narratorNotes: "", reviewed: false }, createdAt: now(),
    };
    project = { ...project, chapters: [...project.chapters, ch] };
    chapterId = ch.id;
  }
  project = placeSceneInChapter(project, chapterId, made.record.id);

  // Private lineage: source → direction → scene. Never exported with the manuscript.
  project = {
    ...project,
    sources: project.sources.map((s) =>
      s.id === sourceId
        ? {
            ...s,
            directions: s.directions.map((d) => (d.id === directionId ? { ...d, sceneId: made.record!.id, updatedAt: now() } : d)),
            history: [...s.history, { at: now(), note: "Author-approved scene added to the manuscript." }],
          }
        : s,
    ),
  };
  return { project: touch(project), sceneId: made.record.id, created: true, reason: "Added to the manuscript." };
}

// ---------------------------------------------------------------------------
// Home screen helpers
// ---------------------------------------------------------------------------

export interface ReviewItem {
  sourceId: string;
  title: string;
  what: "ingredients" | "directions" | "transcript" | "draft";
  count: number;
}

/** Everything awaiting an author decision, for the "Review" card. */
export function awaitingReview(p: StoryProject): ReviewItem[] {
  const out: ReviewItem[] = [];
  for (const s of p.sources) {
    if (s.archived) continue;
    if (s.draft) out.push({ sourceId: s.id, title: s.title, what: "draft", count: 1 });
    if (s.original === "" && s.kind === "spoken") out.push({ sourceId: s.id, title: s.title, what: "transcript", count: 1 });
    const ings = s.ingredients.filter((i) => i.state === "proposed" || i.state === "undecided").length;
    if (ings > 0) out.push({ sourceId: s.id, title: s.title, what: "ingredients", count: ings });
    const dirs = s.directions.filter((d) => d.state === "proposed" || d.state === "undecided").length;
    if (dirs > 0) out.push({ sourceId: s.id, title: s.title, what: "directions", count: dirs });
  }
  return out;
}

/** The most recently worked, unfinished source — the "Continue" card. */
export function continueTarget(p: StoryProject): SourceMaterial | null {
  const active = p.sources.filter((s) => !s.archived && sourceStage(s) !== "in-manuscript");
  return active[0] ?? null;
}

// ---------------------------------------------------------------------------
// Manuscript export safety (law 3)
// ---------------------------------------------------------------------------

export interface LeakFinding {
  kind: "private-id" | "real-identity" | "source-text" | "suggestion-label" | "never-publish";
  detail: string;
}

const PRIVATE_ID_PATTERNS = [
  /\bSM-\d{4,}\b/g,
  /\bMAP-\d{3,}\b/g,
  /\bREAL-[A-Z]+-\d{3,}\b/g,
  /\bFI-\d{3,}\b/g,
];

/**
 * Scan text that is about to leave the private room. Deterministic and
 * conservative: it looks for private ids, vault real names, never-publish
 * details, verbatim source passages, and suggestion labels.
 */
export function manuscriptLeakScan(text: string, p: StoryProject, vault: SourceVaultV1 | null): LeakFinding[] {
  const findings: LeakFinding[] = [];

  for (const pattern of PRIVATE_ID_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      for (const m of new Set(matches)) findings.push({ kind: "private-id", detail: `Private id "${m}" appears in the export.` });
    }
  }

  if (vault) {
    for (const src of vault.sources) {
      const name = src.realName.trim();
      if (name.length >= 3 && new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text)) {
        findings.push({ kind: "real-identity", detail: `A real name from the private legend (${src.id}) appears in the export.` });
      }
      for (const line of src.neverPublish.split(/\n+/)) {
        const detail = line.trim();
        if (detail.length >= 8 && text.toLowerCase().includes(detail.toLowerCase())) {
          findings.push({ kind: "never-publish", detail: `A never-publish detail from ${src.id} appears in the export.` });
        }
      }
    }
  }

  const lowText = text.toLowerCase();
  for (const s of p.sources) {
    const probe = s.original.trim().slice(0, 80).trim();
    if (probe.length >= 40 && lowText.includes(probe.toLowerCase())) {
      findings.push({ kind: "source-text", detail: `Verbatim text from source ${s.id} appears in the export — fictionalize it first.` });
    }
  }

  if (text.includes("Suggested by Story Partner")) {
    findings.push({ kind: "suggestion-label", detail: "A suggestion label is still in the text — unfinished material may have slipped in." });
  }

  return findings;
}

export interface ManuscriptExport {
  markdown: string;
  findings: LeakFinding[];
  safe: boolean;
}

/**
 * Build the manuscript export and scan it. The caller must refuse the
 * download when `safe` is false.
 */
export function buildManuscriptExport(
  p: StoryProject,
  vault: SourceVaultV1 | null,
  opts: { bookId?: string; audio?: boolean } = {},
): ManuscriptExport {
  const markdown = manuscriptMarkdown(p, opts);
  const findings = manuscriptLeakScan(markdown, p, vault);
  return { markdown, findings, safe: findings.length === 0 };
}
