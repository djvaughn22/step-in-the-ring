import { NextRequest, NextResponse } from "next/server";
import { isOwnerRequest } from "../../../owner/session";
import { getMemberStore } from "../../../members/store";
import { listSprintApplications, markSprintApplicationStatus } from "../../../members/sprintApplication";
import type { SprintApplicationStatus } from "../../../members/store";

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
  const applications = await listSprintApplications(store);
  return NextResponse.json({ ok: true, applications });
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
  const status: SprintApplicationStatus = body.status === "reviewed" ? "reviewed" : "new";
  if (!id) return NextResponse.json({ ok: false, error: "Missing id." }, { status: 422 });
  await markSprintApplicationStatus(store, id, status);
  return NextResponse.json({ ok: true });
}
