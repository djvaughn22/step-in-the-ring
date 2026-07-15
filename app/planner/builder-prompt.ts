// The builder prompt — a complete execution brief, not a dump of labelled
// answers.
//
// Two rules that matter more than the wording:
//  1. Never claim the builder has access to a repository the person never
//     mentioned. An invented repo sends a builder editing the wrong thing.
//  2. Never grant commit/push/deploy authority the person never gave.

import { BUILD_TYPE_LABEL, type Interpretation } from "./types";

type Section = { title: string; lines: string[] };

const bullets = (items: string[]) => items.map((i) => `- ${i}`);

export function buildBuilderPrompt(i: Interpretation): string {
  const sections: Section[] = [];
  const add = (title: string, lines: string[]) => {
    const clean = lines.map((l) => l.trim()).filter(Boolean);
    if (clean.length) sections.push({ title, lines: clean });
  };

  const dest = i.destination?.value ?? null;

  if (dest) {
    add("Product context", [
      `This work belongs inside ${dest}, which already exists and has real users.`,
      `Before you edit anything, inspect the ${dest} repository: read the existing structure, styles, and patterns, and follow them. Do not restructure what is already working.`,
    ]);
  } else {
    add("Product context", [
      "This is a standalone build — nothing exists yet, so start clean. Do not assume you have access to any codebase.",
      "Use the simplest stack that does the job, and keep everything in as few files as possible.",
    ]);
  }

  add("Objective", [`${i.summary}`, `Build type: ${BUILD_TYPE_LABEL[i.buildType.value]}.`]);

  if (i.audience) add("Who it is for", [i.audience.value]);
  if (i.need) add("What is wrong today", [i.need.value]);
  if (i.desiredResult) add("What success looks like", [i.desiredResult.value]);

  if (i.versionOne.length) {
    add("Version-one scope — build exactly this", bullets(i.versionOne.map((c) => c.value)));
  }
  if (i.assets.length) {
    add("Assets that already exist — use these, do not invent new ones", [
      ...bullets(i.assets.map((c) => c.value)),
      "Verify each asset actually exists and loads before you build around it. If something is missing, say so instead of substituting a placeholder.",
    ]);
  }
  if (i.preserve.length) {
    add("Must keep working — do not break these", bullets(i.preserve));
  }

  add("Responsive requirements", [
    "Mobile-first. It has to work on a phone held in one hand before it works anywhere else.",
    "Touch targets big enough for a thumb; nothing essential hidden below the fold on a small screen.",
    "Verify on a narrow phone width and on a desktop width.",
  ]);

  add("Accessibility requirements", [
    "Everything usable with mouse, touch, and keyboard alike.",
    "Visible focus on every control; real labels on every input.",
    "Announce state changes to screen readers rather than only showing them.",
    "Respect prefers-reduced-motion.",
  ]);

  if (i.exclusions.length) {
    add("Explicitly out of scope — do not build these", [
      ...bullets(i.exclusions.map((c) => c.value)),
      "If one of these looks necessary, stop and say why instead of building it.",
    ]);
  }
  if (i.constraints.length) add("Constraints", bullets(i.constraints));
  if (i.assumptions.length) {
    add("Assumptions made — correct them if any are wrong", bullets(i.assumptions));
  }

  const authority: string[] = [];
  if (i.permissions.build) authority.push("You have permission to build this now without checking back first.");
  else authority.push("Show the plan and wait for a go-ahead before writing code.");
  authority.push(
    "Where this brief is silent, choose the simplest option that serves version one, and say what you chose.",
  );
  if (!i.permissions.push && dest) {
    authority.push(`Do not commit or push to ${dest}. Show the change working and stop there.`);
  }
  add("Decision authority", authority);

  add("Ready when", [
    ...bullets(i.versionOne.map((c) => `${c.value} — works, on a phone and on a desktop.`)),
    "Nothing on the out-of-scope list got built.",
    ...(i.preserve.length ? ["Everything on the do-not-break list still works."] : []),
  ]);

  add("Testing", [
    "Run it and use it yourself before you call it done — clicking through the real flow, not just a passing build.",
    "Test with a mouse, on a touch screen, and with the keyboard only.",
    ...(dest ? [`Run whatever lint, typecheck, and test commands ${dest} already has, and fix what you broke.`] : []),
  ]);

  if (i.permissions.commit) {
    add("Commit", [
      "Commit the work in one clear commit that says what changed and why.",
      ...(dest ? [`Only commit files belonging to this change. Do not touch unrelated parts of ${dest}.`] : []),
    ]);
  }
  if (i.permissions.push) {
    add("Push", ["Push to the main branch."]);
  }
  if (i.permissions.deploy && dest) {
    add("Deployment", [
      `Pushing deploys ${dest}. After the deploy finishes, load the live URL and confirm the new work is actually there — a successful push is not proof it is live.`,
    ]);
  }

  add("Report back", [
    "When you're done, say plainly: what you built, what you assumed, what you did not build, how you tested it,",
    i.permissions.push ? "the commit hash, and the live URL you verified." : "and anything you could not finish.",
  ]);

  return sections
    .map((s) => `## ${s.title}\n${s.lines.join("\n")}`)
    .join("\n\n")
    .trim();
}
