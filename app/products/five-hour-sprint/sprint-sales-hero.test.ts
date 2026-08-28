// 2026-08-27 visual-conversion correction: the sales-page hero must show
// pricing and the application action before a visitor scrolls into the
// explanatory bands below — not just an outcome sentence.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "page.tsx"), "utf8");

describe("Five Hour Sprint sales page — first-screen hero", () => {
  const hero = src.slice(src.indexOf("<Masthead"), src.indexOf("</Masthead>"));

  it("states the outcome inside the hero", () => {
    expect(hero).toMatch(/Finish one valuable piece of work/);
  });

  it("shows all three real prices before any Band section", () => {
    expect(hero).toMatch(/\$1,500/);
    expect(hero).toMatch(/\$2,500/);
    expect(hero).toMatch(/\$5,000/);
  });

  it("names Founding, Standard, and Team inside the hero", () => {
    expect(hero).toContain("Founding");
    expect(hero).toContain("Standard");
    expect(hero).toContain("Team");
  });

  it("states what can fit in the window inside the hero", () => {
    expect(hero).toMatch(/What can fit/);
  });

  it("puts Apply for a Sprint inside the hero, not only further down the page", () => {
    expect(hero).toContain("Apply for a Sprint");
    expect(hero).toMatch(/href="\/products\/five-hour-sprint\/apply"/);
  });

  it("has no em dash in the hero copy", () => {
    expect(hero).not.toMatch(/—/);
  });
});
