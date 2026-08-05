// ─────────────────────────────────────────────────────────────────────────────
// Entitlement — the ONE source of truth for who may use what.
//
// Statuses (stored in member_entitlements.status):
//   free             — account exists, no paid access
//   active           — paid membership, current
//   tester           — private tester-code grant, time-limited
//   owner            — the owner (granted server-side, never via Stripe)
//   past_due         — payment failed; paid access paused until resolved
//   canceled_active  — canceled, but paid through current_period_end
//   expired          — paid period over
//   revoked          — access removed by the owner
//
// The resolver below is the only place that decides "is this paid access
// live right now" — routes never re-derive it. It is pure over (record,
// now), so every transition is testable.
//
// HARD RULES (test-locked):
//   - Client state, query parameters, cookies, or localStorage NEVER grant
//     entitlement. Only records written by verified server events do.
//   - Owner-only engines stay owner-only regardless of membership.
//   - Membership never gates iDontCry, the Linux system, or local software.
// ─────────────────────────────────────────────────────────────────────────────

import { ENGINES, type Engine } from "../engines/engines";
import type { EntitlementRecord } from "./store";

export const MEMBERSHIP_PRICE_LABEL = "$7.77 per month";
export const MEMBERSHIP_PRICE_CENTS = 777;
export const MEMBERSHIP_CADENCE = "month" as const;
export const MEMBERSHIP_PRODUCT_NAME = "Step In The Ring Membership";

/** What a resolved entitlement means for access checks. */
export interface ResolvedAccess {
  status: EntitlementRecord["status"];
  /** True when paid-level features (member engines, project persistence) are usable now. */
  memberAccess: boolean;
  /** ISO date paid access runs through, when known. */
  activeUntil: string | null;
}

export function resolveAccess(
  record: EntitlementRecord | null,
  now: Date = new Date(),
): ResolvedAccess {
  if (!record) return { status: "free", memberAccess: false, activeUntil: null };
  const periodEnd = record.currentPeriodEnd ? new Date(record.currentPeriodEnd) : null;
  const periodLive = periodEnd !== null && periodEnd.getTime() > now.getTime();

  switch (record.status) {
    case "owner":
      return { status: "owner", memberAccess: true, activeUntil: null };
    case "active":
      // A live paid record with a lapsed period end behaves as expired even
      // if a webhook was missed — stale state can never extend access.
      return periodEnd === null || periodLive
        ? { status: "active", memberAccess: true, activeUntil: record.currentPeriodEnd }
        : { status: "expired", memberAccess: false, activeUntil: record.currentPeriodEnd };
    case "tester":
      return periodLive
        ? { status: "tester", memberAccess: true, activeUntil: record.currentPeriodEnd }
        : { status: "expired", memberAccess: false, activeUntil: record.currentPeriodEnd };
    case "canceled_active":
      return periodLive
        ? { status: "canceled_active", memberAccess: true, activeUntil: record.currentPeriodEnd }
        : { status: "expired", memberAccess: false, activeUntil: record.currentPeriodEnd };
    case "past_due":
      return { status: "past_due", memberAccess: false, activeUntil: record.currentPeriodEnd };
    case "revoked":
      return { status: "revoked", memberAccess: false, activeUntil: null };
    case "expired":
      return { status: "expired", memberAccess: false, activeUntil: record.currentPeriodEnd };
    default:
      return { status: "free", memberAccess: false, activeUntil: null };
  }
}

// ── Engine access matrix — derived from the real registry ───────────────────
//
// Levels:
//   info   — everyone may see what the engine is (name, blurb, status)
//   member — running the engine needs live member access (or owner)
//   owner  — owner-only; never listed as member value, never public
//
// Today every non-owner-only engine is member-level: the free introduction
// is the public directory + idea capture on /membership, and membership is
// what opens the Engine Room itself.

export type EngineAccessLevel = "member" | "owner" | "not-ready";

export function engineAccessLevel(engine: Engine): EngineAccessLevel {
  const activation = engine.activation ?? "planned";
  if (activation === "owner-only") return "owner";
  // Only engines that honestly work end to end (or run in labeled beta) are
  // member value. Building/planned/unavailable engines are never sold.
  return activation === "working" || activation === "beta" ? "member" : "not-ready";
}

export interface EngineMatrixRow {
  id: string;
  name: string;
  activation: NonNullable<Engine["activation"]>;
  access: EngineAccessLevel;
}

export function engineMatrix(): EngineMatrixRow[] {
  return ENGINES.map((e) => ({
    id: e.id,
    name: e.name,
    activation: e.activation ?? "planned",
    access: engineAccessLevel(e),
  }));
}

/** Engine ids a live member may use — owner-only engines never appear. */
export function memberEngineIds(): string[] {
  return engineMatrix()
    .filter((r) => r.access === "member")
    .map((r) => r.id);
}

/** Server-side check for one engine. Owner passes everything. */
export function mayUseEngine(
  engineId: string,
  access: ResolvedAccess,
  isOwner: boolean,
): boolean {
  const row = engineMatrix().find((r) => r.id === engineId);
  if (!row) return false;
  if (isOwner) return true;
  if (row.access === "owner") return false;
  return access.memberAccess;
}
