// Owner login for the Author's Room. Fail-closed: no configured password, no
// entry. Replies are generic on purpose — they never say which part failed,
// and nothing about the attempt (least of all the password) is logged.

import { NextRequest, NextResponse } from "next/server";
import {
  clearFailures, createSessionToken, isLockedOut, ownerPassword,
  passwordMatches, registerFailure, SESSION_COOKIE, SESSION_MAX_AGE_S, sessionSecret,
} from "../../../author/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, private", "X-Robots-Tag": "noindex, nofollow" };

function deny(status: number): NextResponse {
  return NextResponse.json({ ok: false, error: "That didn't work." }, { status, headers: NO_STORE });
}

export async function POST(req: NextRequest) {
  const expected = ownerPassword();
  const secret = sessionSecret();
  if (!expected || !secret) {
    return NextResponse.json(
      { ok: false, error: "The room isn't configured yet." },
      { status: 503, headers: NO_STORE },
    );
  }

  const key = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isLockedOut(key)) return deny(429);

  let supplied = "";
  try {
    const body = (await req.json()) as { password?: unknown };
    if (typeof body.password === "string") supplied = body.password;
  } catch {
    // fall through to the generic failure
  }

  if (!supplied || !passwordMatches(supplied, expected)) {
    registerFailure(key);
    await new Promise((r) => setTimeout(r, 400)); // flat delay on every failure
    return deny(401);
  }

  clearFailures(key);
  const res = NextResponse.json({ ok: true }, { headers: NO_STORE });
  res.cookies.set(SESSION_COOKIE, createSessionToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
  return res;
}
