// Author's Room authentication — server-side, owner-only.
//
// The password lives in the STORY_OWNER_PASSWORD environment variable and is
// verified on the server. It never ships in a client bundle, never lands in
// localStorage, and never appears in a URL, log line, or API response. With
// no password configured the room fails CLOSED — nobody gets in.
//
// Sessions are stateless signed tokens: `<expiryMs>.<hmac>` in an HTTP-only
// cookie. The signing secret defaults to a value derived from the password,
// so rotating STORY_OWNER_PASSWORD invalidates every outstanding session.
// Set STORY_SESSION_SECRET to rotate sessions independently.
//
// Honest limits (documented in docs/AUTHOR-ROOM-PRIVATE.md): this gate stops
// unauthenticated internet visitors and search engines. It does not protect
// against someone at the owner's unlocked computer, a malicious extension in
// this browser profile, or anyone with access to the Vercel project settings.

import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "sitr-author-session";
export const SESSION_MAX_AGE_S = 30 * 24 * 60 * 60; // 30 days

type Env = Record<string, string | undefined>;

export function ownerPassword(env: Env = process.env): string | null {
  const p = env.STORY_OWNER_PASSWORD;
  return p && p.length >= 4 ? p : null; // shorter than 4 = treated as unconfigured
}

export function sessionSecret(env: Env = process.env): string | null {
  if (env.STORY_SESSION_SECRET) return env.STORY_SESSION_SECRET;
  const p = ownerPassword(env);
  if (!p) return null;
  return createHmac("sha256", "sitr-author-session-secret-v1").update(p).digest("hex");
}

/** Timing-safe comparison over fixed-length digests, so length never leaks. */
export function passwordMatches(supplied: string, expected: string): boolean {
  const a = createHmac("sha256", "sitr-author-pw-v1").update(supplied).digest();
  const b = createHmac("sha256", "sitr-author-pw-v1").update(expected).digest();
  return timingSafeEqual(a, b);
}

function sign(expiresAtMs: number, secret: string): string {
  return createHmac("sha256", secret).update(`sitr-author:${expiresAtMs}`).digest("hex");
}

export function createSessionToken(secret: string, nowMs = Date.now()): string {
  const expiresAtMs = nowMs + SESSION_MAX_AGE_S * 1000;
  return `${expiresAtMs}.${sign(expiresAtMs, secret)}`;
}

export function verifySessionToken(token: string | undefined, secret: string | null, nowMs = Date.now()): boolean {
  if (!token || !secret) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const expiresAtMs = Number(token.slice(0, dot));
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs) return false;
  const mac = token.slice(dot + 1);
  const expected = sign(expiresAtMs, secret);
  if (mac.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(mac, "utf8"), Buffer.from(expected, "utf8"));
}

// ---------------------------------------------------------------------------
// Repeated-attempt protection — in-memory, per address.
//
// Honest limit: serverless instances each hold their own map and recycle it
// on cold start, so this slows an attacker down rather than stopping one.
// The real protections are the strong password and the generic failure reply.
// ---------------------------------------------------------------------------

const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILURES = 5;
const LOCKOUT_MS = 60 * 1000;

interface AttemptState { failures: number[]; lockedUntil: number }

const attempts = new Map<string, AttemptState>();

export function isLockedOut(key: string, nowMs = Date.now()): boolean {
  const s = attempts.get(key);
  return !!s && s.lockedUntil > nowMs;
}

export function registerFailure(key: string, nowMs = Date.now()): void {
  const s = attempts.get(key) ?? { failures: [], lockedUntil: 0 };
  s.failures = [...s.failures.filter((t) => nowMs - t < WINDOW_MS), nowMs];
  if (s.failures.length >= MAX_FAILURES) {
    s.lockedUntil = nowMs + LOCKOUT_MS;
    s.failures = [];
  }
  attempts.set(key, s);
}

export function clearFailures(key: string): void {
  attempts.delete(key);
}

/** Test hook — never called by application code. */
export function _resetAttempts(): void {
  attempts.clear();
}
