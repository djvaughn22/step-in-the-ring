import { NextRequest, NextResponse } from "next/server";
import { login, MEMBER_SESSION_COOKIE } from "../../../members/auth";
import { memberCookieOptions } from "../../../members/session";
import { getMemberStore } from "../../../members/store";

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
  const res = NextResponse.json({ ok: true });
  res.cookies.set(MEMBER_SESSION_COOKIE, result.sessionToken, memberCookieOptions(result.expiresAt));
  return res;
}
