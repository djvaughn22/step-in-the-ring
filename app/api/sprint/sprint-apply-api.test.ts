// The public Sprint application endpoint, exercised through the real route
// handler. No session is involved on purpose — applying does not require an
// account — so this mocks only the store, the same pattern
// app/api/builds/builds-api.test.ts uses for the member-backed Build API.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { MemoryMemberStore } from "../../members/store";
import { __resetSprintApplicationRateLimit } from "../../members/sprintApplication";

let store: MemoryMemberStore;

vi.mock("../../members/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../members/store")>();
  return { ...actual, getMemberStore: async () => store };
});

const { POST } = await import("./apply/route");

const VALID = {
  name: "Dana Owner",
  email: "dana@example.com",
  whatToFinish: "A booking page for my studio.",
  successLooksLike: "A customer can pick a time and pay.",
  timing: "asap",
  teamSize: "individual",
  marketingConsent: false,
};

function req(body: unknown, ip = "203.0.113.1"): NextRequest {
  return new NextRequest("http://localhost/api/sprint/apply", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  store = new MemoryMemberStore();
  __resetSprintApplicationRateLimit();
});

describe("POST /api/sprint/apply", () => {
  it("accepts no session and records a real application", async () => {
    const res = await POST(req(VALID));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    const all = await store.listSprintApplications();
    expect(all).toHaveLength(1);
    expect(all[0].email).toBe("dana@example.com");
  });

  it("rejects an invalid submission with a 422 and does not store it", async () => {
    const res = await POST(req({ ...VALID, email: "not-an-email" }, "203.0.113.2"));
    expect(res.status).toBe(422);
    expect(await store.listSprintApplications()).toHaveLength(0);
  });

  it("never stores marketing consent as true unless explicitly sent", async () => {
    const { marketingConsent, ...withoutConsent } = VALID;
    void marketingConsent;
    const res = await POST(req(withoutConsent, "203.0.113.3"));
    expect(res.status).toBe(200);
    const all = await store.listSprintApplications();
    expect(all[0].marketingConsent).toBe(false);
  });

  it("rate-limits repeated applications from the same client address", async () => {
    const ip = "203.0.113.9";
    for (let i = 0; i < 5; i++) {
      const res = await POST(req({ ...VALID, email: `person${i}@example.com` }, ip));
      expect(res.status).toBe(200);
    }
    const blocked = await POST(req({ ...VALID, email: "one-more@example.com" }, ip));
    expect(blocked.status).toBe(429);
  });

  it("a different client address is not affected by another address's limit", async () => {
    for (let i = 0; i < 5; i++) {
      await POST(req({ ...VALID, email: `person${i}@example.com` }, "203.0.113.10"));
    }
    const res = await POST(req({ ...VALID, email: "fresh@example.com" }, "203.0.113.11"));
    expect(res.status).toBe(200);
  });
});
