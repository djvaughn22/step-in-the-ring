// ─────────────────────────────────────────────────────────────────────────────
// Structured tester feedback (2026-08-06 beta reset) — journey step 7:
// "give structured tester feedback." A small, honest loop: any signed-in
// account can leave a categorized note about what they hit; the owner
// triages it from a private panel. No public voting, no ratings, no reply
// thread — the smallest useful version.
//
// Authorization rules (mirrors app/members/projects.ts):
//   - The acting user id comes from the verified server session — NEVER
//     from the request body.
//   - Submitting feedback does NOT require live member access — a lapsed
//     or free account can still report a problem.
//   - Listing and triaging feedback is owner-only.
// ─────────────────────────────────────────────────────────────────────────────

import { randomUUID } from "node:crypto";
import type { FeedbackCategory, FeedbackRecord, FeedbackStatus, MemberStore } from "./store";

export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_CONTEXT_URL_LENGTH = 200;
export const MAX_FEEDBACK_PER_USER = 100;

const CATEGORIES: FeedbackCategory[] = ["bug", "confusing", "idea", "other"];

export type FeedbackResult<T> = { ok: true; value: T } | { ok: false; error: string; status: number };

// Strip control characters but keep \n (\x0A) and \t (\x09) — feedback is
// often multi-line.
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g;

function sanitizeMessage(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const message = raw.replace(CONTROL_CHARS, "").trim();
  if (!message || message.length > MAX_MESSAGE_LENGTH) return null;
  return message;
}

function sanitizeContextUrl(raw: unknown): string {
  if (typeof raw !== "string") return "";
  // Path + query only, never a full external URL a client could forge.
  const trimmed = raw.trim().slice(0, MAX_CONTEXT_URL_LENGTH);
  return trimmed.startsWith("/") ? trimmed : "";
}

export async function createFeedback(
  store: MemberStore,
  actingUserId: string,
  input: { category: unknown; message: unknown; contextUrl: unknown },
  now: Date = new Date(),
): Promise<FeedbackResult<FeedbackRecord>> {
  const category = CATEGORIES.includes(input.category as FeedbackCategory)
    ? (input.category as FeedbackCategory)
    : null;
  if (!category) return { ok: false, error: "Choose a feedback category.", status: 422 };
  const message = sanitizeMessage(input.message);
  if (!message) return { ok: false, error: `Feedback must be 1-${MAX_MESSAGE_LENGTH} characters.`, status: 422 };

  const existing = await store.listFeedback();
  const mine = existing.filter((f) => f.userId === actingUserId);
  if (mine.length >= MAX_FEEDBACK_PER_USER) {
    return { ok: false, error: "Feedback limit reached for this account.", status: 409 };
  }

  const record: FeedbackRecord = {
    id: randomUUID(),
    userId: actingUserId,
    category,
    message,
    contextUrl: sanitizeContextUrl(input.contextUrl),
    status: "new",
    createdAt: now.toISOString(),
  };
  await store.createFeedback(record);
  return { ok: true, value: record };
}

/** Owner-only: every submission, newest first. */
export async function listAllFeedback(store: MemberStore): Promise<FeedbackRecord[]> {
  return store.listFeedback();
}

/** Owner-only: mark a submission reviewed (or back to new). */
export async function markFeedbackStatus(
  store: MemberStore,
  id: string,
  status: FeedbackStatus,
): Promise<void> {
  await store.updateFeedbackStatus(id, status);
}
