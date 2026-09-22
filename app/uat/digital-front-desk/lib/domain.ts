// Digital Front Desk — pure domain logic. No React, no next/headers, no
// storage: everything here is a plain function so it can be unit tested
// directly (see domain.test.ts) the same way app/members/sprintApplication.ts
// and app/owner/gate.ts are tested elsewhere in this repo.

import { randomBytes, randomUUID } from "node:crypto";
import { DEMO_BUSINESS } from "./business";
import type {
  ContactMethod,
  CustomerRequest,
  FrontDeskEvent,
  InternalNote,
  OnboardingApplication,
  OnboardingPlan,
  PipelineStage,
  UrgencyLevel,
} from "./types";
import { PIPELINE_STAGES } from "./types";

// Re-exported so existing server-side call sites (API routes, tests) can
// import formatting helpers from either module. Client components should
// import these from ./display directly, never from here — this file pulls
// in node:crypto and cannot be bundled for the browser.
export { formatTimeAgo, URGENCY_COLOR, eventLabel, isOverdue, priorityScore, sortForStage } from "./display";

// ── Confirmation numbers ────────────────────────────────────────────────────

/** Human-readable, not guessable, never collides in practice. */
export function generateConfirmationNumber(): string {
  const chunk = () => randomBytes(3).toString("hex").toUpperCase();
  return `DFD-${chunk()}-${chunk()}`;
}

// ── Validation (customer intake) ────────────────────────────────────────────

export const MAX_NAME_LENGTH = 200;
export const MAX_EMAIL_LENGTH = 320;
export const MAX_PHONE_LENGTH = 40;
export const MAX_DESCRIPTION_LENGTH = 4000;

const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(raw: unknown, max: number): string {
  if (typeof raw !== "string") return "";
  return raw.replace(CONTROL_CHARS, "").trim().slice(0, max);
}

export interface IntakeInput {
  customerName: unknown;
  customerEmail: unknown;
  customerPhone: unknown;
  serviceArea: unknown;
  serviceId: unknown;
  description: unknown;
  urgency: unknown;
  preferredContact: unknown;
  consentToUpdates: unknown;
}

export type IntakeResult =
  | { ok: true; value: Omit<CustomerRequest, "id" | "confirmationNumber" | "events" | "internalNotes"> }
  | { ok: false; errors: string[] };

const URGENCIES: UrgencyLevel[] = ["routine", "soon", "urgent", "safety_concern"];
const CONTACT_METHODS: ContactMethod[] = ["email", "phone"];

/** Validates and normalizes a raw intake submission. Every rule here has a
 * matching visible error message — nothing fails silently. */
export function validateIntake(input: IntakeInput, now: Date = new Date()): IntakeResult {
  const errors: string[] = [];

  const customerName = clean(input.customerName, MAX_NAME_LENGTH);
  if (!customerName) errors.push("Enter your name.");

  const customerEmail = clean(input.customerEmail, MAX_EMAIL_LENGTH).toLowerCase();
  if (!customerEmail || !EMAIL_SHAPE.test(customerEmail)) errors.push("Enter a valid email address.");

  const customerPhone = clean(input.customerPhone, MAX_PHONE_LENGTH);
  if (!customerPhone) errors.push("Enter a phone number.");

  const serviceArea = clean(input.serviceArea, 100);
  if (!DEMO_BUSINESS.serviceAreas.includes(serviceArea)) errors.push("Choose a service area.");

  const serviceId = clean(input.serviceId, 100);
  if (!DEMO_BUSINESS.services.some((s) => s.id === serviceId)) errors.push("Choose a service.");

  const description = clean(input.description, MAX_DESCRIPTION_LENGTH);
  if (!description) errors.push("Describe what you need.");

  const urgency = URGENCIES.includes(input.urgency as UrgencyLevel) ? (input.urgency as UrgencyLevel) : null;
  if (!urgency) errors.push("Choose how urgent this is.");

  const preferredContact = CONTACT_METHODS.includes(input.preferredContact as ContactMethod)
    ? (input.preferredContact as ContactMethod)
    : null;
  if (!preferredContact) errors.push("Choose a preferred contact method.");

  // Consent is explicit and can never default true — an absent or falsy
  // value is always "no", the same rule app/members/sprintApplication.ts
  // uses for its marketing-consent field.
  if (input.consentToUpdates !== true) errors.push("You must agree to be contacted about this request.");

  if (errors.length > 0) return { ok: false, errors };

  const nowIso = now.toISOString();
  return {
    ok: true,
    value: {
      createdAt: nowIso,
      customerName,
      customerEmail,
      customerPhone,
      serviceArea,
      serviceId,
      description,
      urgency: urgency!,
      preferredContact: preferredContact!,
      consentToUpdates: true,
      status: "new",
      assignedTo: null,
      nextAction: "Review and make first contact",
      nextActionDue: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdate: nowIso,
      lastCustomerUpdate: null,
      lastCustomerUpdateChannel: null,
    },
  };
}

// ── Onboarding preview ───────────────────────────────────────────────────────

const PLANS: OnboardingPlan[] = ["starter", "working", "pro"];

export function validateOnboarding(input: {
  plan: unknown;
  businessName: unknown;
  email: unknown;
}): { ok: true; value: Omit<OnboardingApplication, "id" | "createdAt"> } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const plan = PLANS.includes(input.plan as OnboardingPlan) ? (input.plan as OnboardingPlan) : null;
  if (!plan) errors.push("Choose a plan.");
  const businessName = clean(input.businessName, MAX_NAME_LENGTH);
  if (!businessName) errors.push("Enter your business name.");
  const email = clean(input.email, MAX_EMAIL_LENGTH).toLowerCase();
  if (!email || !EMAIL_SHAPE.test(email)) errors.push("Enter a valid email address.");
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { plan: plan!, businessName, email } };
}

// ── Seed data ────────────────────────────────────────────────────────────────

interface SeedSpec {
  id: string;
  name: string;
  email: string;
  phone: string;
  area: string;
  service: string;
  desc: string;
  urgency: UrgencyLevel;
  status: PipelineStage;
  hoursAgo: number;
  assigned?: string;
}

const SEED_SPECS: SeedSpec[] = [
  {
    id: "seed-sarah",
    name: "Sarah Mitchell",
    email: "sarah@example.com",
    phone: "(555) 123-4567",
    area: "Downtown",
    service: "repairs",
    desc: "Leaky kitchen faucet under the sink. Water dripping when turned on — may need a washer.",
    urgency: "soon",
    status: "new",
    hoursAgo: 0.5,
  },
  {
    id: "seed-james",
    name: "James Rodriguez",
    email: "james.r@example.com",
    phone: "(555) 234-5678",
    area: "Midtown",
    service: "repairs",
    desc: "Deck railing loose in several places — needs tightening and possibly a board replaced.",
    urgency: "soon",
    status: "contacted",
    hoursAgo: 3,
    assigned: "Owner",
  },
  {
    id: "seed-marcus",
    name: "Marcus Chen",
    email: "m.chen@example.com",
    phone: "(555) 345-6789",
    area: "Suburbs",
    service: "assembly",
    desc: "Six-piece dining set delivered — all parts on hand, needs assembly this week.",
    urgency: "urgent",
    status: "scheduled",
    hoursAgo: 1,
    assigned: "Owner",
  },
  {
    id: "seed-diana",
    name: "Diana West",
    email: "diana@example.com",
    phone: "(555) 456-7890",
    area: "Airport District",
    service: "checks",
    desc: "Annual property inspection for a rental — management company needs the report on file.",
    urgency: "routine",
    status: "quoted",
    hoursAgo: 26,
    assigned: "Owner",
  },
];

export function seedRequests(now: Date = new Date()): CustomerRequest[] {
  return SEED_SPECS.map((spec) => {
    const createdAt = new Date(now.getTime() - spec.hoursAgo * 60 * 60 * 1000).toISOString();
    const events: FrontDeskEvent[] = [{ type: "request_created", timestamp: createdAt }];
    if (spec.assigned) {
      events.push({ type: "request_assigned", timestamp: createdAt, assignee: spec.assigned });
    }
    if (spec.status !== "new" && spec.status !== "contacted") {
      events.push({ type: "status_changed", timestamp: createdAt, from: "new", to: spec.status });
    }
    const notes: InternalNote[] = [];
    return {
      id: spec.id,
      createdAt,
      customerName: spec.name,
      customerEmail: spec.email,
      customerPhone: spec.phone,
      serviceArea: spec.area,
      serviceId: spec.service,
      description: spec.desc,
      urgency: spec.urgency,
      preferredContact: "phone",
      consentToUpdates: true,
      status: spec.status,
      assignedTo: spec.assigned ?? null,
      nextAction: spec.status === "new" ? "Review and make first contact" : "Follow up with customer",
      nextActionDue: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      lastUpdate: createdAt,
      lastCustomerUpdate: null,
      lastCustomerUpdateChannel: null,
      internalNotes: notes,
      events,
      confirmationNumber: generateConfirmationNumber(),
    } satisfies CustomerRequest;
  });
}

export function seedRequestIds(): string[] {
  return SEED_SPECS.map((s) => s.id);
}

export function newId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

export { PIPELINE_STAGES };
