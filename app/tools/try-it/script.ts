// TRY-IT SCRIPT — pure logic, no network, no AI.
//
// Round 04 of the loop is "Try it: put it in front of a real person". This
// turns three answers (what it is, the one thing they should try, what you
// most want to learn) into a short script to read from, plus a notes sheet.
// The questions are fixed, plain, and non-leading on purpose: the point is to
// watch, not to sell the thing to the tester.

export type Goal = "understand" | "do" | "return" | "confusing";

export const GOALS: { id: Goal; label: string }[] = [
  { id: "understand", label: "Do they get what it's for?" },
  { id: "do", label: "Can they do the main thing without help?" },
  { id: "confusing", label: "Where does it confuse people?" },
  { id: "return", label: "Would they use it again?" },
];

export interface TryItState {
  what: string;
  task: string;
  goal: Goal;
  notes: { did: string; stuck: string; said: string; change: string };
}

export const EMPTY_TRY_IT: TryItState = {
  what: "",
  task: "",
  goal: "do",
  notes: { did: "", stuck: "", said: "", change: "" },
};

const GOAL_QUESTIONS: Record<Goal, string[]> = {
  understand: [
    "Before you touch anything: what do you think this is for?",
    "Who do you think it's meant for?",
  ],
  do: [
    "Was there a moment you weren't sure what to do next? Where?",
    "Is there anything you expected to be there that wasn't?",
  ],
  confusing: [
    "What was the most confusing part?",
    "Was there a word or button that didn't mean what you expected?",
  ],
  return: [
    "When, if ever, would you open this again?",
    "What would you use instead today?",
  ],
};

/** Every session ends with the same two questions. */
const CLOSING_QUESTIONS = [
  "If you could change one thing, what would it be?",
  "Is there anything you'd like to ask me?",
];

export interface Script {
  before: string[];
  task: string;
  watch: string[];
  questions: string[];
}

export function buildScript(state: Pick<TryItState, "what" | "task" | "goal">): Script {
  const what = state.what.trim() || "this";
  const task = state.task.trim();
  return {
    before: [
      `“I made ${what}. I'm testing it, not you. You can't get this wrong.”`,
      "“Please think out loud. If something is confusing, that's exactly what I need to hear.”",
      "“I'm going to stay quiet and watch. I'll answer questions at the end.”",
    ],
    task: task
      ? `“Could you try to ${task.replace(/^to\s+/i, "")}?” Then stop talking.`
      : "Name the one thing they should try, then stop talking.",
    watch: [
      "Don't help, explain, or point. If they ask, say “What would you try?”",
      "Note every pause, back-tap, or “hmm”. Those are the useful parts.",
      "Let them finish or give up. Both tell you something.",
    ],
    questions: [...GOAL_QUESTIONS[state.goal], ...CLOSING_QUESTIONS],
  };
}

export function scriptText(state: TryItState): string {
  const s = buildScript(state);
  const n = state.notes;
  const lines = [
    `Try-it script: ${state.what.trim() || "my project"}`,
    "",
    "Before they start",
    ...s.before.map((l) => `- ${l}`),
    "",
    "The task",
    `- ${s.task}`,
    "",
    "While they try it",
    ...s.watch.map((l) => `- ${l}`),
    "",
    "Afterwards, ask",
    ...s.questions.map((q, i) => `${i + 1}. ${q}`),
  ];
  if (n.did || n.stuck || n.said || n.change) {
    lines.push(
      "",
      "Notes",
      `What they did: ${n.did.trim() || "-"}`,
      `Where they got stuck: ${n.stuck.trim() || "-"}`,
      `What they said: ${n.said.trim() || "-"}`,
      `The one change I'll make next: ${n.change.trim() || "-"}`,
    );
  }
  return lines.join("\n");
}

export function parseTryItState(raw: unknown): TryItState | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  const notes = (r.notes && typeof r.notes === "object" ? r.notes : {}) as Record<string, unknown>;
  const goal = GOALS.some((g) => g.id === r.goal) ? (r.goal as Goal) : "do";
  return {
    what: str(r.what, 200),
    task: str(r.task, 200),
    goal,
    notes: {
      did: str(notes.did, 1000),
      stuck: str(notes.stuck, 1000),
      said: str(notes.said, 1000),
      change: str(notes.change, 1000),
    },
  };
}
