// ─────────────────────────────────────────────────────────────────────────────
// SENDING A BUILD'S WORDS AHEAD OF IT.
//
// A Build reaching for a capability used to be a plain link, and the engine on
// the far side opened to an empty form. That is the exact moment 22
// capabilities stop feeling like one product: the person already said this,
// once, in their own words, and the software just asked them again.
//
// There is already a convention for carrying words across that boundary — the
// planner has used `sitr-engine-seed` since before vNext (app/planner/
// handoff.ts writes it, app/engines/EngineSystem.tsx consumes and clears it).
// This does NOT invent a second one. It writes the same shape, from a Build.
//
// Deliberately the LIGHT seed, with no CreationRecord attached. The engine's
// fallback path prefills its name field and its first prose question from
// exactly these fields, and pulling the whole creation module into the Build
// workspace's bundle to gain a little more prefill is not a trade worth making.
// ─────────────────────────────────────────────────────────────────────────────

import type { BuildRecordV1 } from "./build";
import type { Capability } from "./capabilities";

/** The key the engines already read. Never a second storage stack. */
export const ENGINE_SEED_KEY = "sitr-engine-seed";

export interface EngineSeed {
  engineId: string;
  title: string;
  summary: string;
  /** Their own words. This is the field the engine's prose question gets. */
  raw: string;
  at: number;
}

/**
 * The seed for opening `capability` from `build`, or null when there is
 * nothing to hand over — only engines have an intake to prefill, and a
 * capability that is a plain page has nowhere to put this.
 */
export function engineSeedFor(
  build: BuildRecordV1,
  capability: Capability,
  at: number,
): EngineSeed | null {
  if (capability.kind !== "engine") return null;
  const raw = build.intent.trim();
  if (!raw) return null;
  return {
    engineId: capability.id,
    title: build.title,
    // The reading when there is one, their sentence when there isn't. Both
    // are true; neither is invented.
    summary: build.reading ?? raw,
    raw,
    at,
  };
}

/** Write it where the engines look. Storage refusal is not worth an error. */
export function seedEngineFromBuild(build: BuildRecordV1, capability: Capability): void {
  const seed = engineSeedFor(build, capability, Date.now());
  if (!seed) return;
  try {
    window.localStorage.setItem(ENGINE_SEED_KEY, JSON.stringify(seed));
  } catch {
    // The engine opens empty. Worse, but not broken.
  }
}
