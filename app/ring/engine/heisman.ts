// Creative Ring engine: the original two-sides challenge from iDontCry's Heisman
// (Nov 25 2026), carried over as-is so both sites run the same mechanics.
// Only change: storage keys start with "sitr-ring-" (core.ts).
import type { TwoSidesChallenge } from "./types";

// THE HEISMAN — the first two-sides challenge (25 Nov 2026).
//
// "Left side" means left knee up and left arm out, standing on the right leg.
// The figure faces the way the working arm points, so its working limbs are
// the ones nearest the viewer. No trophy art and no player is shown or named:
// the pose is described, and the figure is our own drawing.

export const HEISMAN: TwoSidesChallenge = {
  id: "heisman",
  title: "The Heisman",
  lede:
    "Strike the famous football pose on your left side, then on your right. Most people find one side much harder. Which is yours?",
  why:
    "Most of us lead with one side: the hand we write with, the foot we kick with. Trying the same move on your other side shows how much practice each side has had.",
  caption: "{Side} side: {side} knee up, {side} arm out, standing on your {other} leg.",
  poses: {
    standing: {
      start: {
        torso: 0, nearUpper: 6, nearFore: 10, farUpper: -6, farFore: 70,
        nearThigh: -2, nearShin: 0, farThigh: 3, farShin: 0,
      },
      hold: {
        torso: 7, nearUpper: 98, nearFore: 98, farUpper: 8, farFore: 130,
        nearThigh: 82, nearShin: -30, farThigh: 5, farShin: -3,
      },
    },
    seated: {
      start: {
        torso: 0, nearUpper: 6, nearFore: 10, farUpper: -6, farFore: 70,
        nearThigh: 90, nearShin: 0, farThigh: 92, farShin: 2,
      },
      hold: {
        torso: 3, nearUpper: 98, nearFore: 98, farUpper: 8, farFore: 130,
        nearThigh: 115, nearShin: 25, farThigh: 90, farShin: 0,
      },
    },
  },
  versions: {
    standing: {
      label: "Standing",
      note: "On one leg, the classic way.",
      steps: [
        "Stand on your {other} foot.",
        "Lift your {side} knee up high.",
        "Push your {side} arm straight out, palm forward.",
        "Tuck a ball, or a pillow, in your {other} arm.",
      ],
    },
    seated: {
      label: "Seated",
      note: "On the front of a sturdy chair. Good for anyone who would rather not stand on one leg.",
      steps: [
        "Sit tall near the front of a sturdy chair.",
        "Lift your {side} knee so your {side} foot is off the floor.",
        "Push your {side} arm straight out, palm forward.",
        "Tuck a ball, or a pillow, in your {other} arm.",
      ],
    },
  },
  holdChoices: [10, 20, 30],
  defaultHold: 20,
  slip: {
    button: "Touched down",
    singular: "touch-down",
    plural: "touch-downs",
    howTo:
      "Each time your {side} foot touches the floor, tap Touched down, lift it again and keep going. A helper can tap for you.",
  },
  feel: ["Very wobbly", "Wobbly", "Okay", "Steady", "Rock solid"],
  safety: [
    "Clear a space and keep a wall or a chair within reach.",
    "Stop if anything hurts or you feel dizzy.",
    "Kids: try it with a grown-up nearby.",
  ],
  drills: [
    { title: "Other-side holds", text: "Three holds on your {side} side with the timer. Rest a little between them." },
    { title: "Mirror strikes", text: "Strike the pose five times, switching sides every time. Go slow and land it clean." },
    { title: "Cross it up", text: "Lift your {side} knee and push your {other} arm out instead. Five on each side." },
    { title: "Slow motion", text: "Take four counts to rise into the pose and four counts to come down." },
  ],
  measures: [
    "Held: the seconds from Go until the first Touched down tap. If nobody tapped, it is the whole hold.",
    "Touch-downs: how many times Touched down was tapped while the clock ran.",
    "Felt: the number you picked, from 1 (very wobbly) to 5 (rock solid).",
    "Steadier side: the side that held at least one second longer. If the times are closer than that, the side with fewer touch-downs, then the one that felt steadier. Otherwise, even.",
  ],
  limits: [
    "Your phone does not watch you. No camera and no motion sensors are used, so the numbers are only as good as the taps.",
    "This is a challenge for fun, not a medical, fitness or ambidexterity test. It cannot tell you anything about your health or ability.",
    "Your tries are saved on this device only and are not sent anywhere.",
  ],
  reference: { kind: "animation" },
};
