import { NextRequest, NextResponse } from "next/server";
import { memberFromRequest } from "../../../members/session";
import { getMemberStore } from "../../../members/store";
import { createFeedback } from "../../../members/feedback";

export const runtime = "nodejs";

// Any signed-in account may submit — no live membership required. Reporting
// a problem should never be gated behind the thing that might be broken.
export async function POST(req: NextRequest) {
  const store = await getMemberStore();
  if (!store) return NextResponse.json({ ok: false, error: "Not available." }, { status: 503 });
  const ctx = await memberFromRequest(req);
  if (!ctx) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const result = await createFeedback(store, ctx.user.id, {
    category: body.category,
    message: body.message,
    contextUrl: body.contextUrl,
  });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
