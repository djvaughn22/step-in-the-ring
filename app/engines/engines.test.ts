import { describe, it, expect } from "vitest";
import { ENGINES, DESTINATION_LABELS, DESTINATION_USES_AI, type Destination } from "./engines";

// The "Send it to" picker mixes two AI tools (Claude Code, ChatGPT) in with
// five human recipients (Terminal, Designer, Developer, Contractor, Do it
// myself) in one flat list — nothing distinguishes "this invokes AI" from
// "this is a person." DESTINATION_USES_AI is the one place that decides
// which is which; the UI (EngineSystem.tsx) reads it to group the options
// and to caption the generated prompt honestly. Only claude-code and chatgpt
// should ever be true here — adding a new AI destination without updating
// this map would silently mislabel it as "No AI."
describe("Destination — AI vs no-AI is a real, exhaustive distinction", () => {
  it("every destination has an explicit AI/no-AI answer", () => {
    const destinations = Object.keys(DESTINATION_LABELS) as Destination[];
    for (const d of destinations) {
      expect(typeof DESTINATION_USES_AI[d]).toBe("boolean");
    }
  });

  it("only Claude Code and ChatGPT are AI destinations", () => {
    const aiOnes = (Object.keys(DESTINATION_USES_AI) as Destination[]).filter((d) => DESTINATION_USES_AI[d]);
    expect(aiOnes.sort()).toEqual(["chatgpt", "claude-code"]);
  });

  it("every human destination is marked no-AI", () => {
    for (const d of ["terminal", "designer", "developer", "collaborator", "self"] as Destination[]) {
      expect(DESTINATION_USES_AI[d]).toBe(false);
    }
  });
});

describe("Engine beginWith field", () => {
  it("all engines that should have beginWith have non-empty values", () => {
    const enginesWithBeginWith = [
      "idea",
      "build",
      "sell",
      "launch",
      "fix",
      "grow",
      "plan",
      "design-shop",
      "game",
      "howto",
      "story",
      "music",
    ];

    enginesWithBeginWith.forEach((engineId) => {
      const engine = ENGINES.find((e) => e.id === engineId);
      expect(engine).toBeDefined();
      expect(engine?.beginWith).toBeDefined();
      expect(engine?.beginWith).toBeTruthy();
      expect(typeof engine?.beginWith).toBe("string");
      expect(engine?.beginWith?.length).toBeGreaterThan(0);
    });
  });
});
