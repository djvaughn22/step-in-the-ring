// Creative Ring (owner direction, Nov 25 2026): watch something interesting,
// try it yourself, improve, and share what you did if you want to.
//
// A ring is DATA. The first one is the Heisman, using the same two-sides
// engine as iDontCry's (app/ring/engine, carried over unchanged). New kinds of
// ring (music, drawing, technology, practical skills, business, your own idea)
// will need their own engines; until one exists, it is listed only as an idea.
//
// Not a social network: nothing is posted, nothing is uploaded, and there are
// no accounts or profiles. Participation features come later, with the
// privacy, safety and moderation rules written down first.
import { HEISMAN } from "./engine/heisman";
import type { TwoSidesChallenge } from "./engine/types";

export type Ring = {
  id: string;
  /** What area of life it belongs to. */
  area: string;
  title: string;
  line: string;
  minutes: string;
  challenge: TwoSidesChallenge;
};

export const RINGS: Ring[] = [
  {
    id: HEISMAN.id,
    area: "Movement",
    title: HEISMAN.title,
    line: HEISMAN.lede,
    minutes: "About 2 minutes",
    challenge: HEISMAN,
  },
];

/** Areas for later rings. Ideas only: no ring exists in them yet. */
export const LATER_AREAS = ["Music", "Sports", "Drawing", "Technology", "Practical skills", "Business", "Your own idea"];

export function ringById(id: string): Ring | undefined {
  return RINGS.find((r) => r.id === id);
}
