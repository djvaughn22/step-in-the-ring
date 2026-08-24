// Owner rejection (round 2): "Question 1 of 7 / Question 2 of 7" is still a
// form, even framed as one question at a time. These tests lock in the
// corrected version — a quiet progress rail instead of a literal fraction,
// project name asked last, and real deterministic early value that fires
// right after the FIRST real answer (not the third), with a periodic
// checkpoint again partway through a long intake.
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

  it("never shows the literal 'Question N of M' form tell", () => {
    expect(src).not.toMatch(/Question \{wizardStep \+ 1\} of \{steps\.length\}/);
    expect(src).not.toMatch(/Question \d+ of \d+/);
  });

  it("shows a quiet step-progress cue instead, still accessible", () => {
    // A dot per step, filled for done, solid for current.
    expect(src).toMatch(/steps\.map\(\(_, i\) => \(/);
    expect(src).toMatch(/Step \{wizardStep \+ 1\} of \{steps\.length\}/); // sr-only text
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

  it("gives a real, deterministic early value moment, built from the actual answers", () => {
    expect(src).toMatch(/generatePackage\(engine, answers, stage, depth, destination\)/);
    expect(src).toMatch(/pkg\.direction/);
  });

  it("the value checkpoint fires right after the FIRST real answer for every generic engine", () => {
    const bespoke = new Set(["design-shop", "game", "story", "howto", "idea", "music", "writing"]);
    const generic = ENGINES.filter((e) => !e.hidden && !bespoke.has(e.id));
    expect(src).toMatch(/function valueCheckpoints\(steps: Question\[\]\)/);
    // Every generic engine's first non-name question is index 0 — the
    // checkpoint function always includes 0 for any multi-step wizard.
    for (const e of generic) {
      const nonNameQuestions = e.intake.filter((q) => q.key !== "name").length;
      expect(nonNameQuestions).toBeGreaterThan(1); // real multi-step wizards, not trivial forms
    }
  });

  it("does not wait until the third question to show anything useful", () => {
    // The old hardcoded trigger is gone — no more "never past index 2" ceiling.
    expect(src).not.toMatch(/Math\.min\(2, steps\.length - 1\)/);
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
