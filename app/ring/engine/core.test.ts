// The original Heisman engine tests from iDontCry (Nov 25 2026), carried over
// unchanged: Creative Ring uses the same mechanics. Only the storage prefix differs.
import { describe, expect, it } from "vitest";
import {
  EVEN_WITHIN_SECONDS, MAX_TRIES, clearTries, compareSides, fillSide, heldSeconds, loadPrefs, loadTries,
  progressLine, saveTry, savePrefs, sinceFirst, triesKey, verdictLine, type SideResult, type Try,
} from "./core";
import { skeleton } from "./figure";
import { HEISMAN } from "./heisman";

class MemoryStorage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  clear() {
    this.m.clear();
  }
  getItem(k: string) {
    return this.m.has(k) ? (this.m.get(k) as string) : null;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
}
const mem = () => new MemoryStorage() as unknown as Storage;

const side = (taps: number[], feel: number | null = 3, hold = 20): SideResult => ({ hold, taps, feel });
const tryOf = (left: SideResult, right: SideResult, at: string, extra: Partial<Try> = {}): Try => ({
  at, version: "standing", hold: 20, first: "left", left, right, ...extra,
});

describe("the copy tokens", () => {
  it("fills a side and its other side, in both cases", () => {
    expect(fillSide("{Side}: {side} knee up, standing on your {other} leg ({Other})", "left")).toBe(
      "Left: left knee up, standing on your right leg (Right)",
    );
  });

  it("leaves no token unfilled anywhere in the Heisman", () => {
    const texts = [
      HEISMAN.caption, HEISMAN.slip.howTo,
      ...HEISMAN.drills.map((d) => d.text),
      ...HEISMAN.versions.standing.steps, ...HEISMAN.versions.seated.steps,
    ];
    for (const s of ["left", "right"] as const) {
      for (const t of texts) expect(fillSide(t, s)).not.toMatch(/[{}]/);
    }
  });
});

describe("held seconds", () => {
  it("is the whole hold when nobody tapped", () => {
    expect(heldSeconds(side([]))).toBe(20);
  });
  it("is the first tap, to one decimal", () => {
    expect(heldSeconds(side([7444, 9000]))).toBe(7.4);
    expect(heldSeconds(side([9000, 7444]))).toBe(7.4);
  });
  it("never runs past the hold", () => {
    expect(heldSeconds(side([25_000]))).toBe(20);
  });
});

describe("which side was steadier", () => {
  it("goes by the clock when the gap is a clear one", () => {
    const v = compareSides(side([3000]), side([]));
    expect(v).toEqual({ steadier: "right", by: "time", gap: 17 });
    expect(verdictLine(v, HEISMAN)).toBe(
      "Your right side was steadier. It held 17 seconds longer before the first touch-down.",
    );
  });

  it("calls a gap under a second a tie on the clock, then counts touch-downs", () => {
    const v = compareSides(side([5000]), side([5600, 9000, 12000]));
    expect(EVEN_WITHIN_SECONDS).toBe(1);
    expect(v).toEqual({ steadier: "left", by: "slips", gap: 2 });
    expect(verdictLine(v, HEISMAN)).toBe("Your left side was steadier, with 2 fewer touch-downs.");
  });

  it("uses the self-rating only when the clock and the count agree", () => {
    const v = compareSides(side([], 2), side([], 5));
    expect(v).toEqual({ steadier: "right", by: "feel", gap: 3 });
    expect(verdictLine(v, HEISMAN)).toBe("Even on the clock. Your right side felt steadier.");
  });

  it("says even when nothing separates them, and when a rating is missing", () => {
    expect(compareSides(side([], 4), side([], 4)).by).toBe("even");
    expect(compareSides(side([], null), side([], 5)).by).toBe("even");
    expect(verdictLine(compareSides(side([]), side([])), HEISMAN)).toBe("Even. Both sides held about the same.");
  });
});

describe("the history on this device", () => {
  it("saves and reads back tries, oldest first", () => {
    const s = mem();
    saveTry("heisman", tryOf(side([3000]), side([]), "2026-11-25T01:00:00.000Z"), s);
    const all = saveTry("heisman", tryOf(side([]), side([]), "2026-11-26T01:00:00.000Z"), s);
    expect(all).toHaveLength(2);
    expect(loadTries("heisman", s).map((t) => t.at)).toEqual(["2026-11-25T01:00:00.000Z", "2026-11-26T01:00:00.000Z"]);
  });

  it("ignores anything unreadable instead of throwing", () => {
    const s = mem();
    s.setItem(triesKey("heisman"), "{not json");
    expect(loadTries("heisman", s)).toEqual([]);
    s.setItem(triesKey("heisman"), JSON.stringify({ v: 1, tries: [{ at: "x" }, tryOf(side([]), side([]), "ok")] }));
    expect(loadTries("heisman", s).map((t) => t.at)).toEqual(["ok"]);
    expect(loadTries("heisman", null)).toEqual([]);
  });

  it("keeps only the latest tries, and clears on request", () => {
    const s = mem();
    for (let i = 0; i < MAX_TRIES + 5; i++) saveTry("heisman", tryOf(side([]), side([]), `t${i}`), s);
    const kept = loadTries("heisman", s);
    expect(kept).toHaveLength(MAX_TRIES);
    expect(kept[0].at).toBe("t5");
    clearTries("heisman", s);
    expect(loadTries("heisman", s)).toEqual([]);
  });

  it("gives the arcade card one line about the latest try", () => {
    expect(progressLine([])).toBeNull();
    expect(progressLine([tryOf(side([7444]), side([]), "a")])).toBe("Last try: left 7.4s · right 20s");
  });

  it("compares the first and latest tries only when they were done the same way", () => {
    const a = tryOf(side([3000]), side([]), "a");
    const b = tryOf(side([9000]), side([]), "b", { hold: 30 });
    expect(sinceFirst([a])).toBeNull();
    expect(sinceFirst([a, b])).toBeNull();
    const c = tryOf(side([12000]), side([]), "c");
    expect(sinceFirst([a, b, c])).toEqual({ first: a, last: c, count: 2 });
  });

  it("remembers choices, and refuses a hold length the challenge does not offer", () => {
    const s = mem();
    expect(loadPrefs(HEISMAN, s)).toEqual({ version: "standing", hold: 20, first: "left", sound: true });
    savePrefs("heisman", { version: "seated", hold: 30, first: "right", sound: false, kicks: "left" }, s);
    expect(loadPrefs(HEISMAN, s)).toMatchObject({ version: "seated", hold: 30, first: "right", sound: false, kicks: "left" });
    savePrefs("heisman", { version: "standing", hold: 45, first: "left", sound: true }, s);
    expect(loadPrefs(HEISMAN, s).hold).toBe(HEISMAN.defaultHold);
  });
});

describe("the Heisman's own words", () => {
  it("offers a seated version and its hold lengths", () => {
    expect(HEISMAN.holdChoices).toContain(HEISMAN.defaultHold);
    expect(HEISMAN.versions.seated.steps.length).toBeGreaterThan(0);
    expect(HEISMAN.feel).toHaveLength(5);
  });

  it("says plainly what it cannot measure, and makes no health claim", () => {
    const limits = HEISMAN.limits.join(" ");
    expect(limits).toMatch(/No camera and no motion sensors/);
    expect(limits).toMatch(/not a medical, fitness or ambidexterity test/);
    expect(limits).toMatch(/on this device only/);
    const all = JSON.stringify(HEISMAN);
    expect(all).not.toMatch(/\bAI\b|brain|intelligen|diagnos|cure|improves your/i);
  });

  it("shows a clip only when one we may use is configured", () => {
    expect(HEISMAN.reference.kind).toBe("animation");
  });
});

describe("the figure", () => {
  it("draws the pose: arm straight out at shoulder height, knee up, standing foot on the ground", () => {
    const sk = skeleton(HEISMAN.poses.standing.hold);
    const get = (id: string) => sk.segs.find((g) => g.id === id)!;
    const upper = get("near-upper");
    const fore = get("near-fore");
    expect(fore.x2).toBeGreaterThan(upper.x1 + 45); // reaches well forward
    expect(Math.abs(fore.y2 - upper.y1)).toBeLessThan(12); // about level with the shoulder
    expect(get("near-thigh").y2).toBeLessThan(get("far-thigh").y2 - 20); // knee lifted
    expect(Math.abs(get("far-shin").y2 - sk.ground)).toBeLessThan(6); // standing foot down
  });

  it("puts the seated figure on a chair with both feet down before the pose", () => {
    const sk = skeleton(HEISMAN.poses.seated.start, true);
    expect(sk.chair.length).toBeGreaterThan(0);
    for (const id of ["near-shin", "far-shin"]) {
      expect(Math.abs(sk.segs.find((g) => g.id === id)!.y2 - sk.ground)).toBeLessThan(8);
    }
  });
});
