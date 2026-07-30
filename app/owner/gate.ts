// Shared owner gate — pure helpers, no next/headers, fully testable.
//
// There is ONE owner session for every private Step In The Ring surface. It
// is the same signed cookie the Author's Room has always used, verified with
// the same STORY_OWNER_PASSWORD-derived secret (app/author/auth.ts), so a
// login at /owner or /author opens every private room and one logout closes
// them all. Rotating the password invalidates every outstanding session.

import { sessionSecret, verifySessionToken } from "../author/auth";

type Env = Record<string, string | undefined>;

/** True when the supplied cookie value is a valid, unexpired owner session. */
export function hasOwnerSession(token: string | undefined, env: Env = process.env): boolean {
  return verifySessionToken(token, sessionSecret(env));
}

/** The private roots an owner may be returned to after logging in. */
export const PROTECTED_PREFIXES = ["/owner", "/author", "/engines", "/projects"] as const;

/**
 * Validate a post-login destination so the login page can never be used as an
 * open redirect. Only same-site paths under a protected root survive —
 * absolute URLs, protocol-relative //host tricks, javascript: schemes, and
 * unknown paths all fall back to the owner hub. The query string is kept so
 * engine handoffs (?pkg=…) survive the login detour; fragments are dropped.
 */
export function safeReturnTo(raw: string | null | undefined): string {
  if (!raw) return "/owner";
  let url: URL;
  try {
    url = new URL(raw, "https://sitr.internal");
  } catch {
    return "/owner";
  }
  if (url.origin !== "https://sitr.internal") return "/owner";
  const path = url.pathname;
  const allowed = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
  return allowed ? path + url.search : "/owner";
}
