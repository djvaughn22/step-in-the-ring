// ─────────────────────────────────────────────────────────────────────────────
// THE MESSAGES — what a person says to an AI, written out for them.
//
// Step In The Ring does not run an AI. The AI lives in whichever app the person
// picks, and this file writes what they paste into it: a first message, then a
// next message each time they say what should change. That back and forth is
// the promise on the home page, so these functions have to keep it.
//
// Laws:
//   - DETERMINISTIC. No model call and no network. Same words in, same message
//     out, testable one fixture at a time.
//   - Their words go in VERBATIM. Everything around them only tells the AI how
//     to work with this person.
//   - It must survive a wrong guess. The reading in app/planner is rules, and
//     rules misread things (a family cookbook once got a fiction brief). The
//     guess may add or drop one harmless line here, and that is all it can do.
//   - The person's own voice, in everyday words. It has to read right whether
//     they are twelve or eighty, and it never says what they should feel.
// ─────────────────────────────────────────────────────────────────────────────

import type { CreationView } from "../creation/record";
import type { CreationType } from "../creation/types";
import { isRepair } from "../vnext/shape";

/** Any AI chat app works. These are the ones most people have heard of, in
 *  alphabetical order so the order recommends nothing. */
export const AI_APPS = [
  { name: "ChatGPT", href: "https://chatgpt.com/" },
  { name: "Claude", href: "https://claude.ai/" },
  { name: "Copilot", href: "https://copilot.microsoft.com/" },
  { name: "Gemini", href: "https://gemini.google.com/" },
] as const;

const MAKE_IT_NOW =
  "Please make a first version now, even if it's rough, so I have something to react to. Don't ask me a lot of questions first. Where you need something only I would know, like a name or a date, leave a clear blank and tell me what goes there.";

const NO_CODE =
  "I don't know how to code. If this takes code, write all of it for me, in one file that works in a web browser and on a phone, if you can. Tell me what to do with it, one step at a time.";

const PICTURE =
  "If you can make a picture of it, show me one. If you can't, describe it clearly enough that I can picture it, and tell me the easiest way to get it made.";

const SOUND =
  "If you can't make audio, write the words, describe the tune and the feel in plain words, and tell me the easiest way to hear it.";

const KEEP_GOING =
  "Use everyday words. When you're done, ask me what I'd like to change. When I ask for a change, keep everything else as it is and show me the whole updated version.";

const HELP =
  "Please give me your best plain answer first, then ask me one question at a time if you need to know more. If this touches health, money or the law, tell me what to double-check and who could help.";

const HELP_CLOSE = "Use everyday words. If I say I don't follow, explain it a different way.";

const REPAIR =
  "Please ask me for what you need to see, one thing at a time, and tell me exactly where to find it. Explain what you're doing in everyday words, and don't change anything that's already working.";

const REPAIR_NO_CODE = "I don't know how to code, so if the fix takes code, write all of it for me.";

const REPAIR_CLOSE = "When it's fixed, tell me how to check that it works.";

/** The one line that depends on the guess. Writing and plans need nothing
 *  extra; "unknown" gets the code line because it costs nothing if unneeded. */
const FORM_LINE: Partial<Record<CreationType, string>> = {
  app: NO_CODE,
  site: NO_CODE,
  tool: NO_CODE,
  list: NO_CODE,
  game: NO_CODE,
  unknown: NO_CODE,
  design: PICTURE,
  fashion: PICTURE,
  printable: PICTURE,
  "physical-product": PICTURE,
  music: SOUND,
};

/** Somebody naming a repo or a language does code. Telling their AI otherwise
 *  would be false, so the plain-words line drops out. */
const TECHNICAL =
  /\b(repo|repository|github|git|codebase|commit|deploy|api|typescript|javascript|python|react|next\.?js|database|sql)\b/i;

function soundsTechnical(view: CreationView): boolean {
  const { commit, push } = view.interpretation.permissions;
  return commit || push || TECHNICAL.test(view.record.originalIdea);
}

/** What they added beyond the first sentence, still in their own words. */
function theirDetails(view: CreationView): string[] {
  const out: string[] = [];
  const added = Object.values(view.record.answers).map((a) => a.trim()).filter(Boolean);
  if (added.length) out.push(`More about what I want: ${added.join(" ")}`);
  if (view.record.exclusions.length) out.push(`Please leave out: ${view.record.exclusions.join(", ")}.`);
  return out;
}

function opening(lead: string, idea: string): string {
  return idea.includes("\n") || idea.length > 200 ? `${lead}\n\n${idea}` : `${lead} ${idea}`;
}

/** Not everybody comes to make something, and the words have to fit. */
export type Purpose = "make" | "help" | "fix";

export function purposeOf(view: CreationView): Purpose {
  if (view.creationType === "general-help") return "help";
  return isRepair(view) ? "fix" : "make";
}

/** The message that starts the conversation. Short enough to read first. */
export function firstMessage(view: CreationView): string {
  const idea = view.record.originalIdea.trim();
  const details = theirDetails(view);
  const technical = soundsTechnical(view);
  const purpose = purposeOf(view);

  let parts: (string | null | undefined)[];
  if (purpose === "help") {
    parts = [opening("I could use some help with this:", idea), ...details, HELP, HELP_CLOSE];
  } else if (purpose === "fix") {
    parts = [
      opening("Something isn't working and I'd like help fixing it:", idea),
      ...details,
      REPAIR,
      technical ? null : REPAIR_NO_CODE,
      REPAIR_CLOSE,
    ];
  } else {
    const form = FORM_LINE[view.creationType];
    parts = [
      opening("I want to make this:", idea),
      ...details,
      MAKE_IT_NOW,
      form === NO_CODE && technical ? null : form,
      KEEP_GOING,
    ];
  }
  return parts.filter(Boolean).join("\n\n");
}

/* ── THE NEXT MESSAGE ──────────────────────────────────────────────────────
   Five things a person ever needs to tell an AI about what it just made. They
   are the whole skill of working with one, and nobody has to learn the words. */

export type MoveId = "change" | "broke" | "confused" | "different" | "done";

export interface Move {
  id: MoveId;
  label: string;
  /** The question over the box. Null when no words are needed. */
  ask: string | null;
  example: string;
}

export const MOVES: Move[] = [
  { id: "change", label: "Change something", ask: "What should change?", example: "Shorter, and keep the first part." },
  { id: "broke", label: "It didn't work", ask: "What happened?", example: "I clicked Start and nothing moved." },
  { id: "confused", label: "I don't understand", ask: "Which part?", example: "What does “upload the file” mean?" },
  { id: "different", label: "Try another way", ask: "What were you picturing?", example: "Funnier, like a note from a friend." },
  { id: "done", label: "It's right", ask: null, example: "" },
];

/** A closer example for "what should change", when the guess offers one. */
const CHANGE_EXAMPLE: Partial<Record<CreationType, string>> = {
  app: "Make the buttons bigger, and put the list first.",
  site: "Put the phone number at the top, and make it calmer.",
  tool: "Make the buttons bigger, and show the answer first.",
  list: "Add a column for the date, and keep the rest.",
  game: "Make it a little easier, and keep score.",
  design: "Softer colors, and make the title bigger.",
  printable: "Softer colors, and make the title bigger.",
  fashion: "Softer colors, and make the logo smaller.",
  music: "Slower, and change the second verse.",
  story: "Shorter, and keep the last line.",
};

export function exampleFor(move: Move, type: CreationType): string {
  return move.id === "change" ? CHANGE_EXAMPLE[type] ?? move.example : move.example;
}

const DONE: Record<Purpose, string> = {
  make: "This is what I wanted. Please give me the final version, clean and complete, and tell me how to save it and share it, one step at a time.",
  help: "That helps, thank you. Please sum it up in a few plain sentences, and tell me what I should do next.",
  fix: "That fixed it, thank you. Please tell me in a sentence or two what was wrong, and whether there's anything I should do so it doesn't happen again.",
};

/** The next thing to paste. Empty until there are words to put in it. */
export function nextMessage(id: MoveId, words: string, purpose: Purpose = "make"): string {
  const said = words.trim();
  if (id === "done") return DONE[purpose];
  if (!said) return "";
  switch (id) {
    case "change":
      return `Here's what I'd like to change:\n\n${said}\n\nKeep everything else as it is, and show me the whole updated version.`;
    case "broke":
      return `That didn't work for me. Here's what happened:\n\n${said}\n\nPlease tell me in everyday words what went wrong, fix it, and give me the exact steps to try again.`;
    case "confused":
      return `I don't understand this part:\n\n${said}\n\nPlease explain it in everyday words, with no technical terms, and tell me exactly what to do next.`;
    case "different":
      return `This isn't what I had in mind. I was picturing this:\n\n${said}\n\nPlease try again from the start with a different approach. My goal is the same.`;
  }
}
