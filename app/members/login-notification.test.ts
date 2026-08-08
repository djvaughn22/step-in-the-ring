// The owner notification helper, on its own: what it says, who it can ever be
// addressed to, and what it refuses to do when the mail provider misbehaves.
// Every value here is invented — no real secret appears in this file.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildBetaLoginMessage,
  formatCentralTimestamp,
  notifyBetaLogin,
  OWNER_NOTIFICATION_EMAIL,
  ownerNotificationEmail,
  resendSender,
  type OwnerMail,
} from "./login-notification";

const AT = new Date("2026-08-07T23:52:00.000Z"); // 6:52 PM Central

function recorder() {
  const sent: OwnerMail[] = [];
  return {
    sent,
    sender: async (mail: OwnerMail) => {
      sent.push(mail);
    },
  };
}

describe("recipient", () => {
  it("is the owner mailbox, always", () => {
    const mail = buildBetaLoginMessage({ email: "tester@example.com", occurredAt: AT, via: "beta-password" }, {});
    expect(mail?.to).toBe("ask@openmirrorllc.com");
    expect(mail?.to).toBe(OWNER_NOTIFICATION_EMAIL);
  });

  it("cannot be steered by the entered email", async () => {
    const hostile = [
      "attacker@evil.example",
      "tester@example.com, attacker@evil.example",
      "tester@example.com>\nBcc: attacker@evil.example",
      "tester@example.com\r\nTo: attacker@evil.example",
      '"tester@example.com" <attacker@evil.example>',
    ];
    for (const email of hostile) {
      const r = recorder();
      await notifyBetaLogin({ email, occurredAt: AT, via: "beta-password" }, { sender: r.sender, env: {} });
      for (const mail of r.sent) {
        expect(mail.to).toBe(OWNER_NOTIFICATION_EMAIL);
        // Nothing user-controlled can become a header line.
        expect(mail.subject).toBe("Step In The Ring — Beta Login");
        expect(mail.text).not.toMatch(/^(bcc|cc|to|from):/im);
      }
    }
  });

  it("honors a server-side override but ignores junk", () => {
    expect(ownerNotificationEmail({ OWNER_NOTIFICATION_EMAIL: "Owner@Example.com" })).toBe(
      "owner@example.com",
    );
    expect(ownerNotificationEmail({ OWNER_NOTIFICATION_EMAIL: "not-an-email" })).toBe(
      OWNER_NOTIFICATION_EMAIL,
    );
    expect(ownerNotificationEmail({})).toBe(OWNER_NOTIFICATION_EMAIL);
  });
});

describe("message body", () => {
  it("carries the normalized entered email, the time, and the outcome", () => {
    const mail = buildBetaLoginMessage(
      { email: "  Tester@Example.COM  ", occurredAt: AT, via: "beta-password", newTester: true },
      {},
    );
    expect(mail?.text).toContain("Email entered:\ntester@example.com");
    expect(mail?.text).toContain("Access:\nSuccessful beta login");
    expect(mail?.text).toContain("Time:\n2026-08-07 6:52 PM Central");
    expect(mail?.text).toContain("Tester:\nNew tester");
  });

  it("says which door was used, without claiming more than happened", () => {
    const account = buildBetaLoginMessage(
      { email: "member@example.com", occurredAt: AT, via: "account-password" },
      {},
    );
    expect(account?.subject).toBe("Step In The Ring — Sign In");
    expect(account?.text).toContain("Someone signed in to Step In The Ring.");
    expect(account?.text).toContain("Access:\nSuccessful sign in (account password)");
    expect(account?.text).toContain("Email entered:\nmember@example.com");
    expect(account?.text.toLowerCase()).not.toMatch(/verified|confirmed identity|email owner/);
    // The account door is not the beta door — never label one as the other.
    expect(account?.text).not.toContain("Successful beta login");
    expect(account?.to).toBe(OWNER_NOTIFICATION_EMAIL);
  });

  it("never claims the identity was verified", () => {
    const mail = buildBetaLoginMessage({ email: "tester@example.com", occurredAt: AT, via: "beta-password" }, {});
    expect(mail?.text.toLowerCase()).not.toMatch(/verified|confirmed identity|email owner/);
    expect(mail?.text).toContain("Email entered:");
  });

  it("formats the timestamp in Central time", () => {
    expect(formatCentralTimestamp(AT)).toBe("2026-08-07 6:52 PM Central");
  });

  it("is skipped entirely for an unusable email", async () => {
    expect(buildBetaLoginMessage({ email: "nonsense", occurredAt: AT, via: "beta-password" }, {})).toBeNull();
    const r = recorder();
    const result = await notifyBetaLogin({ email: 42, occurredAt: AT, via: "beta-password" }, { sender: r.sender });
    expect(result).toEqual({ sent: false, skipped: "invalid-email" });
    expect(r.sent).toHaveLength(0);
  });
});

describe("account signup message", () => {
  it("tells the fixed owner mailbox that a new account is pending approval", () => {
    const mail = buildBetaLoginMessage(
      {
        email: "  NewMember@Example.COM ",
        occurredAt: AT,
        via: "account-signup",
      },
      {},
    );

    expect(mail?.to).toBe(OWNER_NOTIFICATION_EMAIL);
    expect(mail?.to).toBe("ask@openmirrorllc.com");
    expect(mail?.subject).toBe("Step In The Ring — Account Pending Approval");
    expect(mail?.text).toContain("A new Step In The Ring account is waiting for approval.");
    expect(mail?.text).toContain("Email entered:\nnewmember@example.com");
    expect(mail?.text).toContain("Access:\nNew account awaiting owner approval");
    expect(mail?.text.toLowerCase()).not.toMatch(/verified|confirmed identity|email owner/);
  });
});

describe("delivery", () => {
  it("sends exactly one message per notice", async () => {
    const r = recorder();
    const result = await notifyBetaLogin(
      { email: "tester@example.com", occurredAt: AT, via: "beta-password" },
      { sender: r.sender, env: {} },
    );
    expect(result).toEqual({ sent: true });
    expect(r.sent).toHaveLength(1);
  });

  it("never throws when the provider fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await notifyBetaLogin(
      { email: "tester@example.com", occurredAt: AT, via: "beta-password" },
      {
        sender: async () => {
          throw new Error("provider exploded");
        },
        env: {},
      },
    );
    expect(result).toEqual({ sent: false, skipped: "delivery-failed" });
    spy.mockRestore();
  });

  it("logs no address and no provider body when delivery fails", async () => {
    const lines: string[] = [];
    const spy = vi
      .spyOn(console, "error")
      .mockImplementation((...args: unknown[]) => void lines.push(args.join(" ")));
    await notifyBetaLogin(
      { email: "tester@example.com", occurredAt: AT, via: "beta-password" },
      {
        sender: async () => {
          throw new Error("beta-login-notify: provider responded 500");
        },
        env: {},
      },
    );
    spy.mockRestore();
    expect(lines.join("\n")).not.toContain("tester@example.com");
    expect(lines.join("\n")).not.toContain(OWNER_NOTIFICATION_EMAIL);
  });

  it("skips quietly when no provider is configured", async () => {
    const result = await notifyBetaLogin({ email: "tester@example.com", occurredAt: AT, via: "beta-password" }, { env: {} });
    expect(result).toEqual({ sent: false, skipped: "not-configured" });
  });
});

describe("provider adapter", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("is null until both env values exist", () => {
    expect(resendSender({})).toBeNull();
    expect(resendSender({ RESEND_API_KEY: "re_invented" })).toBeNull();
    expect(resendSender({ MEMBER_EMAIL_FROM: "beta@example.com" })).toBeNull();
    expect(
      resendSender({ RESEND_API_KEY: "re_invented", MEMBER_EMAIL_FROM: "beta@example.com" }),
    ).toBeTypeOf("function");
  });

  it("posts to the owner address only, with the key in the header and never in the body", async () => {
    let captured: { url: string; init: RequestInit } | null = null;
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      captured = { url, init };
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;

    const send = resendSender({
      RESEND_API_KEY: "re_invented_test_key",
      MEMBER_EMAIL_FROM: "beta@example.com",
    })!;
    await send({
      to: OWNER_NOTIFICATION_EMAIL,
      subject: "Step In The Ring — Beta Login",
      text: "A tester entered Step In The Ring.",
    });

    const call = captured as unknown as { url: string; init: RequestInit };
    expect(call.url).toBe("https://api.resend.com/emails");
    const body = JSON.parse(String(call.init.body));
    expect(body.to).toEqual([OWNER_NOTIFICATION_EMAIL]);
    expect(body.from).toBe("beta@example.com");
    expect(String(call.init.body)).not.toContain("re_invented_test_key");
  });

  it("throws a status-only error the caller can swallow", async () => {
    globalThis.fetch = (async () => new Response("secret provider detail", { status: 422 })) as unknown as typeof fetch;
    const send = resendSender({
      RESEND_API_KEY: "re_invented_test_key",
      MEMBER_EMAIL_FROM: "beta@example.com",
    })!;
    await expect(
      send({ to: OWNER_NOTIFICATION_EMAIL, subject: "s", text: "t" }),
    ).rejects.toThrow("beta-login-notify: provider responded 422");
  });
});
