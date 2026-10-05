import { NextRequest, NextResponse } from "next/server";
import { isOwnerRequest } from "../../../owner/session";
import { getMemberStore } from "../../../members/store";
import { listAllFeedback, markFeedbackStatus } from "../../../members/feedback";
import type { FeedbackStatus } from "../../../members/store";

export const runtime = "nodejs";

function ownerGate(req: NextRequest) {
  if (!isOwnerRequest(req)) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const denied = ownerGate(req);
  if (denied) return denied;
  const store = await getMemberStore();
  if (!store) return NextResponse.json({ ok: false, error: "No database configured." }, { status: 503 });
  const members = (await listAllFeedback(store)).map((f) => ({ ...f, from: "member" as const, replyEmail: "" }));
  // Visitor notes (no account). A failure here must not hide member notes.
  const visitors = (await store.listVisitorFeedback().catch(() => [])).map((f) => ({ ...f, userId: "", from: "visitor" as const }));
  const feedback = [...members, ...visitors].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ ok: true, feedback });
}

export async function PATCH(req: NextRequest) {
  const denied = ownerGate(req);
  if (denied) return denied;
  const store = await getMemberStore();
  if (!store) return NextResponse.json({ ok: false, error: "No database configured." }, { status: 503 });
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id : "";
  const status: FeedbackStatus = body.status === "reviewed" ? "reviewed" : "new";
  if (!id) return NextResponse.json({ ok: false, error: "Missing id." }, { status: 422 });
  if (body.from === "visitor") await store.updateVisitorFeedbackStatus(id, status);
  else await markFeedbackStatus(store, id, status);
  return NextResponse.json({ ok: true });
}
