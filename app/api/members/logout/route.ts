import { NextRequest, NextResponse } from "next/server";
import { logout, MEMBER_SESSION_COOKIE } from "../../../members/auth";
import { getMemberStore } from "../../../members/store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const store = await getMemberStore();
  const token = req.cookies.get(MEMBER_SESSION_COOKIE)?.value;
  if (store && token) await logout(store, token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(MEMBER_SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
