// The Repeatable Build Playbook — the actual loop this site runs, written
// down so another creator can run it too. Generated from data (not prose
// scattered in a page) so the same source renders /how and exports as
// Markdown. No pricing, no sales claims — the method itself.

export interface PlaybookStep {
  n: string;
  title: string;
  body: string;
  points: string[];
}

export const PLAYBOOK_STEPS: PlaybookStep[] = [
  {
    n: "1",
    title: "Prepare the machine — once",
    body: "A low-cost build machine is a checklist, not a purchase. Commands vary by system — treat these as templates and use each tool's official install page.",
    points: [
      "An OS you're comfortable in (an old laptop with Linux works fine).",
      "A code editor (VS Code) and a terminal you're not afraid of.",
      "Git, plus a GitHub account for backup and deploys.",
      "Node (or the runtime your builds need) — template: install from the official site, then `node --version`.",
      "Claude Code or the AI builder you trust, signed in.",
      "A browser for testing, and a deploy platform (Vercel's free tier is enough).",
      "Secrets live in local files that never enter git — never in code, never in prompts.",
      "One folder where every repository lives, so nothing gets lost.",
    ],
  },
  {
    n: "2",
    title: "Start with one creation",
    body: "Say the idea in the planner, choose an engine in the Engine Room, or continue one that started on iDontCry. One creation at a time.",
    points: [
      "The idea goes in however it comes out — the system reads it back before anything is planned.",
      "A creation that starts anywhere carries its record everywhere: no retyping between engines.",
    ],
  },
  {
    n: "3",
    title: "Interpret before building",
    body: "The step most projects skip. Before any prompt exists, you can read what's being made, who it serves, the smallest outcome, whether software is even needed, and what's deliberately excluded.",
    points: [
      "Correct anything wrong — the plan re-reads, it doesn't re-interview.",
      "The software-necessity call is honest: some ideas should be tested on paper first, and the plan says so.",
    ],
  },
  {
    n: "4",
    title: "Generate the Build Pack",
    body: "Every creation exports the same portable pack.",
    points: [
      "creation-brief.md — idea, interpretation, specification, acceptance test, and the builder prompt, human-readable.",
      "creation.json — the validated record, re-importable later.",
      "The builder prompt alone copies to the clipboard when that's all you need.",
    ],
  },
  {
    n: "5",
    title: "Run the builder prompt",
    body: "Open the right repository (or an empty folder for a standalone build), start a fresh Claude Code session, paste the prompt, and let it work.",
    points: [
      "The prompt carries the working method: inspect first, smallest stack, mobile-first, test for real, stop only at safety gates.",
      "Your Builder Defaults decide how far it goes: prototype, commit, or commit-and-push.",
    ],
  },
  {
    n: "6",
    title: "Verify independently",
    body: "The builder's report is a claim, not a verdict. Check it yourself.",
    points: [
      "Use the real product — phone width and desktop, mouse and keyboard.",
      "Read the git diff; confirm only the intended repository changed.",
      "The acceptance test from the Build Pack is the checklist.",
    ],
  },
  {
    n: "7",
    title: "Save and repeat",
    body: "Export the finished creation, keep the prompt and acceptance tests with it, and start the next idea. The loop is the product.",
    points: [
      "Builder Defaults persist, so the next prompt starts right.",
      "When an engine's output was weak, that's a bug in the engine — improve it before the next run.",
    ],
  },
];

export function playbookMarkdown(): string {
  return [
    "# The Repeatable Build Playbook",
    "",
    "The loop StepInTheRing actually runs: one idea at a time, interpreted before built, verified before shipped.",
    "",
    ...PLAYBOOK_STEPS.flatMap((s) => [
      `## ${s.n}. ${s.title}`,
      "",
      s.body,
      "",
      ...s.points.map((p) => `- ${p}`),
      "",
    ]),
    "---",
    "",
    "From stepinthering.com — part of Open Mirror LLC.",
    "",
  ].join("\n");
}
