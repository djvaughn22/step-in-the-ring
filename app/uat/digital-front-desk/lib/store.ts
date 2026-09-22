// Digital Front Desk — server-side demo storage.
//
// HONEST LIMIT, stated up front: this is a module-level in-memory store. It
// is NOT a database. It resets whenever the server process restarts, and on
// a serverless deployment (Vercel) different requests can land on different
// warm instances that never share memory — so what the owner dashboard shows
// can vary run to run in production. It is documented that way in
// docs/DIGITAL_FRONT_DESK_UAT.md and must never be described as persistent.
//
// Why this instead of iDontCry's localStorage: localStorage is per-browser,
// so "submit on your phone, see it land on your laptop" — the actual handoff
// promise this product demos — could never be shown there. A shared
// server-side store, even an ephemeral one, can. Moving to real persistence
// later means swapping this module for one backed by app/members/store.ts's
// MemberStore (Postgres via DATABASE_URL) without touching any route or
// component — the same seam that file already documents for member data.
//
// This module is server-only: it is never imported from a "use client" file
// (source-hygiene.test.ts's pattern — see below — plus this file's own doc
// comment are the guardrails against that happening by accident).

import type { CustomerRequest, FrontDeskEvent, OnboardingApplication, PipelineStage } from "./types";
import { newId, seedRequestIds, seedRequests, sortForStage } from "./domain";

interface StoreState {
  requests: Map<string, CustomerRequest>;
  onboarding: OnboardingApplication[];
}

// A global (not module-scope) singleton so hot-reload in `next dev` — which
// re-evaluates modules but keeps the Node process alive — doesn't quietly
// wipe demo data on every save.
const globalKey = "__dfdUatStore__";
type GlobalWithStore = typeof globalThis & { [globalKey]?: StoreState };
const g = globalThis as GlobalWithStore;

function state(): StoreState {
  if (!g[globalKey]) {
    g[globalKey] = { requests: new Map(), onboarding: [] };
  }
  return g[globalKey]!;
}

export function listRequests(): CustomerRequest[] {
  return sortForStage([...state().requests.values()]);
}

export function getRequest(id: string): CustomerRequest | undefined {
  return state().requests.get(id);
}

export function addRequest(
  value: Omit<CustomerRequest, "id" | "confirmationNumber" | "events" | "internalNotes">,
  confirmationNumber: string,
): CustomerRequest {
  const id = newId("req");
  const request: CustomerRequest = {
    ...value,
    id,
    confirmationNumber,
    internalNotes: [],
    events: [{ type: "request_created", timestamp: value.createdAt }],
  };
  state().requests.set(id, request);
  return request;
}

/** Applies a partial update and appends the matching audit event(s) in one
 * atomic step, so a request and its timeline can never drift apart. */
export function updateRequest(
  id: string,
  patch: Partial<CustomerRequest>,
  events: FrontDeskEvent[],
  now: Date = new Date(),
): CustomerRequest | null {
  const existing = state().requests.get(id);
  if (!existing) return null;
  const updated: CustomerRequest = {
    ...existing,
    ...patch,
    lastUpdate: now.toISOString(),
    events: [...existing.events, ...events],
  };
  state().requests.set(id, updated);
  return updated;
}

export function addOnboardingApplication(value: Omit<OnboardingApplication, "id" | "createdAt">, now: Date = new Date()): OnboardingApplication {
  const app: OnboardingApplication = { ...value, id: newId("app"), createdAt: now.toISOString() };
  state().onboarding.push(app);
  return app;
}

export function listOnboardingApplications(): OnboardingApplication[] {
  return [...state().onboarding].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Adds the four fixed-id seed requests if they are not already present.
 * Calling this repeatedly never duplicates data. Returns how many were
 * newly added. */
export function loadSeedData(now: Date = new Date()): number {
  const s = state();
  let added = 0;
  for (const req of seedRequests(now)) {
    if (!s.requests.has(req.id)) {
      s.requests.set(req.id, req);
      added++;
    }
  }
  return added;
}

export function clearAll(): void {
  const s = state();
  s.requests.clear();
  s.onboarding = [];
}

export function exportSnapshot(): { exportedAt: string; requests: CustomerRequest[]; onboarding: OnboardingApplication[] } {
  return {
    exportedAt: new Date().toISOString(),
    requests: listRequests(),
    onboarding: listOnboardingApplications(),
  };
}

export function stats(): { requestCount: number; onboardingCount: number; byStage: Record<PipelineStage, number> } {
  const s = state();
  const byStage = {} as Record<PipelineStage, number>;
  for (const r of s.requests.values()) {
    byStage[r.status] = (byStage[r.status] ?? 0) + 1;
  }
  return { requestCount: s.requests.size, onboardingCount: s.onboarding.length, byStage };
}

/** Test-only reset hook — mirrors app/author/auth.ts's _resetAttempts(). */
export function _resetStoreForTests(): void {
  g[globalKey] = { requests: new Map(), onboarding: [] };
}

export { seedRequestIds };
