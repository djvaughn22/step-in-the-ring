import { after, NextRequest, NextResponse } from "next/server";
import { signup, MEMBER_SESSION_COOKIE, normalizeEmail } from "../../../members/auth";
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
 * Tell the owner that a brand-new account is waiting for approval.
 * The notification contains only the claimed email, time, event type and site.
 * Passwords, password hashes, session tokens and database ids never enter it.
 *
 * Delivery is best-effort: account creation wins even if email delivery fails.
 */
async function notifyOwnerOfSignup(email: unknown): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!normalized) return;

  const notice: BetaLoginNotice = {
    email: normalized,
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

export async function POST(req: NextRequest) {
  const store = await getMemberStore();
  if (!store) return NextResponse.json(UNCONFIGURED, { status: 503 });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const result = await signup(store, { email: body.email, password: body.password }, { ip: clientIp(req) });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(MEMBER_SESSION_COOKIE, result.sessionToken, memberCookieOptions(result.expiresAt));

  // The account is now real and pending owner approval. Notify the owner once,
  // here at creation — never from the Pending Approval page or a page reload.
  await notifyOwnerOfSignup(body.email);

  try {
    await store.recordEvent({
      event: "account-signup",
      source: typeof body.source === "string" ? body.source.slice(0, 40) : "",
      createdAt: new Date().toISOString(),
    });
  } catch {
    // analytics must never break signup
  }
  return res;
}
