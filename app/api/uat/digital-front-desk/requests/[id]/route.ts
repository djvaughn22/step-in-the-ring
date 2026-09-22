// One action per PATCH, always producing both a state change and the
// matching audit event in the same store call — see
// app/uat/digital-front-desk/lib/store.ts's updateRequest(). This is the
// server-side twin of every button the owner's desk offers: assign, change
// status, add a note, set the next action, log a simulated customer update,
// log a simulated review request, and mark complete.

import { NextRequest, NextResponse } from "next/server";
import { dfdOwnerGate } from "../../../../../uat/digital-front-desk/lib/apiGate";
import { PIPELINE_STAGES } from "../../../../../uat/digital-front-desk/lib/types";
import type { ContactMethod, FrontDeskEvent, PipelineStage } from "../../../../../uat/digital-front-desk/lib/types";
import { getRequest, updateRequest } from "../../../../../uat/digital-front-desk/lib/store";

export const runtime = "nodejs";

const MAX_TEXT = 2000;
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g;

function text(raw: unknown, max = MAX_TEXT): string {
  return typeof raw === "string" ? raw.replace(CONTROL_CHARS, "").trim().slice(0, max) : "";
}

function isStage(v: unknown): v is PipelineStage {
  return typeof v === "string" && (PIPELINE_STAGES as string[]).includes(v);
}

function isChannel(v: unknown): v is ContactMethod {
  return v === "email" || v === "phone";
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = dfdOwnerGate(req);
  if (denied) return denied;

  const { id } = await params;
  const existing = getRequest(id);
  if (!existing) return NextResponse.json({ ok: false, error: "Request not found." }, { status: 404 });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const action = body.action;

  let patch: Record<string, unknown> = {};
  let events: FrontDeskEvent[] = [];

  switch (action) {
    case "assign": {
      const assignee = text(body.assignee, 200);
      if (!assignee) return NextResponse.json({ ok: false, error: "Enter who this is assigned to." }, { status: 422 });
      patch = { assignedTo: assignee };
      events = [{ type: "request_assigned", timestamp: nowIso, assignee }];
      break;
    }
    case "status": {
      if (!isStage(body.status)) return NextResponse.json({ ok: false, error: "Unrecognized status." }, { status: 422 });
      if (body.status === existing.status) return NextResponse.json({ ok: true, request: existing });
      patch = { status: body.status };
      events = [{ type: "status_changed", timestamp: nowIso, from: existing.status, to: body.status }];
      if (body.status === "completed") events.push({ type: "request_completed", timestamp: nowIso });
      break;
    }
    case "note": {
      const noteText = text(body.text);
      if (!noteText) return NextResponse.json({ ok: false, error: "Enter a note." }, { status: 422 });
      const author = text(body.author, 100) || "Owner";
      patch = { internalNotes: [...existing.internalNotes, { timestamp: nowIso, text: noteText, author }] };
      events = [{ type: "note_added", timestamp: nowIso, author }];
      break;
    }
    case "next_action": {
      const nextAction = text(body.nextAction, 500);
      if (!nextAction) return NextResponse.json({ ok: false, error: "Enter the next action." }, { status: 422 });
      const dueAtRaw = typeof body.dueAt === "string" ? body.dueAt : "";
      const dueAt = dueAtRaw && !Number.isNaN(new Date(dueAtRaw).getTime()) ? new Date(dueAtRaw).toISOString() : null;
      patch = { nextAction, nextActionDue: dueAt };
      events = [{ type: "next_action_set", timestamp: nowIso, nextAction, dueAt }];
      break;
    }
    case "customer_update": {
      if (!isChannel(body.channel)) return NextResponse.json({ ok: false, error: "Choose a contact channel." }, { status: 422 });
      const message = text(body.message);
      if (!message) return NextResponse.json({ ok: false, error: "Enter what the update would say." }, { status: 422 });
      patch = { lastCustomerUpdate: nowIso, lastCustomerUpdateChannel: body.channel };
      events = [{ type: "customer_update_sent", timestamp: nowIso, channel: body.channel, simulated: true }];
      break;
    }
    case "review_request": {
      if (!isChannel(body.channel)) return NextResponse.json({ ok: false, error: "Choose a contact channel." }, { status: 422 });
      events = [{ type: "review_requested", timestamp: nowIso, channel: body.channel, simulated: true }];
      break;
    }
    default:
      return NextResponse.json({ ok: false, error: "Unrecognized action." }, { status: 422 });
  }

  const updated = updateRequest(id, patch, events, now);
  return NextResponse.json({ ok: true, request: updated });
}
