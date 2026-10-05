// ─────────────────────────────────────────────────────────────────────────────
// Feedback from anyone (2026-10-04). Testers mostly never make an account,
// and the old "Send feedback" link led to a sign-in page. Now anyone can say
// what broke, what confused them, what they wish for, or what they loved.
//
// Rules:
//   - No account, no cookie, no identifier. The only personal detail is an
//     OPTIONAL reply email the person types themselves.
//   - The page it came from is a path only: the query string is dropped,
//     because ?idea= can carry someone's own words.
//   - A filled-in honeypot field means a bot: accepted quietly, not stored.
// ─────────────────────────────────────────────────────────────────────────────

import { randomUUID } from "node:crypto";
import { normalizeEmail } from "./auth";
import { formatCentralTimestamp, ownerNotificationEmail, type OwnerMail } from "./login-notification";
import type { MemberStore, VisitorFeedbackCategory, VisitorFeedbackRecord } from "./store";

export const VISITOR_CATEGORIES: VisitorFeedbackCategory[] = ["bug", "confusing", "idea", "loved"];
export const VISITOR_CATEGORY_LABEL: Record<VisitorFeedbackCategory, string> = {
  bug: "Something broke",
  confusing: "Something was confusing",
  idea: "An idea or wish",
  loved: "Something they loved",
};
export const MAX_VISITOR_MESSAGE = 2000;

const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g;

export type VisitorFeedbackResult =
  | { ok: true; stored: VisitorFeedbackRecord | null }
  | { ok: false; error: string; status: number };

export function cleanContextPath(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const path = raw.split(/[?#]/)[0].trim().slice(0, 120);
  return /^\/[A-Za-z0-9/_\-.~]*$/.test(path) ? path : "";
}

export async function createVisitorFeedback(
  store: MemberStore,
  input: { category: unknown; message: unknown; contextUrl: unknown; replyEmail?: unknown; website?: unknown },
  now: Date = new Date(),
): Promise<VisitorFeedbackResult> {
  if (typeof input.website === "string" && input.website.trim()) return { ok: true, stored: null };

  const category = VISITOR_CATEGORIES.includes(input.category as VisitorFeedbackCategory)
    ? (input.category as VisitorFeedbackCategory)
    : null;
  if (!category) return { ok: false, error: "Pick what kind of note this is.", status: 422 };

  const message = typeof input.message === "string" ? input.message.replace(CONTROL_CHARS, "").trim() : "";
  if (!message) return { ok: false, error: "Write a few words first.", status: 422 };
  if (message.length > MAX_VISITOR_MESSAGE) {
    return { ok: false, error: `Keep it under ${MAX_VISITOR_MESSAGE} characters.`, status: 422 };
  }

  let replyEmail = "";
  if (typeof input.replyEmail === "string" && input.replyEmail.trim()) {
    replyEmail = normalizeEmail(input.replyEmail.trim().slice(0, 200)) ?? "";
    if (!replyEmail) return { ok: false, error: "That email doesn't look right. Leave it empty if you don't want a reply.", status: 422 };
  }

  const record: VisitorFeedbackRecord = {
    id: randomUUID(),
    category,
    message,
    contextUrl: cleanContextPath(input.contextUrl),
    replyEmail,
    status: "new",
    createdAt: now.toISOString(),
  };
  await store.createVisitorFeedback(record);
  return { ok: true, stored: record };
}

/** The owner's copy by email. The tester's address is body text, never a header. */
export function buildVisitorFeedbackMail(
  f: VisitorFeedbackRecord,
  env: Record<string, string | undefined> = process.env,
): OwnerMail {
  return {
    to: ownerNotificationEmail(env),
    subject: `Step In The Ring feedback: ${VISITOR_CATEGORY_LABEL[f.category]}`,
    text: [
      VISITOR_CATEGORY_LABEL[f.category],
      "",
      f.message,
      "",
      `Page: ${f.contextUrl || "(not given)"}`,
      `Time: ${formatCentralTimestamp(new Date(f.createdAt))}`,
      `Reply to: ${f.replyEmail || "(no reply wanted)"}`,
      "",
      "Triage it at https://stepinthering.com/owner/feedback",
    ].join("\n"),
  };
}
