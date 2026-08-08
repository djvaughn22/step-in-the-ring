import { after, NextRequest, NextResponse } from "next/server";
import { MEMBER_SESSION_COOKIE } from "../../../members/auth";
import { betaAdmit } from "../../../members/beta-access";
import {
  notifyBetaLogin,
  type BetaLoginNotice,
} from "../../../members/login-notification";
import { memberCookieOptions } from "../../../members/session";
import { getMemberStore } from "../../../members/store";

export const runtime = "nodejs";

const UNCONFIGURED = {
  ok: false,
  error: "Accounts are not open yet — membership is in private beta.",
};

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/**
 * Tell the owner a tester just joined through the shared-password door.
 * The notification contains only the claimed email, time, event type and site.
 * Passwords, password hashes, session tokens and database ids never enter it.
 *
 * Delivery is best-effort: admission wins even if email delivery fails.
 */
async function notifyOwnerOfSignup(email: string): Promise<void> {
  if (!email) return;

  const notice: BetaLoginNotice = {
    email,
    occurredAt: new Date(),
    via: "account-signup",
    site: process.env.MEMBER_APP_URL ?? "https://stepinthering.com",
  };

  const attempt = async () => {
    try {
      const result = await notifyBetaLogin(notice);
      if (!result.sent) {
        console.error(
          "[member-signup-notify] owner notification not sent:",
          result.skipped ?? "unknown",
        );
      }
    } catch {
      console.error("[member-signup-notify] unexpected notification failure");
    }
  };

  try {
    after(attempt);
  } catch {
    // Tests or runtimes without a request-scoped after() hook.
    await attempt();
  }
}

/**
 * Private-beta join door.
 *
 * Owner decision (2026-08-08, UAT): there is no approval queue. Anyone who
 * knows the shared beta password is admitted as a tester immediately, exactly
 * as the login route already does. This route therefore delegates to the SAME
 * `betaAdmit` core rather than creating `pending` accounts of its own — one
 * admission rule, one place to change it, no second weaker path.
 *
 * The owner's kill switch still outranks the shared password: `betaAdmit`
 * denies a revoked entitlement with 403 and never downgrades an owner or a
 * paid-active account to tester.
 */
export async function POST(req: NextRequest) {
  const store = await getMemberStore();
  if (!store) return NextResponse.json(UNCONFIGURED, { status: 503 });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const beta = await betaAdmit(
    store,
    { email: body.email, password: body.password },
    { ip: clientIp(req) },
  );
  if (!beta.ok) {
    return NextResponse.json({ ok: false, error: beta.error }, { status: beta.status });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(MEMBER_SESSION_COOKIE, beta.sessionToken, memberCookieOptions(beta.expiresAt));

  // The tester is now real and already has access. Notify the owner once, here
  // at admission — never from a landing page or a page reload.
  await notifyOwnerOfSignup(beta.email);

  try {
    await store.recordEvent({
      event: "account-signup",
      source: typeof body.source === "string" ? body.source.slice(0, 40) : "",
      createdAt: new Date().toISOString(),
    });
  } catch {
    // analytics must never break admission
  }
  return res;
}
