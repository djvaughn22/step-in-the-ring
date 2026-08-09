// The Build collection: list what you're making, and start something new.
//
// Creating a Build takes ONE thing from the browser — the person's own words.
// Everything else (title, the reading, version one, the first move) is derived
// SERVER-side by the deterministic shaping in app/vnext/shape.ts. That is not
// ceremony: it means a client cannot post itself a flattering plan, the same
// sentence always produces the same Build, and the reading can be improved
// later without trusting whatever an old browser tab believed.
//
// Authorization reuses the member project rules exactly, the same way
// /api/builds/[id] does: the acting user comes from the verified session, and
// a Build is only ever created on that user's own account.

import { NextRequest, NextResponse } from "next/server";
import { memberFromRequest } from "../../members/session";
import { getMemberStore } from "../../members/store";
import { createProject, listOwnProjects } from "../../members/projects";
import { BUILD_ENGINE_ID } from "../../vnext/capabilities";
import {
  buildsFromProjects, newBuild, readIntentText, serializeBuild,
} from "../../vnext/build";
import { shapeIntent } from "../../vnext/shape";

export const runtime = "nodejs";

/**
 * Answers to the one-question loop. More of the person's own words, so they
 * are sanitized the same way and bounded the same way — never trusted as
 * anything but input to the same deterministic reading.
 */
function readAnswers(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (Object.keys(out).length >= 8) break;
    if (typeof k !== "string" || k.length > 40 || typeof v !== "string") continue;
    // An empty answer is meaningful: it means "decide for me".
    out[k] = readIntentText(v) ?? "";
  }
  return out;
}

export async function GET(req: NextRequest) {
  const store = await getMemberStore();
  if (!store) return NextResponse.json({ ok: false, error: "Not available." }, { status: 503 });
  const ctx = await memberFromRequest(req);
  if (!ctx) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });

  const builds = buildsFromProjects(await listOwnProjects(store, ctx.user.id), BUILD_ENGINE_ID);
  return NextResponse.json({ ok: true, builds });
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

  const intent = readIntentText(body.intent);
  if (!intent) {
    return NextResponse.json(
      { ok: false, error: "Say what you want to create first." },
      { status: 422 },
    );
  }

  // The reading is ours, computed here from their words. Nothing the browser
  // sent about what this "is" is trusted, because nothing was asked for —
  // `answers` are more of the person's own words, not conclusions about them.
  const shaping = shapeIntent(intent, readAnswers(body.answers));
  const record = newBuild(intent, new Date().toISOString(), shaping ?? undefined);

  const created = await createProject(store, ctx.user.id, ctx.access, {
    title: record.title,
    engineId: BUILD_ENGINE_ID,
    content: serializeBuild(record),
  });
  if (!created.ok) {
    return NextResponse.json({ ok: false, error: created.error }, { status: created.status });
  }

  const build = {
    ...record,
    id: created.value.id,
    title: created.value.title,
    createdAt: created.value.createdAt,
    updatedAt: created.value.updatedAt,
  };
  return NextResponse.json({ ok: true, build }, { status: 201 });
}
