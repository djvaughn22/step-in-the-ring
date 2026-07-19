// Classification + software honesty.
//
// Turns a planner Interpretation into the creation-level view: what KIND of
// thing this is (not everything is software), whether version one actually
// needs code, and any safety constraints the creation itself demands.
//
// Everything here is a general rule. No creation-specific output is
// hard-coded — the dog-boredom fixture and a plant-watering idea must both
// come out of the same paths.

import type { Interpretation, Shape } from "../planner/types";
import type { CreationType, SoftwareCall } from "./types";

/* ── CREATION TYPE ─────────────────────────────────────────────────────── */

const PRINTABLE = /\b(printable|pdf|worksheet|template|planner page|colou?ring page|flash ?cards?)\b/i;
const DIGITAL_PRODUCT = /\b(digital (download|product)|e-?book|preset|font pack|download(able)?)\b/i;
const PHYSICAL = /\b(shirts?|t-?shirts?|mugs?|stickers?|totes?|hats?|candles?|jewell?ery|apparel|garments?|clothing|sew|knit|3d[- ]print|woodwork|furniture)\b/i;
const DESIGN = /\b(design|logo|art print|wall art|illustration|poster)\b/i;
const MUSIC = /\b(song|beat|track|album|melody|chords?|lyrics|music)\b/i;
const STORY = /\b(story|novel|book|chapter|comic|screenplay|script|poem|children'?s book)\b/i;
const CONTENT = /\b(blog|podcast|video series|newsletter|channel|content|posts?\b|reel)\b/i;
const SERVICE = /\b(service|dog[- ]walk|babysit|tutor|coach(ing)?|clean(ing)? (houses|homes)|mow|for (people|clients) (who|that)|i('| a)?m offering)\b/i;
const EVENT = /\b(event|party|wedding|reunion|fundraiser|trip|camp|tournament|campaign)\b/i;

export function classifyCreationType(text: string, shape: Shape): { type: CreationType; reason: string } {
  // A game is a game before it is anything its theme mentions — "guess the
  // missing lyric" is a game about music, not music.
  if (shape === "game") return { type: "game", reason: "you described something people play" };
  // Most specific first: a "sticker design" is a design, not a generic product.
  if (PRINTABLE.test(text)) return { type: "printable", reason: "you described a printable file" };
  if (PHYSICAL.test(text)) return { type: "physical-product", reason: "you described a physical item" };
  if (DIGITAL_PRODUCT.test(text)) return { type: "digital-product", reason: "you described a digital product" };
  if (shape === "product" && DESIGN.test(text)) return { type: "design", reason: "you described a design to sell" };
  if (shape === "product") return { type: "physical-product", reason: "you described something people would buy" };
  if (MUSIC.test(text)) return { type: "music", reason: "you described music" };
  if (STORY.test(text)) return { type: "story", reason: "you described a written piece" };
  if (SERVICE.test(text)) return { type: "service", reason: "you described something done for people, not built" };
  if (EVENT.test(text)) return { type: "event-plan", reason: "you described a real-world effort, not software" };
  if (CONTENT.test(text) && shape === "content") return { type: "content", reason: "you described published content" };
  // "Solve X" / "keep Y busy" with no named form is a problem-solving tool.
  if (shape === "unknown" && (CARE_VERB.test(text) || /\b(solve|solving|problem)\b/i.test(text))) {
    return { type: "tool", reason: "you described a problem to solve, so version one is the smallest thing that solves it" };
  }

  switch (shape) {
    case "site": return { type: "site", reason: "you described a place to send people" };
    case "tool": return { type: "tool", reason: "you described something that does a job" };
    case "list": return { type: "list", reason: "you described keeping track of things" };
    case "content": return { type: "content", reason: "you described a piece to publish" };
    default: return { type: "unknown", reason: "it's still taking shape" };
  }
}

export const SOFTWARE_TYPES: CreationType[] = ["app", "site", "tool", "list", "game"];

/* ── CARETAKER PATTERN ─────────────────────────────────────────────────────
   "Keep the dog busy", "entertain a toddler", "help my kid practice" — the
   person USING the creation is the caretaker; the one it serves is the
   dependent. Reading the dependent as the user produces nonsense plans. */

const DEPENDENT =
  /\b(dog|puppy|cat|kitten|pet|toddler|baby|babies|kid|kids|child|children|grand(ma|pa|mother|father)|parent)s?\b/i;
const CARE_VERB =
  /\b(keep|keeping|entertain(ing)?|occupy(ing)?|busy|bored(om)?|calm(ing)?|distract(ing)?|look(ing)? after|take care of|practice|practise)\b/i;

export type CaretakerRead = { dependent: string } | null;

export function findCaretaker(text: string): CaretakerRead {
  if (!CARE_VERB.test(text)) return null;
  const m = text.match(DEPENDENT);
  return m ? { dependent: m[1].toLowerCase() } : null;
}

/** Safety constraints the creation itself demands. General rules only. */
export function deriveSafetyConstraints(text: string, caretaker: CaretakerRead): string[] {
  const out: string[] = [];
  if (caretaker) {
    out.push(
      `Show a plain supervision note: activities for a ${caretaker.dependent} need common-sense supervision and judgment.`,
      "Never diagnose behaviour, give medical advice, or promise a safety outcome.",
    );
  }
  if (/\b(health|medical|diagnos|symptom|medicat|therapy)\b/i.test(text)) {
    out.push("This is not medical advice — say so visibly, and never present output as diagnosis.");
  }
  if (/\b(money|invest|budget|debt|financ)\b/i.test(text)) {
    out.push("This is not financial advice — say so visibly.");
  }
  return out;
}

/* ── SOFTWARE NECESSITY ────────────────────────────────────────────────── */

const EXPLICIT_SOFTWARE =
  /\b(app|web ?app|website|web ?site|software|build it in code|in code|a site\b)\b/i;

/** Version one serves curated content/suggestions — a folder of good answers. */
const CONTENT_HELPER =
  /\b(activit|suggest|idea|tip|prompt|exercise|recipe|question|card)\w*\b/i;

export function assessSoftware(
  type: CreationType,
  i: Interpretation,
  fullText: string,
  caretaker: CaretakerRead = null,
): SoftwareCall {
  const explicit = EXPLICIT_SOFTWARE.test(fullText);

  switch (type) {
    case "game":
      return {
        verdict: "central",
        reason: "A playable game is software (or a physical game — but you described one to play on a screen).",
        explicitSoftwareRequest: explicit,
      };
    case "app":
    case "site":
    case "list":
      return { verdict: "central", reason: "The thing itself is the software.", explicitSoftwareRequest: explicit };
    case "tool": {
      // A tool whose value is choosing from curated suggestions can be paper
      // first. Caretaker helpers are always content-driven: their product is
      // a set of good things to do.
      const contentDriven =
        !!caretaker ||
        CONTENT_HELPER.test(fullText) ||
        i.versionOne.some((c) => CONTENT_HELPER.test(c.value));
      if (contentDriven) {
        return {
          verdict: "helpful",
          reason: "The real product is the set of good suggestions. Software makes picking one faster — it isn't the value itself.",
          nonSoftwareTest: "Write the best 10–15 suggestions on paper or cards and use them for a week. If they work on paper, the app version is worth building.",
          explicitSoftwareRequest: explicit,
        };
      }
      return { verdict: "central", reason: "The tool's job is computation or interaction — that needs software.", explicitSoftwareRequest: explicit };
    }
    case "printable":
    case "design":
    case "digital-product":
      return {
        verdict: "optional",
        reason: "The deliverable is a finished file, not an app. Design software helps make it; no product software is needed.",
        nonSoftwareTest: "Finish ONE file and put it in front of one real buyer or user.",
        explicitSoftwareRequest: explicit,
      };
    case "physical-product":
      return {
        verdict: "test-first",
        reason: "It's a physical thing. Make one real unit before building anything digital around it.",
        nonSoftwareTest: "Make one finished unit (or one finished listing with a real mockup) and get one honest reaction.",
        explicitSoftwareRequest: explicit,
      };
    case "music":
    case "story":
    case "content":
      return {
        verdict: "optional",
        reason: "The finished piece is the product. It needs to be made, not engineered.",
        nonSoftwareTest: "Finish the smallest complete piece and share it with one person who'd tell you the truth.",
        explicitSoftwareRequest: explicit,
      };
    case "service":
      return {
        verdict: "test-first",
        reason: "A service is proven by delivering it. Software can come after the first paying customer.",
        nonSoftwareTest: "Deliver it manually to one real customer, start to finish, before building anything.",
        explicitSoftwareRequest: explicit,
      };
    case "event-plan":
      return {
        verdict: "optional",
        reason: "This is organisation, not software. A checklist and a calendar go a long way.",
        nonSoftwareTest: "Run the plan on paper — phases, owners, dates — before considering any tooling.",
        explicitSoftwareRequest: explicit,
      };
    default:
      return {
        verdict: "helpful",
        reason: "Too early to call — sharpening the idea decides whether software is even involved.",
        explicitSoftwareRequest: explicit,
      };
  }
}

/* ── SMALLEST OUTCOME ──────────────────────────────────────────────────────
   The first moment this creation genuinely worked, in the creator's world. */

export function deriveSmallestOutcome(
  type: CreationType,
  i: Interpretation,
  caretaker: CaretakerRead,
): string {
  if (i.desiredResult?.confidence === "stated") return i.desiredResult.value;
  // The caretaker outcome belongs to helper tools. A dog-walking SERVICE is
  // measured by a delivered walk, not by the dog's boredom level.
  const caretakerTypes: CreationType[] = ["tool", "app", "site", "list", "unknown"];
  if (caretaker && caretakerTypes.includes(type)) {
    return `The ${caretaker.dependent} is genuinely occupied for a stretch you chose, with almost no setup from you.`;
  }
  switch (type) {
    case "game": return "Someone finishes one round and starts another without being asked.";
    case "site": return "A real visitor lands on it and knows what to do next.";
    case "tool": return "Someone with the problem uses it once and gets a useful answer faster than they would have without it.";
    case "list": return "You check it instead of your memory, twice in one week.";
    case "printable":
    case "design":
    case "digital-product": return "One finished file a real person downloads, prints, or uses.";
    case "physical-product": return "One finished unit in a real person's hands, and an honest reaction.";
    case "music": return "One finished piece you can play for someone, start to end.";
    case "story": return "One finished draft a real reader gets through.";
    case "content": return "One finished piece published where its audience actually is.";
    case "service": return "One real delivery, done start to finish, for one real customer.";
    case "event-plan": return "The thing happens, people show up, and nobody's scrambling that morning.";
    default: return i.desiredResult?.value ?? "One version of this exists in the world and someone real has used it.";
  }
}

/* ── VERSION-ONE PROMISE ─────────────────────────────────────────────────
   One sentence the build is accountable to. For decision-helper tools the
   promise is a fast match, not a library to research. */

export function deriveVersionOnePromise(
  type: CreationType,
  i: Interpretation,
  caretaker: CaretakerRead,
  fullText: string,
): string {
  const stated = i.versionOne.filter((c) => c.confidence === "stated").slice(0, 2).map((c) => c.value);
  if (type === "tool" && (caretaker || CONTENT_HELPER.test(fullText)) && stated.length === 0) {
    return "Answer two or three quick questions about right now — time, attention, what's on hand — and get ONE matching suggestion. Not a list to research: one good answer, fast.";
  }
  if (stated.length) return `Version one does exactly this: ${stated.map((s) => s.charAt(0).toLowerCase() + s.slice(1)).join("; ")}.`;
  return `Version one is the smallest ${CREATION_TYPE_NOUN[type]} that delivers: ${deriveSmallestOutcome(type, i, caretaker).charAt(0).toLowerCase()}${deriveSmallestOutcome(type, i, caretaker).slice(1)}`;
}

const CREATION_TYPE_NOUN: Record<CreationType, string> = {
  app: "app", site: "site", tool: "tool", list: "list", game: "game",
  "physical-product": "product", "digital-product": "download", printable: "printable",
  design: "design", music: "piece", story: "draft", content: "piece",
  service: "service", "event-plan": "plan", unknown: "version",
};
