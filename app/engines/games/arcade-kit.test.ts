/**
 * Arcade Kit tests — the exact code serialized into published games,
 * exercised directly: seeded determinism, input buffering, collision
 * honesty, particle caps, persisted audio, bests that only go up, and
 * the anti-mash restart guard.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { ARCADE_KIT_JS, arcadeKitFactory } from "./arcade-kit";

const kit = arcadeKitFactory();

// A tiny localStorage stand-in so persistence paths run in Node.
const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
  };
});

describe("seeded rng", () => {
  it("same seed, same stream — deterministic replays", () => {
    const a = kit.rng(2026);
    const b = kit.rng(2026);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("different seeds diverge and values stay in [0,1)", () => {
    const a = kit.rng(1);
    const c = kit.rng(999);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqC = Array.from({ length: 20 }, () => c.next());
    expect(seqA).not.toEqual(seqC);
    for (const v of [...seqA, ...seqC]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("input buffering", () => {
  it("a press inside the buffer window counts exactly once", () => {
    const input = kit.createInput(120);
    input.press("action", 1000);
    expect(input.consume("action", 1100)).toBe(true);
    expect(input.consume("action", 1100)).toBe(false); // consumed
  });

  it("a stale press does not fire", () => {
    const input = kit.createInput(120);
    input.press("action", 1000);
    expect(input.consume("action", 1200)).toBe(false);
  });

  it("held state tracks press and release", () => {
    const input = kit.createInput();
    input.press("left", 0);
    expect(input.held.left).toBe(true);
    input.release("left");
    expect(input.held.left).toBe(false);
  });
});

describe("collision helpers", () => {
  it("circles and rects overlap honestly", () => {
    expect(kit.collide.circles(0, 0, 5, 8, 0, 4)).toBe(true);
    expect(kit.collide.circles(0, 0, 5, 10, 0, 4)).toBe(false);
    expect(kit.collide.rects(0, 0, 10, 10, 8, 8, 10, 10)).toBe(true);
    expect(kit.collide.rects(0, 0, 10, 10, 11, 0, 5, 5)).toBe(false);
  });

  it("swept crossing catches fast objects (no tunneling)", () => {
    // Moving 30 units in one frame across a line at 25: still detected.
    expect(kit.collide.crossed(10, 40, 25, 0, -1, 1)).toBe(true);
    // Lateral miss at the crossing moment: not a hit.
    expect(kit.collide.crossed(10, 40, 25, 5, -1, 1)).toBe(false);
    // Didn't reach the line: not a hit.
    expect(kit.collide.crossed(10, 20, 25, 0, -1, 1)).toBe(false);
  });
});

describe("particles", () => {
  it("hard cap: overflow evicts the oldest, count never exceeds cap", () => {
    const ps = kit.createParticles(10);
    for (let i = 0; i < 50; i++) {
      ps.spawn({ x: i, y: 0, vx: 0, vy: 0, life: 99, size: 1, color: "#fff" });
    }
    expect(ps.count).toBe(10);
  });

  it("expired particles are removed by tick", () => {
    const ps = kit.createParticles();
    ps.spawn({ x: 0, y: 0, vx: 1, vy: 0, life: 0.1, size: 1, color: "#fff" });
    ps.tick(0.2);
    expect(ps.count).toBe(0);
  });
});

describe("screen shake accessibility", () => {
  it("reduced motion means zero offset, always", () => {
    expect(kit.shakeOffset(0.05, 10, true)).toEqual({ dx: 0, dy: 0 });
    const live = kit.shakeOffset(0.05, 10, false);
    expect(Math.abs(live.dx) + Math.abs(live.dy)).toBeGreaterThan(0);
  });

  it("shake decays to nothing", () => {
    const off = kit.shakeOffset(2, 10, false);
    expect(Math.abs(off.dx)).toBe(0);
    expect(Math.abs(off.dy)).toBe(0);
  });
});

describe("persisted audio settings", () => {
  it("defaults sound on / music off, and toggles persist", () => {
    const a = kit.createAudioSettings("testgame");
    expect(a.sound).toBe(true);
    expect(a.music).toBe(false);
    a.toggleSound();
    a.toggleMusic();
    const b = kit.createAudioSettings("testgame");
    expect(b.sound).toBe(false);
    expect(b.music).toBe(true);
  });
});

describe("bests", () => {
  it("only go up", () => {
    const bests = kit.createBests("testgame");
    expect(bests.record("endless", 100)).toBe(true);
    expect(bests.record("endless", 60)).toBe(false);
    expect(bests.best("endless")).toBe(100);
    expect(bests.record("endless", 150)).toBe(true);
    expect(bests.best("endless")).toBe(150);
  });
});

describe("restart guard", () => {
  it("swallows end-of-run mashing, then allows the restart", () => {
    const g = kit.createRestartGuard(600);
    expect(g.canRestart(0)).toBe(false); // no game over yet
    g.onGameOver(1000);
    expect(g.canRestart(1100)).toBe(false); // mashed
    expect(g.canRestart(1700)).toBe(true);  // meant
  });
});

describe("serialized kit", () => {
  it("the shipped script is the same factory the tests ran", () => {
    expect(ARCADE_KIT_JS).toContain("window.ArcadeKit");
    // Evaluate the serialized script against a stub window: it must build
    // the same API surface.
    const win: Record<string, unknown> = {};
    new Function("window", ARCADE_KIT_JS)(win);
    const shipped = win.ArcadeKit as ReturnType<typeof arcadeKitFactory>;
    expect(Object.keys(shipped).sort()).toEqual(Object.keys(kit).sort());
    expect(shipped.rng(7).next()).toBe(kit.rng(7).next());
  });
});
