// The adapter contract — how an engine's creation becomes a canonical
// project, and the App Engine adapter that is its first implementation.
//
// The contract is deliberately small: an adapter turns a derived CreationView
// into a ProjectBrief. It never touches lifecycle, gates, or evidence — those
// belong to the project, not to any engine's opinion. Non-software adapters
// simply leave the software-only sections empty.

import { viewOf, type CreationView } from "../creation/record";
import { adapterForType } from "../creation/adapters";
import { DEFAULT_BUILDER_DEFAULTS } from "../creation/builder-defaults";
import { SOFTWARE_TYPES } from "../creation/classify";
import { WEB_FORM_LABEL } from "../creation/profile";
import { buildBuilderPrompt } from "../planner/builder-prompt";
import type { CreationRecordV1 } from "../creation/types";
import type { Interpretation } from "../planner/types";
import { buildReport } from "./report";
import {
  assumed, newProjectId, read, said, suggested,
  type GroundedItem, type ProjectBrief, type ProjectRecordV1,
} from "./model";

export interface EngineAdapterContract {
  adapterId: string;
  /** True when this adapter should handle the given view. */
  fits(view: CreationView): boolean;
  toBrief(view: CreationView): ProjectBrief;
}

/* ── helpers ──────────────────────────────────────────────────────────── */

const grounded = (c: { value: string; confidence: string; source?: string } | null): GroundedItem | null => {
  if (!c || !c.value.trim()) return null;
  if (c.confidence === "stated") return said(c.value);
  if (c.confidence === "confirm") return assumed(c.value, c.source ?? "needs confirmation");
  return read(c.value, c.source ?? "inferred from their words");
};

/* ── The App Engine adapter (reference implementation) ────────────────── */

export const appEngineAdapter: EngineAdapterContract = {
  adapterId: "app-engine",

  fits(view) {
    return SOFTWARE_TYPES.includes(view.creationType);
  },

  toBrief(view) {
    const i = view.interpretation;

    const versionOneScope: GroundedItem[] = [
      suggested(view.versionOnePromise, "the smallest version that proves the idea"),
      ...i.versionOne.map((c) => grounded(c)!).filter(Boolean),
    ];

    // The person's stated exclusions are non-goals; ours are deferrals.
    const nonGoals = i.exclusions.filter((c) => c.confidence === "stated").map((c) => c.value);
    const deferredIdeas = i.exclusions.filter((c) => c.confidence !== "stated").map((c) => c.value);

    const userJourney = [
      `They arrive with the need: ${view.problem ?? "the thing they came to do"}.`,
      ...i.versionOne.map((c) => `They can: ${c.value}`),
      `They leave with: ${view.smallestOutcome}`,
    ];

    const screens = view.profile.webForm
      ? [`Version one is ${WEB_FORM_LABEL[view.profile.webForm]} — start with one screen that does the whole job.`]
      : ["One screen that does the whole job. Split only when a real state demands it."];

    const acceptanceCriteria = [
      ...i.versionOne.map((c) => `${c.value} — works, on a phone and on a desktop.`),
      "Nothing on the non-goals list got built.",
      ...(i.preserve.length ? ["Everything on the do-not-break list still works."] : []),
      "Keyboard-only use works end to end; focus is always visible.",
    ];

    const repoWork = !!i.destination || i.permissions.build || i.permissions.commit || i.permissions.push;
    const builderInstructions = repoWork
      ? buildBuilderPrompt(i)
      : adapterForType(view.creationType).prompt(view, DEFAULT_BUILDER_DEFAULTS);

    return {
      intendedUser: view.primaryUser
        ? (grounded(i.audience) ?? read(view.primaryUser, "derived from who actually uses it"))
        : null,
      problem: grounded(i.need),
      desiredOutcome: grounded(i.desiredResult),
      versionOneScope,
      nonGoals,
      deferredIdeas,
      userJourney,
      screens,
      features: i.versionOne.map((c) => grounded(c)!).filter(Boolean),
      dataAndPersistence: [
        "Local-first: saved in the browser (localStorage) with versioned, safe-parsed records.",
        "Corrupt or missing saved data must never crash the page — parse defensively, fall back to empty.",
      ],
      integrations: [], // never invented; a real integration arrives as a stated requirement
      accessibility: [
        "Usable with mouse, touch, and keyboard alike.",
        "Visible focus on every control; real labels on every input.",
        "State changes announced to screen readers.",
        "Respects prefers-reduced-motion.",
      ],
      privacyAndSafety: [
        "No account, no personal data collected in version one.",
        ...view.safetyConstraints,
      ],
      statesCovered: [
        "Empty state: the first visit explains itself — never a blank screen.",
        "Loading state: anything async shows progress, never a frozen page.",
        "Error state: failures say what happened and what to do next.",
      ],
      acceptanceCriteria,
      testChecklist: [
        "Drive the real flow end to end yourself — not just a passing build.",
        "Phone width (~375px) and desktop width.",
        "Keyboard only, start to finish.",
        "Reload mid-flow: saved state survives.",
        "Corrupt the saved data by hand: the page still opens.",
      ],
      deploymentChecklist: [
        "Production build passes locally before any deploy.",
        "Deploy through the project's established workflow only.",
        "After deploy: load the live URL and confirm the new work is actually there.",
        "Record the production check in the evidence ledger.",
      ],
      builderInstructions,
    };
  },
};

const ADAPTERS: EngineAdapterContract[] = [appEngineAdapter];

/**
 * Fallback for creations no adapter claims (a poem, a practice plan). The
 * software-only sections stay empty — no software vocabulary is forced on.
 */
export const genericAdapter: EngineAdapterContract = {
  adapterId: "generic",
  fits: () => true,
  toBrief(view) {
    const i = view.interpretation;
    return {
      intendedUser: grounded(i.audience),
      problem: grounded(i.need),
      desiredOutcome: grounded(i.desiredResult),
      versionOneScope: [
        suggested(view.versionOnePromise, "the smallest version that proves the idea"),
        ...i.versionOne.map((c) => grounded(c)!).filter(Boolean),
      ],
      nonGoals: i.exclusions.filter((c) => c.confidence === "stated").map((c) => c.value),
      deferredIdeas: i.exclusions.filter((c) => c.confidence !== "stated").map((c) => c.value),
      userJourney: [],
      screens: [],
      features: [],
      dataAndPersistence: [],
      integrations: [],
      accessibility: [],
      privacyAndSafety: view.safetyConstraints,
      statesCovered: [],
      acceptanceCriteria: [`${view.smallestOutcome}`],
      testChecklist: view.software.nonSoftwareTest ? [view.software.nonSoftwareTest] : [],
      deploymentChecklist: [],
      builderInstructions: adapterForType(view.creationType).prompt(view, DEFAULT_BUILDER_DEFAULTS),
    };
  },
};

export function adapterForView(view: CreationView): EngineAdapterContract {
  return ADAPTERS.find((a) => a.fits(view)) ?? genericAdapter;
}

/* ── Creation → project ───────────────────────────────────────────────── */

const now = () => new Date().toISOString();

/**
 * Wrap a creation record into a new project. Interpretation runs once here;
 * pass `pre` when the caller already interpreted the same words.
 */
export function projectFromCreation(
  record: CreationRecordV1,
  pre?: Interpretation,
): ProjectRecordV1 {
  const view = viewOf(record, pre);
  const adapter = adapterForView(view);
  const report = buildReport(view);
  const at = now();
  return {
    schemaVersion: 1,
    projectId: newProjectId(),
    name: view.interpretation.title.value.slice(0, 80) || "Untitled project",
    createdAt: at,
    updatedAt: at,
    creation: record,
    report,
    brief: adapter.toBrief(view),
    adapterId: adapter.adapterId,
    status: "scope-awaiting-approval",
    statusHistory: [
      { status: "idea-captured", at, note: "Idea captured from the creator's own words." },
      { status: "interpretation-ready", at, note: "Deterministic interpretation generated." },
      { status: "scope-awaiting-approval", at, note: "Version-one scope drafted; waiting on the owner." },
    ],
    gates: [],
    decisions: [],
    evidence: [],
    outputs: [],
    blocker: null,
  };
}

/**
 * Re-run interpretation on an UNAPPROVED project (after the idea or answers
 * changed). Once the scope is approved the brief is frozen — regeneration
 * refuses, because approval applies to specific words.
 */
export function refreshProject(p: ProjectRecordV1): ProjectRecordV1 {
  if (p.scopeApprovedAt) return p;
  const view = viewOf(p.creation);
  const adapter = adapterForView(view);
  return {
    ...p,
    name: view.interpretation.title.value.slice(0, 80) || p.name,
    report: buildReport(view),
    brief: adapter.toBrief(view),
    adapterId: adapter.adapterId,
    updatedAt: now(),
  };
}
