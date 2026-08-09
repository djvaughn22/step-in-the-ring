// @vitest-environment jsdom
//
// The Build → engine handoff, checked against the convention that already
// existed. The value of this test is the CONTRACT: if the planner's seed shape
// or the engines' storage key ever moves, a Build's words would silently stop
// arriving, and nothing else in the suite would notice.

import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ENGINE_SEED_KEY, engineSeedFor, seedEngineFromBuild } from "./engine-handoff";
import { newBuild, type BuildRecordV1 } from "./build";
import { shapeIntent } from "./shape";
import { allCapabilities, capabilityById, type Capability } from "./capabilities";

const ROOT = join(__dirname, "..", "..");
const SAID = "A one-page website for my dog, with the socks he has stolen.";

function aBuild(patch: Partial<BuildRecordV1> = {}): BuildRecordV1 {
  return {
    ...newBuild(SAID, "2026-08-08T00:00:00.000Z", shapeIntent(SAID) ?? undefined),
    id: "b1",
    ...patch,
  };
}

const engine = capabilityById("build") as Capability;

beforeEach(() => {
  window.localStorage.clear();
});

describe("a build's words travel with it", () => {
  it("carries their own sentence, not a summary of a summary", () => {
    const seed = engineSeedFor(aBuild(), engine, 1)!;
    expect(seed.raw).toBe(SAID);
    expect(seed.engineId).toBe("build");
    expect(seed.title).toBeTruthy();
  });

  it("falls back to their sentence when there is no reading", () => {
    const seed = engineSeedFor(aBuild({ reading: undefined }), engine, 1)!;
    expect(seed.summary).toBe(SAID);
  });

  it("hands nothing over where there is nowhere to put it", () => {
    // A plain page has no intake to prefill.
    const surface = capabilityById("live") as Capability;
    expect(engineSeedFor(aBuild(), surface, 1)).toBeNull();
  });

  it("writes to the key the engines actually read", () => {
    seedEngineFromBuild(aBuild(), engine);
    const stored = JSON.parse(window.localStorage.getItem(ENGINE_SEED_KEY)!);
    expect(stored.engineId).toBe("build");
    expect(stored.raw).toBe(SAID);
  });

  it("uses the same key and fields the planner has always used", () => {
    // If either side moves, a Build's words stop arriving and no other test
    // in this suite would catch it.
    const handoff = readFileSync(join(ROOT, "app/planner/handoff.ts"), "utf8");
    expect(handoff).toContain('ENGINE_SEED_KEY = "sitr-engine-seed"');
    expect(ENGINE_SEED_KEY).toBe("sitr-engine-seed");
    for (const field of ["engineId", "title", "summary", "raw"]) {
      expect(handoff).toContain(field);
    }

    const engines = readFileSync(join(ROOT, "app/engines/EngineSystem.tsx"), "utf8");
    expect(engines).toContain('localStorage.getItem("sitr-engine-seed")');
  });

  it("only ever names an engine that really exists", () => {
    const ids = new Set(allCapabilities().map((c) => c.id));
    for (const c of allCapabilities()) {
      const seed = engineSeedFor(aBuild(), c, 1);
      if (seed) expect(ids.has(seed.engineId)).toBe(true);
    }
  });
});
