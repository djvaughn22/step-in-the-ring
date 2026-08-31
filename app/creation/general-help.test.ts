// The front-door broadening checkpoint (2026-08-30).
//
// Before this, EVERY input that didn't match a concrete creation shape
// (app/site/game/music/story/...) fell into creationType "unknown" and was
// unconditionally routed to the Idea Engine with "It's still an early
// thought — weigh a few versions and leave with one decision." That is
// wrong for "explain this bill," "my faucet is leaking," or "teach me how
// compound interest works" — none of those are ideas still taking shape,
// and none of them have a "version" to weigh.
//
// Separately, FIX_WORDS ("broken", "stopped working") had no digital-vs-
// physical distinction at all: "My toaster is broken" was confirmed live
// to route to the software Fix Engine with "copy it into your builder."
//
// This file locks the fix: a new CreationType, "general-help", covers
// comprehension ("explain X"), decision ("help me decide between..."),
// learning ("teach me X"), and real-world trouble (a physical object
// malfunctioning with no digital context) — routed through the SAME
// honest "no primary engine, here's a portable brief" mechanism already
// used for "fix" and "lands in something existing," never a new fake
// capability. Two narrow, well-justified vocabulary additions (STORY now
// recognizes "letter"/"essay"; EVENT now recognizes "vacation"/"holiday")
// are also locked here since they were found and fixed as part of the same
// investigation.

import { describe, expect, it } from "vitest";
import { adapterForType } from "./adapters";
import { DEFAULT_BUILDER_DEFAULTS } from "./builder-defaults";
import { newRecord, viewOf } from "./record";
import { recommendEngines } from "./recommend";
import { CREATION_TYPE_LABEL } from "./types";

function classify(text: string) {
  const v = viewOf(newRecord(text));
  return { v, rec: recommendEngines(v) };
}

describe("front door — the ten representative inputs route honestly", () => {
  it("'I want to make an app.' still gets the beginner software path", () => {
    const { v, rec } = classify("I want to make an app.");
    expect(v.software.verdict).toBe("central");
    expect(rec.primary?.engineId).toBe("first-build");
  });

  it("'I want to write a song.' still goes to the Music Engine", () => {
    const { rec } = classify("I want to write a song.");
    expect(rec.primary?.engineId).toBe("music");
  });

  it("'Write a letter to my insurance company.' now reads as a written piece, not an early idea", () => {
    const { v, rec } = classify("Write a letter to my insurance company.");
    expect(v.creationType).toBe("story");
    expect(rec.primary?.engineId).toBe("writing");
  });

  it("'Help me plan a vacation.' now reads as a real-world plan, not an early idea", () => {
    const { v, rec } = classify("Help me plan a vacation.");
    expect(v.creationType).toBe("event-plan");
    expect(rec.primary?.engineId).toBe("plan");
  });

  it("'My faucet is leaking.' gets an honest non-engine path, not the Idea Engine's version-weighing", () => {
    const { v, rec } = classify("My faucet is leaking.");
    expect(v.creationType).toBe("general-help");
    expect(rec.primary).toBeNull();
    expect(rec.promptPathWhy).not.toMatch(/weigh a few versions/i);
  });

  it("\"I don't understand this bill.\" gets an honest non-engine path", () => {
    const { v, rec } = classify("I don't understand this bill.");
    expect(v.creationType).toBe("general-help");
    expect(rec.primary).toBeNull();
  });

  it("'Explain this document to me.' gets an honest non-engine path", () => {
    const { v, rec } = classify("Explain this document to me.");
    expect(v.creationType).toBe("general-help");
    expect(rec.primary).toBeNull();
  });

  it("'Help me decide between these two options.' gets an honest non-engine path", () => {
    const { v, rec } = classify("Help me decide between these two options.");
    expect(v.creationType).toBe("general-help");
    expect(rec.primary).toBeNull();
  });

  it("'Teach me how compound interest works.' gets an honest non-engine path", () => {
    const { v, rec } = classify("Teach me how compound interest works.");
    expect(v.creationType).toBe("general-help");
    expect(rec.primary).toBeNull();
  });

  it("'I have an idea but don't know where to start.' is UNCHANGED — still the Idea Engine", () => {
    const { v, rec } = classify("I have an idea but don't know where to start.");
    expect(v.creationType).toBe("unknown");
    expect(rec.primary?.engineId).toBe("idea");
    expect(rec.primary?.why).toMatch(/weigh a few versions/i);
  });
});

describe("the confirmed Fix-Engine misroute for household breakage is closed", () => {
  it("a broken toaster no longer routes to the software Fix Engine", () => {
    const { v, rec } = classify("My toaster is broken.");
    expect(v.creationType).toBe("general-help");
    expect(rec.primary).toBeNull();
    expect(rec.promptPathWhy).not.toMatch(/builder|repair prompt/i);
    expect((rec.alternates ?? []).some((a) => a.engineId === "fix")).toBe(false);
  });

  it("a car that won't start no longer routes to the software Fix Engine", () => {
    const { v, rec } = classify("My car won't start.");
    expect(v.creationType).toBe("general-help");
    expect(rec.primary).toBeNull();
  });

  it("a washing machine that stopped working no longer routes to the software Fix Engine", () => {
    const { v, rec } = classify("The washing machine stopped working.");
    expect(v.creationType).toBe("general-help");
    expect(rec.primary).toBeNull();
  });

  it("a GENUINE software bug report still routes to the real Fix Engine — the guard is narrow, not a blanket suppression", () => {
    const { rec } = classify("The login button on my app is broken.");
    expect(rec.primary).toBeNull(); // "fix" is a promptPathWhy case, not a primary door
    expect(rec.promptPathWhy).toMatch(/looks before it touches/i);
    expect((rec.alternates ?? []).some((a) => a.engineId === "fix")).toBe(true);
  });

  it("a stopped-working WEBSITE still reads as a software fix, not general-help", () => {
    const { v, rec } = classify("My website stopped working.");
    expect(v.creationType).not.toBe("general-help");
    expect((rec.alternates ?? []).some((a) => a.engineId === "fix")).toBe(true);
  });
});

describe("general-help's own generated brief is honest — no fake capability", () => {
  it("never claims a version to weigh or a codebase to inspect", () => {
    const { v } = classify("I don't understand this bill.");
    const prompt = adapterForType(v.creationType).prompt(v, DEFAULT_BUILDER_DEFAULTS);
    expect(prompt).not.toMatch(/codebase/i);
    expect(prompt).not.toMatch(/mobile-first/i);
    expect(prompt).not.toMatch(/score.{0,10}factors|decision record/i);
    // Explicitly says there's nothing to weigh — the opposite claim, not the absence of the word.
    expect(prompt).toMatch(/no version to weigh and nothing to build/i);
    expect(prompt).toMatch(/only has the words above/i);
  });

  it("says plainly what Step In The Ring was never shown", () => {
    const { v } = classify("My faucet is leaking.");
    const prompt = adapterForType(v.creationType).prompt(v, DEFAULT_BUILDER_DEFAULTS);
    expect(prompt).toMatch(/not the actual bill, document, mechanic, or object/i);
  });
});

describe("general-help is a real, exhaustively-wired CreationType", () => {
  it("has a label, a software verdict, and an adapter — not a silent default", () => {
    expect(CREATION_TYPE_LABEL["general-help"]).toBeTruthy();
    expect(adapterForType("general-help").engineId).toBe("general-help-prompt");
  });
});

// Mom-and-dad first-time journey audit (2026-08-30). Confirmed live: "The
// tools this needs" card said "Paper first... the idea needs one more
// decision before tools matter... until the creation has a definite
// form" — language written for a vague idea still taking shape, wrong for
// an already-clear question like "my faucet is leaking."
describe("the tools card for general-help doesn't talk like an unformed idea", () => {
  it("never says the question 'needs a decision' or 'a definite form'", () => {
    const { v } = classify("My faucet is leaking.");
    const text = `${v.tools.stack} ${v.tools.why} ${v.tools.setup.join(" ")} ${v.tools.noSetup.join(" ")} ${v.tools.wait.join(" ")}`;
    expect(text).not.toMatch(/needs one more decision/i);
    expect(text).not.toMatch(/definite form/i);
  });

  it("says plainly this isn't something to build", () => {
    const { v } = classify("I don't understand this bill.");
    expect(v.tools.why).toMatch(/not something to build/i);
  });
});
