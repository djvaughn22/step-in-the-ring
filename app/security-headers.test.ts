// Site-wide security headers live in next.config.ts next to the private-route
// headers. This locks both in so a later config edit can't drop either.
import { describe, expect, it } from "vitest";
import nextConfig, { PRIVATE_ROUTES, SECURITY_HEADERS } from "../next.config";

describe("site-wide security headers", () => {
  it("are nosniff, a strict referrer policy and same-origin framing", () => {
    expect(Object.fromEntries(SECURITY_HEADERS.map((h) => [h.key, h.value]))).toEqual({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "SAMEORIGIN",
    });
  });

  it("apply to every page, and the private-route headers are still there", async () => {
    const rules = await nextConfig.headers!();
    expect(rules.find((r) => r.source === "/:path*")?.headers).toEqual(SECURITY_HEADERS);
    const privateRules = rules.filter((r) => r.source !== "/:path*");
    expect(privateRules.map((r) => r.source)).toEqual(PRIVATE_ROUTES);
  });

  it("never set the same header twice on a private route", async () => {
    const rules = await nextConfig.headers!();
    const privateKeys = rules.filter((r) => r.source !== "/:path*").flatMap((r) => r.headers.map((h) => h.key));
    for (const h of SECURITY_HEADERS) expect(privateKeys).not.toContain(h.key);
  });
});
