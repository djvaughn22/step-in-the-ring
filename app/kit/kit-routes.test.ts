// The three kit routes, through real NextRequests. Stripe and the file store
// are faked at their module boundary; cookies, redirects and headers are real.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetRateLimits } from "../lib/rateLimit";
import type { KitAccess } from "./kitStripe";

let access: KitAccess = { state: "invalid" };
let file: { bytes: Uint8Array; filename: string; contentType: string } | null = null;
let checkout: { ok: true; url: string } | { ok: false; reason: string } = { ok: true, url: "https://checkout.stripe.com/c/pay/x" };
const seen: unknown[] = [];

vi.mock("./kitStripe", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./kitStripe")>();
  return {
    ...actual,
    checkKitAccessFromEnv: vi.fn(async (id: unknown) => {
      seen.push(id);
      return access;
    }),
    getKitGateway: vi.fn(async () => ({})),
    startKitCheckout: vi.fn(async () => checkout),
  };
});

vi.mock("./kitFile", () => ({
  getKitFileSource: async () => ({
    info: async () => null,
    load: async () => (file ? { ...file, version: "1.0", byteLength: file.bytes.byteLength, uploadedAt: "" } : null),
  }),
  kitFileReady: async () => Boolean(file),
}));

const { GET: OPEN } = await import("./open/route");
const { GET: DOWNLOAD } = await import("./download/route");
const { POST: CHECKOUT } = await import("../api/kit/checkout/route");

const SID = "cs_test_a1B2c3D4e5F6g7H8i9J0";
const BASE = "https://stepinthering.com";

beforeEach(() => {
  resetRateLimits();
  seen.length = 0;
  access = { state: "invalid" };
  file = null;
  checkout = { ok: true, url: "https://checkout.stripe.com/c/pay/x" };
  vi.unstubAllEnvs();
});

describe("/kit/open", () => {
  it("remembers the browser for a paid purchase and lands on the kit page", async () => {
    access = { state: "paid", sessionId: SID, email: null };
    const res = await OPEN(new NextRequest(`${BASE}/kit/open?session_id=${SID}`));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`${BASE}/kit?welcome=1`);
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`sitr-kit=${SID}`);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Path=\/kit/);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(res.headers.get("referrer-policy")).toBe("no-referrer");
    expect(seen).toEqual([SID]);
  });

  it("sets no cookie for a link that doesn't check out", async () => {
    const res = await OPEN(new NextRequest(`${BASE}/kit/open?session_id=nope`));
    expect(res.headers.get("location")).toBe(`${BASE}/kit?state=invalid`);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("forgets the browser after a refund", async () => {
    access = { state: "refunded" };
    const res = await OPEN(new NextRequest(`${BASE}/kit/open?session_id=${SID}`));
    expect(res.headers.get("location")).toBe(`${BASE}/kit?state=refunded`);
    expect(res.headers.get("set-cookie") ?? "").toMatch(/sitr-kit=;.*Max-Age=0/i);
  });

  it("slows down someone guessing links", async () => {
    let last: Response | null = null;
    for (let i = 0; i < 31; i++) last = await OPEN(new NextRequest(`${BASE}/kit/open?session_id=${SID}`, { headers: { "x-forwarded-for": "9.9.9.9" } }));
    expect(last?.headers.get("location")).toBe(`${BASE}/kit?state=busy`);
  });
});

describe("/kit/download", () => {
  it("sends strangers to the kit page, never the file", async () => {
    file = { bytes: new Uint8Array([37, 80, 68, 70]), filename: "Ready-to-Build-Kit-v1.0.pdf", contentType: "application/pdf" };
    const res = await DOWNLOAD(new NextRequest(`${BASE}/kit/download`));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`${BASE}/kit`);
  });

  it("serves the PDF privately to a confirmed buyer", async () => {
    access = { state: "paid", sessionId: SID, email: null };
    file = { bytes: new Uint8Array([37, 80, 68, 70]), filename: "Ready-to-Build-Kit-v1.0.pdf", contentType: "application/pdf" };
    const res = await DOWNLOAD(new NextRequest(`${BASE}/kit/download`, { headers: { cookie: `sitr-kit=${SID}` } }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toBe('attachment; filename="Ready-to-Build-Kit-v1.0.pdf"');
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(new Uint8Array([37, 80, 68, 70]));
    expect(seen).toEqual([SID]);
  });

  it("explains a missing file instead of failing", async () => {
    access = { state: "paid", sessionId: SID, email: null };
    const res = await DOWNLOAD(new NextRequest(`${BASE}/kit/download`, { headers: { cookie: `sitr-kit=${SID}` } }));
    expect(res.headers.get("location")).toBe(`${BASE}/kit?file=missing`);
  });

  it("closes the download after a refund", async () => {
    access = { state: "refunded" };
    file = { bytes: new Uint8Array([1]), filename: "k.pdf", contentType: "application/pdf" };
    const res = await DOWNLOAD(new NextRequest(`${BASE}/kit/download`, { headers: { cookie: `sitr-kit=${SID}` } }));
    expect(res.headers.get("location")).toBe(`${BASE}/kit`);
  });
});

describe("/api/kit/checkout", () => {
  const post = () => CHECKOUT(new NextRequest(`${BASE}/api/kit/checkout`, { method: "POST" }));

  it("goes nowhere near Stripe while sales are closed", async () => {
    const res = await post();
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`${BASE}/products/ready-to-build?checkout=closed#kit`);
  });

  it("hands an open checkout straight to Stripe", async () => {
    vi.stubEnv("SITR_KIT_SALES", "open");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    vi.stubEnv("STRIPE_KIT_PRICE_ID", "price_kit");
    vi.stubEnv("MEMBER_APP_URL", BASE);
    const res = await post();
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("https://checkout.stripe.com/c/pay/x");
  });

  it("comes back with an honest note when checkout can't start", async () => {
    vi.stubEnv("SITR_KIT_SALES", "open");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    vi.stubEnv("STRIPE_KIT_PRICE_ID", "price_kit");
    vi.stubEnv("MEMBER_APP_URL", BASE);
    checkout = { ok: false, reason: "price-mismatch" };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await post();
    expect(res.headers.get("location")).toBe(`${BASE}/products/ready-to-build?checkout=unavailable#kit`);
    expect(spy).toHaveBeenCalledWith("[kit] checkout did not start: price-mismatch");
    spy.mockRestore();
  });
});
