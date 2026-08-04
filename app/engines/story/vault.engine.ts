// Real-to-Fiction Legend (internal name: Source Identity Vault) — pure logic.
//
// The protected key connecting the owner's real experiences to the fictional
// universe. Two permanently distinct systems: private source truth (here) and
// published fictional truth (story.engine.ts). This file never imports from
// or writes to the story project — it only READS story records when the owner
// asks for labels, warnings, or reports.
//
// Laws that must not regress:
// 1. Real identities live only in vault records. No function in this file
//    writes real names into a StoryProjectV1, a story export, a briefing
//    pack, a URL, or a log.
// 2. Source IDs are stable, sequential, and never derived from real names.
// 3. Mappings reference fictional elements by stable story id — renaming a
//    character in the story never breaks or loses a mapping.
// 4. Source and mapping changes append history entries. History is never
//    rewritten or truncated by any function here.
// 5. A suggested fictional name is never assigned automatically. Approving a
//    suggestion records the owner's choice — it renames nothing by itself.
// 6. The vault has its own explicit export (PRIVATE-SOURCE-IDENTITY-VAULT).
//    Ordinary story exports and briefing packs never include vault data.
// 7. No automated check here claims to guarantee anonymity. The disclaimer
//    ships with every review surface.

import type { FocusKind, StoryProjectV1 } from "./story.engine";
import { labelFor } from "./story.engine";

// ---------------------------------------------------------------------------
// Source records — private source truth
// ---------------------------------------------------------------------------

export type SourceKind = "person" | "place" | "org" | "event" | "relationship" | "experience";

export const SOURCE_KINDS: { id: SourceKind; label: string; idSegment: string }[] = [
  { id: "person", label: "Person", idSegment: "PERSON" },
  { id: "place", label: "Place", idSegment: "PLACE" },
  { id: "org", label: "Organization", idSegment: "ORG" },
  { id: "event", label: "Event", idSegment: "EVENT" },
  { id: "relationship", label: "Relationship", idSegment: "RELATIONSHIP" },
  { id: "experience", label: "Experience", idSegment: "EXPERIENCE" },
];

export const SOURCE_KIND_BY_ID = new Map(SOURCE_KINDS.map((k) => [k.id, k]));

export type Sensitivity = "ordinary" | "sensitive" | "highly-sensitive";
export const SENSITIVITIES: { id: Sensitivity; label: string }[] = [
  { id: "ordinary", label: "Ordinary" },
  { id: "sensitive", label: "Sensitive" },
  { id: "highly-sensitive", label: "Highly sensitive" },
];

export type LivingStatus = "living" | "deceased" | "unknown" | "n/a";
export type PermissionStatus = "none" | "asked" | "granted" | "n/a";

/** How a source shows up inside a captured memory. */
export type MentionClassification =
  | "confirmed"       // confirmed source truth
  | "possible"        // possible source truth
  | "interpretation"  // owner interpretation, not established fact
  | "missing-context" // something is missing before this can be classified
  | "unresolved"      // not yet worked through
  | "fictional-mix";  // fictional idea mixed into the memory

export const MENTION_CLASSIFICATIONS: { id: MentionClassification; label: string }[] = [
  { id: "confirmed", label: "Confirmed source truth" },
  { id: "possible", label: "Possible source truth" },
  { id: "interpretation", label: "Owner interpretation" },
  { id: "missing-context", label: "Missing context" },
  { id: "unresolved", label: "Unresolved" },
  { id: "fictional-mix", label: "Fictional idea mixed in" },
];

export interface HistoryEntry {
  at: string;
  note: string;
}

export interface MemoryLink {
  memoryId: string; // story MemoryRecord id — the raw capture stays in the story project
  classification: MentionClassification;
}

export interface SourceRecord {
  /** Stable private ID like REAL-PERSON-001. Never derived from the real name. */
  id: string;
  kind: SourceKind;
  realName: string;
  relationshipToOwner: string;
  lifePeriod: string;
  locations: string;
  organizations: string;
  /** Source memories, events, and private context in the owner's words. */
  privateContext: string;
  /** Distinctive traits, expressions, habits — the things that identify. */
  identifyingDetails: string;
  sensitivity: Sensitivity;
  living: LivingStatus;
  permission: PermissionStatus;
  /** Details that must never be published. */
  neverPublish: string;
  /** Details that require significant alteration before any use. */
  mustAlter: string;
  ownerNotes: string;
  memoryLinks: MemoryLink[];
  archived: boolean;
  createdAt: string;
  /** Append-only. */
  history: HistoryEntry[];
}

// ---------------------------------------------------------------------------
// Legend mappings — many-to-many, rename-safe
// ---------------------------------------------------------------------------

export type RiskLevel = "low" | "moderate" | "high" | "owner-review" | "professional-review";

export const RISK_LEVELS: { id: RiskLevel; label: string }[] = [
  { id: "low", label: "Low apparent identification risk" },
  { id: "moderate", label: "Moderate identification risk" },
  { id: "high", label: "High identification risk" },
  { id: "owner-review", label: "Owner review required" },
  { id: "professional-review", label: "Professional review recommended" },
];

export type ApprovalStatus = "unreviewed" | "in-review" | "approved";
export const APPROVAL_STATUSES: { id: ApprovalStatus; label: string }[] = [
  { id: "unreviewed", label: "Unreviewed" },
  { id: "in-review", label: "In review" },
  { id: "approved", label: "Owner approved" },
];

/** Points at a story element by stable id. Survives renames; may dangle if the
 *  story element is later removed — the mapping and its history are kept. */
export interface FictionTarget {
  kind: FocusKind;
  id: string;
}

export interface FictionalizationChange {
  id: string;
  what: string; // what was changed (or invented / removed / merged)
  why: string;  // why this protects privacy or improves the story
  at: string;
}

export type SuggestionStatus = "proposed" | "approved" | "rejected";

export interface NameSuggestion {
  id: string;
  name: string;
  notes: string; // why it fits, similarity concerns, pronunciation, risk
  status: SuggestionStatus;
}

export interface LegendMapping {
  id: string; // MAP-001
  /** One or many sources — composites are normal. */
  sourceIds: string[];
  /** Captured source material (SM-…) that fed this mapping. Many-to-many:
   *  several sources can feed one mapping, one source can feed several. */
  sourceMaterialIds: string[];
  /** The fictional element, when one exists. null = not yet in the story. */
  fiction: FictionTarget | null;
  /** Owner's label while no story element exists (or as a reminder). */
  workingLabel: string;
  previousFictionalNames: string[];
  inspiredBy: string;       // what was inspired by reality
  stillNeedsChange: string; // what still needs to change
  invented: string;         // what was invented
  removedDetails: string;   // what was removed
  mergedFrom: string;       // what was merged from other sources
  mustStayPrivate: string;  // what must remain private
  changes: FictionalizationChange[];
  nameSuggestions: NameSuggestion[];
  risk: RiskLevel;
  approval: ApprovalStatus;
  lastReviewedAt: string; // "" = never
  createdAt: string;
  /** Append-only. */
  history: HistoryEntry[];
}

export interface SourceVaultV1 {
  version: 1;
  /** The story project this legend belongs to. */
  projectId: string;
  counters: Record<SourceKind, number>;
  mapCounter: number;
  sources: SourceRecord[];
  mappings: LegendMapping[];
  createdAt: string;
  updatedAt: string;
  lastExportAt: string; // "" = never
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

function touch(v: SourceVaultV1): SourceVaultV1 {
  return { ...v, updatedAt: now() };
}

const ZERO_COUNTERS: Record<SourceKind, number> = {
  person: 0, place: 0, org: 0, event: 0, relationship: 0, experience: 0,
};

export function createVault(projectId: string): SourceVaultV1 {
  const t = now();
  return {
    version: 1,
    projectId,
    counters: { ...ZERO_COUNTERS },
    mapCounter: 0,
    sources: [],
    mappings: [],
    createdAt: t,
    updatedAt: t,
    lastExportAt: "",
  };
}

export function sourceIdFor(kind: SourceKind, n: number): string {
  return `REAL-${SOURCE_KIND_BY_ID.get(kind)!.idSegment}-${String(n).padStart(3, "0")}`;
}

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

export function addSource(
  v: SourceVaultV1,
  kind: SourceKind,
  realName: string,
): { vault: SourceVaultV1; source: SourceRecord | null } {
  const clean = realName.trim();
  if (!clean) return { vault: v, source: null };
  const n = (v.counters[kind] ?? 0) + 1;
  const source: SourceRecord = {
    id: sourceIdFor(kind, n),
    kind,
    realName: clean,
    relationshipToOwner: "",
    lifePeriod: "",
    locations: "",
    organizations: "",
    privateContext: "",
    identifyingDetails: "",
    sensitivity: "ordinary",
    living: kind === "person" ? "unknown" : "n/a",
    permission: kind === "person" ? "none" : "n/a",
    neverPublish: "",
    mustAlter: "",
    ownerNotes: "",
    memoryLinks: [],
    archived: false,
    createdAt: now(),
    history: [{ at: now(), note: "Source recorded." }],
  };
  return {
    vault: touch({ ...v, counters: { ...v.counters, [kind]: n }, sources: [...v.sources, source] }),
    source,
  };
}

type SourceEdit = Partial<
  Pick<
    SourceRecord,
    | "realName" | "relationshipToOwner" | "lifePeriod" | "locations" | "organizations"
    | "privateContext" | "identifyingDetails" | "sensitivity" | "living" | "permission"
    | "neverPublish" | "mustAlter" | "ownerNotes"
  >
>;

export function updateSource(
  v: SourceVaultV1,
  id: string,
  changes: SourceEdit,
  historyNote = "",
): SourceVaultV1 {
  return touch({
    ...v,
    sources: v.sources.map((s) => {
      if (s.id !== id) return s;
      const next = { ...s, ...changes };
      if (historyNote.trim()) next.history = [...s.history, { at: now(), note: historyNote.trim() }];
      return next;
    }),
  });
}

export function setSourceArchived(v: SourceVaultV1, id: string, archived: boolean): SourceVaultV1 {
  return touch({
    ...v,
    sources: v.sources.map((s) =>
      s.id === id
        ? { ...s, archived, history: [...s.history, { at: now(), note: archived ? "Archived." : "Restored from archive." }] }
        : s,
    ),
  });
}

/**
 * Destructive and deliberately hard. Fails unless the typed confirmation is
 * the exact source ID, and fails while any mapping still references the
 * source. Archival is the preferred path.
 */
export function deleteSource(
  v: SourceVaultV1,
  id: string,
  typedConfirmation: string,
): { vault: SourceVaultV1; ok: boolean; error: string } {
  const source = v.sources.find((s) => s.id === id);
  if (!source) return { vault: v, ok: false, error: "No such source." };
  if (typedConfirmation.trim() !== id) {
    return { vault: v, ok: false, error: `Type the source ID (${id}) exactly to confirm deletion.` };
  }
  const mapped = v.mappings.filter((m) => m.sourceIds.includes(id));
  if (mapped.length > 0) {
    return {
      vault: v, ok: false,
      error: `${mapped.length} mapping(s) still reference this source. Remove it from those mappings first, or archive instead.`,
    };
  }
  return { vault: touch({ ...v, sources: v.sources.filter((s) => s.id !== id) }), ok: true, error: "" };
}

export function linkMemoryToSource(
  v: SourceVaultV1,
  sourceId: string,
  memoryId: string,
  classification: MentionClassification,
): SourceVaultV1 {
  return touch({
    ...v,
    sources: v.sources.map((s) => {
      if (s.id !== sourceId) return s;
      const others = s.memoryLinks.filter((l) => l.memoryId !== memoryId);
      return { ...s, memoryLinks: [...others, { memoryId, classification }] };
    }),
  });
}

export function unlinkMemoryFromSource(v: SourceVaultV1, sourceId: string, memoryId: string): SourceVaultV1 {
  return touch({
    ...v,
    sources: v.sources.map((s) =>
      s.id === sourceId ? { ...s, memoryLinks: s.memoryLinks.filter((l) => l.memoryId !== memoryId) } : s,
    ),
  });
}

// ---------------------------------------------------------------------------
// Mappings
// ---------------------------------------------------------------------------

export function addMapping(
  v: SourceVaultV1,
  sourceIds: string[],
  opts: { fiction?: FictionTarget | null; workingLabel?: string; sourceMaterialIds?: string[] } = {},
): { vault: SourceVaultV1; mapping: LegendMapping | null } {
  const valid = [...new Set(sourceIds)].filter((id) => v.sources.some((s) => s.id === id));
  if (valid.length === 0) return { vault: v, mapping: null };
  const n = v.mapCounter + 1;
  const mapping: LegendMapping = {
    id: `MAP-${String(n).padStart(3, "0")}`,
    sourceIds: valid,
    sourceMaterialIds: [...new Set((opts.sourceMaterialIds ?? []).filter((x) => /^SM-\d{4,}$/.test(x)))],
    fiction: opts.fiction ?? null,
    workingLabel: (opts.workingLabel ?? "").trim(),
    previousFictionalNames: [],
    inspiredBy: "",
    stillNeedsChange: "",
    invented: "",
    removedDetails: "",
    mergedFrom: "",
    mustStayPrivate: "",
    changes: [],
    nameSuggestions: [],
    risk: "owner-review",
    approval: "unreviewed",
    lastReviewedAt: "",
    createdAt: now(),
    history: [{ at: now(), note: `Mapping created from ${valid.join(", ")}.` }],
  };
  return { vault: touch({ ...v, mapCounter: n, mappings: [...v.mappings, mapping] }), mapping };
}

type MappingEdit = Partial<
  Pick<
    LegendMapping,
    | "sourceIds" | "workingLabel" | "inspiredBy" | "stillNeedsChange" | "invented"
    | "removedDetails" | "mergedFrom" | "mustStayPrivate"
  >
>;

export function updateMapping(
  v: SourceVaultV1,
  id: string,
  changes: MappingEdit,
  historyNote = "",
): SourceVaultV1 {
  return touch({
    ...v,
    mappings: v.mappings.map((m) => {
      if (m.id !== id) return m;
      const next = { ...m, ...changes };
      if (changes.sourceIds !== undefined) {
        next.sourceIds = [...new Set(changes.sourceIds)].filter((sid) => v.sources.some((s) => s.id === sid));
        if (next.sourceIds.length === 0) next.sourceIds = m.sourceIds; // a mapping never loses its last source silently
      }
      if (historyNote.trim()) next.history = [...m.history, { at: now(), note: historyNote.trim() }];
      return next;
    }),
  });
}

/** Link a captured source (SM-…) to a mapping — the many-to-many bridge lane. */
export function linkSourceMaterialToMapping(v: SourceVaultV1, mappingId: string, smId: string): SourceVaultV1 {
  if (!/^SM-\d{4,}$/.test(smId)) return v;
  return touch({
    ...v,
    mappings: v.mappings.map((m) =>
      m.id === mappingId && !m.sourceMaterialIds.includes(smId)
        ? { ...m, sourceMaterialIds: [...m.sourceMaterialIds, smId], history: [...m.history, { at: now(), note: `Source material ${smId} linked.` }] }
        : m,
    ),
  });
}

export function unlinkSourceMaterialFromMapping(v: SourceVaultV1, mappingId: string, smId: string): SourceVaultV1 {
  return touch({
    ...v,
    mappings: v.mappings.map((m) =>
      m.id === mappingId ? { ...m, sourceMaterialIds: m.sourceMaterialIds.filter((x) => x !== smId) } : m,
    ),
  });
}

/** Point a mapping at a story element (or detach it). History records the move;
 *  the previous fictional name is preserved when the project can still name it. */
export function setMappingFiction(
  v: SourceVaultV1,
  id: string,
  fiction: FictionTarget | null,
  project: StoryProjectV1 | null,
): SourceVaultV1 {
  return touch({
    ...v,
    mappings: v.mappings.map((m) => {
      if (m.id !== id) return m;
      const previous = m.fiction && project ? labelFor(project, m.fiction) : "";
      const keepName =
        previous && !previous.startsWith("(missing") && !m.previousFictionalNames.includes(previous)
          ? [...m.previousFictionalNames, previous]
          : m.previousFictionalNames;
      const note = fiction
        ? `Mapped to ${fiction.kind} ${project ? `"${labelFor(project, fiction)}"` : fiction.id}.`
        : "Detached from fictional element.";
      return {
        ...m, fiction, previousFictionalNames: keepName,
        history: [...m.history, { at: now(), note }],
      };
    }),
  });
}

export function addMappingChange(v: SourceVaultV1, id: string, what: string, why: string): SourceVaultV1 {
  const cleanWhat = what.trim();
  if (!cleanWhat) return v;
  return touch({
    ...v,
    mappings: v.mappings.map((m) =>
      m.id === id
        ? {
            ...m,
            changes: [...m.changes, { id: shortId(), what: cleanWhat, why: why.trim(), at: now() }],
            history: [...m.history, { at: now(), note: `Change recorded: ${cleanWhat}` }],
          }
        : m,
    ),
  });
}

export function addNameSuggestion(v: SourceVaultV1, id: string, name: string, notes = ""): SourceVaultV1 {
  const clean = name.trim();
  if (!clean) return v;
  return touch({
    ...v,
    mappings: v.mappings.map((m) =>
      m.id === id
        ? { ...m, nameSuggestions: [...m.nameSuggestions, { id: shortId(), name: clean, notes: notes.trim(), status: "proposed" }] }
        : m,
    ),
  });
}

/**
 * Records the owner's verdict on a suggestion. Approving assigns NOTHING —
 * renaming a fictional element stays a separate, deliberate act in the story
 * room. This function touches no story data.
 */
export function setSuggestionStatus(
  v: SourceVaultV1,
  mappingId: string,
  suggestionId: string,
  status: SuggestionStatus,
): SourceVaultV1 {
  return touch({
    ...v,
    mappings: v.mappings.map((m) =>
      m.id === mappingId
        ? { ...m, nameSuggestions: m.nameSuggestions.map((s) => (s.id === suggestionId ? { ...s, status } : s)) }
        : m,
    ),
  });
}

export function reviewMapping(
  v: SourceVaultV1,
  id: string,
  risk: RiskLevel,
  approval: ApprovalStatus,
): SourceVaultV1 {
  return touch({
    ...v,
    mappings: v.mappings.map((m) =>
      m.id === id
        ? {
            ...m, risk, approval, lastReviewedAt: now(),
            history: [
              ...m.history,
              { at: now(), note: `Reviewed — risk: ${RISK_LEVELS.find((r) => r.id === risk)?.label}; status: ${approval}.` },
            ],
          }
        : m,
    ),
  });
}

// ---------------------------------------------------------------------------
// Identity-leakage review — deterministic, honest, never a guarantee
// ---------------------------------------------------------------------------

export const LEAKAGE_DISCLAIMER =
  "These checks are mechanical and incomplete. No automated check can guarantee anonymity — " +
  "combinations of true details can identify a person even when every name is changed. " +
  "The owner's judgment, and where it matters a publishing attorney's, are the real review.";

/** The combination-risk checklist the owner walks per mapping. */
export const IDENTITY_RISK_CHECKLIST: string[] = [
  "Exact job plus exact city plus exact year",
  "Unusual family structure",
  "Distinctive injury or medical event",
  "Rare profession",
  "Specific school and graduation year",
  "Recognizable workplace incident",
  "Exact public achievement",
  "Unique quotation",
  "Highly specific relationship history",
  "Exact property or building description",
  "Distinctive sequence of life events",
  "Publicly searchable facts",
  "A fictional name too similar to the real name",
  "Several unchanged facts appearing together",
];

const wordsOf = (s: string): string[] =>
  s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3);

/** Heuristic: a shared word, or two words sharing a 5+ character prefix. */
export function nameTooSimilar(realName: string, fictionalName: string): boolean {
  const a = wordsOf(realName);
  const b = wordsOf(fictionalName);
  for (const x of a) {
    for (const y of b) {
      if (x === y) return true;
      let common = 0;
      while (common < x.length && common < y.length && x[common] === y[common]) common++;
      if (common >= 5) return true;
    }
  }
  return false;
}

export interface LeakageWarning {
  level: "notice" | "warning";
  mappingId: string; // "" when the warning is about a source alone
  sourceId: string;
  message: string;
}

/**
 * Scans FICTION-BOUND story surfaces (titles, descriptions, notes, scene
 * drafts — not raw memories, which are private source captures by design)
 * for each source's real name, plus mapping-level checks.
 */
export function leakageWarnings(v: SourceVaultV1, p: StoryProjectV1): LeakageWarning[] {
  const out: LeakageWarning[] = [];

  const surfaces: { where: string; text: string }[] = [
    { where: "project title", text: p.title },
    { where: "premise", text: p.premise },
    ...p.characters.flatMap((c) => [
      { where: `character "${c.name}"`, text: `${c.name} ${c.description}` },
    ]),
    ...p.relationships.map((r) => ({ where: `relationship "${r.title}"`, text: `${r.title} ${r.description}` })),
    ...p.storylines.map((s) => ({ where: `storyline "${s.name}"`, text: `${s.name} ${s.summary}` })),
    ...p.scenes.flatMap((s) => [
      { where: `scene "${s.title}"`, text: `${s.title} ${s.purpose}` },
      ...s.drafts.map((d, i) => ({ where: `scene "${s.title}" draft ${i + 1}`, text: d.text })),
    ]),
    ...p.chapters.map((c) => ({ where: `chapter "${c.workingTitle}"`, text: `${c.workingTitle} ${c.purpose}` })),
    ...p.notes.map((n) => ({ where: `${n.kind} note`, text: n.text })),
  ];

  for (const s of v.sources) {
    if (s.archived) continue;
    const full = s.realName.trim().toLowerCase();
    if (!full) continue;
    for (const surf of surfaces) {
      if (surf.text.toLowerCase().includes(full)) {
        out.push({
          level: "warning", mappingId: "", sourceId: s.id,
          message: `The real name behind ${s.id} appears in the ${surf.where}. Fiction-bound text should use fictional names only.`,
        });
      }
    }
  }

  for (const m of v.mappings) {
    const fictionalName = m.fiction ? labelFor(p, m.fiction) : m.workingLabel;
    for (const sid of m.sourceIds) {
      const s = v.sources.find((x) => x.id === sid);
      if (!s) continue;
      if (fictionalName && !fictionalName.startsWith("(missing") && nameTooSimilar(s.realName, fictionalName)) {
        out.push({
          level: "warning", mappingId: m.id, sourceId: s.id,
          message: `${m.id}: the fictional name "${fictionalName}" is similar to the real name behind ${s.id}.`,
        });
      }
      if (m.approval === "approved" && m.changes.length === 0 && s.sensitivity !== "ordinary") {
        out.push({
          level: "warning", mappingId: m.id, sourceId: s.id,
          message: `${m.id} is approved but records zero deliberate changes, and ${s.id} is marked ${s.sensitivity}. What was actually altered?`,
        });
      }
    }
    if (m.approval !== "unreviewed" && !m.lastReviewedAt) {
      out.push({
        level: "notice", mappingId: m.id, sourceId: m.sourceIds[0] ?? "",
        message: `${m.id} has an approval status but no review date.`,
      });
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// Identity Protection Report — owner-only, produced before publication
// ---------------------------------------------------------------------------

export const ATTORNEY_LINE =
  "For serious privacy, reputation, defamation, confidentiality, or legal concerns, have an " +
  "appropriate publishing attorney review the manuscript before release.";

export function identityProtectionReport(v: SourceVaultV1, p: StoryProjectV1): string {
  const warnings = leakageWarnings(v, p);
  const active = v.sources.filter((s) => !s.archived);
  const unmapped = active.filter((s) => !v.mappings.some((m) => m.sourceIds.includes(s.id)));
  const unreviewed = v.mappings.filter((m) => m.approval !== "approved");
  const serious = v.mappings.filter((m) => m.risk === "high" || m.risk === "professional-review");

  const lines: string[] = [
    `PRIVATE — Identity Protection Report`,
    `Project: ${p.title}`,
    `Generated: ${now().slice(0, 10)}`,
    ``,
    `This report is for the owner only. It contains private source IDs and review findings.`,
    ``,
    `## Coverage`,
    `- Sources on record: ${active.length} (${v.sources.length - active.length} archived)`,
    `- Legend mappings: ${v.mappings.length}`,
    unmapped.length
      ? `- Sources with NO mapping yet: ${unmapped.map((s) => s.id).join(", ")}`
      : `- Every active source has at least one mapping.`,
    ``,
    `## Review status`,
    unreviewed.length
      ? `- Not yet owner-approved: ${unreviewed.map((m) => m.id).join(", ")}`
      : `- Every mapping is owner-approved.`,
    serious.length
      ? `- High risk / professional review: ${serious.map((m) => m.id).join(", ")}`
      : `- No mapping is currently flagged high risk.`,
    ``,
    `## Mechanical findings (${warnings.length})`,
    ...(warnings.length ? warnings.map((w) => `- [${w.level}] ${w.message}`) : ["- None found by the mechanical checks."]),
    ``,
    `## Owner checklist — walk this for every mapping used in the book`,
    ...IDENTITY_RISK_CHECKLIST.map((c) => `- ${c}`),
    ``,
    `## Honest limits`,
    LEAKAGE_DISCLAIMER,
    ``,
    ATTORNEY_LINE,
    ``,
    `This report changes nothing by itself. It never rewrites the manuscript.`,
  ];
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// AI boundary — redaction and the smallest safe excerpt
// ---------------------------------------------------------------------------

export const AI_BOUNDARY_NOTICE =
  "Source context below uses private source IDs and fictional names only. Real identities stay " +
  "in the owner's local legend and are not part of this material. Do not ask for them.";

export const AI_SEND_WARNING =
  "Review before sending: anything you copy into an outside AI leaves this device and is governed " +
  "by that provider's account and privacy settings. Real names have been replaced with source IDs — " +
  "check the preview yourself before you paste.";

/**
 * Replaces every occurrence of each active source's real name (full name
 * first, then individual name words of 3+ characters, longest first) with the
 * source's private ID in brackets. Over-redaction is the safe direction.
 */
export function redactRealNames(text: string, sources: SourceRecord[]): string {
  const tokens: { token: string; id: string }[] = [];
  for (const s of sources) {
    const full = s.realName.trim();
    if (!full) continue;
    tokens.push({ token: full, id: s.id });
    for (const w of full.split(/\s+/)) {
      const clean = w.replace(/[^A-Za-z0-9'-]/g, "");
      if (clean.length >= 3) tokens.push({ token: clean, id: s.id });
    }
  }
  tokens.sort((a, b) => b.token.length - a.token.length);
  let out = text;
  for (const { token, id } of tokens) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`\\b${escaped}\\b`, "gi"), `[${id}]`);
  }
  return out;
}

/**
 * The smallest useful source context for an outside-AI task: source IDs,
 * the fictional name, and the fictionalization decisions — never real names,
 * never neverPublish/mustStayPrivate content, never the whole legend.
 */
export function aiSafeSourceContext(v: SourceVaultV1, mappingIds: string[], p: StoryProjectV1): string {
  const chosen = v.mappings.filter((m) => mappingIds.includes(m.id));
  const blocks = chosen.map((m) => {
    const fictionalName = m.fiction ? labelFor(p, m.fiction) : m.workingLabel || "(no fictional element yet)";
    const lines = [
      `### ${m.id} → ${fictionalName}`,
      `Sources: ${m.sourceIds.join(", ")}`,
    ];
    if (m.inspiredBy.trim()) lines.push(`Inspired by reality: ${m.inspiredBy.trim()}`);
    if (m.invented.trim()) lines.push(`Invented: ${m.invented.trim()}`);
    if (m.changes.length) {
      lines.push("Deliberate changes from reality:");
      for (const c of m.changes) lines.push(`- ${c.what}${c.why ? ` (why: ${c.why})` : ""}`);
    }
    return lines.join("\n");
  });
  const body = blocks.length ? blocks.join("\n\n") : "No mappings selected.";
  return redactRealNames(`${AI_BOUNDARY_NOTICE}\n\n${body}`, v.sources);
}

// ---------------------------------------------------------------------------
// Export / import — the vault travels ONLY in its own explicit file
// ---------------------------------------------------------------------------

export const VAULT_EXPORT_FORMAT = "sitr-private-source-identity-vault";
export const VAULT_EXPORT_FILENAME_PREFIX = "PRIVATE-SOURCE-IDENTITY-VAULT";

export const VAULT_EXPORT_NOTICE =
  "PRIVATE. This file is the Real-to-Fiction Legend: it contains the real identities behind the " +
  "fiction — real people, places, organizations, and private context. It is not part of any " +
  "manuscript, family review, publishing, or AI export, and it should be stored with the same " +
  "care as a private journal. The creative project backup does NOT include this file; keep both " +
  "if you want complete disaster recovery.";

export function exportVaultPayload(v: SourceVaultV1): string {
  return JSON.stringify(
    { format: VAULT_EXPORT_FORMAT, formatVersion: 1, notice: VAULT_EXPORT_NOTICE, exportedAt: now(), vault: v },
    null,
    2,
  );
}

export function markVaultExported(v: SourceVaultV1): SourceVaultV1 {
  return { ...v, lastExportAt: now() };
}

const isStr = (x: unknown): x is string => typeof x === "string";
const strOr = (x: unknown, fallback = ""): string => (isStr(x) ? x : fallback);
const arr = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);

const SOURCE_KIND_IDS = SOURCE_KINDS.map((k) => k.id);
const RISK_IDS = RISK_LEVELS.map((r) => r.id);
const APPROVAL_IDS = APPROVAL_STATUSES.map((a) => a.id);
const SENSITIVITY_IDS = SENSITIVITIES.map((s) => s.id);
const MENTION_IDS = MENTION_CLASSIFICATIONS.map((m) => m.id);
const LIVING_IDS: LivingStatus[] = ["living", "deceased", "unknown", "n/a"];
const PERMISSION_IDS: PermissionStatus[] = ["none", "asked", "granted", "n/a"];
const SUGGESTION_IDS: SuggestionStatus[] = ["proposed", "approved", "rejected"];
const FOCUS_KIND_IDS: FocusKind[] = ["character", "relationship", "storyline", "scene", "chapter"];

function cleanHistory(x: unknown): HistoryEntry[] {
  return arr(x)
    .map((h) => h as Record<string, unknown>)
    .filter((h) => h && isStr(h.note))
    .map((h) => ({ at: strOr(h.at), note: h.note as string }));
}

/**
 * Rebuild a SourceVaultV1 from untrusted data. Filters invalid records,
 * preserves mappings even when their fiction target no longer resolves
 * (danglers keep their history), recomputes counters so future IDs never
 * collide. Returns null when unusable. Never throws.
 */
export function sanitizeVault(data: unknown): SourceVaultV1 | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (!isStr(d.projectId)) return null;

  const seen = new Set<string>();
  const sources: SourceRecord[] = [];
  for (const raw of arr(d.sources)) {
    const s = raw as Record<string, unknown>;
    if (!s || !isStr(s.id) || !s.id || seen.has(s.id)) continue;
    if (!SOURCE_KIND_IDS.includes(s.kind as SourceKind)) continue;
    if (!isStr(s.realName) || !s.realName.trim()) continue;
    seen.add(s.id);
    sources.push({
      id: s.id,
      kind: s.kind as SourceKind,
      realName: s.realName,
      relationshipToOwner: strOr(s.relationshipToOwner),
      lifePeriod: strOr(s.lifePeriod),
      locations: strOr(s.locations),
      organizations: strOr(s.organizations),
      privateContext: strOr(s.privateContext),
      identifyingDetails: strOr(s.identifyingDetails),
      sensitivity: SENSITIVITY_IDS.includes(s.sensitivity as Sensitivity) ? (s.sensitivity as Sensitivity) : "ordinary",
      living: LIVING_IDS.includes(s.living as LivingStatus) ? (s.living as LivingStatus) : "unknown",
      permission: PERMISSION_IDS.includes(s.permission as PermissionStatus) ? (s.permission as PermissionStatus) : "none",
      neverPublish: strOr(s.neverPublish),
      mustAlter: strOr(s.mustAlter),
      ownerNotes: strOr(s.ownerNotes),
      memoryLinks: arr(s.memoryLinks)
        .map((l) => l as Record<string, unknown>)
        .filter((l) => l && isStr(l.memoryId) && MENTION_IDS.includes(l.classification as MentionClassification))
        .map((l) => ({ memoryId: l.memoryId as string, classification: l.classification as MentionClassification })),
      archived: s.archived === true,
      createdAt: strOr(s.createdAt),
      history: cleanHistory(s.history),
    });
  }

  const mappings: LegendMapping[] = [];
  for (const raw of arr(d.mappings)) {
    const m = raw as Record<string, unknown>;
    if (!m || !isStr(m.id) || !m.id || seen.has(m.id)) continue;
    const sourceIds = arr(m.sourceIds).filter((x): x is string => isStr(x) && sources.some((s) => s.id === x));
    if (sourceIds.length === 0) continue;
    seen.add(m.id);
    const f = m.fiction as Record<string, unknown> | null | undefined;
    const fiction: FictionTarget | null =
      f && FOCUS_KIND_IDS.includes(f.kind as FocusKind) && isStr(f.id) ? { kind: f.kind as FocusKind, id: f.id } : null;
    mappings.push({
      id: m.id,
      sourceIds: [...new Set(sourceIds)],
      sourceMaterialIds: [...new Set(arr(m.sourceMaterialIds).filter((x): x is string => isStr(x) && /^SM-\d{4,}$/.test(x)))],
      fiction,
      workingLabel: strOr(m.workingLabel),
      previousFictionalNames: arr(m.previousFictionalNames).filter(isStr),
      inspiredBy: strOr(m.inspiredBy),
      stillNeedsChange: strOr(m.stillNeedsChange),
      invented: strOr(m.invented),
      removedDetails: strOr(m.removedDetails),
      mergedFrom: strOr(m.mergedFrom),
      mustStayPrivate: strOr(m.mustStayPrivate),
      changes: arr(m.changes)
        .map((c) => c as Record<string, unknown>)
        .filter((c) => c && isStr(c.what) && c.what.trim())
        .map((c) => ({ id: strOr(c.id) || shortId(), what: c.what as string, why: strOr(c.why), at: strOr(c.at) })),
      nameSuggestions: arr(m.nameSuggestions)
        .map((s) => s as Record<string, unknown>)
        .filter((s) => s && isStr(s.name) && s.name.trim())
        .map((s) => ({
          id: strOr(s.id) || shortId(),
          name: s.name as string,
          notes: strOr(s.notes),
          status: SUGGESTION_IDS.includes(s.status as SuggestionStatus) ? (s.status as SuggestionStatus) : "proposed",
        })),
      risk: RISK_IDS.includes(m.risk as RiskLevel) ? (m.risk as RiskLevel) : "owner-review",
      approval: APPROVAL_IDS.includes(m.approval as ApprovalStatus) ? (m.approval as ApprovalStatus) : "unreviewed",
      lastReviewedAt: strOr(m.lastReviewedAt),
      createdAt: strOr(m.createdAt),
      history: cleanHistory(m.history),
    });
  }

  // Recompute counters from the IDs actually present so new IDs never collide.
  const counters = { ...ZERO_COUNTERS };
  for (const s of sources) {
    const match = /-(\d+)$/.exec(s.id);
    const n = match ? parseInt(match[1], 10) : 0;
    if (n > counters[s.kind]) counters[s.kind] = n;
  }
  let mapCounter = 0;
  for (const m of mappings) {
    const match = /^MAP-(\d+)$/.exec(m.id);
    const n = match ? parseInt(match[1], 10) : 0;
    if (n > mapCounter) mapCounter = n;
  }

  return {
    version: 1,
    projectId: d.projectId,
    counters,
    mapCounter,
    sources,
    mappings,
    createdAt: strOr(d.createdAt),
    updatedAt: strOr(d.updatedAt),
    lastExportAt: strOr(d.lastExportAt),
  };
}

export type VaultImportResult = { ok: true; vault: SourceVaultV1 } | { ok: false; error: string };

export function parseVaultImport(raw: string): VaultImportResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }
  const d = data as Record<string, unknown>;
  if (!d || d.format !== VAULT_EXPORT_FORMAT) {
    return { ok: false, error: "That file isn't a Source Identity Vault export." };
  }
  const vault = sanitizeVault(d.vault);
  if (!vault) return { ok: false, error: "The file doesn't contain a usable vault." };
  return { ok: true, vault };
}

// ---------------------------------------------------------------------------
// Private search — real-identity search exists ONLY here, never in the
// ordinary story workspace.
// ---------------------------------------------------------------------------

export interface VaultSearchHit {
  kind: "source" | "mapping";
  id: string;
  label: string;
}

export function searchVault(v: SourceVaultV1, p: StoryProjectV1 | null, query: string): VaultSearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: VaultSearchHit[] = [];
  for (const s of v.sources) {
    const hay = [
      s.id, s.realName, s.relationshipToOwner, s.lifePeriod, s.locations, s.organizations,
      s.privateContext, s.identifyingDetails, s.ownerNotes, s.neverPublish, s.mustAlter,
    ].join(" ").toLowerCase();
    if (hay.includes(q)) hits.push({ kind: "source", id: s.id, label: `${s.id} — ${s.realName}${s.archived ? " (archived)" : ""}` });
  }
  for (const m of v.mappings) {
    const fictional = m.fiction && p ? labelFor(p, m.fiction) : m.workingLabel;
    const hay = [
      m.id, m.workingLabel, fictional, m.inspiredBy, m.invented, m.mergedFrom,
      m.previousFictionalNames.join(" "), m.nameSuggestions.map((s) => s.name).join(" "),
      m.changes.map((c) => `${c.what} ${c.why}`).join(" "),
    ].join(" ").toLowerCase();
    if (hay.includes(q)) hits.push({ kind: "mapping", id: m.id, label: `${m.id} — ${fictional || "(unnamed)"}` });
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Honest storage explanation — shown in the vault UI, pinned by tests
// ---------------------------------------------------------------------------

export const VAULT_PRIVACY_EXPLANATION =
  "The legend is stored in this browser on this device, in its own storage slot, separate from " +
  "the story project — it is not intentionally sent to or stored on the Step In The Ring server, " +
  "and it is never included in story exports, briefing packs, or backups unless you export the " +
  "vault itself. Honest limits: browser storage is NOT encryption. Anyone who can open this " +
  "browser profile, or this device's files, could read it. The vault lock on this page deters " +
  "casual access on a shared device — it is not a security boundary. The storage format reserves " +
  "room for real encryption in a later pass; until then, treat this device like the private " +
  "journal it now holds, and keep vault export files somewhere equally private.";
