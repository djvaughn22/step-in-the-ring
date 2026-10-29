// Idea Engine logic: the engine does the work — three distinct versions, one
// recommended, and a decision with nothing left blank — plus handoff prefill
// integrity against real engine intake keys.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  decisionFor, decisionToMarkdown, handoffAnswers, ideaVersions, recommendVersion, shapeOf,
  HANDOFF_TARGETS,
  type IdeaDecision,
} from "./idea.engine";
import { ENGINES } from "../engines";

const CHORES = "A weekly chore board where parents assign chores, kids check them off, and everyone sees what is done.";
const NOW = new Date("2026-10-22T12:00:00Z");

describe("versions are the engine's work, not rewrites", () => {
  it("gives three genuinely different versions, not the seed with a suffix", () => {
    const vs = ideaVersions(CHORES, "my family");
    expect(vs.map((v) => v.id)).toEqual(["test", "small", "full"]);
    expect(new Set(vs.map((v) => v.what)).size).toBe(3);
    expect(new Set(vs.map((v) => v.effort)).size).toBe(3);
    vs.forEach((v) => {
      expect(v.what.endsWith("— but the smallest version: one feature, one page, or one product, finished this week.")).toBe(false);
      expect(v.firstVersion.length).toBeGreaterThan(10);
      expect(v.test.length).toBeGreaterThan(10);
    });
  });

  it("reads the shape of the idea", () => {
    expect(shapeOf(CHORES)).toBe("software");
    expect(shapeOf("Hand-poured candles that smell like a campfire")).toBe("product");
    expect(shapeOf("A monthly board-game night at the library")).toBe("event");
    expect(shapeOf("Dog walking for busy neighbors")).toBe("service");
  });

  it("recommends the cheapest test when time or money is tight, and says why", () => {
    const r = recommendVersion(CHORES, "only weekends, no budget");
    expect(r.id).toBe("test");
    expect(r.why).toMatch(/weekends/);
    expect(recommendVersion(CHORES, "").id).toBe("small");
  });
});

describe("the decision is finished", () => {
  it("fills every field the old screen made the visitor write", () => {
    const vs = ideaVersions(CHORES, "my family");
    const rec = recommendVersion(CHORES, "");
    for (const v of vs) {
      const d = decisionFor(v, CHORES, "my family", "", rec, NOW);
      expect(d.description).not.toBe("");
      expect(d.simplestFirstVersion).not.toBe("");
      expect(d.requiredTools).not.toBe("");
      expect(d.firstAction).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), /);
      expect(d.successTest).toMatch(/Check on /);
      expect(d.nextEngineId).not.toBe("");
      expect(decisionToMarkdown(d, "Chores", v.label)).toContain("First action");
    }
  });

  it("hands a software idea to Build with the original sentence intact", () => {
    const small = ideaVersions(CHORES, "")[1];
    const d = decisionFor(small, CHORES, "", "", recommendVersion(CHORES, ""), NOW);
    expect(d.nextEngineId).toBe("build");
    expect(handoffAnswers(d, "Chores").purpose).toContain("parents assign chores");
  });

  it("the studio no longer asks for 25 ratings or blank decision fields", () => {
    const src = readFileSync(join(__dirname, "IdeaStudio.tsx"), "utf8");
    expect(src).not.toMatch(/IDEA_FACTORS|setScore|\/25/);
    expect(src).not.toMatch(/Fill in the decision/);
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

describe("2026-10-28 pass: the idea stays the idea", () => {
  const IDEA = "I want to make cat stickers of a grumpy cat in a tiny crown";
  it("reads as a noun phrase in the version text", () => {
    const [test] = ideaVersions("A card game where kids invent silly animals and trade them", "");
    expect(test.what).toContain("one sample of a card game");
    expect(ideaVersions(IDEA, "")[0].what).toContain("one sample of cat stickers");
    expect(ideaVersions(IDEA, "").map((v) => v.what).join(" ")).not.toMatch(/i want to/i);
  });
  it("hands Sell the original idea, not the approach sentence, and claims nothing exists", () => {
    const v = ideaVersions(IDEA, "")[0];
    const d = decisionFor(v, IDEA, "cat lovers", "", recommendVersion(IDEA, ""), NOW);
    expect(d.description).toBe(`${IDEA}.`);
    expect(d.approach).toBe(v.what);
    const sell = handoffAnswers({ ...d, nextEngineId: "sell" }, "Stickers");
    expect(sell.product).toBe(`${IDEA}.`);
    expect(sell.exists).toBeUndefined();
  });
});
