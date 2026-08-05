import { NextRequest, NextResponse } from "next/server";
import { memberFromRequest } from "../../../../members/session";
import { getMemberStore } from "../../../../members/store";
import { redeemTesterCode, testerCodeSecret } from "../../../../members/testerCodes";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const store = await getMemberStore();
  const secret = testerCodeSecret();
  if (!store || !secret) {
    return NextResponse.json({ ok: false, error: "Not available." }, { status: 503 });
  }
  const ctx = await memberFromRequest(req);
  if (!ctx) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const result = await redeemTesterCode(store, secret, { code: body.code, userId: ctx.user.id, ip });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, activeUntil: result.activeUntil });
}
