// First Build Coach copy (owner, 2026-10-08): no assistant-name promotion or
// AI marketing; third-party requirements are stated plainly where they are
// used; old saved progress with the renamed idea type still loads.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(join(__dirname, "page.tsx"), "utf8");
const visible = src.replace(/\/\/.*$/gm, "").replace(/s\.ideaType === "AI tool"/, "");

describe("First Build Coach wording", () => {
  it("names no AI assistant and uses no AI label", () => {
    expect(visible).not.toMatch(/ChatGPT|Claude|\bAI tool\b|"AI/);
  });

  it("says plainly that the outside services are separate", () => {
    expect(src).toContain("Each of these is a separate service you sign up for yourself.");
    expect(src).toContain("this page does not include one");
    expect(src).toContain("needs a tool that can edit the files in your project folder");
  });

  it("keeps saved progress from before the rename", () => {
    expect(src).toContain('s.ideaType === "AI tool" ? "Simple tool"');
    expect(src).toMatch(/SUGGEST\[ideaType \?\? "I'm not sure"\] \?\? SUGGEST\["I'm not sure"\]/);
  });
});
