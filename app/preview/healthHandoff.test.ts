import { describe, it, expect } from "vitest";
import { createHash, createHmac } from "node:crypto";
import { mintHealthHandoffToken, externalPreviewHref } from "./healthHandoff";

const NAMESPACE = "sitr-health-handoff-v1:";

/** Mirrors idontcry/src/lib/sitrHealthHandoff.ts's verifier exactly — the
 *  two files are independently maintained in separate repos and must never
 *  drift apart. This test is the tripwire for that. */
function verifyLikeSibling(token: string, password: string, now = Date.now()): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  if (!payload.startsWith("sitr-health-")) return false;
  const key = createHash("sha256").update(`${NAMESPACE}${password}`).digest();
  const expected = createHmac("sha256", key).update(payload).digest("hex");
  if (expected !== signature) return false;
  const exp = Number(payload.slice("sitr-health-".length));
  return Number.isFinite(exp) && now <= exp;
}

describe("mintHealthHandoffToken", () => {
  it("returns null when no shared passcode is configured", () => {
    expect(mintHealthHandoffToken(null)).toBeNull();
  });

  it("mints a token the sibling repo's verifier accepts", () => {
    const token = mintHealthHandoffToken("23dkdkd");
    expect(token).not.toBeNull();
    expect(verifyLikeSibling(token as string, "23dkdkd")).toBe(true);
  });

  it("the sibling verifier rejects it under a different shared password", () => {
    const token = mintHealthHandoffToken("23dkdkd") as string;
    expect(verifyLikeSibling(token, "some-other-code")).toBe(false);
  });

  it("expires after the TTL", () => {
    const now = Date.now();
    const token = mintHealthHandoffToken("23dkdkd", now) as string;
    expect(verifyLikeSibling(token, "23dkdkd", now + 4 * 60 * 1000)).toBe(true);
    expect(verifyLikeSibling(token, "23dkdkd", now + 6 * 60 * 1000)).toBe(false);
  });
});

describe("externalPreviewHref", () => {
  const HREF = "https://idontcry.com/family/health-plan-example";
  const SSO = "https://idontcry.com/api/family-health-plan/sso";

  it("returns the plain page href when there's no SSO endpoint configured", () => {
    expect(externalPreviewHref(HREF, undefined, "23dkdkd")).toBe(HREF);
  });

  it("returns the plain href when the passcode isn't configured, even with an SSO endpoint set", () => {
    expect(externalPreviewHref(HREF, SSO, null)).toBe(HREF);
  });

  it("points at the SSO endpoint with a working handoff token when both are set", () => {
    const href = externalPreviewHref(HREF, SSO, "23dkdkd");
    expect(href.startsWith(`${SSO}?sitr=`)).toBe(true);
    const token = decodeURIComponent(href.slice(`${SSO}?sitr=`.length));
    expect(verifyLikeSibling(token, "23dkdkd")).toBe(true);
  });
});
