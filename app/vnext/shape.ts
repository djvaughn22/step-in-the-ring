// ─────────────────────────────────────────────────────────────────────────────
// SHAPING — what Step In The Ring understands the moment somebody steps in.
//
// This is the bridge between the two halves of the product: the deterministic
// reading engine we already have (app/planner/interpret.ts → app/creation/
// record.ts's CreationView) and the one persistent object vNext is built
// around (app/vnext/build.ts's BuildRecordV1).
//
// Laws:
//   - DETERMINISTIC. Same words in, same shaping out, forever. There is no
//     model call here and there must never be one: the reading is rules we
//     wrote, that we can test one fixture at a time, and that cost nothing to
//     run. Generative compute, when it arrives, runs on the person's own
//     provider — it is not what makes this page feel intelligent.
//   - It NEVER rewrites the person's words. `intent` stays exactly what they
//     typed; everything here is a reading of it, clearly labelled as such.
//   - It never claims more than it read. When there is no honest first move
//     to give, it asks for one more sentence instead of inventing a plan.
//   - No storage, no navigation, no React. Pure functions, so the same shaping
//     can be shown on the homepage before an account exists AND written onto a
//     Build after one does.
// ─────────────────────────────────────────────────────────────────────────────

import { newRecord, viewOf, type CreationView } from "../creation/record";
import { CREATION_TYPE_LABEL, type CreationType } from "../creation/types";
import { capabilitiesForIntent, capabilityById, type Capability } from "./capabilities";
import type { OpenQuestion } from "../planner/types";

/** A capability, trimmed to what a Build needs to show a door. */
export interface ShapedHelp {
  id: string;
  name: string;
  emoji: string;
  href: string;
  what: string;
}

export interface BuildShaping {
  /** A title the person recognizes, from their own words. */
  title: string;
  /** One plain sentence: what this actually is. */
  reading: string;
  /** "A game", "A site", "A coaching plan" — the kind, in human words. */
  kind: string;
  /** Who actually uses it, when we could tell. Never guessed at loudly. */
  forWhom: string | null;
  /** What "real" means the first time it works. */
  realMeans: string;
  /** What version one does. Plain bullets, at most five. */
  versionOne: string[];
  /** The one next thing worth doing. Always a full sentence. */
  firstMove: string;
  /** Existing capabilities matched to these words. Never a gate. */
  helps: ShapedHelp[];
  /** At most one thing worth asking — and only when it's actually useful. */
  question: OpenQuestion | null;
  /**
   * The honest software call, when it's worth saying out loud. A person who
   * doesn't need an app should hear that before they build one.
   */
  softwareNote: string | null;
}

const MAX_VERSION_ONE = 5;

function trimHelp(c: Capability): ShapedHelp {
  return { id: c.id, name: c.name, emoji: c.emoji, href: c.href, what: c.what };
}

/** Lowercase the first letter only — blanket toLowerCase mangles product names. */
function lowerFirst(s: string): string {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

function endWithStop(s: string): string {
  const clean = s.trim();
  if (!clean) return clean;
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
}

/**
 * Is this a REPAIR — something of theirs that is broken?
 *
 * The planner classifies on the bare verb "fix", which is right for its own
 * purposes but too loose to hang a first move on: "teach people how to fix a
 * bike tire" is a guide, not a repair, and telling that person to "write down
 * exactly what goes wrong" is confidently wrong. So a repair has to look like
 * one — a thing in a broken state, and not a sentence about teaching.
 */
const TEACHING =
  /\b(how to|teach|teaching|tutorial|guide|explain|walkthrough|walk through|show (?:people|someone|others|you))\b/i;
const BROKEN_STATE =
  /\b(broken|broke|breaks|bug|buggy|doesn'?t work|does not work|not working|stopped working|fails|failing|error|crash(?:es|ing)?|glitch|busted|won'?t (?:open|load|save|close|start))\b/i;
// Kept in sync with app/planner/interpret.ts's INCONSISTENT_BEHAVIOR by
// hand — this file duplicates that file's fix-detection rather than
// importing it (separate systems, same underlying question: "is this a
// repair?"). "Works on X but not on Y" never says "broken" literally.
const INCONSISTENT_BEHAVIOR = /\bworks?\b[^.!?]{0,60}\bbut\b[^.!?]{0,20}\bnot\b/i;

export function isRepair(view: CreationView): boolean {
  if (view.interpretation.buildType.value !== "fix") return false;
  const said = view.record.originalIdea;
  if (TEACHING.test(said)) return false;
  return (
    BROKEN_STATE.test(said) ||
    INCONSISTENT_BEHAVIOR.test(said) ||
    /\bfix (?:my|the|this|our|his|her|their)\b/i.test(said)
  );
}

/**
 * The first move. Ordered rules, most honest first:
 *
 *   1. Something broken is not a blank page. The first move is reproducing it,
 *      never "build version one" — that would be a plan for a different job.
 *   2. If version one probably doesn't need software at all, the cheapest
 *      real-world test beats writing code. Say that first.
 *   3. Otherwise the first behaviour of version one IS the first move.
 *   4. If we couldn't read a version one, ask for the one thing that would
 *      let us — never fake a plan.
 */
export function firstMoveFrom(view: CreationView, versionOne: string[]): string {
  if (isRepair(view)) {
    return "Write down exactly what goes wrong, and the one step that makes it happen every time.";
  }
  // A question or a real situation isn't "building" anything — confirmed
  // live: "I don't understand this bill" got "Before building anything,
  // try the cheap version..." right under a card that had just said this
  // isn't something to build. The test itself is already a full, honest
  // sentence; it doesn't need a building-shaped wrapper around it.
  if (view.creationType === "general-help") {
    const test = view.software.nonSoftwareTest;
    return test
      ? endWithStop(test)
      : "Read the brief below, then bring it to a person, a reference, or an AI who can see the real thing.";
  }
  const test = view.software.nonSoftwareTest;
  const testFirst = view.software.verdict === "test-first" || view.software.verdict === "optional";
  if (test && testFirst) {
    // Confirmed live: a song and a letter both got "Before building
    // anything..." right next to "The finished piece is the product. It
    // needs to be made, not engineered." "Building" is the one word here
    // that's specifically software-shaped; the rest of the sentence
    // already carries the real idea (try the small thing before the fuller
    // one) without it.
    return endWithStop(`Try the cheap version first: ${lowerFirst(test)}`);
  }
  if (versionOne.length > 0) {
    return endWithStop(`Get this working first, and nothing else yet: ${lowerFirst(versionOne[0])}`);
  }
  const q = view.interpretation.openQuestions[0];
  // The question is asked again right below this, so echoing it verbatim reads
  // like a stutter. Point at it instead — it is still the one next thing.
  if (q) return endWithStop(`Answer the one question below — ${lowerFirst(q.question)}`);
  return "Write one more sentence: who uses this, and what they do with it.";
}

/**
 * The one sentence at the top of the step-in moment.
 *
 * The planner's summary is normally the right thing — it survives messy input
 * and it's the same reading the full plan shows. But when it only had ONE
 * stated behaviour to work with it collapses to a fragment ("A game: a score
 * counter."), and a fragment is a bad first impression of a product whose job
 * is to understand you.
 *
 * So: when the summary comes out thin AND the person's own opening sentence
 * says more, we show THEIR sentence. Never a rewrite, never an invention — the
 * more informative of two true things.
 */
export function readingFrom(view: CreationView): string {
  const summary = view.interpretation.summary.trim();
  const clause = summary.includes(":") ? summary.slice(summary.indexOf(":") + 1).trim() : "";
  const thin = clause.length > 0 && clause.length < 35;
  if (!thin) return summary;

  const said = view.record.originalIdea.replace(/\s+/g, " ").trim();
  const first = (said.split(/(?<=[.!?])\s/)[0] ?? said).trim();
  if (first.length <= summary.length) return summary;
  const capped = first.length > 180 ? `${first.slice(0, 177).trimEnd()}…` : first;
  return capped.charAt(0).toUpperCase() + capped.slice(1);
}

/**
 * What "real" means the first time.
 *
 * `smallestOutcome` is derived from the KIND of thing (a site, a game, a
 * book), which is right for something being made and wrong for something being
 * repaired: "a real visitor lands on it and knows what to do next" is the goal
 * of building a site, not of fixing one. A repair has exactly one honest
 * definition of done.
 */
function realMeansFrom(view: CreationView): string {
  if (isRepair(view)) {
    return "The thing that's broken works again, and you've watched it work.";
  }
  return view.smallestOutcome;
}

/** Worth saying out loud only when software isn't obviously the product. */
function softwareNoteFrom(view: CreationView): string | null {
  if (view.software.verdict === "central") return null;
  return endWithStop(view.software.reason);
}

/**
 * Capabilities that are true for anything a person is MAKING, used only
 * when nothing matched their actual words. An empty "what can help" is a
 * dead end; pointing at an engine that doesn't fit is worse. These two
 * always fit — for something being made. Confirmed live: "I don't
 * understand this bill" fell through to these two (a five-hour sprint, a
 * beginner app walkthrough) because neither matches any keyword — an
 * empty section would have been more honest than two wrong ones.
 */
const ALWAYS_HELPFUL = ["five-hour-sprint", "first-app"];

function helpsFor(intent: string, creationType: CreationType): ShapedHelp[] {
  // Every real capability here is a tool for MAKING something — none of
  // them fit a question, a decision, or real-world trouble, matched
  // keyword or not. Confirmed live: "Teach me how compound interest
  // works" keyword-matched the How To Anything Engine — which turns the
  // OWNER'S OWN proven fix into a published tutorial, the opposite
  // direction from wanting to learn something. Suggesting it is worse
  // than suggesting nothing.
  if (creationType === "general-help") return [];
  const matched = capabilitiesForIntent(intent, 4);
  if (matched.length > 0) return matched.map(trimHelp);
  return ALWAYS_HELPFUL.flatMap((id) => {
    const c = capabilityById(id);
    return c ? [trimHelp(c)] : [];
  });
}

/** Turn a finished reading into the shaping a Build is started from. */
export function shapingFromView(view: CreationView): BuildShaping {
  const i = view.interpretation;
  // On a repair, "version one" bullets describe a thing that already exists.
  // Showing them as the plan would be inventing work nobody asked for.
  const versionOne =
    isRepair(view)
      ? []
      : i.versionOne.map((c) => c.value.trim()).filter(Boolean).slice(0, MAX_VERSION_ONE);

  return {
    title: i.title.value,
    reading: readingFrom(view),
    kind: CREATION_TYPE_LABEL[view.creationType],
    forWhom: view.primaryUser ?? i.audience?.value ?? null,
    realMeans: realMeansFrom(view),
    versionOne,
    firstMove: firstMoveFrom(view, versionOne),
    helps: helpsFor(i.raw, view.creationType),
    question: i.openQuestions[0] ?? null,
    softwareNote: softwareNoteFrom(view),
  };
}

/**
 * Read a person's own words. The one entry point for surfaces that don't
 * already hold a CreationView — everything the homepage computes anyway is
 * reused there instead of read twice.
 */
export function shapeIntent(intent: string, answers: Record<string, string> = {}): BuildShaping | null {
  const said = intent.trim();
  if (!said) return null;
  return shapingFromView(viewOf(newRecord(said, { answers })));
}
