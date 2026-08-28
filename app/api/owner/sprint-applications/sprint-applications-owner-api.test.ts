// The owner Sprint-application triage endpoint, exercised through the real
// route handler and a real owner session token — same approach as
// app/owner/owner-boundary.test.ts for the publish API.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createSessionToken, SESSION_COOKIE, sessionSecret } from "../../../author/auth";
import { MemoryMemberStore } from "../../../members/store";

const TEST_PW = "invented-test-password-for-sprint-owner-api";
const ORIGINAL = process.env.STORY_OWNER_PASSWORD;

let store: MemoryMemberStore;

vi.mock("../../../members/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../members/store")>();
  return { ...actual, getMemberStore: async () => store };
});

const { GET, PATCH } = await import("./route");

beforeEach(() => {
  store = new MemoryMemberStore();
  process.env.STORY_OWNER_PASSWORD = TEST_PW;
});

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.STORY_OWNER_PASSWORD;
  else process.env.STORY_OWNER_PASSWORD = ORIGINAL;
});

function ownerCookie(): string {
  const token = createSessionToken(sessionSecret()!);
  return `${SESSION_COOKIE}=${token}`;
}

function getReq(cookie?: string): NextRequest {
  return new NextRequest("http://localhost/api/owner/sprint-applications", {
    headers: cookie ? { cookie } : {},
  });
}

function patchReq(body: unknown, cookie?: string): NextRequest {
  return new NextRequest("http://localhost/api/owner/sprint-applications", {
    method: "PATCH",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
}

describe("GET /api/owner/sprint-applications", () => {
  it("denies a request with no owner session", async () => {
    const res = await GET(getReq());
    expect(res.status).toBe(404);
  });

  it("denies the ordinary member session cookie shape, not just an absent one", async () => {
    const res = await GET(getReq(`${SESSION_COOKIE}=not-a-real-token`));
    expect(res.status).toBe(404);
  });

  it("lists applications for a valid owner session", async () => {
    await store.createSprintApplication({
      id: "app-1",
      name: "Dana",
      email: "dana@example.com",
      whatToFinish: "A booking page.",
      successLooksLike: "Customers can book.",
      timing: "asap",
      teamSize: "individual",
      marketingConsent: false,
      status: "new",
      createdAt: new Date().toISOString(),
    });
    const res = await GET(getReq(ownerCookie()));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.applications).toHaveLength(1);
  });
});

describe("PATCH /api/owner/sprint-applications", () => {
  it("denies a request with no owner session", async () => {
    const res = await PATCH(patchReq({ id: "app-1", status: "reviewed" }));
    expect(res.status).toBe(404);
  });

  it("updates status for a valid owner session", async () => {
    await store.createSprintApplication({
      id: "app-1",
      name: "Dana",
      email: "dana@example.com",
      whatToFinish: "A booking page.",
      successLooksLike: "Customers can book.",
      timing: "asap",
      teamSize: "individual",
      marketingConsent: false,
      status: "new",
      createdAt: new Date().toISOString(),
    });
    const res = await PATCH(patchReq({ id: "app-1", status: "reviewed" }, ownerCookie()));
    expect(res.status).toBe(200);
    const all = await store.listSprintApplications();
    expect(all[0].status).toBe("reviewed");
  });
});
