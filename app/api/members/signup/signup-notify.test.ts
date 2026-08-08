import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

const PASSWORD = "invented-signup-password-123";

beforeEach(() => {
  store = new MemoryMemberStore();
  resetRateLimiter();
  notifySpy.mockClear();
  notifySpy.mockImplementation(async () => ({ sent: true }));
});

function request(
  email: string,
  password = PASSWORD,
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

describe("new pending account owner notification", () => {
  it("notifies exactly once after a successful new signup", async () => {
    const res = await POST(request("NewMember@Example.com"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get("set-cookie")).toContain("sitr-member-session=");
    expect(notifySpy).toHaveBeenCalledTimes(1);
    expect(notice().email).toBe("newmember@example.com");
    expect(notice().via).toBe("account-signup");
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
    expect(serialized).not.toContain(PASSWORD);
    expect(serialized).not.toContain(token);
    expect(serialized.toLowerCase()).not.toContain("password");
    expect(serialized.toLowerCase()).not.toContain("postgres");
    expect(serialized.toLowerCase()).not.toContain("userid");
  });

  it("does not send another notification when duplicate signup is rejected", async () => {
    const first = await POST(
      request("duplicate@example.com", PASSWORD, "203.0.113.41"),
    );
    expect(first.status).toBe(200);
    expect(notifySpy).toHaveBeenCalledTimes(1);

    notifySpy.mockClear();

    const duplicate = await POST(
      request("duplicate@example.com", PASSWORD, "203.0.113.42"),
    );

    expect(duplicate.status).toBe(409);
    expect(notifySpy).not.toHaveBeenCalled();
  });

  it("keeps the successful signup when owner email delivery fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    notifySpy.mockRejectedValueOnce(new Error("provider down"));

    const res = await POST(
      request("mailfail@example.com", PASSWORD, "203.0.113.43"),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get("set-cookie")).toContain("sitr-member-session=");
    expect(notifySpy).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });

  it("keeps mail credentials and notification triggers out of client/pending UI", () => {
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
    expect(client).not.toContain("ask@openmirrorllc.com");
  });
});
