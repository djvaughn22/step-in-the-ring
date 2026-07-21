// The interpretation report — the planner's reading of an idea, sorted into
// labelled bins a person can audit at a glance:
//
//   USER SAID · SYSTEM INTERPRETED · ASSUMED · MISSING · RECOMMENDED ·
//   VERSION ONE · DEFERRED
//
// Everything here is REARRANGED from the deterministic interpretation in
// app/planner/interpret.ts and the derived creation view — nothing is
// invented, and nothing is merely concatenated: each statement lands in the
// bin that matches how we know it. Stated exclusions are non-goals; inferred
// exclusions are deferrals; an inferred audience is an interpretation with
// its basis attached, never presented as the person's own words.

import type { CreationView } from "../creation/record";
import { SOFTWARE_VERDICT_LABEL } from "../creation/types";
import type { InterpretationReport } from "./model";

const clip = (s: string, n = 240) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function buildReport(view: CreationView): InterpretationReport {
  const i = view.interpretation;
  const r = view.record;

  /* USER SAID — verbatim ground truth, never paraphrased. */
  const userSaid: string[] = [
    `“${clip(r.originalIdea)}”`,
    ...Object.entries(r.answers)
      .filter(([, v]) => v.trim())
      .map(([, v]) => `“${clip(v)}”`),
    ...r.requirements.map((q) => `Required: ${q}`),
    ...r.constraints.map((c) => `Constraint: ${c}`),
  ];

  /* SYSTEM INTERPRETED — our reading, each line with its basis. */
  const systemInterpreted: { text: string; basis: string }[] = [
    { text: `What this is: ${i.summary}`, basis: "read from the idea itself" },
    { text: `Kind of creation: ${view.creationType}`, basis: view.typeReason },
    {
      text: SOFTWARE_VERDICT_LABEL[view.software.verdict],
      basis: view.software.reason,
    },
  ];
  const inferredClaims: { label: string; value?: string; source?: string }[] = [
    { label: "Working title", value: i.title.confidence !== "stated" ? i.title.value : undefined, source: i.title.source },
    { label: "Who it's for", value: i.audience && i.audience.confidence !== "stated" ? i.audience.value : undefined, source: i.audience?.source },
    { label: "The problem", value: i.need && i.need.confidence !== "stated" ? i.need.value : undefined, source: i.need?.source },
    { label: "Success looks like", value: i.desiredResult && i.desiredResult.confidence !== "stated" ? i.desiredResult.value : undefined, source: i.desiredResult?.source },
    { label: "Where it lives", value: i.destination && i.destination.confidence !== "stated" ? i.destination.value : undefined, source: i.destination?.source },
  ];
  for (const c of inferredClaims) {
    if (c.value) systemInterpreted.push({ text: `${c.label}: ${c.value}`, basis: c.source ?? "inferred from their words" });
  }

  /* ASSUMED — labelled, smallest-safe assumptions, all correctable. */
  const assumed = [...new Set([...i.assumptions, ...view.assumptions])];

  /* MISSING — what we genuinely don't have. Only material gaps become
     clarifying questions; the rest are covered by a labelled assumption. */
  const missing = i.openQuestions.map((q) => q.question);
  const clarifying = i.openQuestions.map((q) => ({ question: q.question, why: q.help }));

  /* RECOMMENDED — clearly ours. */
  const recommended: string[] = [
    ...view.recommendations,
    `Tools for version one: ${view.tools.stack} (${view.tools.why})`,
  ];

  /* VERSION ONE — the cut that ships first. */
  const versionOne: string[] = [
    view.versionOnePromise,
    ...i.versionOne.map((c) => c.value),
  ].filter((v, idx, arr) => v.trim() && arr.indexOf(v) === idx);

  /* DEFERRED — inferred version-two temptations, parked with a reason.
     (Stated exclusions are the person's own non-goals — those stay in
     USER SAID via the brief's non-goals, not here.) */
  const deferred = i.exclusions
    .filter((c) => c.confidence !== "stated")
    .map((c) => (c.source ? `${c.value} — ${c.source}` : c.value));

  return {
    userSaid,
    systemInterpreted,
    assumed,
    missing,
    recommended,
    versionOne,
    deferred,
    clarifying,
  };
}
