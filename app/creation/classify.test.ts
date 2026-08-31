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

// Mom-and-dad final acceptance pass (2026-08-30). The exact same bare-noun
// bug "coach" had, now confirmed live for "service": answering "I don't
// understand this bill"'s follow-up question ("What part is confusing or
// concerning you?") with "There's a $60 service fee I don't remember
// agreeing to" reclassified the WHOLE creation from general-help to "A
// service" — "deliver it manually to one real customer, start to finish,"
// with the "what can help" wrong-tool suggestions back too. A bill
// mentioning a service fee is far more common than someone starting a
// service business while explaining a bill.
describe("SERVICE no longer fires on ordinary bill/administrative phrases", () => {
  it("a service fee mentioned while explaining a bill stays general-help, not a service business", () => {
    const { type } = classifyCreationType(
      "I don't understand this bill. There's a $60 service fee I don't remember agreeing to.",
      "unknown",
    );
    expect(type).not.toBe("service");
  });

  it("customer service and terms of service don't trigger it either", () => {
    expect(classifyCreationType("Customer service never called me back about it.", "unknown").type).not.toBe("service");
    expect(classifyCreationType("It says something about terms of service I didn't agree to.", "unknown").type).not.toBe("service");
  });

  it("a real service business is still detected — the fix excludes phrases, not the concept", () => {
    expect(classifyCreationType("I want to start a dog walking service.", "unknown").type).toBe("service");
    expect(classifyCreationType("I want to offer a lawn mowing service to my neighborhood.", "unknown").type).toBe("service");
  });
});

// Mom-and-dad final acceptance pass (2026-08-30). Same bare-word ambiguity
// class as "coach" and "service" above, found while walking the actual
// decision journey: answering "Help me decide between two options" with
// "Option A: keep renting my apartment. Option B: buy a small house..."
// matched the bare CARE_VERB "keep" (meant for "keep a dog busy") with no
// dependent required, and routed a housing decision to "you described a
// problem to solve" / a software-tool reading ("Write one more sentence:
// who uses this, and what they do with it").
describe("the caretaker-tool shortcut requires an actual dependent, not just the bare verb", () => {
  it("'keep renting my apartment' is not a caretaker pattern", () => {
    const { type } = classifyCreationType(
      "Option A: keep renting my apartment. Option B: buy a small house with a bigger mortgage payment.",
      "unknown",
    );
    expect(type).not.toBe("tool");
  });

  it("the real caretaker example — keep a dog busy — still reads as a problem-solving tool", () => {
    const { type } = classifyCreationType("Keep a dog busy and entertained.", "unknown");
    expect(type).toBe("tool");
  });

  it("'solve'/'problem' alone still routes to tool, no dependent needed for that path", () => {
    const { type } = classifyCreationType("I need to solve a scheduling problem for my team.", "unknown");
    expect(type).toBe("tool");
  });
});
