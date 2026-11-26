// Creative Ring engine: the original two-sides challenge from iDontCry's Heisman
// (Nov 25 2026), carried over as-is so both sites run the same mechanics.
// Only change: storage keys start with "sitr-ring-" (core.ts).
// ─────────────────────────────────────────────────────────────────────────────
// TWO-SIDES CHALLENGES — one movement, tried on the left and on the right, and
// compared honestly. The Heisman is the first (`heisman.ts`).
//
// A new challenge is new DATA — one `TwoSidesChallenge` — never a new page
// component. The page (`TwoSidesChallenge.tsx`), the scoring (`core.ts`) and
// the figure (`figure.ts`, `PoseFigure.tsx`) are shared. See
// docs/CHALLENGES.md for what is measured, what is not, and how to add one.
//
// Copy tokens: {side} {other} → "left"/"right", {Side} {Other} → "Left"/"Right".
// ─────────────────────────────────────────────────────────────────────────────

export type Side = "left" | "right";

/** The standing version and an easier seated one, for anyone who needs it. */
export type Version = "standing" | "seated";

/**
 * Joint angles in degrees, measured from straight down; positive turns toward
 * the way the figure faces. "near" limbs are the working side (drawn in the
 * area's colour), "far" limbs are the support side.
 */
export interface PoseAngles {
  torso: number;
  nearUpper: number;
  nearFore: number;
  farUpper: number;
  farFore: number;
  nearThigh: number;
  nearShin: number;
  farThigh: number;
  farShin: number;
}

export interface Drill {
  title: string;
  text: string;
}

export interface VersionCopy {
  label: string;
  note: string;
  /** How to strike the pose, for one side (tokens filled per side). */
  steps: string[];
}

/** A reference clip is shown only when one we have permission to use exists. */
export type Reference =
  | { kind: "animation" }
  | { kind: "video"; src: string; poster?: string; credit: string };

export interface TwoSidesChallenge {
  /** Route segment and storage key. Never change once shipped. */
  id: string;
  title: string;
  /** One plain sentence under the title. */
  lede: string;
  /** Why trying both sides is interesting. No claims about health or ability. */
  why: string;
  /** Under the figure, per side. */
  caption: string;
  poses: Record<Version, { start: PoseAngles; hold: PoseAngles }>;
  versions: Record<Version, VersionCopy>;
  /** Hold lengths offered, in seconds. */
  holdChoices: number[];
  defaultHold: number;
  /** The one thing the big button counts while the clock runs. */
  slip: { button: string; singular: string; plural: string; howTo: string };
  /** Self-rating words, 1 to 5. */
  feel: [string, string, string, string, string];
  safety: string[];
  drills: Drill[];
  /** What each number means, in plain words. */
  measures: string[];
  /** What the challenge cannot tell you. */
  limits: string[];
  reference: Reference;
}
