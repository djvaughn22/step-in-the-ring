// Sprint 2 product reset: SERVICE used to match the bare noun "coach", not
// just the gerund "coaching" — so any idea that merely mentioned a team's
// coach ("coach contact information" on a baseball site) got typed as a
// service being offered, not a site being built. That one false positive
// rerouted the whole reading: wrong creation type, wrong software verdict
// ("deliver it manually to a paying customer" for a plain content site),
// wrong engine.
import { describe, expect, it } from "vitest";
import { classifyCreationType } from "./classify";

describe("SERVICE no longer fires on the bare noun \"coach\"", () => {
  it("a site that merely names a coach's contact info reads as a site, not a service", () => {
    const { type } = classifyCreationType(
      "a simple website for my son's baseball team with the schedule and coach contact information",
      "site",
    );
    expect(type).toBe("site");
  });

  it("actually offering coaching still reads as a service", () => {
    const { type } = classifyCreationType("I want to offer private coaching for new runners", "unknown");
    expect(type).toBe("service");
  });
});
