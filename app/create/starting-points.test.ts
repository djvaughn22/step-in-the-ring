// Mom-and-dad first-time journey audit (2026-08-30) — Home message check.
//
// A first-time visitor should be able to tell, within seconds, that they
// can bring a real question ("I don't understand this bill") and not just
// a thing to make. Every other example on Home ("build a simple website,"
// "make a family game," "write something," "make a song") is make/build-
// framed; only the 4th Quick Start tile was broad enough to plausibly
// cover it, and even that one said "Plan, fix, or build something else" —
// three verbs, all still about making something.
//
// This does not add a 5th tile (Home was deliberately trimmed to "four
// doors, not eight" in an earlier checkpoint) and does not change layout —
// only this one tile's own label/subtitle, so the front door can honestly
// answer "can I bring my own problem?" without becoming a menu to study.

import { describe, expect, it } from "vitest";
import { QUICK_START } from "./starting-points";

describe("Home's Quick Start still proves a real question is welcome, not just a build", () => {
  it("keeps exactly four tiles — no menu growth", () => {
    expect(QUICK_START).toHaveLength(4);
  });

  it("the fourth tile signals a real question is as welcome as a project", () => {
    const last = QUICK_START[QUICK_START.length - 1];
    expect(`${last.label} ${last.what}`.toLowerCase()).toMatch(/question|ask/);
  });

  it("every tile's stem still drops an editable sentence starter into the box, not a category", () => {
    for (const q of QUICK_START) {
      expect(q.stem.trim().length).toBeGreaterThan(0);
      expect(q.stem.endsWith(" ")).toBe(true);
    }
  });
});
