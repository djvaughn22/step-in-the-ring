// Build Pack export and builder handoff.
//
// Five artifacts, all generated from the project record, never hand-typed:
//   1. A readable Markdown Build Pack.
//   2. Machine-readable JSON (versioned; re-importable).
//   3. A Claude builder assignment — generated ONLY from an approved scope.
//   4. A test-and-verification assignment.
//   5. A concise owner approval summary.
//
// The builder assignment is never a generic "build me an app" prompt: it
// carries the repository boundary, the approved scope, non-goals, acceptance
// criteria, required evidence, risk gates, dirty-work protection, deployment
// restrictions, and exact final-report requirements.

import { viewOf } from "../creation/record";
import { claimLevel, CLAIM_LEVEL_LABEL, EVIDENCE_RESULT_LABEL } from "./evidence";
import { hasGate, nextAction, STATUS_LABEL } from "./lifecycle";
import {
  GATE_LABEL, PROJECT_SCHEMA_VERSION,
  type GateId, type GroundedItem, type OutputEntry, type OutputKind, type ProjectRecordV1,
} from "./model";

const GROUNDING_TAG: Record<GroundedItem["grounding"], string> = {
  "user-said": "they said",
  interpreted: "we read",
  assumed: "assumed",
  recommended: "suggested",
};

const g = (item: GroundedItem) =>
  `${item.text} _(${GROUNDING_TAG[item.grounding]}${item.basis ? ` — ${item.basis}` : ""})_`;

const section = (title: string, lines: string[]): string =>
  lines.length ? `## ${title}\n${lines.join("\n")}` : "";

const bullets = (items: string[]) => items.filter(Boolean).map((s) => `- ${s}`);

/* ── 1. Markdown Build Pack ───────────────────────────────────────────── */

export function buildPackMarkdown(p: ProjectRecordV1): string {
  const b = p.brief;
  const r = p.report;
  const parts: string[] = [
    `# Build Pack — ${p.name}`,
    `Status: **${STATUS_LABEL[p.status]}** · Schema v${p.schemaVersion} · Updated ${p.updatedAt.slice(0, 10)}`,
    p.scopeApprovedAt
      ? `Scope approved ${p.scopeApprovedAt.slice(0, 10)}. This pack reflects the approved scope.`
      : `**Scope not yet approved.** This pack is a draft — do not hand it to a builder yet.`,

    section("Their words", r.userSaid.length ? bullets(r.userSaid) : []),
    section("What we read into it (with the basis)", bullets(r.systemInterpreted.map((x) => `${x.text} — _${x.basis}_`))),
    section("Assumed (labelled, correctable)", bullets(r.assumed)),
    section("Still missing", bullets(r.missing)),
    section("Recommended (ours, not theirs)", bullets(r.recommended)),

    section("Who it's for", b.intendedUser ? [g(b.intendedUser)] : []),
    section("The problem", b.problem ? [g(b.problem)] : []),
    section("Success looks like", b.desiredOutcome ? [g(b.desiredOutcome)] : []),
    section("Version-one scope", bullets(b.versionOneScope.map(g))),
    section("Non-goals — building these is a scope violation", bullets(b.nonGoals)),
    section("Deferred — parked, not forgotten", bullets(b.deferredIdeas)),
    section("User journey", bullets(b.userJourney)),
    section("Screens / experience states", bullets(b.screens)),
    section("Data and persistence", bullets(b.dataAndPersistence)),
    section("Integrations", bullets(b.integrations.length ? b.integrations : [])),
    section("Accessibility", bullets(b.accessibility)),
    section("Privacy and safety", bullets(b.privacyAndSafety)),
    section("Error, loading, and empty states", bullets(b.statesCovered)),
    section("Acceptance criteria", bullets(b.acceptanceCriteria)),
    section("Test checklist", bullets(b.testChecklist)),
    section("Deployment checklist", bullets(b.deploymentChecklist)),

    section("Evidence so far", p.evidence.length
      ? bullets(p.evidence.map((e) =>
          `[${EVIDENCE_RESULT_LABEL[e.result]}] ${e.claim} — ${e.ran || e.type} (${e.environment}, ${e.at.slice(0, 10)})`))
      : ["- Nothing proven yet. Every claim below the scope line is still a plan."]),
    section("Decisions", bullets(p.decisions.map((d) => `${d.at.slice(0, 10)} · ${d.by}: ${d.decision}`))),
    section("Current blocker", p.blocker ? [p.blocker] : []),
    section("One next action", [`${nextAction(p).label} _(waiting on: ${nextAction(p).who})_`]),
  ];
  return parts.filter(Boolean).join("\n\n").trim() + "\n";
}

/* ── 2. Machine-readable JSON ─────────────────────────────────────────── */

export interface BuildPackJsonV1 {
  v: 1;
  kind: "sitr-project-build-pack";
  generatedAt: string;
  schemaVersion: typeof PROJECT_SCHEMA_VERSION;
  project: ProjectRecordV1;
}

export function buildPackJson(p: ProjectRecordV1): string {
  const pack: BuildPackJsonV1 = {
    v: 1,
    kind: "sitr-project-build-pack",
    generatedAt: new Date().toISOString(),
    schemaVersion: PROJECT_SCHEMA_VERSION,
    project: p,
  };
  return JSON.stringify(pack, null, 2);
}

/* ── 3. The Claude builder assignment ─────────────────────────────────── */

/** Gates that are relevant warnings for any builder run. */
const RISK_GATES: GateId[] = [
  "destructive-action", "paid-service", "credential-change", "public-publishing",
  "marketplace-publication", "production-data", "external-integration",
  "cross-repository", "legal-financial-exposure",
];

export function builderAssignment(p: ProjectRecordV1): { ok: boolean; text?: string; why?: string } {
  if (!hasGate(p, "scope-approval")) {
    return {
      ok: false,
      why: "The version-one scope hasn't been approved. A builder assignment only exists for an approved scope — approve it (or correct the interpretation) first.",
    };
  }
  const b = p.brief;
  // Deterministic on the frozen words — the same destination the approved
  // brief was generated from.
  const dest = viewOf(p.creation).interpretation.destination?.value ?? null;

  const ungranted = RISK_GATES.filter((gate) => !hasGate(p, gate));
  const granted = RISK_GATES.filter((gate) => hasGate(p, gate));

  const text = [
    `# Builder assignment — ${p.name}`,
    `Generated from approved project ${p.projectId} (scope approved ${p.scopeApprovedAt?.slice(0, 10)}).`,

    `## Repository boundary`,
    [
      dest
        ? `Work only in the ${dest} repository. Do not inspect, edit, or deploy any other repository.`
        : "This is a standalone build. Do not assume access to any existing repository, and do not touch one without a new, explicit approval.",
      "Before editing: record the current branch, HEAD, and working-tree state. Preserve any unrelated dirty work — never reset, discard, or absorb it.",
    ].map((s) => `- ${s}`).join("\n"),

    `## Mission`,
    p.report.systemInterpreted[0]?.text ?? p.name,

    section("Approved version-one scope — build exactly this", bullets(b.versionOneScope.map((i) => i.text))),
    section("Non-goals — do not build these; if one looks necessary, stop and say why", bullets(b.nonGoals)),
    section("Acceptance criteria — 'done' means every one of these", bullets(b.acceptanceCriteria)),
    section("Tests required", bullets(b.testChecklist)),

    `## Evidence required`,
    [
      "For every acceptance criterion: what you ran, the exact result, pass or fail. No claim without its check.",
      "Distinguish plainly: generated vs working locally vs test-passing vs deployed vs verified in production. Never present a weaker level as a stronger one.",
      "If something is mocked, say MOCKED. A mocked response is evidence of the mock, not the integration.",
    ].map((s) => `- ${s}`).join("\n"),

    `## Risk gates — STOP and report instead of proceeding`,
    [
      ...ungranted.map((gate) => `NOT approved: ${GATE_LABEL[gate]}.`),
      ...granted.map((gate) => `Approved for this project on ${p.gates.find((x) => x.gateId === gate)?.grantedAt.slice(0, 10)}: ${GATE_LABEL[gate]}.`),
      "Anything requiring passwords, purchases, secrets, or production-data changes: stop, report the exact blocker and the smallest owner action, and continue with unrelated safe work.",
    ].map((s) => `- ${s}`).join("\n"),

    `## Deployment restrictions`,
    [
      "Do not deploy unless the deployment checklist below is part of the approved scope and the established workflow is documented.",
      ...bullets(b.deploymentChecklist).map((s) => s.slice(2)),
    ].map((s) => `- ${s}`).join("\n"),

    `## The brief`,
    b.builderInstructions,

    `## Final report — required, exactly this`,
    [
      "What you built, mapped to each scope line.",
      "What you assumed, and why.",
      "What you did NOT build (non-goals honoured, anything unfinished).",
      "Every check you ran with its real result — including failures.",
      "What is proven vs generated vs mocked vs still manual.",
      "Working-tree and commit state at the end.",
      "The one next action you recommend, and what evidence would resolve the biggest remaining uncertainty.",
    ].map((s) => `- ${s}`).join("\n"),
  ].filter(Boolean).join("\n\n").trim() + "\n";

  return { ok: true, text };
}

/* ── 4. Test-and-verification assignment ──────────────────────────────── */

export function testAssignment(p: ProjectRecordV1): string {
  const b = p.brief;
  return [
    `# Test & verification assignment — ${p.name}`,
    "Role: tester. You verify claims; you do not add features or fix scope. A failing check is a finding, not a defeat — report it exactly.",
    section("Claims to verify (the acceptance criteria)", bullets(b.acceptanceCriteria)),
    section("How to test", bullets(b.testChecklist)),
    section("Persistence claims", bullets([
      "“It saves” requires: save → reload → the data is still there. Record both steps.",
      "“It survives bad data” requires: corrupt the stored data by hand → the page still opens.",
    ])),
    section("For each check, record", bullets([
      "The claim being tested.",
      "What you ran (command, URL, or manual steps).",
      "The environment (local / preview / production).",
      "Pass, fail, or blocked — with a one-line safe summary.",
    ])),
    "Never mark a check passed unless it actually ran and passed. 'Should work' is not a result.",
  ].filter(Boolean).join("\n\n").trim() + "\n";
}

/* ── 5. Owner approval summary ────────────────────────────────────────── */

export function ownerSummary(p: ProjectRecordV1): string {
  const b = p.brief;
  const r = p.report;
  const level = claimLevel(p.evidence, "version one works");
  return [
    `# ${p.name} — owner summary`,
    `Where it stands: **${STATUS_LABEL[p.status]}**. Overall proof level: ${CLAIM_LEVEL_LABEL[level]}.`,
    section("You'd be approving", bullets(b.versionOneScope.map((i) => i.text))),
    section("Explicitly not included", bullets(b.nonGoals.length ? b.nonGoals : ["Nothing was explicitly excluded — worth a look before approving."])),
    section("Assumptions riding on this", bullets(r.assumed.length ? r.assumed : ["None — everything came from their words."])),
    section("Open questions", bullets(r.clarifying.map((q) => `${q.question} — ${q.why}`))),
    section("One next action", [nextAction(p).label]),
  ].filter(Boolean).join("\n\n").trim() + "\n";
}

/* ── Output registry ──────────────────────────────────────────────────── */

export function recordOutput(p: ProjectRecordV1, kind: OutputKind, label: string): ProjectRecordV1 {
  const entry: OutputEntry = {
    id: `o-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    kind,
    at: new Date().toISOString(),
    label,
  };
  return { ...p, outputs: [...p.outputs, entry], updatedAt: new Date().toISOString() };
}
