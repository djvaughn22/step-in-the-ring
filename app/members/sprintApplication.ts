// ─────────────────────────────────────────────────────────────────────────────
// Five Hour Sprint (paid service) applications — the lead-capture flow for
// the flagship commercial offer. Mirrors app/members/feedback.ts, with two
// differences that matter:
//
//   - There is no signed-in acting user. Anyone can apply without an
//     account, so validation happens on the submitted fields alone.
//   - Marketing consent is a separate, explicit field that is never
//     defaulted true. A missing or falsy value in the request body means
//     "no", never "yes".
//
// Submitting does NOT create a checkout or a member account — there is no
// live billing yet. This only records a lead the owner reviews by hand from
// /owner/sprint-applications.
// ─────────────────────────────────────────────────────────────────────────────

import { randomUUID } from "node:crypto";
import type {
  MemberStore,
  SprintApplicationRecord,
  SprintApplicationStatus,
  SprintTeamSize,
  SprintTiming,
} from "./store";

export const MAX_NAME_LENGTH = 200;
export const MAX_EMAIL_LENGTH = 320;
export const MAX_FIELD_LENGTH = 2000;

const TIMINGS: SprintTiming[] = ["asap", "this-month", "exploring"];
const TEAM_SIZES: SprintTeamSize[] = ["individual", "team"];

// Deliberately simple: catches obvious typos without rejecting a real
// address a stricter pattern would choke on.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SprintApplicationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; status: number };

const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g;

function sanitizeText(raw: unknown, max: number): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.replace(CONTROL_CHARS, "").trim();
  if (!value || value.length > max) return null;
  return value;
}

function sanitizeEmail(raw: unknown): string | null {
  const value = sanitizeText(raw, MAX_EMAIL_LENGTH);
  if (!value) return null;
  const lower = value.toLowerCase();
  return EMAIL_SHAPE.test(lower) ? lower : null;
}

export interface SprintApplicationInput {
  name: unknown;
  email: unknown;
  whatToFinish: unknown;
  successLooksLike: unknown;
  timing: unknown;
  teamSize: unknown;
  marketingConsent: unknown;
}

export async function createSprintApplication(
  store: MemberStore,
  input: SprintApplicationInput,
  now: Date = new Date(),
): Promise<SprintApplicationResult<SprintApplicationRecord>> {
  const name = sanitizeText(input.name, MAX_NAME_LENGTH);
  if (!name) return { ok: false, error: "Enter your name.", status: 422 };

  const email = sanitizeEmail(input.email);
  if (!email) return { ok: false, error: "Enter a valid email.", status: 422 };

  const whatToFinish = sanitizeText(input.whatToFinish, MAX_FIELD_LENGTH);
  if (!whatToFinish) return { ok: false, error: "Say what you want to finish.", status: 422 };

  const successLooksLike = sanitizeText(input.successLooksLike, MAX_FIELD_LENGTH);
  if (!successLooksLike) return { ok: false, error: "Say what success looks like.", status: 422 };

  const timing = TIMINGS.includes(input.timing as SprintTiming) ? (input.timing as SprintTiming) : null;
  if (!timing) return { ok: false, error: "Choose when you want this to happen.", status: 422 };

  const teamSize = TEAM_SIZES.includes(input.teamSize as SprintTeamSize)
    ? (input.teamSize as SprintTeamSize)
    : null;
  if (!teamSize) return { ok: false, error: "Say whether this is for you or a team.", status: 422 };

  // Explicit opt-in only. Anything other than a literal boolean true is "no".
  const marketingConsent = input.marketingConsent === true;

  const record: SprintApplicationRecord = {
    id: randomUUID(),
    name,
    email,
    whatToFinish,
    successLooksLike,
    timing,
    teamSize,
    marketingConsent,
    status: "new",
    createdAt: now.toISOString(),
  };
  await store.createSprintApplication(record);
  return { ok: true, value: record };
}

/** Owner-only: every application, newest first. */
export async function listSprintApplications(store: MemberStore): Promise<SprintApplicationRecord[]> {
  return store.listSprintApplications();
}

/** Owner-only: mark an application reviewed (or back to new). */
export async function markSprintApplicationStatus(
  store: MemberStore,
  id: string,
  status: SprintApplicationStatus,
): Promise<void> {
  await store.updateSprintApplicationStatus(id, status);
}

// ── Rate limiting ────────────────────────────────────────────────────────────
// Public, unauthenticated endpoint — a small in-memory throttle keyed by
// client address, same shape as app/preview/previewAuth.ts. Best effort only:
// resets on cold start and is not shared between serverless instances, but
// still slows a script down more than having nothing at all.

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

const attempts = new Map<string, { count: number; windowStart: number }>();

export function sprintApplicationRateLimited(rateKey: string, now: number = Date.now()): boolean {
  const record = attempts.get(rateKey);
  if (record && now - record.windowStart < RATE_LIMIT_WINDOW_MS) {
    if (record.count >= RATE_LIMIT_MAX_ATTEMPTS) return true;
    record.count += 1;
    return false;
  }
  attempts.set(rateKey, { count: 1, windowStart: now });
  return false;
}

/** Exported for tests only — clears the in-memory throttle. */
export function __resetSprintApplicationRateLimit(): void {
  attempts.clear();
}
