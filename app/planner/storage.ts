// Saved plans, and the migration from the seven-question era.
//
// MIGRATION (v2 → v3), one-way, non-destructive:
//   v2 ("sitr-v2") stored an array of raw seven-question forms:
//     { ideaName, whoIsItFor, problem, win, firstVersion, smallestUseful,
//       avoid, savedAt }
//   v3 ("sitr-plans-v3") stores the person's own words plus any follow-up
//   answers, and re-interprets them on open. So a v2 record becomes a v3
//   record by stitching its fields back into the sentences someone would have
//   said in the first place.
//
//   The v2 key is READ, never deleted — if this migration is ever wrong, the
//   originals are still sitting there. Every v2 field is also kept verbatim on
//   `legacy`, so nothing a person typed is ever lost.

import type { PlannerInput } from "./interpret";

const V2_KEY = "sitr-v2";
const V3_KEY = "sitr-plans-v3";
const LIMIT = 30;

type LegacyForm = {
  ideaName?: string;
  whoIsItFor?: string;
  problem?: string;
  win?: string;
  firstVersion?: string;
  smallestUseful?: string;
  avoid?: string;
  savedAt?: string;
};

export type SavedPlan = {
  id: string;
  version: 3;
  savedAt: string;
  title: string;
  /** Exactly what the person typed. The plan is always rebuilt from this. */
  description: string;
  answers: Record<string, string>;
  /** Present only on records carried over from the seven-question era. */
  legacy?: LegacyForm;
};

const isBrowser = () => typeof window !== "undefined";

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Rebuild what a person would have said out loud from seven separate boxes.
 *
 * Each v2 field goes where its MEANING belongs, not into one run-on blob:
 * the audience and the version-one list were already answers to questions, so
 * they migrate as answers. Only the idea, the problem and the win read as
 * description. Writing labels like "The problem:" into the description would
 * make the interpreter parse the label itself as a feature — which is exactly
 * the bug the old planner had.
 */
const strip = (s?: string) => (s ?? "").trim().replace(/\.?$/, "");

export function migrateLegacy(form: LegacyForm): SavedPlan | null {
  const idea = strip(form.ideaName);
  if (!idea) return null;

  const described: string[] = [`${idea}.`];
  if (form.problem?.trim()) described.push(`Right now, ${lowerFirst(strip(form.problem))}.`);
  if (form.win?.trim()) described.push(`It works when ${lowerFirst(strip(form.win))}.`);
  if (form.avoid?.trim()) described.push(`Don't build ${lowerFirst(strip(form.avoid))}.`);

  const answers: Record<string, string> = {};
  if (form.whoIsItFor?.trim()) answers.audience = strip(form.whoIsItFor);
  const v1 = [strip(form.firstVersion), strip(form.smallestUseful)].filter(Boolean).join(". ");
  if (v1) answers.versionOne = `${v1}.`;

  return {
    id: newId(),
    version: 3,
    savedAt: form.savedAt || new Date().toISOString(),
    title: idea.slice(0, 60),
    description: described.join(" "),
    answers,
    legacy: { ...form },
  };
}

function lowerFirst(s: string): string {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

function readLegacy(): SavedPlan[] {
  try {
    const raw = window.localStorage.getItem(V2_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((f): f is LegacyForm => !!f && typeof f === "object")
      .map(migrateLegacy)
      .filter((p): p is SavedPlan => p !== null);
  } catch {
    return [];
  }
}

/** Anything malformed is skipped rather than allowed to crash the page. */
function readV3(): SavedPlan[] {
  try {
    const raw = window.localStorage.getItem(V3_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    const list = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as { plans?: unknown }).plans)
        ? (parsed as { plans: unknown[] }).plans
        : [];
    return list.filter(isSavedPlan);
  } catch {
    return [];
  }
}

function isSavedPlan(v: unknown): v is SavedPlan {
  if (!v || typeof v !== "object") return false;
  const p = v as Partial<SavedPlan>;
  return typeof p.id === "string" && typeof p.description === "string" && p.description.trim().length > 0;
}

export function loadPlans(): SavedPlan[] {
  if (!isBrowser()) return [];
  const v3 = readV3();
  const migrated = readLegacy().filter((old) => !v3.some((p) => p.description === old.description));
  const all = [...v3, ...migrated].sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
  // Write the migrated records forward once so the work isn't redone each load.
  if (migrated.length) writePlans(all);
  return all;
}

function writePlans(plans: SavedPlan[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(V3_KEY, JSON.stringify({ version: 3, plans: plans.slice(0, LIMIT) }));
  } catch {}
}

export function savePlan(input: PlannerInput, title: string): SavedPlan[] {
  const plans = loadPlans();
  const description = (input.description ?? "").trim();
  if (!description) return plans;

  const record: SavedPlan = {
    id: newId(),
    version: 3,
    savedAt: new Date().toISOString(),
    title: title.slice(0, 60),
    description,
    answers: input.answers ?? {},
  };
  // Re-saving the same idea updates it instead of stacking duplicates.
  const rest = plans.filter((p) => p.description !== description);
  const next = [record, ...rest];
  writePlans(next);
  return next.slice(0, LIMIT);
}

export function deletePlan(id: string): SavedPlan[] {
  const next = loadPlans().filter((p) => p.id !== id);
  writePlans(next);
  return next;
}
