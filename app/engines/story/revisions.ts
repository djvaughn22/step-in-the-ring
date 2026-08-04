// Project-level revisions — every meaningful save is recoverable.
//
// Laws:
// 1. Restoring an older revision NEVER discards the newer work: the current
//    state is parked as a protected checkpoint first, then the snapshot is
//    applied. Both branches survive.
// 2. Pruning only ever touches plain autosaves beyond the keep window. Manual
//    saves, named checkpoints, and anything marked protected are never pruned.
// 3. A revision snapshot is re-sanitized on restore — corrupted history can
//    fail loudly, but it can't poison the working project.

import { countRecords, projectWordCount, sanitizeProject, uid, type StoryProject } from "./story.engine";

export type RevisionKind = "autosave" | "save" | "checkpoint";

export const REVISION_KIND_LABELS: Record<RevisionKind, string> = {
  autosave: "Autosave",
  save: "Manual save",
  checkpoint: "Named checkpoint",
};

/** Suggested checkpoint names — the owner can type anything. */
export const CHECKPOINT_SUGGESTIONS = [
  "First scene draft",
  "First complete chapter",
  "Owner read-through",
  "Owner revision",
  "Continuity pass",
  "Identity-protection pass",
  "Theological review",
  "Audio revision",
  "Copyedit",
  "Final manuscript",
  "First edition",
  "Corrected first edition",
];

export interface RevisionRecord {
  id: string;
  projectId: string;
  kind: RevisionKind;
  label: string; // required for checkpoints, optional note otherwise
  protected: boolean;
  createdAt: string;
  wordCount: number;
  records: number;
  snapshot: StoryProject;
}

export function makeRevision(p: StoryProject, kind: RevisionKind, label = ""): RevisionRecord {
  return {
    id: uid(),
    projectId: p.id,
    kind,
    label: label.trim(),
    protected: kind === "checkpoint",
    createdAt: new Date().toISOString(),
    wordCount: projectWordCount(p),
    records: countRecords(p),
    snapshot: p,
  };
}

export const AUTOSAVE_KEEP = 20;

/**
 * Which revisions may be dropped: plain autosaves past the newest
 * AUTOSAVE_KEEP. Everything else is untouchable (law 2).
 */
export function prunableAutosaves(revisions: RevisionRecord[]): RevisionRecord[] {
  const autosaves = revisions
    .filter((r) => r.kind === "autosave" && !r.protected)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return autosaves.slice(AUTOSAVE_KEEP);
}

export interface RestorePlan {
  /** The current state, parked as a protected checkpoint BEFORE restoring. */
  park: RevisionRecord;
  /** The older snapshot, re-sanitized, carrying the same project id. */
  restored: StoryProject;
}

export function planRestore(current: StoryProject, revision: RevisionRecord): RestorePlan | null {
  const clean = sanitizeProject(revision.snapshot);
  if (!clean || clean.id !== current.id) return null;
  const park = makeRevision(current, "checkpoint", `Before restoring "${revision.label || revision.createdAt.slice(0, 16).replace("T", " ")}"`);
  return { park, restored: { ...clean, updatedAt: new Date().toISOString() } };
}

/** Honest, compact comparison — counts, not a silent merge. */
export function compareRevisions(a: RevisionRecord, b: RevisionRecord): string[] {
  const lines: string[] = [];
  const sections: { key: keyof StoryProject & string; label: string }[] = [
    { key: "sources", label: "source material" },
    { key: "memories", label: "memories" },
    { key: "characters", label: "characters" },
    { key: "relationships", label: "relationships" },
    { key: "storylines", label: "storylines" },
    { key: "scenes", label: "scenes" },
    { key: "chapters", label: "chapters" },
    { key: "notes", label: "notes" },
    { key: "books", label: "books" },
    { key: "constitution", label: "series constitution rules" },
    { key: "spiritual", label: "spiritual-world rules" },
    { key: "research", label: "research claims" },
    { key: "editions", label: "published editions" },
  ];
  lines.push(`Words: ${a.wordCount} → ${b.wordCount}`);
  for (const s of sections) {
    const na = (a.snapshot[s.key] as unknown[]).length;
    const nb = (b.snapshot[s.key] as unknown[]).length;
    if (na !== nb) lines.push(`${s.label}: ${na} → ${nb}`);
  }
  const draftsA = new Map(a.snapshot.scenes.map((s) => [s.id, s.drafts.length]));
  for (const s of b.snapshot.scenes) {
    const before = draftsA.get(s.id);
    if (before !== undefined && before !== s.drafts.length) {
      lines.push(`scene "${s.title}": ${before} → ${s.drafts.length} drafts`);
    }
  }
  if (lines.length === 1) lines.push("Same record counts — differences are inside the text.");
  return lines;
}
