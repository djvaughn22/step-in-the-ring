// ─────────────────────────────────────────────────────────────────────────────
// Owner notification — "somebody just signed in."
//
// Both doors report here: the shared private-beta password and an ordinary
// account password. Deliberately small, and deliberately honest about what it
// knows:
//
//   - Neither door proves the person owns that inbox. So nothing here ever
//     says verified/confirmed. It says "Email entered", because that is all
//     that happened.
//   - The recipient is fixed owner infrastructure, resolved SERVER-SIDE only.
//     The tester's submitted email is BODY CONTENT — never a recipient, never
//     a header value, never concatenated into one.
//   - No secret can reach this module: the input type has no field for a
//     password, a password hash, a session token, a cookie, or a database id,
//     and nothing here reads one.
//   - Delivery is best-effort. notifyBetaLogin() never throws and never
//     surfaces provider internals. A mail outage must not turn a valid login
//     into a failed one.
//
// Provider: the same Resend REST call the family already uses (CrossHeartPray's
// bingo mailer), reached with fetch so no second email service is introduced.
// With RESEND_API_KEY / MEMBER_EMAIL_FROM unset the notification is skipped and
// login is completely unaffected — the same fail-quiet shape auth.ts describes.
// ─────────────────────────────────────────────────────────────────────────────

import { normalizeEmail } from "./auth";

/** Fixed owner mailbox. Server-only — no NEXT_PUBLIC_, never sent to a client. */
export const OWNER_NOTIFICATION_EMAIL = "ask@openmirrorllc.com";

/** Env override for the owner mailbox, for when the owner address changes. */
export function ownerNotificationEmail(
  env: Record<string, string | undefined> = process.env,
): string {
  const raw = env.OWNER_NOTIFICATION_EMAIL?.trim();
  return raw && normalizeEmail(raw) ? raw.toLowerCase() : OWNER_NOTIFICATION_EMAIL;
}

/**
 * Which door the person came through. Neither one proves inbox ownership, so
 * neither one is ever described as verified — the account-password path only
 * proves the account's own password was known.
 */
export type LoginVia = "beta-password" | "account-password";

export type BetaLoginNotice = {
  /** The email the person typed. Claimed, not verified. */
  email: unknown;
  occurredAt: Date;
  via: LoginVia;
  /** True when this admission created the tester record for the first time. */
  newTester?: boolean;
  site?: string;
};

export type OwnerMail = { to: string; subject: string; text: string };
export type MailSender = (mail: OwnerMail) => Promise<void>;

export type NotifyResult = { sent: boolean; skipped?: string };

/** "2026-08-07 6:52 PM Central" — the owner reads these in their own time. */
export function formatCentralTimestamp(at: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")} ${get(
    "dayPeriod",
  )} Central`;
}

/**
 * Build the message. The recipient is always the owner mailbox — the entered
 * email only ever appears inside the body text.
 */
export function buildBetaLoginMessage(
  notice: BetaLoginNotice,
  env: Record<string, string | undefined> = process.env,
): OwnerMail | null {
  const email = normalizeEmail(notice.email);
  if (!email) return null;

  const beta = notice.via === "beta-password";
  const lines = [
    beta ? "A tester entered Step In The Ring." : "Someone signed in to Step In The Ring.",
    "",
    "Email entered:",
    email,
    "",
    "Time:",
    formatCentralTimestamp(notice.occurredAt),
    "",
    "Access:",
    beta ? "Successful beta login" : "Successful sign in (account password)",
  ];
  if (notice.newTester !== undefined) {
    lines.push("", "Tester:", notice.newTester ? "New tester" : "Existing tester");
  }
  if (notice.site) lines.push("", "Site:", notice.site);
  lines.push(
    "",
    "Note: signing in does not prove inbox ownership. This is the address",
    "entered at sign in, nothing more.",
  );

  return {
    to: ownerNotificationEmail(env),
    subject: beta ? "Step In The Ring — Beta Login" : "Step In The Ring — Sign In",
    text: lines.join("\n"),
  };
}

/**
 * The configured sender, or null when RESEND_API_KEY / MEMBER_EMAIL_FROM are
 * absent. Absent config means the notification is skipped — never that login
 * breaks.
 */
export function resendSender(
  env: Record<string, string | undefined> = process.env,
): MailSender | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.MEMBER_EMAIL_FROM?.trim();
  if (!apiKey || !from) return null;

  return async function sendViaResend(mail) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      // Provider bodies can echo addresses and key hints — never log them.
      throw new Error(`beta-login-notify: provider responded ${response.status}`);
    }
  };
}

/**
 * Tell the owner that a beta login succeeded. Never throws: every failure is
 * recorded as a short, secret-free server note and reported as `sent: false`.
 */
export async function notifyBetaLogin(
  notice: BetaLoginNotice,
  deps: { sender?: MailSender | null; env?: Record<string, string | undefined> } = {},
): Promise<NotifyResult> {
  const env = deps.env ?? process.env;
  try {
    const mail = buildBetaLoginMessage(notice, env);
    if (!mail) return { sent: false, skipped: "invalid-email" };

    const sender = deps.sender !== undefined ? deps.sender : resendSender(env);
    if (!sender) return { sent: false, skipped: "not-configured" };

    await sender(mail);
    return { sent: true };
  } catch (err) {
    // Safe server-side note only: no address, no provider body, no secret.
    console.error(
      "[beta-login-notify] delivery failed:",
      err instanceof Error ? err.message : "unknown error",
    );
    return { sent: false, skipped: "delivery-failed" };
  }
}
