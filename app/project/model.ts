// The canonical project record — the Project OS's source of truth.
//
// A project WRAPS a creation record (the creator's exact words and answers —
// see app/creation/types.ts) and adds what a creation record deliberately
// doesn't have: lifecycle state, approval gates, decisions, evidence, and
// generated outputs. Interpretation stays derived and deterministic until the
// owner approves the scope — approval freezes the brief, because an approval
// applies to specific words, not to whatever a later interpreter version
// would have said.
//
// Non-software engines use the same record: the software-only brief sections
// (screens, data, integrations…) are plain arrays that an adapter may leave
// empty. Nothing here forces software vocabulary onto a poem.

import { parseCreationRecord, type CreationRecordV1 } from "../creation/types";
import { parseEvidenceEntry, type EvidenceEntry } from "./evidence";

export const PROJECT_SCHEMA_VERSION = 1 as const;

/* ── Grounding — every statement knows where it came from ─────────────── */

/**
 * How a statement entered the project.
 *  user-said    — the person's own words, verbatim or lightly trimmed
 *  interpreted  — the system's reading of what they meant (basis shown)
 *  assumed      — the smallest safe assumption, labelled, correctable
 *  recommended  — the system's suggestion, never presented as their idea
 */
export type Grounding = "user-said" | "interpreted" | "assumed" | "recommended";

export interface GroundedItem {
  text: string;
  grounding: Grounding;
  /** Why we believe it — required for anything not user-said. */
  basis?: string;
}

export const said = (text: string): GroundedItem => ({ text, grounding: "user-said" });
export const read = (text: string, basis: string): GroundedItem => ({ text, grounding: "interpreted", basis });
export const assumed = (text: string, basis: string): GroundedItem => ({ text, grounding: "assumed", basis });
export const suggested = (text: string, basis: string): GroundedItem => ({ text, grounding: "recommended", basis });

/* ── The interpretation report (Phase 2's output, stored on the record) ── */

export interface InterpretationReport {
  /** Verbatim: the idea itself plus everything they stated outright. */
  userSaid: string[];
  /** What the system read between the lines, each with its basis. */
  systemInterpreted: { text: string; basis: string }[];
  /** Labelled assumptions — smallest safe reading of what's missing. */
  assumed: string[];
  /** Information we genuinely don't have. */
  missing: string[];
  /** Suggestions — clearly ours, never presented as theirs. */
  recommended: string[];
  /** The version-one cut. */
  versionOne: string[];
  /** Explicitly deferred or excluded — good ideas parked, not forgotten. */
  deferred: string[];
  /** Only questions whose answer would change what gets built. */
  clarifying: { question: string; why: string }[];
}

export const EMPTY_REPORT: InterpretationReport = {
  userSaid: [], systemInterpreted: [], assumed: [], missing: [],
  recommended: [], versionOne: [], deferred: [], clarifying: [],
};

/* ── The brief — what an approved version one actually is ─────────────── */

export interface ProjectBrief {
  intendedUser: GroundedItem | null;
  problem: GroundedItem | null;
  desiredOutcome: GroundedItem | null;
  versionOneScope: GroundedItem[];
  /** Explicit non-goals — building one of these is a scope violation. */
  nonGoals: string[];
  deferredIdeas: string[];
  userJourney: string[];
  /** Screens for software; major experience states for everything else. */
  screens: string[];
  features: GroundedItem[];
  /** Software-only sections — adapters for non-software work leave them empty. */
  dataAndPersistence: string[];
  integrations: string[];
  accessibility: string[];
  privacyAndSafety: string[];
  /** Error, loading, and empty states version one must handle. */
  statesCovered: string[];
  acceptanceCriteria: string[];
  testChecklist: string[];
  deploymentChecklist: string[];
  /** The full builder brief (markdown) — generated, never hand-assembled. */
  builderInstructions: string;
}

export const EMPTY_BRIEF: ProjectBrief = {
  intendedUser: null, problem: null, desiredOutcome: null,
  versionOneScope: [], nonGoals: [], deferredIdeas: [], userJourney: [],
  screens: [], features: [], dataAndPersistence: [], integrations: [],
  accessibility: [], privacyAndSafety: [], statesCovered: [],
  acceptanceCriteria: [], testChecklist: [], deploymentChecklist: [],
  builderInstructions: "",
};

/* ── Lifecycle ────────────────────────────────────────────────────────── */

export type ProjectStatus =
  | "idea-captured"
  | "interpretation-ready"
  | "scope-awaiting-approval"
  | "scope-approved"
  | "build-pack-ready"
  | "implementation-in-progress"
  | "checks-running"
  | "build-failed"
  | "prototype-working"
  | "deployment-pending"
  | "verified-live"
  | "improvement-proposed"
  | "paused"
  | "rejected";

export interface StatusChange {
  status: ProjectStatus;
  at: string;
  note?: string;
}

/* ── Approval gates ───────────────────────────────────────────────────── */

/**
 * Actions the system may RECOMMEND but never cross on its own.
 * A grant is explicit, recorded, and applies to this project only.
 */
export type GateId =
  | "scope-approval"
  | "destructive-action"
  | "paid-service"
  | "credential-change"
  | "public-publishing"
  | "marketplace-publication"
  | "production-data"
  | "external-integration"
  | "cross-repository"
  | "legal-financial-exposure";

export const GATE_LABEL: Record<GateId, string> = {
  "scope-approval": "Version-one scope approved by the owner",
  "destructive-action": "Destructive action (deleting or overwriting real work)",
  "paid-service": "Paid service or new spending",
  "credential-change": "Creating or changing credentials",
  "public-publishing": "Publishing anything publicly",
  "marketplace-publication": "Publishing to a marketplace",
  "production-data": "Mutating production data",
  "external-integration": "External integration with consequential access",
  "cross-repository": "Anything touching another repository",
  "legal-financial-exposure": "Employer, privacy, legal, financial, or security exposure",
};

export interface GateGrant {
  gateId: GateId;
  grantedAt: string;
  note?: string;
}

/* ── Decisions, outputs ───────────────────────────────────────────────── */

export interface DecisionEntry {
  id: string;
  at: string;
  by: "owner" | "system";
  decision: string;
  note?: string;
}

export type OutputKind =
  | "build-pack-md"
  | "build-pack-json"
  | "builder-assignment"
  | "test-assignment"
  | "owner-summary"
  | "other";

export interface OutputEntry {
  id: string;
  kind: OutputKind;
  at: string;
  label: string;
}

/* ── The record ───────────────────────────────────────────────────────── */

export interface ProjectRecordV1 {
  schemaVersion: typeof PROJECT_SCHEMA_VERSION;
  projectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  /** The canonical input: the creator's words, answers, facts, limits. */
  creation: CreationRecordV1;
  /** The labelled interpretation. Regenerated until scope approval. */
  report: InterpretationReport;
  /** The working brief. Frozen at scope approval. */
  brief: ProjectBrief;
  /** Which adapter produced the brief (e.g. "app-engine"). */
  adapterId: string;
  status: ProjectStatus;
  statusHistory: StatusChange[];
  /** Set when the owner approves the scope; freezes report + brief. */
  scopeApprovedAt?: string;
  gates: GateGrant[];
  decisions: DecisionEntry[];
  evidence: EvidenceEntry[];
  outputs: OutputEntry[];
  /** The one thing stopping progress, if anything. */
  blocker: string | null;
}

export const newProjectId = () =>
  `pr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/* ── Safe parsing + migration ─────────────────────────────────────────── */

const isStr = (v: unknown): v is string => typeof v === "string";

function strList(v: unknown, max = 60): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter(isStr).map((s) => s.trim()).filter(Boolean).slice(0, max);
}

const GROUNDINGS = new Set(["user-said", "interpreted", "assumed", "recommended"]);

function groundedItem(v: unknown): GroundedItem | null {
  if (!v || typeof v !== "object") return null;
  const p = v as Record<string, unknown>;
  if (!isStr(p.text) || !p.text.trim()) return null;
  const grounding = isStr(p.grounding) && GROUNDINGS.has(p.grounding)
    ? (p.grounding as Grounding)
    : "interpreted";
  return { text: p.text.trim(), grounding, basis: isStr(p.basis) ? p.basis : undefined };
}

function groundedList(v: unknown, max = 40): GroundedItem[] {
  if (!Array.isArray(v)) return [];
  return v.map(groundedItem).filter((g): g is GroundedItem => g !== null).slice(0, max);
}

function parseReport(v: unknown): InterpretationReport {
  if (!v || typeof v !== "object") return { ...EMPTY_REPORT };
  const p = v as Record<string, unknown>;
  const interpreted = Array.isArray(p.systemInterpreted)
    ? (p.systemInterpreted as unknown[])
        .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
        .filter((x) => isStr(x.text))
        .map((x) => ({ text: x.text as string, basis: isStr(x.basis) ? x.basis : "" }))
    : [];
  const clarifying = Array.isArray(p.clarifying)
    ? (p.clarifying as unknown[])
        .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
        .filter((x) => isStr(x.question))
        .map((x) => ({ question: x.question as string, why: isStr(x.why) ? x.why : "" }))
    : [];
  return {
    userSaid: strList(p.userSaid),
    systemInterpreted: interpreted,
    assumed: strList(p.assumed),
    missing: strList(p.missing),
    recommended: strList(p.recommended),
    versionOne: strList(p.versionOne),
    deferred: strList(p.deferred),
    clarifying,
  };
}

function parseBrief(v: unknown): ProjectBrief {
  if (!v || typeof v !== "object") return { ...EMPTY_BRIEF };
  const p = v as Record<string, unknown>;
  return {
    intendedUser: groundedItem(p.intendedUser),
    problem: groundedItem(p.problem),
    desiredOutcome: groundedItem(p.desiredOutcome),
    versionOneScope: groundedList(p.versionOneScope),
    nonGoals: strList(p.nonGoals),
    deferredIdeas: strList(p.deferredIdeas),
    userJourney: strList(p.userJourney),
    screens: strList(p.screens),
    features: groundedList(p.features),
    dataAndPersistence: strList(p.dataAndPersistence),
    integrations: strList(p.integrations),
    accessibility: strList(p.accessibility),
    privacyAndSafety: strList(p.privacyAndSafety),
    statesCovered: strList(p.statesCovered),
    acceptanceCriteria: strList(p.acceptanceCriteria),
    testChecklist: strList(p.testChecklist),
    deploymentChecklist: strList(p.deploymentChecklist),
    builderInstructions: isStr(p.builderInstructions) ? p.builderInstructions : "",
  };
}

const STATUSES = new Set<string>([
  "idea-captured", "interpretation-ready", "scope-awaiting-approval",
  "scope-approved", "build-pack-ready", "implementation-in-progress",
  "checks-running", "build-failed", "prototype-working", "deployment-pending",
  "verified-live", "improvement-proposed", "paused", "rejected",
]);

const GATE_IDS = new Set<string>(Object.keys(GATE_LABEL));
const OUTPUT_KINDS = new Set<string>([
  "build-pack-md", "build-pack-json", "builder-assignment",
  "test-assignment", "owner-summary", "other",
]);

/**
 * Strict, non-throwing parse of a stored project. Malformed → null, never a
 * crash. Missing newer fields get safe defaults, so a record saved by an
 * older build of this schema still opens — that IS the migration path for
 * additive v1.x changes. A future v2 adds a real migration step here.
 */
export function parseProjectRecord(v: unknown): ProjectRecordV1 | null {
  if (!v || typeof v !== "object") return null;
  const p = v as Record<string, unknown>;
  if (p.schemaVersion !== PROJECT_SCHEMA_VERSION) return null;
  if (!isStr(p.projectId) || !p.projectId.trim()) return null;
  const creation = parseCreationRecord(p.creation);
  if (!creation) return null;

  const status = isStr(p.status) && STATUSES.has(p.status)
    ? (p.status as ProjectStatus)
    : "idea-captured";

  const statusHistory: StatusChange[] = Array.isArray(p.statusHistory)
    ? (p.statusHistory as unknown[])
        .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
        .filter((x) => isStr(x.status) && STATUSES.has(x.status as string))
        .map((x) => ({
          status: x.status as ProjectStatus,
          at: isStr(x.at) ? x.at : new Date().toISOString(),
          note: isStr(x.note) ? x.note : undefined,
        }))
    : [];

  const gates: GateGrant[] = Array.isArray(p.gates)
    ? (p.gates as unknown[])
        .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
        .filter((x) => isStr(x.gateId) && GATE_IDS.has(x.gateId as string))
        .map((x) => ({
          gateId: x.gateId as GateId,
          grantedAt: isStr(x.grantedAt) ? x.grantedAt : new Date().toISOString(),
          note: isStr(x.note) ? x.note : undefined,
        }))
    : [];

  const decisions: DecisionEntry[] = Array.isArray(p.decisions)
    ? (p.decisions as unknown[])
        .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
        .filter((x) => isStr(x.decision))
        .map((x, n) => ({
          id: isStr(x.id) ? x.id : `d-${n}`,
          at: isStr(x.at) ? x.at : new Date().toISOString(),
          by: x.by === "owner" ? "owner" : "system",
          decision: x.decision as string,
          note: isStr(x.note) ? x.note : undefined,
        }))
    : [];

  const evidence: EvidenceEntry[] = Array.isArray(p.evidence)
    ? (p.evidence as unknown[])
        .map(parseEvidenceEntry)
        .filter((e): e is EvidenceEntry => e !== null)
    : [];

  const outputs: OutputEntry[] = Array.isArray(p.outputs)
    ? (p.outputs as unknown[])
        .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
        .filter((x) => isStr(x.kind) && OUTPUT_KINDS.has(x.kind as string) && isStr(x.label))
        .map((x, n) => ({
          id: isStr(x.id) ? x.id : `o-${n}`,
          kind: x.kind as OutputKind,
          at: isStr(x.at) ? x.at : new Date().toISOString(),
          label: x.label as string,
        }))
    : [];

  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    projectId: p.projectId,
    name: isStr(p.name) && p.name.trim() ? p.name.trim().slice(0, 80) : "Untitled project",
    createdAt: isStr(p.createdAt) ? p.createdAt : new Date().toISOString(),
    updatedAt: isStr(p.updatedAt) ? p.updatedAt : new Date().toISOString(),
    creation,
    report: parseReport(p.report),
    brief: parseBrief(p.brief),
    adapterId: isStr(p.adapterId) && p.adapterId ? p.adapterId : "app-engine",
    status,
    statusHistory,
    scopeApprovedAt: isStr(p.scopeApprovedAt) ? p.scopeApprovedAt : undefined,
    gates,
    decisions,
    evidence,
    outputs,
    blocker: isStr(p.blocker) && p.blocker.trim() ? p.blocker : null,
  };
}
