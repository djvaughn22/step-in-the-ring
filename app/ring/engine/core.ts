// Creative Ring engine: the original two-sides challenge from iDontCry's Heisman
// (Nov 25 2026), carried over as-is so both sites run the same mechanics.
// Only change: storage keys start with "sitr-ring-" (core.ts).
// The two-sides scoring and the device-only history. Pure functions, no React,
// so the rules can be tested and carried to another site whole.

import type { Side, TwoSidesChallenge, Version } from "./types";

export const SIDES: readonly Side[] = ["left", "right"];

export function otherSide(side: Side): Side {
  return side === "left" ? "right" : "left";
}

function cap(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Fill {side} {other} {Side} {Other} for one side. */
export function fillSide(text: string, side: Side): string {
  const o = otherSide(side);
  return text
    .replaceAll("{side}", side)
    .replaceAll("{other}", o)
    .replaceAll("{Side}", cap(side))
    .replaceAll("{Other}", cap(o));
}

/** "20" or "7.4" — whole seconds lose the ".0". */
export function secs(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** One side of one try, exactly as it was tapped. */
export interface SideResult {
  /** how long the clock ran, in seconds */
  hold: number;
  /** milliseconds after Go of every tap of the big button */
  taps: number[];
  /** the self-rating, 1..5, or null if none was picked */
  feel: number | null;
}

/** Seconds from Go to the first tap, or the whole hold if nobody tapped. One decimal. */
export function heldSeconds(r: SideResult): number {
  const first = r.taps.length ? Math.min(...r.taps) : null;
  const s = first === null ? r.hold : Math.min(first / 1000, r.hold);
  return Math.round(s * 10) / 10;
}

/** Times closer than this are a tie on the clock: a tap is a human reaction, not a sensor. */
export const EVEN_WITHIN_SECONDS = 1;

export type Verdict =
  | { steadier: Side; by: "time" | "slips" | "feel"; gap: number }
  | { steadier: null; by: "even"; gap: 0 };

/**
 * Which side was steadier, by one stated rule: a clear gap on the clock first,
 * then fewer slips, then the self-rating. Anything closer is "even".
 */
export function compareSides(left: SideResult, right: SideResult): Verdict {
  const tl = heldSeconds(left);
  const tr = heldSeconds(right);
  const gap = Math.round(Math.abs(tl - tr) * 10) / 10;
  if (gap >= EVEN_WITHIN_SECONDS) return { steadier: tl > tr ? "left" : "right", by: "time", gap };
  const sl = left.taps.length;
  const sr = right.taps.length;
  if (sl !== sr) return { steadier: sl < sr ? "left" : "right", by: "slips", gap: Math.abs(sl - sr) };
  if (left.feel !== null && right.feel !== null && left.feel !== right.feel) {
    return { steadier: left.feel > right.feel ? "left" : "right", by: "feel", gap: Math.abs(left.feel - right.feel) };
  }
  return { steadier: null, by: "even", gap: 0 };
}

/** The results headline, in the challenge's own words. */
export function verdictLine(v: Verdict, c: TwoSidesChallenge): string {
  if (v.steadier === null) return "Even. Both sides held about the same.";
  if (v.by === "time") {
    return `Your ${v.steadier} side was steadier. It held ${secs(v.gap)} seconds longer before the first ${c.slip.singular}.`;
  }
  if (v.by === "slips") {
    return `Your ${v.steadier} side was steadier, with ${v.gap} fewer ${v.gap === 1 ? c.slip.singular : c.slip.plural}.`;
  }
  return `Even on the clock. Your ${v.steadier} side felt steadier.`;
}

/* ── The device-only history ────────────────────────────────────────────── */

/** One finished try: both sides, in the order they were done. */
export interface Try {
  /** ISO time the second side finished */
  at: string;
  version: Version;
  hold: number;
  first: Side;
  left: SideResult;
  right: SideResult;
  /** optional, from "About you": the hand you write with */
  writes?: Side | "both";
  /** optional: the foot you kick with */
  kicks?: Side;
}

export const MAX_TRIES = 60;

export function triesKey(id: string): string {
  return `sitr-ring-${id}-v1`;
}

export function prefsKey(id: string): string {
  return `sitr-ring-${id}-prefs-v1`;
}

function store(storage?: Storage | null): Storage | null {
  if (storage !== undefined) return storage;
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function isSide(x: unknown): x is Side {
  return x === "left" || x === "right";
}

function isSideResult(x: unknown): x is SideResult {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.hold === "number" && r.hold > 0 &&
    Array.isArray(r.taps) && r.taps.every((t) => typeof t === "number" && t >= 0) &&
    (r.feel === null || (typeof r.feel === "number" && r.feel >= 1 && r.feel <= 5))
  );
}

function isTry(x: unknown): x is Try {
  if (!x || typeof x !== "object") return false;
  const t = x as Record<string, unknown>;
  return (
    typeof t.at === "string" &&
    (t.version === "standing" || t.version === "seated") &&
    typeof t.hold === "number" &&
    isSide(t.first) &&
    isSideResult(t.left) &&
    isSideResult(t.right)
  );
}

/** Every saved try, oldest first. Anything unreadable is ignored, never thrown. */
export function loadTries(id: string, storage?: Storage | null): Try[] {
  try {
    const raw = store(storage)?.getItem(triesKey(id));
    if (!raw) return [];
    const doc = JSON.parse(raw) as { v?: unknown; tries?: unknown };
    if (!doc || doc.v !== 1 || !Array.isArray(doc.tries)) return [];
    return doc.tries.filter(isTry);
  } catch {
    return [];
  }
}

/** Add a try and return the new list (kept to the last MAX_TRIES). */
export function saveTry(id: string, t: Try, storage?: Storage | null): Try[] {
  const tries = [...loadTries(id, storage), t].slice(-MAX_TRIES);
  try {
    store(storage)?.setItem(triesKey(id), JSON.stringify({ v: 1, tries }));
  } catch {
    /* private mode or full storage: the try still shows, it just is not kept */
  }
  return tries;
}

export function clearTries(id: string, storage?: Storage | null): void {
  try {
    store(storage)?.removeItem(triesKey(id));
  } catch {
    /* nothing to clear */
  }
}

/** The arcade card's line: the latest try, both sides. */
export function progressLine(tries: Try[]): string | null {
  const last = tries.at(-1);
  if (!last) return null;
  return `Last try: left ${secs(heldSeconds(last.left))}s · right ${secs(heldSeconds(last.right))}s`;
}

/**
 * "See whether you improve": the first and the latest try done the same way
 * (same version, same hold), so the two are a fair comparison.
 */
export function sinceFirst(tries: Try[]): { first: Try; last: Try; count: number } | null {
  const last = tries.at(-1);
  if (!last) return null;
  const same = tries.filter((t) => t.version === last.version && t.hold === last.hold);
  if (same.length < 2) return null;
  return { first: same[0], last, count: same.length };
}

/* ── Remembered choices ─────────────────────────────────────────────────── */

export interface Prefs {
  version: Version;
  hold: number;
  first: Side;
  sound: boolean;
  writes?: Side | "both";
  kicks?: Side;
}

export function loadPrefs(c: TwoSidesChallenge, storage?: Storage | null): Prefs {
  const base: Prefs = { version: "standing", hold: c.defaultHold, first: "left", sound: true };
  try {
    const raw = store(storage)?.getItem(prefsKey(c.id));
    if (!raw) return base;
    const p = JSON.parse(raw) as Partial<Prefs>;
    return {
      version: p.version === "seated" ? "seated" : "standing",
      hold: typeof p.hold === "number" && c.holdChoices.includes(p.hold) ? p.hold : c.defaultHold,
      first: isSide(p.first) ? p.first : "left",
      sound: p.sound !== false,
      writes: isSide(p.writes) || p.writes === "both" ? p.writes : undefined,
      kicks: isSide(p.kicks) ? p.kicks : undefined,
    };
  } catch {
    return base;
  }
}

export function savePrefs(id: string, p: Prefs, storage?: Storage | null): void {
  try {
    store(storage)?.setItem(prefsKey(id), JSON.stringify(p));
  } catch {
    /* not kept, still used */
  }
}
