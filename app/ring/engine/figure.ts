// Creative Ring engine: the original two-sides challenge from iDontCry's Heisman
// (Nov 25 2026), carried over as-is so both sites run the same mechanics.
// Only change: storage keys start with "sitr-ring-" (core.ts).
// The figure, as geometry: joint angles in, line segments out. Shared by the
// page's animated demonstration (PoseFigure.tsx) and the arcade card's art,
// so both draw the same body. Facing right; mirror it for the left side.

import type { PoseAngles } from "./types";

export type SegRole = "work" | "body" | "far";

export interface Seg {
  id: string;
  role: SegRole;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Skeleton {
  segs: Seg[];
  head: { x: number; y: number; r: number };
  ball: { x: number; y: number; rot: number };
  chair: Seg[];
  ground: number;
}

/** The drawing's frame: wide enough for either side once mirrored about x = 100. */
export const FIGURE_VIEW = { x: 30, y: 38, w: 140, h: 176 } as const;

const LEN = { torso: 50, upper: 28, fore: 27, thigh: 38, shin: 38, foot: 11 };
const GROUND = 207;

const rad = (deg: number) => (deg * Math.PI) / 180;
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Walk `len` from (x, y) at `deg` from straight down, positive = forward. */
function from(x: number, y: number, len: number, deg: number) {
  return { x: x + len * Math.sin(rad(deg)), y: y + len * Math.cos(rad(deg)) };
}

function seg(id: string, role: SegRole, a: { x: number; y: number }, b: { x: number; y: number }): Seg {
  return { id, role, x1: r1(a.x), y1: r1(a.y), x2: r1(b.x), y2: r1(b.y) };
}

export function skeleton(a: PoseAngles, seated = false): Skeleton {
  const hip = seated ? { x: 92, y: 165 } : { x: 92, y: 128 };
  const up = (len: number) => ({
    x: hip.x + len * Math.sin(rad(a.torso)),
    y: hip.y - len * Math.cos(rad(a.torso)),
  });
  const neck = up(LEN.torso);
  const shoulder = up(LEN.torso - 5);
  const head = up(LEN.torso + 15);

  const nElbow = from(shoulder.x, shoulder.y, LEN.upper, a.nearUpper);
  const nHand = from(nElbow.x, nElbow.y, LEN.fore, a.nearFore);
  const fElbow = from(shoulder.x, shoulder.y, LEN.upper, a.farUpper);
  const fHand = from(fElbow.x, fElbow.y, LEN.fore, a.farFore);

  const nKnee = from(hip.x, hip.y, LEN.thigh, a.nearThigh);
  const nAnkle = from(nKnee.x, nKnee.y, LEN.shin, a.nearShin);
  const nToe = from(nAnkle.x, nAnkle.y, LEN.foot, a.nearShin + 80);
  const fKnee = from(hip.x, hip.y, LEN.thigh, a.farThigh);
  const fAnkle = from(fKnee.x, fKnee.y, LEN.shin, a.farShin);
  const fToe = from(fAnkle.x, fAnkle.y, LEN.foot, a.farShin + 80);

  // An open palm across the end of the working arm: the stiff-arm.
  const palmA = from(nHand.x, nHand.y, 7, a.nearFore - 90);
  const palmB = from(nHand.x, nHand.y, 7, a.nearFore + 90);

  const segs: Seg[] = [
    seg("far-thigh", "far", hip, fKnee),
    seg("far-shin", "far", fKnee, fAnkle),
    seg("far-foot", "far", fAnkle, fToe),
    seg("far-upper", "far", shoulder, fElbow),
    seg("far-fore", "far", fElbow, fHand),
    seg("torso", "body", hip, neck),
    seg("near-thigh", "work", hip, nKnee),
    seg("near-shin", "work", nKnee, nAnkle),
    seg("near-foot", "work", nAnkle, nToe),
    seg("near-upper", "work", shoulder, nElbow),
    seg("near-fore", "work", nElbow, nHand),
    seg("palm", "work", palmA, palmB),
  ];

  const chair: Seg[] = seated
    ? [
        seg("seat", "far", { x: 56, y: 170 }, { x: 104, y: 170 }),
        seg("back", "far", { x: 58, y: 170 }, { x: 58, y: 116 }),
        seg("leg-front", "far", { x: 100, y: 170 }, { x: 100, y: GROUND }),
        seg("leg-back", "far", { x: 60, y: 170 }, { x: 60, y: GROUND }),
      ]
    : [];

  return {
    segs,
    head: { x: r1(head.x), y: r1(head.y), r: 11 },
    ball: { x: r1(fHand.x - 5), y: r1(fHand.y + 1), rot: -28 },
    chair,
    ground: GROUND,
  };
}

/** Straight blend between two poses, t from 0 (a) to 1 (b). */
export function mixPose(a: PoseAngles, b: PoseAngles, t: number): PoseAngles {
  const k = Math.max(0, Math.min(1, t));
  const out = {} as PoseAngles;
  for (const key of Object.keys(a) as (keyof PoseAngles)[]) out[key] = a[key] + (b[key] - a[key]) * k;
  return out;
}

/**
 * The demonstration's loop, in milliseconds: stand, rise into the pose, hold
 * it (with a small balancing sway), come back down.
 */
export const LOOP = { stand: 900, rise: 1000, hold: 2400, fall: 900 } as const;
export const LOOP_MS = LOOP.stand + LOOP.rise + LOOP.hold + LOOP.fall;

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Where the loop is at `ms`: how far into the pose (0..1) and the sway in degrees. */
export function loopFrame(ms: number): { t: number; sway: number } {
  const m = ((ms % LOOP_MS) + LOOP_MS) % LOOP_MS;
  if (m < LOOP.stand) return { t: 0, sway: 0 };
  if (m < LOOP.stand + LOOP.rise) return { t: ease((m - LOOP.stand) / LOOP.rise), sway: 0 };
  if (m < LOOP.stand + LOOP.rise + LOOP.hold) {
    const h = m - LOOP.stand - LOOP.rise;
    return { t: 1, sway: 1.6 * Math.sin((h / LOOP.hold) * Math.PI * 3) };
  }
  return { t: 1 - ease((m - LOOP.stand - LOOP.rise - LOOP.hold) / LOOP.fall), sway: 0 };
}

/** The loop's first frame of the held pose — where the animation starts, so it never jumps. */
export const LOOP_HOLD_START = LOOP.stand + LOOP.rise;
