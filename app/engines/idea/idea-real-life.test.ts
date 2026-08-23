// Real-life test: "I have three versions of the same idea" should only need
// the idea itself to start comparing — not a name and an audience first.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "IdeaStudio.tsx"), "utf8");

describe("Idea Engine — the idea alone is enough to start", () => {
  it("opens by asking what you're thinking about", () => {
    expect(src).toMatch(/What are you thinking about\?/);
  });

  it("only the idea itself is required to collect angles", () => {
    expect(src).toMatch(/if \(!answers\.seed\?\.trim\(\)\)/);
    expect(src).not.toMatch(/!answers\.name \|\| !answers\.seed \|\| !answers\.who/);
  });

  it("derives a project name from the idea instead of asking for one first", () => {
    expect(src).toMatch(/function deriveIdeaName/);
  });
});
