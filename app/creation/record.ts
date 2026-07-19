// Build, view, persist and move creation records.
//
// A record is INPUT — the creator's words, answers, facts and limits.
// `viewOf()` derives everything else (classification, interpretation,
// software call, recommendation inputs) deterministically, so the same
// record read by two engines yields the same understanding.

import { interpret, type PlannerInput } from "../planner/interpret";
import type { Interpretation } from "../planner/types";
import {
  assessSoftware, classifyCreationType, deriveSafetyConstraints,
  deriveSmallestOutcome, deriveVersionOnePromise, findCaretaker,
} from "./classify";
import {
  CREATION_SCHEMA_VERSION, parseCreationRecord,
  type CreationRecordV1, type CreationType, type HandoffPayloadV1,
  type SoftwareCall, type SourceFlow,
} from "./types";

const newId = () => `cr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const now = () => new Date().toISOString();

/* ── CONSTRUCTION ──────────────────────────────────────────────────────── */

export function newRecord(
  originalIdea: string,
  opts: Partial<Pick<CreationRecordV1, "source" | "sourceFlow" | "originalTitle" | "answers" | "facts" | "exclusions" | "requirements" | "constraints" | "engineId">> = {},
): CreationRecordV1 {
  return {
    schemaVersion: CREATION_SCHEMA_VERSION,
    creationId: newId(),
    createdAt: now(),
    updatedAt: now(),
    source: opts.source ?? "stepinthering",
    sourceFlow: opts.sourceFlow ?? "planner",
    originalIdea: originalIdea.trim().slice(0, 4000),
    originalTitle: opts.originalTitle,
    answers: { ...(opts.answers ?? {}) },
    facts: { ...(opts.facts ?? {}) },
    requirements: [...(opts.requirements ?? [])],
    exclusions: [...(opts.exclusions ?? [])],
    constraints: [...(opts.constraints ?? [])],
    engineId: opts.engineId,
    journey: opts.engineId ? [{ engineId: opts.engineId, at: now(), why: "started here" }] : [],
  };
}

/** A validated cross-domain handoff becomes a first-class record. */
export function recordFromHandoff(p: HandoffPayloadV1): CreationRecordV1 {
  const flow: SourceFlow = p.flow;
  return newRecord(p.idea, {
    source: "idontcry",
    sourceFlow: flow,
    originalTitle: p.title,
    facts: { ...(p.facts ?? {}), ...(p.typeHint ? { typeHint: p.typeHint } : {}) },
    exclusions: p.exclusions ?? [],
    engineId: p.engineHint,
  });
}

/** Engine-room intake (no planner pass) still gets a real record. */
export function recordFromEngineIntake(
  engineId: string,
  answers: Record<string, string>,
): CreationRecordV1 {
  // The free-text idea lives under different keys per engine.
  const idea =
    answers.rough || answers.purpose || answers.idea || answers.symptom ||
    answers.outcome || answers.what || answers.product || answers.name || "";
  return newRecord(idea, {
    sourceFlow: "engine-room",
    originalTitle: answers.name || undefined,
    answers,
    engineId,
  });
}

/* ── MUTATION (always through these — they bump updatedAt) ─────────────── */

export function withAnswers(r: CreationRecordV1, answers: Record<string, string>): CreationRecordV1 {
  const merged = { ...r.answers };
  for (const [k, v] of Object.entries(answers)) {
    if (v && v.trim()) merged[k] = v.trim();
  }
  return { ...r, answers: merged, updatedAt: now() };
}

/** Moving to another engine keeps the whole record and logs the move. */
export function moveToEngine(r: CreationRecordV1, engineId: string, why: string): CreationRecordV1 {
  if (r.engineId === engineId) return r;
  return {
    ...r,
    engineId,
    journey: [...r.journey, { engineId, at: now(), why }],
    updatedAt: now(),
  };
}

/* ── THE DERIVED VIEW ──────────────────────────────────────────────────── */

export interface CreationView {
  record: CreationRecordV1;
  /** The planner's full interpretation of the same words. */
  interpretation: Interpretation;
  creationType: CreationType;
  typeReason: string;
  /** The person who will actually use it (caretaker-aware). */
  primaryUser: string | null;
  /** Who it serves when that's a different person/being than the user. */
  beneficiary: string | null;
  problem: string | null;
  smallestOutcome: string;
  versionOnePromise: string;
  software: SoftwareCall;
  safetyConstraints: string[];
  /** Cleanly separated: what they said / what we assumed / what we suggest. */
  facts: string[];
  assumptions: string[];
  recommendations: string[];
}

/** Facts a handoff carried in, phrased for humans. */
function handoffFacts(r: CreationRecordV1): string[] {
  const label: Record<string, string> = {
    mode: "Started as", vibe: "Vibe", productType: "Product type", audience: "Audience",
    player: "The player", goal: "The player's goal", theme: "Theme", spark: "The spark",
  };
  return Object.entries(r.facts)
    .filter(([k]) => k !== "typeHint")
    .map(([k, v]) => `${label[k] ?? k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`);
}

export function viewOf(record: CreationRecordV1): CreationView {
  const input: PlannerInput = { description: record.originalIdea, answers: record.answers };
  const i = interpret(input);
  const fullText = [record.originalIdea, ...Object.values(record.answers), ...Object.values(record.facts)].join(". ");

  const typeHint = record.facts.typeHint as CreationType | undefined;
  const classified = classifyCreationType(fullText, i.shape);
  // A handoff's own declaration outranks our guess — the source flow knew
  // what it was making (a Game Lab game IS a game).
  const creationType = typeHint ?? classified.type;
  const typeReason = typeHint
    ? `it arrived from ${record.sourceFlow === "game-lab" ? "the Game Lab" : record.sourceFlow === "dream-shop" ? "the Dream Shop" : "iDontCry"} as ${typeHint === "game" ? "a game" : typeHint}`
    : classified.reason;

  const caretaker = findCaretaker(fullText);
  const software = assessSoftware(creationType, i, fullText, caretaker);

  const primaryUser = caretaker
    ? `The person looking after the ${caretaker.dependent} — often busy, short on attention, needing a fast answer`
    : i.audience?.value ?? null;

  const facts: string[] = [
    `Their words: “${record.originalIdea.slice(0, 200)}${record.originalIdea.length > 200 ? "…" : ""}”`,
    ...i.versionOne.filter((c) => c.confidence === "stated").map((c) => `Stated: ${c.value}`),
    ...record.requirements.map((rq) => `Required: ${rq}`),
    ...record.exclusions.map((x) => `Excluded by them: ${x}`),
    ...record.constraints.map((c) => `Constraint: ${c}`),
    ...handoffFacts(record),
  ];
  const assumptions: string[] = [
    ...i.assumptions,
    ...(caretaker
      ? [`The real user is the caretaker, not the ${caretaker.dependent} — the ${caretaker.dependent} benefits, the caretaker decides.`]
      : []),
    ...(primaryUser && !caretaker && i.audience && i.audience.confidence !== "stated"
      ? [] // already covered by planner assumptions
      : []),
  ];
  const recommendations: string[] = [];
  if (software.nonSoftwareTest) {
    recommendations.push(`Smallest non-software test: ${software.nonSoftwareTest}`);
  }
  if (software.explicitSoftwareRequest && (software.verdict === "optional" || software.verdict === "test-first")) {
    recommendations.push("You asked for software, so software is what gets planned — the non-software test above is the cheaper first proof if you want it.");
  }

  return {
    record,
    interpretation: i,
    creationType,
    typeReason,
    primaryUser,
    beneficiary: caretaker ? `the ${caretaker.dependent}` : null,
    problem: i.need?.value ?? null,
    smallestOutcome: deriveSmallestOutcome(creationType, i, caretaker),
    versionOnePromise: deriveVersionOnePromise(creationType, i, caretaker, fullText),
    software,
    safetyConstraints: deriveSafetyConstraints(fullText, caretaker),
    facts,
    assumptions,
    recommendations,
  };
}

/* ── PERSISTENCE (the current creation — resume across visits) ─────────── */

const CURRENT_KEY = "sitr-creation-current-v1";

export function saveCurrentCreation(r: CreationRecordV1): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CURRENT_KEY, JSON.stringify(r));
  } catch {}
}

export function loadCurrentCreation(): CreationRecordV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CURRENT_KEY);
    return raw ? parseCreationRecord(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function clearCurrentCreation(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CURRENT_KEY);
  } catch {}
}
