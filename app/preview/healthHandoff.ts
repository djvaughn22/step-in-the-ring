// Mints a short-lived, single-purpose proof that a visitor already typed
// the ONE shared health-preview code here — so iDontCry's own health-plan
// example page can skip asking for it a second time. See
// idontcry/src/lib/sitrHealthHandoff.ts (the matching verifier in the
// sibling repo) for the full contract; the two files must stay in sync.
//
// The two apps deliberately share ONE human-facing code: SITR_PREVIEW_
// PASSCODE here must equal iDontCry's FAMILY_HEALTH_PLAN_PASSWORD. This
// module never sends that password anywhere — it only signs a short-lived
// expiry with a key derived from it, in a namespace that can never collide
// with this app's own preview session token (see issueToken/tokenValid
// above, namespace "sitr-preview-session-v1").

import { createHash, createHmac } from "node:crypto";

const NAMESPACE = "sitr-health-handoff-v1:";
const TTL_MS = 5 * 60 * 1000;

function signingKey(sharedPasscode: string): Buffer {
  return createHash("sha256").update(`${NAMESPACE}${sharedPasscode}`).digest();
}

/** Returns null when the shared passcode is not configured — a visitor who
 *  somehow got here without one gets a plain external link, not a broken
 *  token. */
export function mintHealthHandoffToken(
  sharedPasscode: string | null,
  now: number = Date.now(),
): string | null {
  if (!sharedPasscode) return null;
  const payload = `sitr-health-${now + TTL_MS}`;
  const signature = createHmac("sha256", signingKey(sharedPasscode)).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

/** The href to actually link to for one external preview row: plain when it
 *  doesn't opt into the shared-code handoff (or the passcode isn't
 *  configured), token-appended when it does. Used by every page that lists
 *  EXTERNAL_PREVIEWS so the handoff logic exists in exactly one place. */
export function externalPreviewHref(
  href: string,
  sharedCode: boolean | undefined,
  sharedPasscode: string | null,
): string {
  if (!sharedCode) return href;
  const token = mintHealthHandoffToken(sharedPasscode);
  return token ? `${href}?sitr=${encodeURIComponent(token)}` : href;
}
