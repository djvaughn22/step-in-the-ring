// Real bug found while auditing the Game Engine's "carry forward planner
// seed" feature (commit 9110418): GameStudio.tsx was wired to display
// `initialAnswers.seed`, but consumePlannerSeed() only ever set `.seed` for
// the Idea Engine — never for Game, whose intake is deliberately empty
// (intake: []), so the first-textarea fallback never fires either. The
// display code was dead: "make a fun family friendly game" reached Game
// Engine (routing worked) but the original idea never appeared there
// (carry-forward silently didn't). This locks in the actual data path, not
// just the routing decision.
//
// Found again 2026-08-24, same bug, two more engines: Music and How-To's
// TaskSession both have intake: [] too, and EngineSystem.tsx's mount points
// for them (unlike Game/Writing/Idea) passed no seed prop AT ALL — the
// components didn't even have a seedIdea prop to receive one. Real-life
// tested via the owner's own scenarios ("a laid-back reggae beat in
// BandLab", "make my first beat in BandLab") before this fix: both engines
// opened to a blank field, the idea silently vanishing between the readback
// screen and the engine.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "EngineSystem.tsx"), "utf8");

describe("consumePlannerSeed carries the original idea into every seed-reading engine", () => {
  it("both branches of consumePlannerSeed cover idea, game, writing, music and howto", () => {
    // Both branches of consumePlannerSeed must include the same five ids —
    // that's the actual bug shape: one branch (the one Home's
    // seedEngineWithRecord path takes) missing an id the other branch has.
    const matches = src.match(/\["idea", "game", "writing", "music", "howto"\]\.includes\(e\.id\)/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("every studio that reads a seed is actually passed one from EngineSystem", () => {
    for (const [engineId, varName] of [
      ["game", "prefill"],
      ["writing", "seededIdea"],
      ["music", "musicSeed"],
      ["howto", "howtoSeed"],
    ]) {
      const mountBlock = src.slice(src.indexOf(`engineId === "${engineId}"`));
      const nextMount = mountBlock.indexOf("if (engineId ===", 10);
      const block = nextMount === -1 ? mountBlock : mountBlock.slice(0, nextMount);
      expect(block, `${engineId} mount calls consumePlannerSeed`).toContain("consumePlannerSeed(engine)");
      // The variable must be used again after it's declared — not just
      // computed and discarded, which was the actual shape of the bug for
      // music and howto (both had no seed prop on their component at all).
      const declaredAt = block.indexOf(varName);
      expect(declaredAt, `${engineId}: ${varName} declared`).toBeGreaterThanOrEqual(0);
      expect(block.indexOf(varName, declaredAt + varName.length), `${engineId}: ${varName} used again, not just declared`).toBeGreaterThan(0);
    }
  });

  it("GameStudio, MusicSession and TaskSession all read the seed prop they're given", () => {
    const game = readFileSync(join(__dirname, "games/GameStudio.tsx"), "utf8");
    expect(game).toMatch(/initialAnswers\?\.seed/);
    const music = readFileSync(join(__dirname, "music/MusicSession.tsx"), "utf8");
    expect(music).toMatch(/seedIdea/);
    const task = readFileSync(join(__dirname, "howto/TaskSession.tsx"), "utf8");
    expect(task).toMatch(/seedIdea/);
  });
});
