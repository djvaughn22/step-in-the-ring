// A first-time visitor must not be forced to learn seven internal stages
// before they understand the product — the simple model has to come first,
// and the detailed walkthrough has to still be there for people who want it.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "page.tsx"), "utf8");

describe("How It Works — simple model before the detailed one", () => {
  it("defines a three-step simple model", () => {
    expect(src).toMatch(/const SIMPLE = \[/);
    const count = (src.match(/emoji:/g) ?? []).length;
    expect(count).toBe(3);
  });

  it("renders SIMPLE before the detailed STEPS list", () => {
    const simpleAt = src.indexOf("{SIMPLE.map");
    const stepsAt = src.indexOf("{STEPS.map");
    expect(simpleAt).toBeGreaterThan(-1);
    expect(stepsAt).toBeGreaterThan(-1);
    expect(simpleAt).toBeLessThan(stepsAt);
  });

  it("still carries all seven detailed steps — nothing was thrown away", () => {
    expect(src).toMatch(/n: "01"/);
    expect(src).toMatch(/n: "07"/);
    const count = (src.match(/n: "0\d"/g) ?? []).length;
    expect(count).toBe(7);
  });
});
