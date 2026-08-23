// Real bug found while auditing the Game Engine's "carry forward planner
// seed" feature (commit 9110418): GameStudio.tsx was wired to display
// `initialAnswers.seed`, but consumePlannerSeed() only ever set `.seed` for
// the Idea Engine — never for Game, whose intake is deliberately empty
// (intake: []), so the first-textarea fallback never fires either. The
// display code was dead: "make a fun family friendly game" reached Game
// Engine (routing worked) but the original idea never appeared there
// (carry-forward silently didn't). This locks in the actual data path, not
// just the routing decision.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "EngineSystem.tsx"), "utf8");

describe("consumePlannerSeed carries the original idea into Game, not just Idea", () => {
  it("sets .seed for game on both the record path and the raw/summary path", () => {
    // Both branches of consumePlannerSeed must include "game" alongside "idea" —
    // that's the actual bug: the record-handoff branch (the one Home's
    // seedEngineWithRecord path takes) had it missing entirely.
    const matches = src.match(/e\.id === "idea" \|\| e\.id === "game"/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("GameStudio actually reads the same key that gets set", () => {
    const studio = readFileSync(join(__dirname, "games/GameStudio.tsx"), "utf8");
    expect(studio).toMatch(/initialAnswers\?\.seed/);
  });
});
