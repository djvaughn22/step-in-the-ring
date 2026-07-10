// Result-review engine. When the user returns with results, don't restart
// intake — analyze what actually happened and recommend the next path.
import type { NextPath } from "./store";

export const PATH_LABELS: Record<NextPath, string> = {
  fix: "Fix",
  refine: "Refine",
  expand: "Expand",
  launch: "Launch",
};

export const PATH_BLURB: Record<NextPath, string> = {
  fix: "Something is broken, missing, regressed, or misleading — correct it safely first.",
  refine: "It works, but feels awkward, unclear, or unfinished — improve it without rebuilding.",
  expand: "This cycle is stable — add the next planned capability.",
  launch: "It's ready for real people — prepare the public launch and a first measurable result.",
};

export interface ReviewInput {
  completed: boolean; // did the build/cycle complete?
  correctLive: boolean; // is the live behavior correct?
  broke: string; // what broke / regressed
  wrong: string; // what feels wrong / unfinished
  deferred: string; // what was deferred
  readyForPublic: boolean;
  raw: string; // pasted return report
}

const hits = (s: string, words: string[]) => {
  const t = (s || "").toLowerCase();
  return words.some((w) => t.includes(w));
};

export function analyzeReturn(input: ReviewInput): { recommendation: NextPath; notes: string[] } {
  const notes: string[] = [];
  const brokeSignals =
    !input.completed ||
    !input.correctLive ||
    input.broke.trim().length > 0 ||
    hits(input.raw, ["error", "broke", "broken", "fail", "regress", "crash", "500", "blank", "doesn't work", "not working"]);

  if (brokeSignals) {
    notes.push("There are signs something broke, regressed, or didn't finish — fix and re-verify before adding anything.");
    if (input.deferred.trim()) notes.push(`Note the deferred item so it isn't lost: ${input.deferred.trim()}.`);
    // Guard against "build passed" being treated as proof the experience is good.
    if (input.completed && hits(input.raw, ["build passed", "build succeeded", "compiled"]))
      notes.push("A green build is not proof the product experience is right — verify the live behavior.");
    return { recommendation: "fix", notes };
  }

  if (input.wrong.trim().length > 0 || hits(input.raw, ["awkward", "confusing", "unclear", "unfinished", "rough", "clunky", "ugly"])) {
    notes.push("It works but isn't polished — refine the specific rough edges without rebuilding what's fine.");
    return { recommendation: "refine", notes };
  }

  if (input.readyForPublic || hits(input.raw, ["ready to launch", "ready for launch", "ship it", "launch"])) {
    notes.push("It looks ready for real people — move to a launch pass with a first measurable result.");
    return { recommendation: "launch", notes };
  }

  notes.push("This cycle looks stable — expand to the next planned capability.");
  if (input.deferred.trim()) notes.push(`A natural next candidate: ${input.deferred.trim()}.`);
  return { recommendation: "expand", notes };
}

export const REVIEW_QUESTIONS: { key: keyof ReviewInput; label: string; type: "bool" | "text" }[] = [
  { key: "completed", label: "Did the build / cycle complete?", type: "bool" },
  { key: "correctLive", label: "Is the live behavior correct?", type: "bool" },
  { key: "broke", label: "What broke or regressed? (blank if nothing)", type: "text" },
  { key: "wrong", label: "What feels wrong, unclear, or unfinished?", type: "text" },
  { key: "deferred", label: "What did the tool defer?", type: "text" },
  { key: "readyForPublic", label: "Does it feel ready for real people?", type: "bool" },
];
