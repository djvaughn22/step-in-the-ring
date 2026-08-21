// ─────────────────────────────────────────────────────────────────────────────
// STARTING POINTS — for the person who wants to make something and does not
// know what.
//
// Two very different people arrive here. One knows exactly what they want and
// types it. The other wants to make something and has nothing in their hands.
// The box serves the first perfectly and the second not at all, so these
// exist: concrete, small, and every one of them is something this site can
// actually carry all the way through.
//
// Rules for this list:
//   - A starting point drops an EDITABLE STEM into the box. It is never hidden
//     category state. What comes back is still the person's own sentence.
//   - Every one names a real thing a person could finish. No "explore your
//     creativity", no prompts about unlocking potential.
//   - If Step In The Ring cannot carry it, it does not go on the list.
// ─────────────────────────────────────────────────────────────────────────────

export interface StartingPoint {
  emoji: string;
  /** What you're setting out to do. Short enough to scan a column of them. */
  label: string;
  /** One line of what you'd end up with. */
  what: string;
  /** The editable stem dropped into the box. Ends mid-sentence on purpose. */
  stem: string;
}

export const STARTING_POINTS: StartingPoint[] = [
  {
    emoji: "🎲",
    label: "Make a family game",
    what: "Something your own kids will actually play.",
    stem: "A game my family can play together where ",
  },
  {
    emoji: "🌐",
    label: "Build a simple website",
    what: "One page that does one job, live on the internet.",
    stem: "A simple website for ",
  },
  {
    emoji: "⏱️",
    label: "Plan a five hour sprint",
    what: "One evening, one finished thing.",
    stem: "In five hours I want to finish ",
  },
  {
    emoji: "✍️",
    label: "Write something",
    what: "A story, a chapter, or the thing you keep meaning to write down.",
    stem: "I want to write ",
  },
  {
    emoji: "🎵",
    label: "Make a song",
    what: "Words, a melody in your head, or nothing yet.",
    stem: "A song about ",
  },
  {
    emoji: "🎨",
    label: "Design something",
    what: "A print, a shirt, a sticker — something people could buy.",
    stem: "A design for ",
  },
  {
    emoji: "🔧",
    label: "Fix something",
    what: "Repair what broke without breaking the rest of it.",
    stem: "Something broke: ",
  },
  {
    emoji: "💼",
    label: "Start a small business idea",
    what: "Work out what you're actually selling and to whom.",
    stem: "A small business where I ",
  },
];

/** The short version used under the box, where a full column would crowd it. */
export const QUICK_STARTERS = STARTING_POINTS.map((s) => ({
  emoji: s.emoji,
  label: s.label,
  stem: s.stem,
}));
