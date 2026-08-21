// ─────────────────────────────────────────────────────────────────────────────
// THE SHARED PREVIEW DOOR — server only.
//
// What this is: a courtesy door. The owner has a handful of pages that aren't
// finished enough to publish but that he wants to hand to one person. This
// checks a single shared passcode and issues a signed session so that person
// can look around without making an account.
//
// What this is NOT — and this must never be blurred:
//   - It is NOT security for private data. One short shared code, handed out
//     by text message, protects nothing that would actually hurt someone if it
//     leaked. Never put records, credentials, payment details or anyone's
//     personal information behind it.
//   - It is NOT a member session. It grants no membership and no saved work.
//   - It is NOT owner access. Owner tools check their own session and are
//     never reachable from here. See app/owner/session.ts.
//
// Laws:
//   - The passcode lives ONLY in SITR_PREVIEW_PASSCODE on the server. It is
//     never hard-coded, never a query parameter, never in localStorage, never
//     in the client bundle. app/owner/source-hygiene.test.ts and
//     app/members/membership.test.ts already fail the build if a literal code
//     appears in source — that test exists because a previous gate leaked its
//     codes into the public bundle. Do not weaken it.
//   - FAIL CLOSED. With the env var unset, nobody gets in, including the
//     owner. An unconfigured door is a locked door, not an open one.
//   - The signing key is derived from the passcode, so rotating the passcode
//     instantly invalidates every outstanding session.
// ─────────────────────────────────────────────────────────────────────────────

import { cookies } from "next/headers";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const PREVIEW_COOKIE = "sitr_preview";

const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60; // 12 hours
const TOKEN_SUBJECT = "preview";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 8;

// Best effort only: in-memory, resets on cold start, not shared between
// serverless instances. Still better than no throttling on a 4-digit code.
const attempts = new Map<string, { count: number; windowStart: number }>();

/** The configured passcode, or null when the door is not configured at all. */
export function previewPasscode(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): string | null {
  const raw = env.SITR_PREVIEW_PASSCODE;
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  return value.length > 0 ? value : null;
}

/** True when an owner has actually configured the door. */
export function previewConfigured(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return previewPasscode(env) !== null;
}

function sha256(input: string): Buffer {
  return createHash("sha256").update(input).digest();
}

function signingKey(passcode: string): Buffer {
  return sha256(`sitr-preview-session-v1:${passcode}`);
}

/** Constant-time compare on fixed-length digests, so length leaks nothing. */
function passcodeMatches(candidate: string, expected: string): boolean {
  return timingSafeEqual(sha256(candidate), sha256(expected));
}

export function issueToken(passcode: string, now: number = Date.now()): string {
  const payload = `${TOKEN_SUBJECT}.${now}`;
  const signature = createHmac("sha256", signingKey(passcode))
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}

/**
 * Verify a token against the CURRENT passcode. Returns false on any doubt:
 * wrong shape, wrong subject, bad signature, expired, or door unconfigured.
 */
export function tokenValid(
  token: string | undefined,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
  now: number = Date.now(),
): boolean {
  const passcode = previewPasscode(env);
  if (!passcode || !token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [subject, issuedAt, signature] = parts;
  if (subject !== TOKEN_SUBJECT) return false;

  const issued = Number(issuedAt);
  if (!Number.isFinite(issued)) return false;
  if (now - issued > SESSION_MAX_AGE_SECONDS * 1000) return false;
  // A token stamped in the future is a forged token.
  if (issued - now > 60_000) return false;

  const expected = createHmac("sha256", signingKey(passcode))
    .update(`${subject}.${issuedAt}`)
    .digest("hex");
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export type PreviewAttempt =
  | { ok: true; token: string }
  | { ok: false; reason: "unconfigured" | "wrong" | "rate-limited" };

/** Check a submitted passcode. Never logs the candidate. */
export function checkPasscode(
  candidate: string,
  rateKey: string,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
  now: number = Date.now(),
): PreviewAttempt {
  const passcode = previewPasscode(env);
  if (!passcode) return { ok: false, reason: "unconfigured" };

  const record = attempts.get(rateKey);
  if (record && now - record.windowStart < RATE_LIMIT_WINDOW_MS) {
    if (record.count >= RATE_LIMIT_MAX_ATTEMPTS) {
      return { ok: false, reason: "rate-limited" };
    }
    record.count += 1;
  } else {
    attempts.set(rateKey, { count: 1, windowStart: now });
  }

  if (!passcodeMatches(candidate.trim(), passcode)) {
    return { ok: false, reason: "wrong" };
  }

  attempts.delete(rateKey);
  return { ok: true, token: issueToken(passcode, now) };
}

/** Cookie options for the preview session. HttpOnly — script can never read it. */
export function previewCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

/** Read the request's cookie. The one call a preview page makes. */
export async function isPreviewAuthorized(): Promise<boolean> {
  const store = await cookies();
  return tokenValid(store.get(PREVIEW_COOKIE)?.value);
}

/** Exported for tests only — clears the in-memory throttle. */
export function __resetPreviewRateLimit(): void {
  attempts.clear();
}
