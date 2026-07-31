/**
 * Arcade Kit — the Game Engine's reusable game-feel foundation.
 *
 * Everything the 2026 iDontCry arcade pass proved out, distilled into one
 * dependency-free runtime any single-file game template can carry:
 * a seeded deterministic RNG, a clamped fixed-step loop, keyboard/touch
 * input with press buffering, collision helpers, hard-capped particles,
 * reduced-motion-aware screen shake, persisted sound settings, best
 * scores that only go up, and an anti-mash restart guard.
 *
 * One source, two consumers:
 *  - Templates: `ARCADE_KIT_JS` is the factory serialized into a <script>
 *    tag wherever a template carries the __ARCADE_KIT__ marker (see
 *    game-modes.instantiateTemplate). The page gets `window.ArcadeKit`.
 *  - Tests: call `arcadeKitFactory()` directly and exercise the same code
 *    that ships into every published game.
 *
 * The factory body must stay dependency-free and browser-safe: no imports,
 * no references to anything outside its own scope, `window`/`localStorage`
 * only behind `typeof` guards.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export function arcadeKitFactory() {
  // ── Seeded RNG — deterministic replays, same family as Circuit's core ──
  function rng(seed: number) {
    let s = seed | 0 || 1;
    return {
      next(): number {
        // xorshift32 — fast, stable, good enough for game feel.
        s ^= s << 13; s |= 0;
        s ^= s >>> 17;
        s ^= s << 5; s |= 0;
        return ((s >>> 0) % 100000) / 100000;
      },
      state(): number { return s; },
    };
  }

  // ── Loop — clamped dt so a background tab never teleports the game ──
  function createLoop(step: (dt: number, now: number) => void, maxDt = 0.1) {
    let raf = 0;
    let last = 0;
    let running = false;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = last === 0 ? 0 : Math.min(maxDt, Math.max(0, (now - last) / 1000));
      last = now;
      step(dt, now);
    };
    return {
      start() { if (!running) { running = true; last = 0; raf = requestAnimationFrame(frame); } },
      stop() { if (running) { running = false; cancelAnimationFrame(raf); } },
      get running() { return running; },
    };
  }

  // ── Input — held keys + buffered presses (a near-correct press counts) ──
  function createInput(bufferMs = 120) {
    const held: Record<string, boolean> = {};
    const buffered: Record<string, number> = {};
    function press(key: string, atMs: number) {
      held[key] = true;
      buffered[key] = atMs;
    }
    function release(key: string) { held[key] = false; }
    /** True once if `key` was pressed within the last `bufferMs` — and
        consumes it, so one press is never two actions. */
    function consume(key: string, nowMs: number): boolean {
      const at = buffered[key];
      if (at !== undefined && nowMs - at <= bufferMs) {
        delete buffered[key];
        return true;
      }
      return false;
    }
    return { held, press, release, consume, bufferMs };
  }

  // ── Collision — the helpers every mode kept re-deriving ──
  const collide = {
    circles(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
      const dx = x2 - x1, dy = y2 - y1;
      const rr = r1 + r2;
      return dx * dx + dy * dy <= rr * rr;
    },
    rects(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number): boolean {
      return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    },
    /** Did a moving point cross a line at `lineAt` between two frames, and
        was it inside [min,max] laterally when it did? The swept check that
        makes fast objects honest (no tunneling through thin walls). */
    crossed(prevPos: number, pos: number, lineAt: number, lateral: number, min: number, max: number): boolean {
      if (!(prevPos < lineAt && pos >= lineAt)) return false;
      return lateral >= min && lateral <= max;
    },
  };

  // ── Particles — hard cap; overflow evicts the oldest, never grows ──
  function createParticles(cap = 240) {
    const list: Array<{ x: number; y: number; vx: number; vy: number; life: number; age: number; size: number; color: string }> = [];
    return {
      spawn(p: { x: number; y: number; vx: number; vy: number; life: number; size: number; color: string }) {
        if (list.length >= cap) list.shift();
        list.push({ ...p, age: 0 });
      },
      tick(dt: number, gravity = 0) {
        for (const p of list) {
          p.age += dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += gravity * dt;
        }
        for (let i = list.length - 1; i >= 0; i--) {
          if (list[i].age >= list[i].life) list.splice(i, 1);
        }
      },
      get count() { return list.length; },
      get cap() { return cap; },
      forEach(fn: (p: { x: number; y: number; age: number; life: number; size: number; color: string }) => void) {
        for (const p of list) fn(p);
      },
    };
  }

  // ── Screen shake — always respects prefers-reduced-motion ──
  function shakeOffset(ageSec: number, magnitude: number, reducedMotion: boolean): { dx: number; dy: number } {
    if (reducedMotion || ageSec < 0) return { dx: 0, dy: 0 };
    const fall = Math.max(0, 1 - ageSec * 3);
    return {
      dx: Math.sin(ageSec * 91) * magnitude * fall,
      dy: Math.cos(ageSec * 127) * magnitude * fall,
    };
  }

  // ── Persistence — sound settings + bests that only go up ──
  const storage = {
    read(key: string): any {
      try {
        if (typeof localStorage === "undefined") return null;
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    },
    write(key: string, value: any): void {
      try {
        if (typeof localStorage !== "undefined") localStorage.setItem(key, JSON.stringify(value));
      } catch { /* private mode */ }
    },
  };

  function createAudioSettings(prefix: string) {
    const key = prefix + ":audio";
    const saved = storage.read(key) || {};
    const st = { sound: saved.sound !== false, music: saved.music === true };
    return {
      get sound() { return st.sound; },
      get music() { return st.music; },
      toggleSound() { st.sound = !st.sound; storage.write(key, st); return st.sound; },
      toggleMusic() { st.music = !st.music; storage.write(key, st); return st.music; },
    };
  }

  function createBests(prefix: string) {
    const key = prefix + ":bests";
    return {
      /** Records `score` under `board`; returns true when it's a new best.
          Bests only ever go up — a bad run can never erase a good one. */
      record(board: string, score: number): boolean {
        const all = storage.read(key) || {};
        const prev = typeof all[board] === "number" ? all[board] : -Infinity;
        if (score > prev) {
          all[board] = score;
          storage.write(key, all);
          return true;
        }
        return false;
      },
      best(board: string): number | null {
        const all = storage.read(key) || {};
        return typeof all[board] === "number" ? all[board] : null;
      },
    };
  }

  // ── Restart guard — one-more-try energy without accidental restarts ──
  function createRestartGuard(guardMs = 600) {
    let overAt: number | null = null;
    return {
      onGameOver(nowMs: number) { overAt = nowMs; },
      /** A restart press only counts once the guard has passed — mashed
          end-of-run inputs never skip the result. */
      canRestart(nowMs: number): boolean {
        return overAt !== null && nowMs - overAt >= guardMs;
      },
      reset() { overAt = null; },
      guardMs,
    };
  }

  return {
    rng, createLoop, createInput, collide, createParticles,
    shakeOffset, createAudioSettings, createBests, createRestartGuard,
    version: 1,
  };
}

/**
 * The kit as an inline script — `window.ArcadeKit` in any page that carries
 * it. Serialized from the same factory the tests execute.
 */
export const ARCADE_KIT_JS =
  `/* Arcade Kit v1 — StepInTheRing Game Engine runtime */\n` +
  `window.ArcadeKit = (${arcadeKitFactory.toString()})();`;
