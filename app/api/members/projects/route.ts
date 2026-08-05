import { NextRequest, NextResponse } from "next/server";
import { memberFromRequest } from "../../../members/session";
import { getMemberStore } from "../../../members/store";
import { createProject, importLocalProjects, listOwnProjects } from "../../../members/projects";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const store = await getMemberStore();
  if (!store) return NextResponse.json({ ok: false, error: "Not available." }, { status: 503 });
  const ctx = await memberFromRequest(req);
  if (!ctx) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
  const projects = await listOwnProjects(store, ctx.user.id);
  return NextResponse.json({
    ok: true,
    projects: projects.map((p) => ({
      id: p.id,
      title: p.title,
      engineId: p.engineId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  });
}

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

  // User-triggered import of chosen browser-local projects.
  if (Array.isArray(body.import)) {
    const result = await importLocalProjects(store, ctx.user.id, ctx.access, body.import);
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true, ...result.value });
  }

  const result = await createProject(store, ctx.user.id, ctx.access, {
    title: body.title,
    engineId: body.engineId,
    content: body.content,
  });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  try {
    const mine = await listOwnProjects(store, ctx.user.id);
    if (mine.length === 1) {
      await store.recordEvent({ event: "first-saved-project", source: "", createdAt: new Date().toISOString() });
    }
  } catch {
    // analytics must never break a save
  }
  return NextResponse.json({ ok: true, project: result.value });
}
