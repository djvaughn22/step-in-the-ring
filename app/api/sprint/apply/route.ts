// Public lead-capture endpoint for the paid Five Hour Sprint service. No
// session required — an applicant does not need an account to ask about the
// service. Rate-limited per client address since this is unauthenticated.

import { NextRequest, NextResponse } from "next/server";
import { getMemberStore } from "../../../members/store";
import {
  createSprintApplication,
  sprintApplicationRateLimited,
} from "../../../members/sprintApplication";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function rateKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? "").trim() || "unknown";
}

export async function POST(req: NextRequest) {
  if (sprintApplicationRateLimited(rateKey(req))) {
    return NextResponse.json({ ok: false, error: "Too many applications from here. Try again later." }, { status: 429 });
  }

  const store = await getMemberStore();
  if (!store) return NextResponse.json({ ok: false, error: "Not available." }, { status: 503 });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const result = await createSprintApplication(store, {
    name: body.name,
    email: body.email,
    whatToFinish: body.whatToFinish,
    successLooksLike: body.successLooksLike,
    timing: body.timing,
    teamSize: body.teamSize,
    marketingConsent: body.marketingConsent,
  });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
