// The Digital Front Desk access split, exercised through the REAL route
// handlers — the functional counterpart to
// app/uat/digital-front-desk/access-model.test.ts's source-level checks.
//
// The rule under test: a customer can submit a request with no owner
// session, but can never list, read, or change requests, and the owner-only
// surfaces (queue listing, status/assignment/notes/next-action, onboarding
// leads, admin) all require the real owner session — with or without it,
// everything 404s the instant the feature flag is off.

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { createSessionToken, sessionSecret } from "../../../author/auth";
import { _resetStoreForTests } from "../../../uat/digital-front-desk/lib/store";
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

describe("public customer intake — no owner session required", () => {
  it("accepts a valid submission with no cookie at all", async () => {
    const res = await requestsPOST(req("/api/uat/digital-front-desk/requests", { method: "POST", body: VALID_INTAKE }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.request.confirmationNumber).toMatch(/^DFD-/);
    // The response is the customer's OWN new record — not the queue.
    expect(data.request.customerName).toBe("Jamie Rivera");
  });

  it("still validates and rejects an invalid submission (400/422), not silently", async () => {
    const res = await requestsPOST(req("/api/uat/digital-front-desk/requests", { method: "POST", body: { ...VALID_INTAKE, customerEmail: "not-an-email" } }));
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.ok).toBe(false);
  });
});

describe("the request queue and every change to a request stay owner-only", () => {
  it("GET the queue with no cookie is 404, not an empty list", async () => {
    const res = await requestsGET(req("/api/uat/digital-front-desk/requests"));
    expect(res.status).toBe(404);
  });

  it("GET the queue with a valid owner cookie sees the submitted request", async () => {
    await requestsPOST(req("/api/uat/digital-front-desk/requests", { method: "POST", body: VALID_INTAKE }));
    const res = await requestsGET(req("/api/uat/digital-front-desk/requests", { cookie: ownerCookieHeader() }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.requests.length).toBe(1);
  });

  it("PATCH (status/assign/note/next-action) with no cookie is 404", async () => {
    const created = await requestsPOST(req("/api/uat/digital-front-desk/requests", { method: "POST", body: VALID_INTAKE }));
    const { request } = await created.json();
    const res = await requestPATCH(
      req(`/api/uat/digital-front-desk/requests/${request.id}`, { method: "PATCH", body: { action: "assign", assignee: "Owner" } }),
      { params: Promise.resolve({ id: request.id }) },
    );
    expect(res.status).toBe(404);
  });

  it("PATCH with a valid owner cookie succeeds", async () => {
    const created = await requestsPOST(req("/api/uat/digital-front-desk/requests", { method: "POST", body: VALID_INTAKE }));
    const { request } = await created.json();
    const res = await requestPATCH(
      req(`/api/uat/digital-front-desk/requests/${request.id}`, { method: "PATCH", cookie: ownerCookieHeader(), body: { action: "assign", assignee: "Owner" } }),
      { params: Promise.resolve({ id: request.id }) },
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.request.assignedTo).toBe("Owner");
  });
});

describe("onboarding and admin stay owner-only", () => {
  it("onboarding GET and POST are 404 with no cookie", async () => {
    expect((await onboardingGET(req("/api/uat/digital-front-desk/onboarding"))).status).toBe(404);
    expect(
      (await onboardingPOST(req("/api/uat/digital-front-desk/onboarding", { method: "POST", body: { plan: "starter", businessName: "Acme", email: "a@b.com" } }))).status,
    ).toBe(404);
  });

  it("onboarding GET and POST succeed with a valid owner cookie", async () => {
    const cookie = ownerCookieHeader();
    const post = await onboardingPOST(req("/api/uat/digital-front-desk/onboarding", { method: "POST", cookie, body: { plan: "starter", businessName: "Acme", email: "a@b.com" } }));
    expect(post.status).toBe(200);
    const get = await onboardingGET(req("/api/uat/digital-front-desk/onboarding", { cookie }));
    expect(get.status).toBe(200);
  });

  it("admin GET and POST are 404 with no cookie", async () => {
    expect((await adminGET(req("/api/uat/digital-front-desk/admin"))).status).toBe(404);
    expect((await adminPOST(req("/api/uat/digital-front-desk/admin", { method: "POST", body: { action: "seed" } }))).status).toBe(404);
  });

  it("admin seed/reset succeed with a valid owner cookie", async () => {
    const cookie = ownerCookieHeader();
    const res = await adminPOST(req("/api/uat/digital-front-desk/admin", { method: "POST", cookie, body: { action: "seed" } }));
    expect(res.status).toBe(200);
  });
});

describe("the feature flag off 404s everything, owner session or not", () => {
  beforeEach(() => {
    process.env.DIGITAL_FRONT_DESK_UAT_ENABLED = "false";
  });

  it("public intake POST 404s with the flag off", async () => {
    const res = await requestsPOST(req("/api/uat/digital-front-desk/requests", { method: "POST", body: VALID_INTAKE }));
    expect(res.status).toBe(404);
  });

  it("owner-authenticated queue GET 404s with the flag off", async () => {
    const res = await requestsGET(req("/api/uat/digital-front-desk/requests", { cookie: ownerCookieHeader() }));
    expect(res.status).toBe(404);
  });

  it("owner-authenticated admin POST 404s with the flag off", async () => {
    const res = await adminPOST(req("/api/uat/digital-front-desk/admin", { method: "POST", cookie: ownerCookieHeader(), body: { action: "seed" } }));
    expect(res.status).toBe(404);
  });
});
