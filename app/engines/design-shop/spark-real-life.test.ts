// Owner rejection: the Spark screen was an eight-field wall (name, idea,
// theme, customer, occasion, product type, spark phrase, constraint — five
// marked required) before generating anything. Real-life test: "I need a
// simple logo for a family game" should need only the idea to get moving.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "DesignShopStudio.tsx"), "utf8");

describe("Design Shop — one idea starts it, not an eight-field form", () => {
  it("asks what to design as the one open question", () => {
    expect(src).toMatch(/What do you need to design\?/);
  });

  it("only the idea is required to generate directions", () => {
    expect(src).toMatch(/if \(!answers\.idea\?\.trim\(\)\)/);
    // The old five-field required gate is gone.
    expect(src).not.toMatch(/!answers\.name \|\| !answers\.idea \|\| !answers\.customer/);
  });

  it("everything else is tucked behind an optional details disclosure", () => {
    expect(src).toMatch(/<details/);
    expect(src).toMatch(/Add detail \(optional/);
  });

  it("missing customer/product type degrade gracefully instead of blocking", () => {
    expect(src).toMatch(/"the person you have in mind"/);
    expect(src).toMatch(/answers\.productType\?\.trim\(\) \|\| "product"/);
  });

  it("derives a project name from the idea instead of asking for one first", () => {
    expect(src).toMatch(/function deriveDesignName/);
  });
});
