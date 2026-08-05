import { NextRequest, NextResponse } from "next/server";
import { getMemberStore } from "../../../members/store";

export const runtime = "nodejs";

// Minimal, privacy-respecting counters. Allowlisted event names only, a
// short source label, nothing else — no project text, no identifiers, no
// fingerprinting. Unknown events are dropped silently.
const ALLOWED_EVENTS = new Set([
  "membership-page-visit",
  "checkout-cancel",
  "mvp1-declared",
]);

export async function POST(req: NextRequest) {
  const store = await getMemberStore();
  if (!store) return NextResponse.json({ ok: true });
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: true });
  }
  const event = typeof body.event === "string" ? body.event : "";
  if (!ALLOWED_EVENTS.has(event)) return NextResponse.json({ ok: true });
  const source = typeof body.source === "string" ? body.source.replace(/[^a-z0-9-]/gi, "").slice(0, 40) : "";
  try {
    await store.recordEvent({ event, source, createdAt: new Date().toISOString() });
  } catch {
    // counters must never surface errors
  }
  return NextResponse.json({ ok: true });
}
