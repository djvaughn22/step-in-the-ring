// Public usage counter. See app/lib/usage.ts for what is (and is never)
// counted. Always answers 204 so a counter can never break a page or reveal
// anything about the database.

import { NextRequest, NextResponse } from "next/server";
import { getMemberStore } from "../../members/store";
import { isOwnerRequest } from "../../owner/session";
import { cleanSource, isUsageEvent } from "../../lib/usage";
import { allow } from "../../lib/rateLimit";

export const runtime = "nodejs";

const done = () => new NextResponse(null, { status: 204 });

export async function POST(req: NextRequest) {
  // The owner testing their own site would drown out real use.
  if (isOwnerRequest(req)) return done();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allow(`usage:${ip}`, 120, 60_000)) return done();

  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(await req.text()) as Record<string, unknown>;
  } catch {
    return done();
  }
  if (!isUsageEvent(body.event)) return done();

  const store = await getMemberStore();
  if (!store) return done();
  try {
    await store.recordEvent({ event: body.event, source: cleanSource(body.source), createdAt: new Date().toISOString() });
  } catch {
    // counts must never surface errors
  }
  return done();
}
