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
//   - Every one names a real thing a person could finish, and the list as a
//     whole has to speak to a kid, a student, somebody at work and a
//     grandparent. No "explore your creativity", no prompts about unlocking
//     potential.
//   - If Step In The Ring cannot carry it, it does not go on the list.
// ─────────────────────────────────────────────────────────────────────────────

/** Which column a starting point sits in when there's room for three. */
export type StartingPointGroup = "build" | "create" | "do";

export const STARTING_POINT_GROUPS: { id: StartingPointGroup; title: string }[] = [
  { id: "build", title: "Build" },
  { id: "create", title: "Create" },
  { id: "do", title: "Do" },
];

export interface StartingPoint {
  emoji: string;
  /** What you're setting out to do. Short enough to scan a column of them. */
  label: string;
  /** One line of what you'd end up with. */
  what: string;
  /** The editable stem dropped into the box. Ends mid-sentence on purpose. */
  stem: string;
  group: StartingPointGroup;
}

export const STARTING_POINTS: StartingPoint[] = [
  {
    emoji: "🌐",
    label: "Build a simple website",
    what: "One page that does one job.",
    stem: "A simple website for ",
    group: "build",
  },
  {
    emoji: "🎲",
    label: "Make a game",
    what: "Something you and your friends or family will actually play.",
    stem: "A game where ",
    group: "build",
  },
  {
    emoji: "🧮",
    label: "Make a small tool",
    what: "A calculator, a tracker, a checklist. One job done well.",
    stem: "A small tool that ",
    group: "build",
  },
  {
    emoji: "✍️",
    label: "Write something",
    what: "A story, a letter, a speech, or the thing you keep meaning to write down.",
    stem: "I want to write ",
    group: "create",
  },
  {
    emoji: "🎵",
    label: "Make a song",
    what: "Words, a melody in your head, or nothing yet.",
    stem: "A song about ",
    group: "create",
  },
  {
    emoji: "🎨",
    label: "Design something",
    what: "A print, a shirt, a sticker, an invitation.",
    stem: "A design for ",
    group: "create",
  },
  {
    emoji: "📖",
    label: "Make a family keepsake",
    what: "A cookbook, a family history, a book of stories.",
    stem: "A keepsake for my family: ",
    group: "create",
  },
  {
    emoji: "📚",
    label: "Study for something",
    what: "A study guide, flashcards or a practice quiz.",
    stem: "A study guide for ",
    group: "do",
  },
  {
    emoji: "🗓️",
    label: "Plan something",
    what: "A trip, an event, a week at work.",
    stem: "A plan for ",
    group: "do",
  },
  {
    emoji: "🔧",
    label: "Fix something",
    what: "Repair what broke without breaking the rest of it.",
    stem: "Something broke: ",
    group: "do",
  },
];

/**
 * The line under the box. It answers "what can I make here?" for very different
 * people at a glance, without naming who they are: nobody is told a thing is for
 * kids or for seniors, they just see something like what they came for.
 */
export const HOME_STARTERS = [
  { emoji: "🎮", label: "A game", stem: "A game where " },
  { emoji: "🌐", label: "A website", stem: "A website for " },
  { emoji: "📚", label: "A study guide", stem: "A study guide for " },
  { emoji: "📖", label: "A family cookbook", stem: "A family cookbook with " },
  { emoji: "🎵", label: "A song", stem: "A song about " },
  { emoji: "🗓️", label: "A work plan", stem: "A work plan for " },
  { emoji: "🧭", label: "Help with a problem", stem: "I need help with " },
];

/** Did they pick a starter and press Start without finishing the sentence? */
export function isUnfinishedStarter(text: string): boolean {
  const said = text.trim().toLowerCase();
  return [...HOME_STARTERS, ...STARTING_POINTS, ...QUICK_START].some((s) => s.stem.trim().toLowerCase() === said);
}

/**
 * What the back and forth actually sounds like. Fictional, per the standing
 * rule against using anybody's real life as an example (see CLAUDE.md). `first`
 * is a whole sentence on purpose: "Try this one" lets somebody with nothing in
 * mind see the workspace in one tap, and they can still edit it in the box.
 */
export const HOME_EXAMPLES: { title: string; first: string; then: string }[] = [
  {
    title: "A game about dragons",
    first: "A game where a dragon collects gold and dodges arrows.",
    then: "Make the dragon faster, and keep score.",
  },
  {
    title: "A study guide",
    first: "A one-page study guide for my biology final.",
    then: "Too long. Just cells and genetics, then quiz me.",
  },
  {
    title: "A website for work",
    first: "A simple website for my dental office.",
    then: "Put the phone number at the top, and make it calmer.",
  },
  {
    title: "A birthday poem",
    first: "A birthday poem for my granddaughter who loves horses.",
    then: "Shorter, and keep the part about the pony.",
  },
];

/**
 * HOME's "Quick start" row — four broad doors, not eight specific ones. The
 * full column on /create and in the Library is for somebody already looking
 * for a starting point; Home only has to prove four kinds of thing are
 * possible and get out of the way of the box above it.
 */
export const QUICK_START: Omit<StartingPoint, "group">[] = [
  { emoji: "🌐", label: "Make an app or site", what: "Something that runs on the internet.", stem: "A website that " },
  { emoji: "🎮", label: "Make a game", what: "Something you can play.", stem: "A game where " },
  { emoji: "🎨", label: "Make something creative", what: "A song, a story, a design — whatever you're carrying.", stem: "Something creative: " },
  { emoji: "🧭", label: "Plan, fix, or ask something", what: "A project, a real problem, a question you need help with — that's fine too.", stem: "I need to " },
];
