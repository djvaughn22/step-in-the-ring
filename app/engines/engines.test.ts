import { describe, it, expect } from "vitest";
import { ENGINES } from "./engines";

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
