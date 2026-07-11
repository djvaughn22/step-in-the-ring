// Idea Engine logic: ranking, scoring completeness, angle generation limits,
// and handoff prefill integrity against real engine intake keys.
import { describe, expect, it } from "vitest";
import {
  generateAngles, handoffAnswers, isFullyScored, rankCandidates, totalScore,
  HANDOFF_TARGETS, IDEA_FACTORS,
  type IdeaCandidate, type IdeaDecision,
} from "./idea.engine";
import { ENGINES } from "../engines";

const scored = (id: string, value: number): IdeaCandidate => ({
  id, text: id, origin: "yours",
  scores: Object.fromEntries(IDEA_FACTORS.map((f) => [f.id, value])),
});

describe("idea ranking", () => {
  it("ranks fully scored ideas by total, unscored last", () => {
    const partial: IdeaCandidate = { id: "partial", text: "partial", origin: "yours", scores: { excitement: 5 } };
    const ranked = rankCandidates([partial, scored("low", 2), scored("high", 5)]);
    expect(ranked.map((c) => c.id)).toEqual(["high", "low", "partial"]);
  });

  it("totals across all five factors", () => {
    expect(totalScore(scored("x", 3))).toBe(15);
    expect(isFullyScored(scored("x", 3))).toBe(true);
    expect(isFullyScored({ id: "y", text: "y", origin: "yours" })).toBe(false);
  });
});

describe("angle generation", () => {
  it("generates a small labeled set, never a flood", () => {
    const angles = generateAngles("dog treat recipe cards", "dog owners");
    expect(angles.length).toBeLessThanOrEqual(4);
    angles.forEach((a) => {
      expect(a.origin).toBe("angle");
      expect(a.text).toContain("dog treat recipe cards");
    });
  });
});

describe("handoff", () => {
  const decision: IdeaDecision = {
    description: "Printable dog treat recipe cards",
    intendedUser: "Dog owners who bake",
    problem: "Store treats are expensive",
    simplestFirstVersion: "One 5-card printable set",
    requiredTools: "Canva free",
    nextEngineId: "design-shop",
    firstAction: "Draft the first 5 recipes",
    decidedAt: "2026-07-10T00:00:00.000Z",
  };

  it("every handoff target is a real visible engine", () => {
    HANDOFF_TARGETS.forEach((t) => {
      const engine = ENGINES.find((e) => e.id === t.engineId);
      expect(engine, t.engineId).toBeDefined();
      expect(engine?.hidden).not.toBe(true);
    });
  });

  it("prefills keys that exist in the target engine's intake", () => {
    for (const target of HANDOFF_TARGETS) {
      const answers = handoffAnswers({ ...decision, nextEngineId: target.engineId }, "Test");
      const engine = ENGINES.find((e) => e.id === target.engineId)!;
      // design-shop uses its own studio; its intake is defined in engines.ts too.
      const validKeys = new Set([...engine.intake.map((q) => q.key), "name", "exists"]);
      Object.keys(answers).forEach((k) => {
        expect(validKeys.has(k), `${target.engineId} intake has no key "${k}"`).toBe(true);
      });
      expect(answers.name).toBe("Test");
    }
  });

  it("carries the decision content into the prefill", () => {
    const answers = handoffAnswers(decision, "Cards");
    expect(answers.idea).toBe(decision.description);
    expect(answers.customer).toBe(decision.intendedUser);
  });
});
