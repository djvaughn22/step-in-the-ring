import { NextRequest, NextResponse } from "next/server";
import { login, MEMBER_SESSION_COOKIE } from "../../../members/auth";
import { memberCookieOptions } from "../../../members/session";
import { getMemberStore } from "../../../members/store";
import { resolveAccess } from "../../../members/entitlement";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  const store = await getMemberStore();
  if (!store) {
    return NextResponse.json(
      { ok: false, error: "Accounts are not open yet — membership is in private beta." },
      { status: 503 },
    );
  }
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
  const result = await login(store, { email: body.email, password: body.password }, { ip: clientIp(req) });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  // Check entitlement status — pending accounts cannot proceed
  const entitlement = await store.getEntitlement(result.userId);
  const access = resolveAccess(entitlement);
  if (access.status === "pending") {
    return NextResponse.json(
      { ok: false, error: "Account pending approval.", email: body.email },
      { status: 403 },
    );
  }

  // Revoked or expired accounts cannot proceed
  if (!access.memberAccess && access.status !== "owner") {
    return NextResponse.json(
      { ok: false, error: "Access denied." },
      { status: 403 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(MEMBER_SESSION_COOKIE, result.sessionToken, memberCookieOptions(result.expiresAt));
  return res;
}
