import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "../../../author/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store, private", "X-Robots-Tag": "noindex, nofollow" } },
  );
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return res;
}
