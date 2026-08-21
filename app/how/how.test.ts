// A first-time visitor must not be forced to learn seven internal stages
// before they understand the product — the simple model has to come first,
// and the detailed walkthrough has to still be there for people who want it.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "page.tsx"), "utf8");

describe("How It Works — simple model before the detailed one", () => {
  it("defines the five-move loop, the same one the homepage shows", () => {
    expect(src).toMatch(/const LOOP = \[/);
    const loop = src.slice(src.indexOf("const LOOP = ["), src.indexOf("const STEPS"));
    expect((loop.match(/n: "0\d"/g) ?? []).length).toBe(5);
  });

  it("renders the loop before the detailed STEPS list", () => {
    const simpleAt = src.indexOf("{LOOP.map");
    const stepsAt = src.indexOf("{STEPS.map");
    expect(simpleAt).toBeGreaterThan(-1);
    expect(stepsAt).toBeGreaterThan(-1);
    expect(simpleAt).toBeLessThan(stepsAt);
  });

  it("still carries all seven detailed steps — nothing was thrown away", () => {
    const steps = src.slice(src.indexOf("const STEPS"));
    expect(steps).toMatch(/n: "01"/);
    expect(steps).toMatch(/n: "07"/);
    expect((steps.match(/n: "0\d"/g) ?? []).length).toBe(7);
  });
});
