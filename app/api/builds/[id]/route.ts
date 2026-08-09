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
// Reads a session cookie: never prerender, never cache.
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Every response here is one person's own work, behind their own session
 * cookie. Next's default (`public, max-age=0, must-revalidate`) relies on a
 * shared cache choosing to revalidate; `private, no-store` does not rely on
 * anyone choosing anything. This is the class of mistake that serves one
 * member's builds to another, so it is stated rather than assumed.
 */
function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  const store = await getMemberStore();
  if (!store) return json({ ok: false, error: "Not available." }, 503);
  const ctx = await memberFromRequest(req);
  if (!ctx) return json({ ok: false, error: "Sign in first." }, 401);

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: "Bad request." }, 400);
  }
  const action = parseAction(body.action);
  if (!action) return json({ ok: false, error: "That isn't an action." }, 422);

  const { id } = await params;
  const found = await readProject(store, ctx.user.id, id);
  if (!found.ok) return json({ ok: false, error: found.error }, found.status);
  if (found.value.engineId !== BUILD_ENGINE_ID) {
    // Not a Build. Refuse rather than rewriting somebody's engine project.
    return json({ ok: false, error: "Project not found." }, 404);
  }

  const build = parseBuild(found.value.content);
  if (!build) {
    return json({ ok: false, error: "This build can't be read, so it won't be overwritten." }, 409);
  }

  const result = applyAction(build, action);
  if (!result.ok) return json({ ok: false, error: result.error }, result.status);

  const saved = await updateProject(store, ctx.user.id, ctx.access, id, {
    content: serializeBuild({ ...result.build, id }),
  });
  if (!saved.ok) return json({ ok: false, error: saved.error }, saved.status);

  return json({ ok: true, build: { ...result.build, id, updatedAt: saved.value.updatedAt } });
}
