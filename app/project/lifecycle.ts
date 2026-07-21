// Lifecycle — how a project moves, and which moves need the owner.
//
// The software may RECOMMEND the next state; it never silently crosses an
// approval gate. Every transition goes through advance(), which enforces the
// gate map and refuses claims the evidence doesn't support ("verified live"
// with no production evidence is a lie, not a status).

import { canClaimVerifiedLive } from "./evidence";
import type {
  DecisionEntry, GateGrant, GateId, ProjectRecordV1, ProjectStatus,
} from "./model";

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  "idea-captured": "Idea captured",
  "interpretation-ready": "Interpretation ready",
  "scope-awaiting-approval": "Scope awaiting approval",
  "scope-approved": "Scope approved",
  "build-pack-ready": "Build Pack ready",
  "implementation-in-progress": "Implementation in progress",
  "checks-running": "Automated checks running",
  "build-failed": "Build failed",
  "prototype-working": "Prototype working",
  "deployment-pending": "Deployment pending",
  "verified-live": "Verified live",
  "improvement-proposed": "Improvement proposed",
  paused: "Paused",
  rejected: "Rejected",
};

/** The main line, for the progress strip. Paused/rejected sit outside it. */
export const STATUS_ORDER: ProjectStatus[] = [
  "idea-captured", "interpretation-ready", "scope-awaiting-approval",
  "scope-approved", "build-pack-ready", "implementation-in-progress",
  "checks-running", "prototype-working", "deployment-pending",
  "verified-live", "improvement-proposed",
];

/** Which states a state may move to. Anything absent is refused. */
const TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  "idea-captured": ["interpretation-ready", "paused", "rejected"],
  "interpretation-ready": ["scope-awaiting-approval", "idea-captured", "paused", "rejected"],
  "scope-awaiting-approval": ["scope-approved", "interpretation-ready", "paused", "rejected"],
  "scope-approved": ["build-pack-ready", "scope-awaiting-approval", "paused", "rejected"],
  "build-pack-ready": ["implementation-in-progress", "scope-awaiting-approval", "paused", "rejected"],
  "implementation-in-progress": ["checks-running", "build-failed", "prototype-working", "paused", "rejected"],
  "checks-running": ["build-failed", "prototype-working", "implementation-in-progress", "paused"],
  "build-failed": ["implementation-in-progress", "checks-running", "paused", "rejected"],
  "prototype-working": ["deployment-pending", "implementation-in-progress", "improvement-proposed", "paused", "rejected"],
  "deployment-pending": ["verified-live", "prototype-working", "build-failed", "paused"],
  "verified-live": ["improvement-proposed", "paused"],
  "improvement-proposed": ["scope-awaiting-approval", "implementation-in-progress", "verified-live", "paused", "rejected"],
  paused: ["idea-captured", "interpretation-ready", "scope-awaiting-approval", "scope-approved",
    "build-pack-ready", "implementation-in-progress", "prototype-working", "deployment-pending",
    "verified-live", "improvement-proposed", "rejected"],
  rejected: ["idea-captured"],
};

/** Entering these states requires this gate to have been granted. */
const STATE_GATE: Partial<Record<ProjectStatus, GateId>> = {
  "scope-approved": "scope-approval",
  "build-pack-ready": "scope-approval",
  "implementation-in-progress": "scope-approval",
};

export const hasGate = (p: ProjectRecordV1, gateId: GateId): boolean =>
  p.gates.some((g) => g.gateId === gateId);

/** Raw transition targets from the current state (before gate checks). */
export function allowedTargets(p: ProjectRecordV1): ProjectStatus[] {
  return TRANSITIONS[p.status];
}

export function canTransition(p: ProjectRecordV1, to: ProjectStatus): { ok: boolean; why?: string } {
  if (!TRANSITIONS[p.status].includes(to)) {
    return { ok: false, why: `A project can't move from "${STATUS_LABEL[p.status]}" to "${STATUS_LABEL[to]}".` };
  }
  const gate = STATE_GATE[to];
  if (gate && !hasGate(p, gate)) {
    return { ok: false, why: `Needs the owner first: ${gateLabel(gate)}.` };
  }
  if (to === "verified-live" && !canClaimVerifiedLive(p.evidence)) {
    return {
      ok: false,
      why: "“Verified live” needs a passing production check in the evidence ledger — a deploy alone isn't proof.",
    };
  }
  return { ok: true };
}

function gateLabel(g: GateId): string {
  return g === "scope-approval" ? "approve the version-one scope" : `approve: ${g.replace(/-/g, " ")}`;
}

const now = () => new Date().toISOString();
const decId = () => `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** The only way to change status. Refusals return the project unchanged. */
export function advance(
  p: ProjectRecordV1,
  to: ProjectStatus,
  note?: string,
): { project: ProjectRecordV1; ok: boolean; why?: string } {
  const check = canTransition(p, to);
  if (!check.ok) return { project: p, ok: false, why: check.why };
  return {
    ok: true,
    project: {
      ...p,
      status: to,
      statusHistory: [...p.statusHistory, { status: to, at: now(), note }],
      updatedAt: now(),
    },
  };
}

/**
 * The owner approves the version-one scope. This is the one gate the UI
 * grants directly; it freezes the report and brief (regeneration stops).
 */
export function approveScope(p: ProjectRecordV1, note?: string): ProjectRecordV1 {
  if (hasGate(p, "scope-approval")) return p;
  const grant: GateGrant = { gateId: "scope-approval", grantedAt: now(), note };
  const decision: DecisionEntry = {
    id: decId(), at: now(), by: "owner",
    decision: "Approved the version-one scope.", note,
  };
  const approved: ProjectRecordV1 = {
    ...p,
    gates: [...p.gates, grant],
    decisions: [...p.decisions, decision],
    scopeApprovedAt: now(),
    updatedAt: now(),
  };
  const moved = advance(approved, "scope-approved", "Owner approved the scope.");
  return moved.ok ? moved.project : approved;
}

/** Record an owner decision without a status change. */
export function recordDecision(
  p: ProjectRecordV1,
  by: "owner" | "system",
  decision: string,
  note?: string,
): ProjectRecordV1 {
  return {
    ...p,
    decisions: [...p.decisions, { id: decId(), at: now(), by, decision, note }],
    updatedAt: now(),
  };
}

/* ── The one next action ──────────────────────────────────────────────── */

export interface NextAction {
  label: string;
  /** Who moves next — keeps "waiting on the owner" honest. */
  who: "owner" | "builder" | "system";
}

export function nextAction(p: ProjectRecordV1): NextAction {
  if (p.blocker) return { label: `Clear the blocker: ${p.blocker}`, who: "owner" };
  switch (p.status) {
    case "idea-captured":
      return { label: "Run interpretation — turn the rough idea into a labelled reading.", who: "system" };
    case "interpretation-ready":
      return { label: "Read the interpretation, correct anything wrong, then send the scope for approval.", who: "owner" };
    case "scope-awaiting-approval":
      return p.report.clarifying.length
        ? { label: `Answer the open question (“${p.report.clarifying[0].question}”) or approve the scope with the labelled assumption.`, who: "owner" }
        : { label: "Approve the version-one scope, or edit the idea and re-interpret.", who: "owner" };
    case "scope-approved":
      return { label: "Generate the Build Pack and the builder assignment.", who: "system" };
    case "build-pack-ready":
      return { label: "Hand the builder assignment to Claude (or another builder) and mark implementation started.", who: "owner" };
    case "implementation-in-progress":
      return { label: "When the builder reports back, record its evidence, then run the checks.", who: "builder" };
    case "checks-running":
      return { label: "Record each check's result in the evidence ledger — pass or fail, exactly as it ran.", who: "system" };
    case "build-failed":
      return { label: "Read the failing evidence, decide: fix, narrow the scope, or pause.", who: "owner" };
    case "prototype-working":
      return { label: "Decide whether to deploy. Deployment is an owner call, never automatic.", who: "owner" };
    case "deployment-pending":
      return { label: "Add a passing production check to the evidence ledger, then mark it verified live.", who: "owner" };
    case "verified-live":
      return { label: "Nothing owed. Propose an improvement when one is worth its cost.", who: "owner" };
    case "improvement-proposed":
      return { label: "Approve the improvement's scope, or send it back to verified live.", who: "owner" };
    case "paused":
      return { label: "Resume when ready — everything is saved exactly where it stopped.", who: "owner" };
    case "rejected":
      return { label: "Closed. Start over from the idea if it comes back.", who: "owner" };
  }
}
