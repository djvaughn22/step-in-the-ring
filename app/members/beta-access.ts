// ─────────────────────────────────────────────────────────────────────────────
// Private-beta admission — the ONE shared credential that opens the door
// during the current testing period.
//
// The contract (owner decision, 2026-08-07):
//
//   any email + the shared beta password + not revoked = tester access
//
// This is an ADMISSION credential only. Once it validates, the normal member
// session and entitlement machinery in auth.ts / entitlement.ts governs
// everything else — there is no second, weaker session mechanism here.
//
// HARD RULES:
//   - The password lives ONLY in SITR_BETA_ACCESS_PASSWORD, a server-only
//     environment variable. It is never hard-coded, never sent to the client,
//     never logged, and never returned by an API.
//   - Unset or empty env fails CLOSED: nobody gets in via this path.
//   - A revoked entitlement is denied even with the correct password. That is
//     the owner's kill switch and it outranks the shared credential.
//   - An existing owner or paid-active account is never downgraded to tester.
// ─────────────────────────────────────────────────────────────────────────────

import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import {
  hashPassword,
  issueSession,
  normalizeEmail,
  rateLimited,
  recordAttempt,
  type AuthResult,
} from "./auth";
import type { MemberStore, UserRecord } from "./store";

/** How long a beta admission grants tester access before it must be renewed. */
export const BETA_ACCESS_DAYS = 90;

/**
 * The shared beta password, read from server-only environment config.
 * Returns null when unset or blank so every caller fails closed.
 */
export function betaPasswordFromEnv(
  env: Record<string, string | undefined> = process.env,
): string | null {
  const raw = env.SITR_BETA_ACCESS_PASSWORD;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Compare a submitted password to the shared one. Leading/trailing whitespace
 * on the submission is trimmed first — the same copy/paste tolerance the
 * iDontCry family gate needed, because testers paste from a message app.
 */
export function betaPasswordMatches(submitted: unknown, expected: string): boolean {
  if (typeof submitted !== "string" || expected.length === 0) return false;
  const given = Buffer.from(submitted.trim(), "utf8");
  const want = Buffer.from(expected, "utf8");
  if (given.length !== want.length) return false;
  return timingSafeEqual(given, want);
}

/** Statuses that already outrank a tester grant and must never be downgraded. */
const KEEPS_ITS_STATUS = new Set(["owner", "active", "canceled_active"]);

/**
 * Admit an email on the shared beta password, creating the identity and the
 * tester entitlement when needed, then issuing a normal member session.
 *
 * `betaPassword` is injectable so tests never hard-code the production secret.
 */
export async function betaAdmit(
  store: MemberStore,
  input: { email: unknown; password: unknown },
  opts: { ip: string; now?: Date; betaPassword?: string | null },
): Promise<AuthResult> {
  const now = opts.now ?? new Date();
  const email = normalizeEmail(input.email);

  const limiterKey = `beta:${opts.ip}:${email ?? "invalid"}`;
  if (rateLimited(limiterKey, now.getTime())) {
    return { ok: false, error: "Too many attempts. Please wait and try again.", status: 429 };
  }
  recordAttempt(limiterKey, now.getTime());

  const expected =
    opts.betaPassword !== undefined ? opts.betaPassword : betaPasswordFromEnv();
  // Fail closed: with no configured password this door does not exist.
  if (!expected) {
    return {
      ok: false,
      error: "Step In The Ring is not open yet — membership is in private beta.",
      status: 503,
    };
  }

  // One generic message for every rejection — never reveals whether an email
  // is known, nor which half of the submission was wrong.
  const generic = { ok: false as const, error: "Email or password is incorrect.", status: 401 };
  if (!email) return generic;
  if (!betaPasswordMatches(input.password, expected)) return generic;

  const existingUser = await store.getUserByEmail(email);
  const existing = existingUser ? await store.getEntitlement(existingUser.id) : null;

  // The owner's kill switch outranks the shared password, always.
  if (existing?.status === "revoked") {
    return { ok: false, error: "Access denied.", status: 403 };
  }

  let user = existingUser;
  if (!user) {
    user = {
      id: randomUUID(),
      email,
      // No account password is ever set by this path. A random unguessable
      // hash keeps the shared secret out of the user record entirely, so a
      // database leak cannot reveal it and normal login cannot use it.
      passwordHash: hashPassword(randomBytes(32).toString("base64url")),
      emailVerified: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      deletionRequestedAt: null,
    } satisfies UserRecord;
    await store.createUser(user);
  }

  if (!existing || !KEEPS_ITS_STATUS.has(existing.status)) {
    const until = new Date(now.getTime() + BETA_ACCESS_DAYS * 24 * 60 * 60 * 1000);
    await store.upsertEntitlement({
      userId: user.id,
      status: "tester",
      source: "beta-password",
      stripeCustomerId: existing?.stripeCustomerId ?? null,
      stripeSubscriptionId: existing?.stripeSubscriptionId ?? null,
      currentPeriodEnd: until.toISOString(),
      testerCodeId: existing?.testerCodeId ?? null,
      revokedAt: null,
      adminNotes: existing?.adminNotes ?? "",
      createdAt: existing?.createdAt ?? now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  const session = await issueSession(store, user.id, now);
  return { ok: true, userId: user.id, ...session };
}
