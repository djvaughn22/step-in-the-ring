// Product reset Sprint 2 — the eight representative ideas from the sprint
// brief, run through the real deterministic pipeline (interpret -> classify
// -> shape -> recommend). Table-driven so a future regression in any one
// reading shows up as one failing row, not a rewritten test file.
//
// These lock BEHAVIOR proven correct this sprint, not the exact copy — a
// fixture never asserts on generated prose strings, only on the structural
// guarantees the brief actually asked for.
import { describe, expect, it } from "vitest";
import { newRecord, viewOf } from "./record";
import { shapingFromView } from "../vnext/shape";
import { recommendEngines } from "./recommend";

type Case = {
  label: string;
  raw: string;
  creationType: string;
  buildType: string;
  /** engineId, or null when the builder-prompt path is correctly primary. */
  primaryEngine: string | null;
};

const CASES: Case[] = [
  {
    label: "baseball team site",
    raw: "A simple website for my son's baseball team with the schedule and coach contact information.",
    creationType: "site",
    buildType: "new",
    primaryEngine: "first-build",
  },
  {
    label: "family food-catching game",
    raw: "A phone game where our family competes to catch falling food.",
    creationType: "game",
    buildType: "new",
    primaryEngine: "game",
  },
  {
    label: "website cleanup service",
    raw: "A weekend service helping local businesses clean up confusing websites.",
    creationType: "service",
    buildType: "improve",
    primaryEngine: "plan",
  },
  {
    label: "starting-over song",
    raw: "A song about starting over when you thought it was too late.",
    creationType: "music",
    buildType: "new",
    primaryEngine: "music",
  },
  {
    label: "sellable encouragement card",
    raw: "A printable Christian encouragement card I could sell on Etsy.",
    creationType: "printable",
    buildType: "sell",
    primaryEngine: "design-shop",
  },
  {
    label: "neighborhood fundraiser",
    raw: "Plan a neighborhood fundraiser with volunteers, deadlines, and donations.",
    creationType: "event-plan",
    buildType: "explore",
    primaryEngine: "plan",
  },
  {
    label: "live site, no signups",
    raw: "My live website gets visitors but nobody signs up.",
    creationType: "site",
    buildType: "improve",
    primaryEngine: null, // the builder prompt IS the handoff — honest, not a from-scratch walkthrough
  },
  {
    label: "broken login",
    raw: "The login on my app stopped working after the last change.",
    creationType: "tool",
    buildType: "fix",
    primaryEngine: null, // fix always routes through the repair prompt path, never a door
  },
];

describe("the eight representative ideas", () => {
  for (const c of CASES) {
    describe(c.label, () => {
      const view = viewOf(newRecord(c.raw));
      const shaping = shapingFromView(view);
      const rec = recommendEngines(view);

      it("reads as the right kind of thing", () => {
        expect(view.creationType).toBe(c.creationType);
        expect(view.interpretation.buildType.value).toBe(c.buildType);
      });

      it("asks at most one question", () => {
        expect(view.interpretation.openQuestions.length).toBeLessThanOrEqual(1);
      });

      it("recommends the honest engine, or the honest prompt path", () => {
        expect(rec.primary?.engineId ?? null).toBe(c.primaryEngine);
        if (c.primaryEngine === null) expect(rec.promptPathWhy).toBeTruthy();
      });

      it("names an audience only as a whole word, never a truncated fragment", () => {
        if (!shaping.forWhom) return;
        // A capture cut off by the 60-char class limit ends mid-word — no
        // trailing punctuation, and the last "word" is a bare 1-2 letter
        // fragment. "coach contact" is fine; "coach contact i" is not.
        expect(shaping.forWhom).not.toMatch(/\s[a-z]{1,2}$/i);
      });

      it("never shows an empty version one without asking the question that would fill it", () => {
        if (shaping.versionOne.length === 0) {
          expect(view.interpretation.openQuestions.length).toBeGreaterThan(0);
        }
      });

      it("a plain repair never invents version-one bullets for a thing that already exists", () => {
        if (view.interpretation.buildType.value === "fix") expect(shaping.versionOne).toEqual([]);
      });

      it("gives a first move that is a real sentence, not empty or a stutter", () => {
        expect(shaping.firstMove.trim().length).toBeGreaterThan(10);
        expect(shaping.firstMove.trim()).not.toBe(shaping.reading.trim());
      });

      it("never repeats the reading verbatim as the version-one plan", () => {
        const readingNorm = shaping.reading.toLowerCase().replace(/[^a-z0-9]/g, "");
        for (const v of shaping.versionOne) {
          expect(v.toLowerCase().replace(/[^a-z0-9]/g, "")).not.toBe(readingNorm);
        }
      });
    });
  }

  it("covers a routing case for each of build, plan, and fix", () => {
    const primaries = CASES.map((c) => c.primaryEngine);
    expect(primaries).toContain("first-build");
    expect(primaries).toContain("plan");
    // Fix never gets a door (the repair prompt is always primary) — assert
    // the honest prompt path fires for the one broken-thing case instead.
    const fixCase = CASES.find((c) => c.buildType === "fix")!;
    const view = viewOf(newRecord(fixCase.raw));
    const rec = recommendEngines(view);
    expect(rec.alternates.map((a) => a.engineId)).toContain("fix");
  });
});
