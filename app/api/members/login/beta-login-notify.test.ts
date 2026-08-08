// The notification trigger, exercised through the REAL login route handler:
// exactly one notification on a successful beta admission, none on any denial,
// and no secret in what the notification helper receives.
// Every credential in this file is invented.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { MemoryMemberStore } from "../../../members/store";
import { resetRateLimiter } from "../../../members/auth";
import type { BetaLoginNotice } from "../../../members/login-notification";

const BETA_PW = "invented-beta-door-password";
let store: MemoryMemberStore;

vi.mock("../../../members/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../members/store")>();
  return { ...actual, getMemberStore: async () => store };
});

const notifySpy = vi.fn<(notice: BetaLoginNotice) => Promise<{ sent: boolean }>>(async () => ({
  sent: true,
}));
vi.mock("../../../members/login-notification", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../members/login-notification")>();
  return { ...actual, notifyBetaLogin: (notice: BetaLoginNotice) => notifySpy(notice) };
});

const { POST } = await import("./route");

const ORIGINAL_PW = process.env.SITR_BETA_ACCESS_PASSWORD;

beforeEach(() => {
  store = new MemoryMemberStore();
  process.env.SITR_BETA_ACCESS_PASSWORD = BETA_PW;
  resetRateLimiter();
  notifySpy.mockClear();
  notifySpy.mockImplementation(async () => ({ sent: true }));
});

afterEach(() => {
  if (ORIGINAL_PW === undefined) delete process.env.SITR_BETA_ACCESS_PASSWORD;
  else process.env.SITR_BETA_ACCESS_PASSWORD = ORIGINAL_PW;
});

function loginReq(email: string, password: string, ip = "203.0.113.7"): NextRequest {
  return new NextRequest("http://localhost/api/members/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ email, password }),
  });
}

function notice(): BetaLoginNotice {
  return notifySpy.mock.calls[0]![0];
}

describe("successful beta login", () => {
  it("notifies exactly once and still signs the tester in", async () => {
    const res = await POST(loginReq("Tester@Example.com", BETA_PW));
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("sitr-member-session=");
    expect(notifySpy).toHaveBeenCalledTimes(1);
  });

  it("passes the normalized entered email", async () => {
    await POST(loginReq("  Tester@Example.COM  ", BETA_PW));
    expect(notice().email).toBe("tester@example.com");
  });

  it("passes no password, no session token, and no other secret", async () => {
    const res = await POST(loginReq("tester@example.com", BETA_PW));
    const cookie = res.headers.get("set-cookie") ?? "";
    const sessionToken = /sitr-member-session=([^;]+)/.exec(cookie)?.[1] ?? "impossible";

    const payload = notice();
    expect(Object.keys(payload).sort()).toEqual(["email", "newTester", "occurredAt", "site"]);

    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain(BETA_PW);
    expect(serialized).not.toContain(sessionToken);
    expect(serialized).not.toContain("password");
    expect(serialized).not.toContain("token");
    expect(serialized.toLowerCase()).not.toContain("postgres");
  });

  it("marks a returning tester as not new", async () => {
    await POST(loginReq("tester@example.com", BETA_PW, "203.0.113.8"));
    expect(notice().newTester).toBe(true);
    notifySpy.mockClear();
    await POST(loginReq("tester@example.com", BETA_PW, "203.0.113.9"));
    expect(notice().newTester).toBe(false);
  });

  it("survives a notification failure — the login is still good", async () => {
    notifySpy.mockImplementation(async () => {
      throw new Error("provider down");
    });
    const res = await POST(loginReq("tester@example.com", BETA_PW, "203.0.113.10"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get("set-cookie")).toContain("sitr-member-session=");
  });
});

describe("denials never notify", () => {
  it("wrong password", async () => {
    const res = await POST(loginReq("tester@example.com", "not-the-beta-password"));
    expect(res.status).toBe(401);
    expect(notifySpy).not.toHaveBeenCalled();
  });

  it("revoked email, even with the correct beta password", async () => {
    const now = new Date().toISOString();
    await store.createUser({
      id: "user-revoked",
      email: "revoked@example.com",
      passwordHash: "scrypt$00$00",
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
      deletionRequestedAt: null,
    });
    await store.upsertEntitlement({
      userId: "user-revoked",
      status: "revoked",
      source: "beta-password",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      testerCodeId: null,
      revokedAt: now,
      adminNotes: "",
      createdAt: now,
      updatedAt: now,
    });

    const res = await POST(loginReq("revoked@example.com", BETA_PW));
    expect(res.status).toBe(403);
    expect(notifySpy).not.toHaveBeenCalled();
  });

  it("rate-limited request", async () => {
    for (let i = 0; i < 12; i++) {
      await POST(loginReq("tester@example.com", "wrong-guess", "198.51.100.5"));
    }
    notifySpy.mockClear();
    const res = await POST(loginReq("tester@example.com", BETA_PW, "198.51.100.5"));
    expect(res.status).toBe(429);
    expect(notifySpy).not.toHaveBeenCalled();
  });

  it("no beta password configured at all", async () => {
    delete process.env.SITR_BETA_ACCESS_PASSWORD;
    const res = await POST(loginReq("tester@example.com", BETA_PW, "198.51.100.6"));
    expect(res.status).not.toBe(200);
    expect(notifySpy).not.toHaveBeenCalled();
  });
});
