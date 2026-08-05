import { NextRequest, NextResponse } from "next/server";
import { memberFromRequest } from "../../../../members/session";
import { getMemberStore } from "../../../../members/store";
import { deleteOwnProject, readProject, updateProject } from "../../../../members/projects";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const store = await getMemberStore();
  if (!store) return NextResponse.json({ ok: false, error: "Not available." }, { status: 503 });
  const ctx = await memberFromRequest(req);
  if (!ctx) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
  const { id } = await params;
  const result = await readProject(store, ctx.user.id, id);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, project: result.value });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const store = await getMemberStore();
  if (!store) return NextResponse.json({ ok: false, error: "Not available." }, { status: 503 });
  const ctx = await memberFromRequest(req);
  if (!ctx) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
  const { id } = await params;
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
  const result = await updateProject(store, ctx.user.id, ctx.access, id, {
    title: body.title,
    content: body.content,
  });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, project: result.value });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const store = await getMemberStore();
  if (!store) return NextResponse.json({ ok: false, error: "Not available." }, { status: 503 });
  const ctx = await memberFromRequest(req);
  if (!ctx) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
  const { id } = await params;
  const result = await deleteOwnProject(store, ctx.user.id, id);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
