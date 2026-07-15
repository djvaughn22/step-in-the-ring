// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { loadPlans, migrateLegacy, savePlan } from "./storage";
import { interpret } from "./interpret";

const V2 = [
  {
    ideaName: "A game where you dodge falling tacos",
    whoIsItFor: "Me and my friends at lunch",
    problem: "Every game we play was made by someone else",
    // Verbatim from the old homepage's own example — this is exactly the shape
    // of data sitting in real people's localStorage right now.
    win: "A friend plays it, loses, and immediately demands a rematch",
    firstVersion: "One player, falling tacos, a score counter, a game-over screen",
    smallestUseful: "A square that moves left and right, one falling taco, a score",
    avoid: "Levels, power-ups, online multiplayer",
    savedAt: "2026-07-01T12:00:00.000Z",
  },
];

describe("migrating seven-question saves", () => {
  beforeEach(() => window.localStorage.clear());

  it("turns seven boxes back into sentences a person would say", () => {
    const p = migrateLegacy(V2[0])!;
    expect(p.version).toBe(3);
    expect(p.description).toContain("dodge falling tacos");
    expect(p.description.toLowerCase()).toContain("don't build levels, power-ups, online multiplayer");
    // No scaffolding labels — the interpreter would read "The problem:" as a feature.
    expect(p.description).not.toMatch(/The problem:|The win:|smallest useful version:/);
  });

  it("sends each old field where its meaning belongs", () => {
    const p = migrateLegacy(V2[0])!;
    // The audience box was already an answer to "who is it for" — keep it one.
    expect(p.answers.audience).toBe("Me and my friends at lunch");
    expect(p.answers.versionOne).toContain("falling tacos, a score counter");
  });

  it("does not turn the old problem/win boxes into features", () => {
    const p = migrateLegacy(V2[0])!;
    const i = interpret({ description: p.description, answers: p.answers });
    const v1 = i.versionOne.map((c) => c.value.toLowerCase()).join(" | ");
    expect(v1).not.toContain("made by someone else");
    expect(v1).not.toContain("demands a rematch");
    expect(i.audience?.value).toBe("Me and my friends at lunch");
  });

  it("keeps every original field verbatim", () => {
    const p = migrateLegacy(V2[0])!;
    expect(p.legacy?.smallestUseful).toBe(V2[0].smallestUseful);
    expect(p.legacy?.win).toBe(V2[0].win);
  });

  it("a migrated save still produces a real plan", () => {
    const p = migrateLegacy(V2[0])!;
    const i = interpret({ description: p.description });
    expect(i.title.value.length).toBeGreaterThan(2);
    expect(i.versionOne.length).toBeGreaterThan(0);
    expect(i.exclusions.length).toBeGreaterThan(0);
  });

  it("reads old saves through loadPlans and keeps the original key", () => {
    window.localStorage.setItem("sitr-v2", JSON.stringify(V2));
    const plans = loadPlans();
    expect(plans).toHaveLength(1);
    expect(plans[0].savedAt).toBe("2026-07-01T12:00:00.000Z");
    // The originals stay put — the migration is never destructive.
    expect(window.localStorage.getItem("sitr-v2")).toBeTruthy();
  });

  it("does not duplicate a migrated save on the next load", () => {
    window.localStorage.setItem("sitr-v2", JSON.stringify(V2));
    loadPlans();
    expect(loadPlans()).toHaveLength(1);
  });

  it("survives junk in storage instead of crashing", () => {
    window.localStorage.setItem("sitr-v2", "{not json");
    window.localStorage.setItem("sitr-plans-v3", "also not json");
    expect(loadPlans()).toEqual([]);
  });

  it("skips a v2 record with no idea name", () => {
    expect(migrateLegacy({ whoIsItFor: "someone" })).toBeNull();
  });

  it("ignores malformed v3 records without losing good ones", () => {
    window.localStorage.setItem(
      "sitr-plans-v3",
      JSON.stringify({ version: 3, plans: [{ nope: true }, { id: "a", description: "A real idea", savedAt: "2026-07-02" }] }),
    );
    expect(loadPlans()).toHaveLength(1);
  });
});

describe("saving", () => {
  beforeEach(() => window.localStorage.clear());

  it("round-trips a plan", () => {
    savePlan({ description: "A leaderboard for family game night" }, "Family Leaderboard");
    const plans = loadPlans();
    expect(plans[0].description).toContain("leaderboard");
    expect(plans[0].title).toBe("Family Leaderboard");
  });

  it("updates rather than stacking the same idea twice", () => {
    savePlan({ description: "Same idea" }, "One");
    savePlan({ description: "Same idea" }, "Two");
    const plans = loadPlans();
    expect(plans).toHaveLength(1);
    expect(plans[0].title).toBe("Two");
  });
});

describe("a migrated save produces a plan worth reading", () => {
  // The seven-question era stored fragment lists, not sentences. Reopening one
  // must still yield the person's own features — not our parser's debris.
  const p = migrateLegacy(V2[0])!;
  const i = interpret({ description: p.description, answers: p.answers });
  const v1 = i.versionOne.map((c) => c.value);

  it("keeps their version-one list intact", () => {
    expect(v1).toContain("One player");
    expect(v1).toContain("A score counter");
  });

  it("does not shred a feature at every 'and'", () => {
    expect(v1).not.toContain("Right");
    expect(v1.join(" | ")).toContain("moves left and right");
  });

  it("carries every thing they refused to build", () => {
    const x = i.exclusions.map((c) => c.value.toLowerCase()).join(" | ");
    expect(x).toContain("levels");
    expect(x).toContain("power-ups");
    expect(x).toContain("online multiplayer");
  });

  it("reads the old win box as the success condition", () => {
    expect(i.desiredResult?.value.toLowerCase()).toContain("rematch");
  });
});
