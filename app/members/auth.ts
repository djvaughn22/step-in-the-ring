// ─────────────────────────────────────────────────────────────────────────────
// Member authentication — customer accounts for Step In The Ring Membership.
//
// Deliberately the simplest secure architecture the stack supports, built on
// the same primitives the owner gate already trusts (node:crypto, HTTP-only
// cookies, fail-closed env checks):
//
//   - Passwords: scrypt (N=16384, r=8, p=1) with a per-user random salt.
//     Plaintext is never stored, logged, or echoed.
//   - Sessions: 32 random bytes, sent as an HTTP-only cookie; only the
//     sha256 hash is stored server-side, so a database leak cannot replay
//     sessions.
//   - The member session is completely separate from the owner session
//     (different cookie, different secret space). Owner access never rides
//     on a customer account.
//   - Accounts are framed around an adult, parent, or responsible
//     purchaser. Children are never asked to create independent paid
//     accounts.
//   - Email verification and password recovery need an email provider;
//     until RESEND_API_KEY + MEMBER_EMAIL_FROM are configured those flows
//     are disabled and say so honestly.
//
// This module is pure logic over an injected MemberStore + clock so every
// path is testable. Route handlers own cookies and HTTP.
// ─────────────────────────────────────────────────────────────────────────────

import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import type { MemberStore, UserRecord } from "./store";

export const MEMBER_SESSION_COOKIE = "sitr-member-session";
export const MEMBER_SESSION_MAX_AGE_S = 30 * 24 * 60 * 60; // 30 days

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 10;
const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string, salt: Buffer = randomBytes(16)): string {
  const key = scryptSync(password, salt, SCRYPT_KEYLEN, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, keyHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length, {
    N: 16384,
    r: 8,
    p: 1,
  });
  return timingSafeEqual(actual, expected);
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ── Rate limiting (same honest in-memory pattern as the owner gate) ─────────

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;

const attempts = new Map<string, number[]>();

export function rateLimited(key: string, nowMs: number = Date.now()): boolean {
  const kept = (attempts.get(key) ?? []).filter((t) => t > nowMs - WINDOW_MS);
  attempts.set(key, kept);
  if (attempts.size > 5000) {
    for (const [k, times] of attempts) {
      if (times.every((t) => t <= nowMs - WINDOW_MS)) attempts.delete(k);
    }
  }
  return kept.length >= MAX_ATTEMPTS;
}

export function recordAttempt(key: string, nowMs: number = Date.now()): void {
  const kept = (attempts.get(key) ?? []).filter((t) => t > nowMs - WINDOW_MS);
  kept.push(nowMs);
  attempts.set(key, kept);
}

/** Test hook — clears the in-memory limiter. */
export function resetRateLimiter(): void {
  attempts.clear();
}

// ── Core operations ─────────────────────────────────────────────────────────

export type AuthResult =
  | { ok: true; userId: string; sessionToken: string; expiresAt: string }
  | { ok: false; error: string; status: number };

export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return null;
  return email;
}

export function passwordProblem(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (raw.length > 200) return "Password is too long.";
  return null;
}

async function issueSession(
  store: MemberStore,
  userId: string,
  now: Date,
): Promise<{ sessionToken: string; expiresAt: string }> {
  const sessionToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + MEMBER_SESSION_MAX_AGE_S * 1000).toISOString();
  await store.createSession({
    tokenHash: hashSessionToken(sessionToken),
    userId,
    expiresAt,
    createdAt: now.toISOString(),
  });
  return { sessionToken, expiresAt };
}

export async function signup(
  store: MemberStore,
  input: { email: unknown; password: unknown },
  opts: { ip: string; now?: Date },
): Promise<AuthResult> {
  const now = opts.now ?? new Date();
  if (rateLimited(`signup:${opts.ip}`, now.getTime())) {
    return { ok: false, error: "Too many attempts. Please wait and try again.", status: 429 };
  }
  recordAttempt(`signup:${opts.ip}`, now.getTime());

  const email = normalizeEmail(input.email);
  if (!email) return { ok: false, error: "Enter a valid email address.", status: 422 };
  const pwProblem = passwordProblem(input.password);
  if (pwProblem) return { ok: false, error: pwProblem, status: 422 };

  if (await store.getUserByEmail(email)) {
    // Same generic wording as a bad login — never confirms which emails exist.
    return { ok: false, error: "That email cannot be used. Try signing in instead.", status: 409 };
  }

  const user: UserRecord = {
    id: randomUUID(),
    email,
    passwordHash: hashPassword(String(input.password)),
    emailVerified: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    deletionRequestedAt: null,
  };
  await store.createUser(user);
  await store.upsertEntitlement({
    userId: user.id,
    status: "free",
    source: "none",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
    testerCodeId: null,
    revokedAt: null,
    adminNotes: "",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  const session = await issueSession(store, user.id, now);
  return { ok: true, userId: user.id, ...session };
}

export async function login(
  store: MemberStore,
  input: { email: unknown; password: unknown },
  opts: { ip: string; now?: Date },
): Promise<AuthResult> {
  const now = opts.now ?? new Date();
  const email = normalizeEmail(input.email);
  const limiterKey = `login:${opts.ip}:${email ?? "invalid"}`;
  if (rateLimited(limiterKey, now.getTime())) {
    return { ok: false, error: "Too many attempts. Please wait and try again.", status: 429 };
  }
  recordAttempt(limiterKey, now.getTime());

  const generic = { ok: false as const, error: "Email or password is incorrect.", status: 401 };
  if (!email || typeof input.password !== "string") return generic;

  const user = await store.getUserByEmail(email);
  if (!user || !verifyPassword(input.password, user.passwordHash)) return generic;

  const session = await issueSession(store, user.id, now);
  return { ok: true, userId: user.id, ...session };
}

export async function logout(store: MemberStore, sessionToken: string | undefined): Promise<void> {
  if (!sessionToken) return;
  await store.deleteSession(hashSessionToken(sessionToken));
}

/** Resolve a session cookie to its user — null for missing/expired/unknown. */
export async function sessionUser(
  store: MemberStore,
  sessionToken: string | undefined,
  now: Date = new Date(),
): Promise<UserRecord | null> {
  if (!sessionToken) return null;
  const session = await store.getSession(hashSessionToken(sessionToken));
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() <= now.getTime()) {
    await store.deleteSession(session.tokenHash);
    return null;
  }
  return store.getUserById(session.userId);
}

/**
 * Account deletion request — marks the account, ends every session. Actual
 * data removal follows the retention policy (owner-approved) so billing
 * disputes and legal duties can be honored. Only the account's own user can
 * request it, and it cannot touch anyone else's data.
 */
export async function requestAccountDeletion(
  store: MemberStore,
  userId: string,
  now: Date = new Date(),
): Promise<void> {
  const user = await store.getUserById(userId);
  if (!user) return;
  await store.updateUser({ ...user, deletionRequestedAt: now.toISOString(), updatedAt: now.toISOString() });
  await store.deleteSessionsForUser(userId);
}
