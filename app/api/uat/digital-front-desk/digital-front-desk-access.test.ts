// The Digital Front Desk access model, exercised through the REAL route
// handlers — the functional counterpart to
// app/uat/digital-front-desk/access-model.test.ts's source-level checks.
//
// Two things are true at once here, and both are tested:
//   1. Right now (DFD_OPEN_UAT_MODE = true): a customer can submit a
//      request with no owner session, AND so can anyone reach the queue,
//      change a request, or use onboarding/admin — that's the accepted,
//      documented trade-off for this open UAT period.
//   2. The underlying owner check still WORKS — dfdOwnerGate(req, false)
//      (explicitly overriding the open-mode default) still 404s a request
//      with no cookie and admits one with a valid owner cookie. This is
//      what "the gate is intact, not deleted" actually means in a test,
//      not just a comment.
// The feature flag (DIGITAL_FRONT_DESK_UAT_ENABLED) always wins over both:
// off, and everything 404s regardless of open mode or owner session.

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { createSessionToken, sessionSecret } from "../../../author/auth";
import { _resetStoreForTests } from "../../../uat/digital-front-desk/lib/store";
import { dfdOwnerGate } from "../../../uat/digital-front-desk/lib/apiGate";
import { GET as requestsGET, POST as requestsPOST } from "./requests/route";
import { PATCH as requestPATCH } from "./requests/[id]/route";
import { GET as onboardingGET, POST as onboardingPOST } from "./onboarding/route";
import { GET as adminGET, POST as adminPOST } from "./admin/route";

const TEST_PW = "invented-test-password";
const ORIGINAL_PW = process.env.STORY_OWNER_PASSWORD;
const ORIGINAL_FLAG = process.env.DIGITAL_FRONT_DESK_UAT_ENABLED;

const VALID_INTAKE = {
  customerName: "Jamie Rivera",
  customerEmail: "jamie@example.com",
  customerPhone: "(555) 111-2222",
  serviceArea: "Downtown",
  serviceId: "repairs",
  description: "A leaky pipe under the sink.",
  urgency: "soon",
  preferredContact: "email",
  consentToUpdates: true,
};

function ownerCookieHeader(): string {
  const token = createSessionToken(sessionSecret()!);
  return `sitr-author-session=${token}`;
}

function req(url: string, init: { method?: string; cookie?: string; body?: unknown } = {}): NextRequest {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (init.cookie) headers.cookie = init.cookie;
  return new NextRequest(`http://localhost${url}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
}

beforeEach(() => {
  process.env.STORY_OWNER_PASSWORD = TEST_PW;
  process.env.DIGITAL_FRONT_DESK_UAT_ENABLED = "true";
  _resetStoreForTests();
});

afterEach(() => {
  if (ORIGINAL_PW === undefined) delete process.env.STORY_OWNER_PASSWORD;
  else process.env.STORY_OWNER_PASSWORD = ORIGINAL_PW;
  if (ORIGINAL_FLAG === undefined) delete process.env.DIGITAL_FRONT_DESK_UAT_ENABLED;
  else process.env.DIGITAL_FRONT_DESK_UAT_ENABLED = ORIGINAL_FLAG;
  _resetStoreForTests();
});

describe("public customer intake — no owner session required (unchanged by open-UAT mode)", () => {
  it("accepts a valid submission with no cookie at all", async () => {
    const res = await requestsPOST(req("/api/uat/digital-front-desk/requests", { method: "POST", body: VALID_INTAKE }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.request.confirmationNumber).toMatch(/^DFD-/);
  });

  it("still validates and rejects an invalid submission (422), not silently", async () => {
    const res = await requestsPOST(req("/api/uat/digital-front-desk/requests", { method: "POST", body: { ...VALID_INTAKE, customerEmail: "not-an-email" } }));
    expect(res.status).toBe(422);
  });
});

describe("open UAT mode: operational routes are reachable with no owner cookie right now", () => {
  it("GET the queue with no cookie succeeds (accepted, documented trade-off)", async () => {
    await requestsPOST(req("/api/uat/digital-front-desk/requests", { method: "POST", body: VALID_INTAKE }));
    const res = await requestsGET(req("/api/uat/digital-front-desk/requests"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.requests.length).toBe(1);
  });

  it("PATCH (assign/status/note/next-action) with no cookie succeeds", async () => {
    const created = await requestsPOST(req("/api/uat/digital-front-desk/requests", { method: "POST", body: VALID_INTAKE }));
    const { request } = await created.json();
    const res = await requestPATCH(
      req(`/api/uat/digital-front-desk/requests/${request.id}`, { method: "PATCH", body: { action: "assign", assignee: "Owner" } }),
      { params: Promise.resolve({ id: request.id }) },
    );
    expect(res.status).toBe(200);
    expect((await res.json()).request.assignedTo).toBe("Owner");
  });

  it("onboarding GET and POST succeed with no cookie", async () => {
    expect((await onboardingGET(req("/api/uat/digital-front-desk/onboarding"))).status).toBe(200);
    expect(
      (await onboardingPOST(req("/api/uat/digital-front-desk/onboarding", { method: "POST", body: { plan: "starter", businessName: "Acme", email: "a@b.com" } }))).status,
    ).toBe(200);
  });

  it("admin GET and POST (seed/reset/export) succeed with no cookie", async () => {
    expect((await adminGET(req("/api/uat/digital-front-desk/admin"))).status).toBe(200);
    expect((await adminPOST(req("/api/uat/digital-front-desk/admin", { method: "POST", body: { action: "seed" } }))).status).toBe(200);
  });
});

describe("the underlying owner check is intact — proven by exercising it directly", () => {
  // dfdOwnerGate's `openMode` parameter defaults to the real
  // DFD_OPEN_UAT_MODE constant. Passing `false` here exercises the exact
  // same isOwnerRequest() branch that runs once the constant is restored —
  // this is what "the gate still works, it's just switched off" means in a
  // test, not only in a comment.
  it("denies a request with no cookie when open mode is off", () => {
    const res = dfdOwnerGate(req("/api/uat/digital-front-desk/requests"), false);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(404);
  });

  it("denies a request with a tampered cookie when open mode is off", () => {
    const res = dfdOwnerGate(req("/api/uat/digital-front-desk/requests", { cookie: "sitr-author-session=garbage" }), false);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(404);
  });

  it("admits a valid owner session when open mode is off", () => {
    const res = dfdOwnerGate(req("/api/uat/digital-front-desk/requests", { cookie: ownerCookieHeader() }), false);
    expect(res).toBeNull();
  });

  it("still 404s with open mode off if the feature flag itself is off — the flag always wins", () => {
    process.env.DIGITAL_FRONT_DESK_UAT_ENABLED = "false";
    const res = dfdOwnerGate(req("/api/uat/digital-front-desk/requests", { cookie: ownerCookieHeader() }), false);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(404);
  });
});

describe("the feature flag off 404s everything, open mode or not", () => {
  beforeEach(() => {
    process.env.DIGITAL_FRONT_DESK_UAT_ENABLED = "false";
  });

  it("public intake POST 404s with the flag off", async () => {
    const res = await requestsPOST(req("/api/uat/digital-front-desk/requests", { method: "POST", body: VALID_INTAKE }));
    expect(res.status).toBe(404);
  });

  it("the queue GET 404s with the flag off, even though open mode would otherwise allow it", async () => {
    const res = await requestsGET(req("/api/uat/digital-front-desk/requests"));
    expect(res.status).toBe(404);
  });

  it("admin POST 404s with the flag off", async () => {
    const res = await adminPOST(req("/api/uat/digital-front-desk/admin", { method: "POST", body: { action: "seed" } }));
    expect(res.status).toBe(404);
  });
});
