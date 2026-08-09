// The Build state-transition seam.
//
// The browser posts what it WANTS to happen ({ action: {...} }); the server
// loads the Build, applies the pure transition from app/vnext/actions.ts, and
// writes it back. A client never hands us a finished record — that is what
// keeps "Live" a statement about work instead of a field anyone can set.
//
// Authorization reuses the member project rules exactly: the acting user comes
// from the verified session, ownership is checked server-side, and a mismatch
// is a 404 (existence is not confirmed to strangers).

import { NextRequest, NextResponse } from "next/server";
import { memberFromRequest } from "../../../members/session";
import { getMemberStore } from "../../../members/store";
import { readProject, updateProject } from "../../../members/projects";
import { BUILD_ENGINE_ID } from "../../../vnext/capabilities";
import { parseBuild, serializeBuild } from "../../../vnext/build";
import { applyAction, parseAction } from "../../../vnext/actions";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
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
  const action = parseAction(body.action);
  if (!action) return NextResponse.json({ ok: false, error: "That isn't an action." }, { status: 422 });

  const { id } = await params;
  const found = await readProject(store, ctx.user.id, id);
  if (!found.ok) return NextResponse.json({ ok: false, error: found.error }, { status: found.status });
  if (found.value.engineId !== BUILD_ENGINE_ID) {
    // Not a Build. Refuse rather than rewriting somebody's engine project.
    return NextResponse.json({ ok: false, error: "Project not found.", }, { status: 404 });
  }

  const build = parseBuild(found.value.content);
  if (!build) {
    return NextResponse.json(
      { ok: false, error: "This build can't be read, so it won't be overwritten." },
      { status: 409 },
    );
  }

  const result = applyAction(build, action);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });

  const saved = await updateProject(store, ctx.user.id, ctx.access, id, {
    content: serializeBuild({ ...result.build, id }),
  });
  if (!saved.ok) return NextResponse.json({ ok: false, error: saved.error }, { status: saved.status });

  return NextResponse.json({ ok: true, build: { ...result.build, id, updatedAt: saved.value.updatedAt } });
}
