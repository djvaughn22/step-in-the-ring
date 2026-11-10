// ─────────────────────────────────────────────────────────────────────────────
// Request a project (Build it with us, 2026-11-10).
//
// Rules:
//   - Server-side validation is the real check. The form's own checks are a
//     courtesy.
//   - Nothing a person types is logged, put in a URL or sent to analytics.
//     The owner reads it in their email and at /owner/inquiries.
//   - A request is never an order. Nothing here accepts a project, takes a
//     payment or promises a date.
//   - Bots: a filled honeypot or a form sent faster than a person can type
//     is accepted quietly and NOT stored, so the bot learns nothing.
// ─────────────────────────────────────────────────────────────────────────────

import { randomUUID } from "node:crypto";
import { normalizeEmail } from "./auth";
import { formatCentralTimestamp, ownerNotificationEmail, type OwnerMail } from "./login-notification";
import type { MemberStore, ProjectInquiryRecord } from "./store";
import { BUDGETS, PROJECT_TYPES, SERVICE_CHOICES, TIMELINES, labelFor } from "../services/offers";

export const INQUIRY_LIMITS = {
  name: 120,
  organization: 160,
  siteUrl: 300,
  description: 4000,
  descriptionMin: 20,
} as const;

/** A person can't read the form and fill it in faster than this. */
export const MIN_FILL_MS = 3000;

const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

function clean(raw: unknown, max: number, keepNewlines = false): string {
  if (typeof raw !== "string") return "";
  let s = raw.replace(CONTROL_CHARS, "");
  if (!keepNewlines) s = s.replace(/[\r\n\t]+/g, " ");
  return s.trim().slice(0, max + 1);
}

function oneOf(list: readonly { id: string }[], raw: unknown): string | null {
  return typeof raw === "string" && list.some((x) => x.id === raw) ? raw : null;
}

/** An existing website: accept "example.com" or a full http(s) address. */
export function cleanSiteUrl(raw: unknown): string | null {
  const s = clean(raw, INQUIRY_LIMITS.siteUrl);
  if (!s) return "";
  if (s.length > INQUIRY_LIMITS.siteUrl) return null;
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withScheme);
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".") || /\s/.test(s)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export type InquiryErrors = Partial<Record<"name" | "email" | "siteUrl" | "projectType" | "service" | "description" | "timeline" | "budget" | "organization", string>>;

export type InquiryResult =
  | { ok: true; stored: ProjectInquiryRecord | null }
  | { ok: false; status: number; error: string; fields?: InquiryErrors };

export interface InquiryInput {
  name?: unknown;
  email?: unknown;
  organization?: unknown;
  siteUrl?: unknown;
  projectType?: unknown;
  service?: unknown;
  description?: unknown;
  timeline?: unknown;
  budget?: unknown;
  /** Honeypot. A person never sees it. */
  nickname?: unknown;
  /** Milliseconds the form was open before sending. */
  elapsedMs?: unknown;
}

export function validateInquiry(input: InquiryInput, now: Date = new Date()):
  | { ok: true; record: ProjectInquiryRecord | null }
  | { ok: false; fields: InquiryErrors } {
  if (typeof input.nickname === "string" && input.nickname.trim()) return { ok: true, record: null };
  const elapsed = Number(input.elapsedMs);
  if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < MIN_FILL_MS) return { ok: true, record: null };

  const fields: InquiryErrors = {};
  const name = clean(input.name, INQUIRY_LIMITS.name);
  if (!name) fields.name = "Tell us your name.";
  else if (name.length > INQUIRY_LIMITS.name) fields.name = "That name is too long.";

  const email = normalizeEmail(typeof input.email === "string" ? input.email.trim() : "");
  if (!email) fields.email = "Enter an email address we can reply to.";

  const organization = clean(input.organization, INQUIRY_LIMITS.organization);
  if (organization.length > INQUIRY_LIMITS.organization) fields.organization = "Keep this shorter.";

  const siteUrl = cleanSiteUrl(input.siteUrl);
  if (siteUrl === null) fields.siteUrl = "That doesn't look like a web address. Leave it empty if you don't have one.";

  const projectType = oneOf(PROJECT_TYPES, input.projectType);
  if (!projectType) fields.projectType = "Pick the kind of project.";

  const service = oneOf(SERVICE_CHOICES, input.service);
  if (!service) fields.service = "Pick a service, or “Not sure”.";

  const description = clean(input.description, INQUIRY_LIMITS.description, true);
  if (description.length < INQUIRY_LIMITS.descriptionMin) fields.description = "Tell us a little more: a sentence or two is plenty.";
  else if (description.length > INQUIRY_LIMITS.description) fields.description = `Keep it under ${INQUIRY_LIMITS.description} characters.`;

  const timeline = oneOf(TIMELINES, input.timeline);
  if (!timeline) fields.timeline = "Pick a timeline.";

  const budgetRaw = input.budget === undefined || input.budget === null ? "" : input.budget;
  const budget = oneOf(BUDGETS, budgetRaw);
  if (budget === null) fields.budget = "Pick a budget range, or “Prefer not to say”.";

  if (Object.keys(fields).length) return { ok: false, fields };
  return {
    ok: true,
    record: {
      id: randomUUID(),
      name,
      email: email!,
      organization,
      siteUrl: siteUrl ?? "",
      projectType: projectType!,
      service: service!,
      description,
      timeline: timeline!,
      budget: budget ?? "",
      status: "new",
      createdAt: now.toISOString(),
    },
  };
}

export async function createProjectInquiry(store: MemberStore, input: InquiryInput, now: Date = new Date()): Promise<InquiryResult> {
  const v = validateInquiry(input, now);
  if (!v.ok) return { ok: false, status: 422, error: "A few things need a look.", fields: v.fields };
  if (!v.record) return { ok: true, stored: null };
  await store.createProjectInquiry(v.record);
  return { ok: true, stored: v.record };
}

/** The owner's copy. The person's address is body text, never a header. */
export function buildInquiryMail(i: ProjectInquiryRecord, env: Record<string, string | undefined> = process.env): OwnerMail {
  return {
    to: ownerNotificationEmail(env),
    subject: `Step In The Ring project request: ${labelFor(SERVICE_CHOICES, i.service)}`,
    text: [
      "A new project request. It is not accepted until you reply.",
      "",
      `Name: ${i.name}`,
      `Email: ${i.email}`,
      `Business or organization: ${i.organization || "(not given)"}`,
      `Existing website: ${i.siteUrl || "(none)"}`,
      `Project: ${labelFor(PROJECT_TYPES, i.projectType)}`,
      `Service: ${labelFor(SERVICE_CHOICES, i.service)}`,
      `Timeline: ${labelFor(TIMELINES, i.timeline)}`,
      `Budget: ${labelFor(BUDGETS, i.budget)}`,
      `Received: ${formatCentralTimestamp(new Date(i.createdAt))}`,
      "",
      "What they want:",
      i.description,
      "",
      "Before replying, run the conflict screening checklist.",
      "All requests: https://stepinthering.com/owner/inquiries",
    ].join("\n"),
  };
}
