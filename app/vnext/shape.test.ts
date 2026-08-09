import { describe, expect, it } from "vitest";
import { shapeIntent } from "./shape";
import { newBuild, parseBuild, serializeBuild } from "./build";

const GAME =
  "A game where you dodge falling tacos and try to beat your friend's score. " +
  "One player, a score counter, and it gets faster the longer you last.";
const SITE =
  "A one-page website for my dog. It shows his name, one great photo, three facts " +
  "about him, and a running list of the socks he has stolen.";
const BOOK = "I want to write a book about my grandfather's war letters.";
const BROKEN = "my site is broken";
const VAGUE = "something cool";

describe("shapeIntent", () => {
  it("is deterministic — the same words always read the same way", () => {
    expect(shapeIntent(GAME)).toEqual(shapeIntent(GAME));
    expect(shapeIntent(BOOK)).toEqual(shapeIntent(BOOK));
  });

  it("returns null for nothing, so a caller never shows an empty reading", () => {
    expect(shapeIntent("")).toBeNull();
    expect(shapeIntent("   \n  ")).toBeNull();
  });

  it("reads a game as a game and gives a first move from version one", () => {
    const s = shapeIntent(GAME)!;
    expect(s.kind).toBe("A game");
    expect(s.versionOne.length).toBeGreaterThan(0);
    expect(s.firstMove).toContain(s.versionOne[0].charAt(0).toLowerCase() + s.versionOne[0].slice(1));
  });

  it("never invents version one for something that's broken", () => {
    const s = shapeIntent(BROKEN)!;
    expect(s.versionOne).toEqual([]);
    // A repair starts by reproducing it, not by building a first version.
    expect(s.firstMove.toLowerCase()).toContain("what goes wrong");
    expect(s.firstMove.toLowerCase()).not.toContain("version one");
  });

  it("puts the cheap real-world test first when software isn't the product", () => {
    const s = shapeIntent(BOOK)!;
    expect(s.firstMove.toLowerCase()).toContain("before building anything");
    expect(s.softwareNote).toBeTruthy();
  });

  it("shows their own sentence when the summary comes out a fragment", () => {
    // One stated behaviour makes the planner summary collapse to "A game: a
    // score counter." — their sentence says far more, and it's still true.
    const s = shapeIntent(GAME)!;
    expect(s.reading.toLowerCase()).toContain("dodge falling tacos");
    expect(s.reading).not.toBe("A game: a score counter.");
  });

  it("keeps the planner summary when it actually says something", () => {
    const s = shapeIntent(BOOK)!;
    expect(s.reading.toLowerCase()).toContain("grandfather");
  });

  it("says nothing about software when software plainly IS the product", () => {
    expect(shapeIntent(SITE)!.softwareNote).toBeNull();
  });

  it("asks at most one thing, and only when it's worth asking", () => {
    const s = shapeIntent(SITE)!;
    expect(s.question?.key).toBe("audience");
    // The shaping still stands on its own — the question is never a gate.
    expect(s.realMeans).toBeTruthy();
    expect(s.firstMove).toBeTruthy();
  });

  it("always offers somewhere to go, even when nothing matched the words", () => {
    const s = shapeIntent(VAGUE)!;
    expect(s.helps.length).toBeGreaterThan(0);
    expect(s.helps.map((h) => h.id)).toContain("five-hour-sprint");
  });

  it("only ever offers capabilities a person can actually open", () => {
    // The Game Engine is owner-only; a game must never be routed into it.
    const s = shapeIntent(GAME)!;
    expect(s.helps.map((h) => h.id)).not.toContain("game");
  });

  it("gives a first move for every kind of thing somebody might say", () => {
    for (const said of [GAME, SITE, BOOK, BROKEN, VAGUE, "sell my woodworking on etsy"]) {
      const s = shapeIntent(said)!;
      expect(s.firstMove.trim().length).toBeGreaterThan(10);
      expect(s.realMeans.trim().length).toBeGreaterThan(10);
      expect(s.title.trim()).not.toBe("");
    }
  });
});

describe("a Build started from a shaping", () => {
  it("carries the reading without ever touching the person's words", () => {
    const s = shapeIntent(SITE)!;
    const b = newBuild(SITE, "2026-08-08T00:00:00.000Z", s);
    expect(b.intent).toBe(SITE.replace(/\s+/g, " ").trim());
    expect(b.reading).toBe(s.reading);
    expect(b.goal).toBe(s.realMeans);
    expect(b.currentAction).toBe(s.firstMove);
    expect(b.versionOne).toEqual(s.versionOne);
    expect(b.stage).toBe("bring");
  });

  it("still works with no shaping at all", () => {
    const b = newBuild("just a sentence", "2026-08-08T00:00:00.000Z");
    expect(b.reading).toBeUndefined();
    expect(b.versionOne).toBeUndefined();
    expect(b.currentAction).toBeTruthy();
  });

  it("survives a round trip through storage", () => {
    const s = shapeIntent(GAME)!;
    const b = newBuild(GAME, "2026-08-08T00:00:00.000Z", s);
    const back = parseBuild(serializeBuild(b))!;
    expect(back.reading).toBe(b.reading);
    expect(back.versionOne).toEqual(b.versionOne);
    expect(back.goal).toBe(b.goal);
  });

  it("reads a Session 1 Build that predates shaping, losing nothing", () => {
    const legacy = JSON.stringify({
      version: 1,
      id: "abc",
      title: "An old build",
      intent: "A thing I said before shaping existed",
      stage: "shape",
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-02T00:00:00.000Z",
      currentAction: "Keep going.",
      capabilitiesUsed: ["idea"],
      artifacts: [],
      history: [{ at: "2026-08-01T00:00:00.000Z", note: "You stepped in.", stage: "bring" }],
    });
    const back = parseBuild(legacy)!;
    expect(back.intent).toBe("A thing I said before shaping existed");
    expect(back.stage).toBe("shape");
    expect(back.currentAction).toBe("Keep going.");
    expect(back.capabilitiesUsed).toEqual(["idea"]);
    expect(back.reading).toBeUndefined();
    expect(back.versionOne).toBeUndefined();
  });
});
