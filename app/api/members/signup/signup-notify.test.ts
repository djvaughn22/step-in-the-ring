import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetRateLimiter } from "../../../members/auth";
import type {
  BetaLoginNotice,
  NotifyResult,
} from "../../../members/login-notification";
import { MemoryMemberStore } from "../../../members/store";

let store: MemoryMemberStore;

vi.mock("../../../members/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../members/store")>();
  return { ...actual, getMemberStore: async () => store };
});

const notifySpy = vi.fn<(notice: BetaLoginNotice) => Promise<NotifyResult>>(
  async () => ({ sent: true }),
);

vi.mock("../../../members/login-notification", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../members/login-notification")>();
  return {
    ...actual,
    notifyBetaLogin: (notice: BetaLoginNotice) => notifySpy(notice),
  };
});

const { POST } = await import("./route");

/**
 * A password invented for these tests. The real production credential lives
 * only in SITR_BETA_ACCESS_PASSWORD in Vercel and must never appear here.
 */
const BETA_PW = "invented-tester-password-for-tests";
const ORIGINAL_PW = process.env.SITR_BETA_ACCESS_PASSWORD;

beforeEach(() => {
  store = new MemoryMemberStore();
  process.env.SITR_BETA_ACCESS_PASSWORD = BETA_PW;
  resetRateLimiter();
  notifySpy.mockClear();
  notifySpy.mockImplementation(async () => ({ sent: true }));
});

afterAll(() => {
  if (ORIGINAL_PW === undefined) delete process.env.SITR_BETA_ACCESS_PASSWORD;
  else process.env.SITR_BETA_ACCESS_PASSWORD = ORIGINAL_PW;
});

function request(
  email: string,
  password = BETA_PW,
  ip = "203.0.113.40",
): NextRequest {
  return new NextRequest("http://localhost/api/members/signup", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify({ email, password }),
  });
}

function notice(): BetaLoginNotice {
  return notifySpy.mock.calls[0]![0];
}

async function seed(email: string, status: string) {
  const now = new Date().toISOString();
  const user = {
    id: `user-${email}`,
    email,
    passwordHash: "not-used-by-this-door",
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
    deletionRequestedAt: null,
  };
  await store.createUser(user);
  await store.upsertEntitlement({
    userId: user.id,
    status: status as never,
    source: "none",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
    testerCodeId: null,
    revokedAt: status === "revoked" ? now : null,
    adminNotes: "",
    createdAt: now,
    updatedAt: now,
  });
  return user;
}

describe("shared-password join door — owner notification", () => {
  it("admits a brand-new tester and notifies exactly once", async () => {
    const res = await POST(request("NewMember@Example.com"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get("set-cookie")).toContain("sitr-member-session=");
    expect(notifySpy).toHaveBeenCalledTimes(1);
    expect(notice().email).toBe("newmember@example.com");
    expect(notice().via).toBe("account-signup");
  });

  it("grants tester access immediately — no approval queue", async () => {
    await POST(request("instant@example.com"));

    const user = await store.getUserByEmail("instant@example.com");
    const entitlement = await store.getEntitlement(user!.id);
    expect(entitlement?.status).toBe("tester");
    expect(entitlement?.source).toBe("beta-password");
  });

  it("upgrades an already-pending account instead of stranding it", async () => {
    const user = await seed("waiting@example.com", "pending");

    const res = await POST(request("waiting@example.com"));

    expect(res.status).toBe(200);
    expect((await store.getEntitlement(user.id))?.status).toBe("tester");
  });

  it("passes no password, hash, session token, user id or database detail", async () => {
    const res = await POST(request("private@example.com"));
    const cookie = res.headers.get("set-cookie") ?? "";
    const token =
      /sitr-member-session=([^;]+)/.exec(cookie)?.[1] ?? "impossible-token";

    const payload = notice();

    expect(Object.keys(payload).sort()).toEqual([
      "email",
      "occurredAt",
      "site",
      "via",
    ]);

    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain(BETA_PW);
    expect(serialized).not.toContain(token);
    expect(serialized.toLowerCase()).not.toContain("password");
    expect(serialized.toLowerCase()).not.toContain("postgres");
    expect(serialized.toLowerCase()).not.toContain("userid");
  });

  it("notifies again when a returning tester uses the door", async () => {
    const first = await POST(
      request("returning@example.com", BETA_PW, "203.0.113.41"),
    );
    expect(first.status).toBe(200);
    expect(notifySpy).toHaveBeenCalledTimes(1);

    notifySpy.mockClear();

    const again = await POST(
      request("returning@example.com", BETA_PW, "203.0.113.42"),
    );

    // Every use of the door is reported — the owner wants a record of activity,
    // not only of first contact.
    expect(again.status).toBe(200);
    expect(notifySpy).toHaveBeenCalledTimes(1);
  });

  it("rejects a wrong password without notifying", async () => {
    const res = await POST(
      request("stranger@example.com", "not-the-password", "203.0.113.44"),
    );

    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(notifySpy).not.toHaveBeenCalled();
  });

  it("denies a revoked account even with the correct password", async () => {
    await seed("revoked@example.com", "revoked");

    const res = await POST(
      request("revoked@example.com", BETA_PW, "203.0.113.45"),
    );

    expect(res.status).toBe(403);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(notifySpy).not.toHaveBeenCalled();
  });

  it("fails closed when no shared password is configured", async () => {
    delete process.env.SITR_BETA_ACCESS_PASSWORD;

    const res = await POST(
      request("anyone@example.com", "anything", "203.0.113.46"),
    );

    expect(res.status).toBe(503);
    expect(notifySpy).not.toHaveBeenCalled();
  });

  it("keeps the successful admission when owner email delivery fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    notifySpy.mockRejectedValueOnce(new Error("provider down"));

    const res = await POST(
      request("mailfail@example.com", BETA_PW, "203.0.113.43"),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get("set-cookie")).toContain("sitr-member-session=");
    expect(notifySpy).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });

  it("keeps mail credentials, the shared password and notification triggers out of the client", () => {
    const client = [
      readFileSync(
        join(process.cwd(), "app/members/signup/SignupContent.tsx"),
        "utf8",
      ),
      readFileSync(
        join(process.cwd(), "app/members/login/LoginContent.tsx"),
        "utf8",
      ),
    ].join("\\n");

    expect(client).not.toContain("login-notification");
    expect(client).not.toContain("notifyBetaLogin");
    expect(client).not.toContain("RESEND_API_KEY");
    expect(client).not.toContain("MEMBER_EMAIL_FROM");
    expect(client).not.toContain("SITR_BETA_ACCESS_PASSWORD");
    expect(client).not.toContain("ask@openmirrorllc.com");
  });
});
