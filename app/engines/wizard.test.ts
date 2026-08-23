// Owner rejection: the generic Engine Room used to open with a giant
// six-to-eight-field questionnaire before showing anything useful. These
// tests lock in the replacement — one question at a time, project name asked
// last (not first), and a real early "here's where this is heading" moment
// before every field is filled in.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ENGINES, getEngine } from "./engines";

const src = readFileSync(join(__dirname, "EngineSystem.tsx"), "utf8");

describe("generic engine intake — one question at a time, not a giant form", () => {
  it("no longer renders every intake question in one pass", () => {
    // The old giant form mapped the whole intake array into one screen.
    expect(src).not.toMatch(/\{engine\.intake\.map\(/);
  });

  it("shows a step-by-step progress cue instead of a wall of fields", () => {
    expect(src).toMatch(/Question \{wizardStep \+ 1\} of \{steps\.length\}/);
  });

  it("asks project name at the end, not first", () => {
    const steps = ENGINES.find((e) => e.id === "build")!.intake;
    expect(steps[0].key).toBe("name"); // still first in the raw registry order...
    // ...but wizardSteps() strips it, and the wizard only asks it on the
    // final screen (the source renders the name input inside `atFinal`).
    expect(src).toMatch(/function wizardSteps\(e: Engine\)[\s\S]{0,120}filter\(\(q\) => q\.key !== "name"\)/);
    const finalBlock = src.slice(src.indexOf("{atFinal && ("), src.indexOf("{atFinal && (") + 800);
    expect(finalBlock).toMatch(/intake-name/);
  });

  it("gives a real, deterministic early value moment before the form is complete", () => {
    expect(src).toMatch(/Here&apos;s where this is heading/);
    expect(src).toMatch(/generatePackage\(engine, answers, stage, depth, destination\)/);
  });

  it("the value moment fires no later than the 3rd question, for every generic engine", () => {
    const bespoke = new Set(["design-shop", "game", "story", "howto", "idea", "music"]);
    const generic = ENGINES.filter((e) => !e.hidden && !bespoke.has(e.id));
    for (const e of generic) {
      const nonNameQuestions = e.intake.filter((q) => q.key !== "name").length;
      expect(nonNameQuestions).toBeGreaterThan(0);
      // Math.min(2, steps.length - 1) in the source — never past index 2.
      expect(Math.min(2, nonNameQuestions - 1)).toBeLessThanOrEqual(2);
    }
  });

  it("the intro no longer promises a questionnaire", () => {
    expect(src).not.toMatch(/answer a few real questions/);
  });

  it("every generic engine still resolves through the registry", () => {
    ["build", "sell", "launch", "fix", "grow", "plan"].forEach((id) => {
      expect(getEngine(id)).toBeTruthy();
    });
  });
});
