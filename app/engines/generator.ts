// The DJ-Way execution-package generator. Deterministic, free. Quality comes
// from the user's real answers + a rigorous structure — NOT generic filler.
import type { BuildStage, Depth, Destination, Engine } from "./engines";
import { DEPTH_LABELS, DESTINATION_LABELS } from "./engines";
import type { ExecutionPackage } from "./store";
import { generateSpecialties } from "./specialties";

type A = Record<string, string>;
const val = (a: A, k: string) => (a[k] ?? "").trim();
const or = (a: A, k: string, fallback: string) => (val(a, k) ? val(a, k) : `(${fallback})`);
const has = (a: A, k: string) => val(a, k).length > 0;

const bullets = (items: string[]) => items.filter(Boolean).map((s) => `- ${s}`).join("\n");

// ---- Section builders --------------------------------------------------
function understanding(e: Engine, a: A): string {
  const lines = [
    `Project: ${or(a, "name", "unnamed")}`,
    `Engine: ${e.name} — ${e.tagline}`,
    ``,
    `What you're trying to accomplish: ${or(a, "outcome", val(a, "purpose") || val(a, "rough") || "the outcome you described")}`,
    `Who it's for: ${or(a, "who", val(a, "customer") || val(a, "audience") || "the person you named")}`,
    `The real situation now: ${or(a, "situation", val(a, "symptom") || val(a, "evidence") || "as you described")}`,
    `What already exists: ${or(a, "exists", "not stated — the build must inspect and confirm before assuming")}`,
    `Main problem / focus: ${or(a, "problem", val(a, "symptom") || val(a, "bottleneck") || val(a, "core") || "the core problem you described")}`,
    `Biggest constraint: ${or(a, "constraint", "not stated")}`,
    `What success looks like: ${or(a, "success", val(a, "measure") || "the result you described")}`,
  ];
  const unknowns: string[] = [];
  if (!has(a, "exists")) unknowns.push("What already exists — must be inspected, not assumed.");
  if (!has(a, "success") && !has(a, "measure")) unknowns.push("A concrete success measure for this cycle.");
  if (e.technical && !has(a, "stack")) unknowns.push("The exact stack/repo state — confirm before building.");
  return lines.join("\n") + (unknowns.length ? `\n\nStill to verify:\n${bullets(unknowns)}` : "");
}

function direction(e: Engine, a: A, stage: BuildStage): string {
  const map: Record<string, string> = {
    idea: `Take the strongest interpretation of "${or(a, "rough", "your idea")}" and prove it with the smallest real test before building anything big.`,
    build: `Build the single core action — ${or(a, "core", "the one thing that helps someone")} — as a working first version, and defer everything else.`,
    sell: `Package "${or(a, "product", "the offer")}" for ${or(a, "customer", "the buyer")} and run one real validation before scaling.`,
    launch: `Get ${or(a, "what", "the product")} in front of ${or(a, "audience", "a first audience")} with only the blockers fixed that actually stop a launch.`,
    fix: `Reproduce and inspect "${or(a, "symptom", "the symptom")}" first, protect what works, then make the smallest safe correction.`,
    grow: `Attack the one bottleneck (${or(a, "bottleneck", "the drop-off")}) with the smallest experiment that can move ${or(a, "measure", "the number")}.`,
    plan: `Turn "${or(a, "outcome", "the outcome")}" into phases with owners and a clear next action — no boiling the ocean.`,
    etsy: `Vet "${or(a, "idea", "your product idea")}" for Etsy — assess buyer clarity, production fit, and brand alignment — then package it for launch if the green lights align.`,
  };
  return [
    map[e.id] ?? "One focused direction for this cycle.",
    ``,
    `Preserve: ${or(a, "protect", "everything already working — inspect first, don't rebuild what's fine")}.`,
    `Avoid: doing everything at once, guessing at the current state, and adding scope that isn't required for this objective.`,
    `Current stage: ${stage} — outputs are tuned to this stage, not a generic template.`,
  ].join("\n");
}

function objective(e: Engine, a: A): string {
  const map: Record<string, string> = {
    idea: `Clarify the concept and define ONE simple test that proves (or kills) it this week.`,
    build: `Ship a working first version of the core action: ${or(a, "core", "the one core thing")}.`,
    sell: `Produce the offer + a validation test that gets a real yes/no from ${or(a, "customer", "a real buyer")}.`,
    launch: `Reach launch-ready and get the first measurable result: ${or(a, "measure", "your first target")}.`,
    fix: `Reproduce, root-cause, and safely repair "${or(a, "symptom", "the issue")}" without regressions.`,
    grow: `Run one experiment that could move ${or(a, "measure", "the target number")} — with a decision rule.`,
    plan: `Lock the milestones + owners and start the first concrete action.`,
    etsy: `Produce a go/no-go decision on "${or(a, "idea", "the product")}" — complete with listing draft, social pack, and fulfillment path if approved.`,
  };
  return `${map[e.id] ?? "One focused, verifiable objective."}\n\nNarrow enough to finish and verify in a single pass.`;
}

function scope(e: Engine, a: A): { inScope: string[]; outOfScope: string[] } {
  const common = [`This cycle's objective only`, `Saved project state on this device`, `A verification pass`];
  const inByEngine: Record<string, string[]> = {
    idea: ["Clarified concept + strongest interpretation", "One simple test design", "A decision: pursue, pause, or send to Build/Sell/Plan/iDontCry"],
    build: ["The one core user action, working end-to-end", "First screen / route", "Local/save state as needed", "Mobile behavior", "Build verification"],
    sell: ["Offer + format + price hypothesis", "Sales-page requirements", "Delivery process", "One validation test"],
    launch: ["Readiness assessment", "Only launch-blocking fixes", "Production checks", "Launch message + first-result tracking"],
    fix: ["Reproduce + inspect the exact symptom", "Smallest safe correction", "Regression tests around the affected journey"],
    grow: ["One growth hypothesis", "Smallest experiment", "Measurement + decision rule"],
    plan: ["Phases + milestones", "Owners + dependencies", "The immediate next action"],
    etsy: ["Product decision (Build First, Refine, Park, or Avoid)", "Etsy listing draft (title, description, tags, price range)", "Organic social launch pack (hooks, captions, Reel/Story ideas)", "Fulfillment path (digital, POD, handmade)", "Legal & trademark risk assessment"],
  };
  const out = [
    "Native mobile apps", "Accounts / complex auth", "Subscriptions / payments (unless this cycle IS that)",
    "Broad redesign of unrelated areas", "Unnecessary paid APIs", "Advanced analytics", "Speculative features",
    "Etsy shop setup", "Etsy Pattern integration", "Print-on-Demand vendor account setup", "Actual production or shipping",
  ];
  return { inScope: [...(inByEngine[e.id] ?? []), ...common], outOfScope: out };
}

function design(e: Engine, a: A): string | undefined {
  const productish = ["build", "launch", "sell", "fix"].includes(e.id);
  if (!productish) return undefined;
  return [
    `Desired feeling: clear, calm, trustworthy — usable by a 7-year-old or a 97-year-old.`,
    `Primary action: ${or(a, "core", val(a, "product") || "the one thing you want them to do")}.`,
    `Secondary action: a way to learn more or come back later.`,
    `Information order: what it is → why it fits them → the one action.`,
    `Mobile: works one-handed; no horizontal overflow; tap targets ≥ 44px.`,
    `Accessibility: real labels, visible focus, don't rely on color alone.`,
    `Don't copy: any competitor's exact wording, assets, or distinctive visual identity.`,
    `Don't overdesign: no giant gradients, no glassy noise, no decorative clutter over the core flow.`,
    `Base it on: ${or(a, "who", "your actual audience")} and any existing brand — not a random theme.`,
  ].join("\n");
}

function architecture(e: Engine, a: A): string {
  if (e.technical) {
    return [
      `Routes / screens: the one route for this cycle's core action first; defer the rest.`,
      `Reusable components: extract only what's used more than once; match existing conventions.`,
      `State / persistence: ${or(a, "exists", "local-first unless a backend already exists")}; version stored data; parse it safely.`,
      `Integrations: none new unless the objective requires it; no new paid APIs without approval.`,
      `Error handling: external failures degrade gracefully; the page never blanks.`,
      `Mobile + accessibility: baked in, not bolted on.`,
      `Deployment: match the existing pipeline (${or(a, "exists", "confirm from the repo")}).`,
      `Future boundary: leave clean seams for the next cycle; don't build the future now.`,
    ].join("\n");
  }
  // Non-technical projects
  return [
    `Phases: break the work into 2–4 focused phases.`,
    `Owners: name who does each phase (even if it's just you).`,
    `Dependencies: what must happen before what.`,
    `Milestones: the checkpoint that ends each phase.`,
    `Decisions: what has to be decided before starting.`,
    `Completion criteria: how you'll know each phase is truly done.`,
  ].join("\n");
}

function sequence(): string {
  return [
    `1. Inspect — understand the current state; preserve existing work; document the starting point.`,
    `2. Define — resolve the decisions this cycle needs.`,
    `3. Design — the user journey, structure, and presentation.`,
    `4. Build — implement the core experience only.`,
    `5. Verify — test the real behavior (not just that it compiles).`,
    `6. Polish — clarity, responsiveness, accessibility, consistency.`,
    `7. Return — bring the actual results back into StepInTheRing.`,
    `8. Refine — generate the next focused cycle based on evidence.`,
  ].join("\n");
}

// ---- The primary prompt (the centerpiece) ------------------------------
function claudeCodePrompt(e: Engine, a: A, stage: BuildStage, depth: Depth): string {
  const sc = scope(e, a);
  const deep = depth === "deep";
  const quick = depth === "quick";
  const lines: string[] = [];
  lines.push(`# ${or(a, "name", "Project")} — ${e.name} build cycle (${DEPTH_LABELS[depth]})`);
  lines.push(``);
  lines.push(`You are working directly in the existing repository. Inspect first, preserve working parts, implement ONE focused objective, verify it for real, and report honestly. Do not rebuild working functionality. Do not try to build everything at once.`);
  lines.push(``);
  lines.push(`## Project`);
  lines.push(`- Name: ${or(a, "name", "unnamed")}`);
  lines.push(`- Purpose: ${or(a, "purpose", val(a, "rough") || val(a, "product") || "as described")}`);
  lines.push(`- Who it's for: ${or(a, "who", val(a, "audience") || "the specified user")}`);
  lines.push(`- Current problem: ${or(a, "problem", val(a, "symptom") || val(a, "core") || "as described")}`);
  lines.push(`- Current state (verify before trusting): ${or(a, "exists", "unknown — inspect the repo and confirm")}`);
  lines.push(`- Desired outcome for THIS cycle: ${or(a, "outcome", val(a, "success") || "as described")}`);
  lines.push(`- Stage: ${stage}`);
  lines.push(``);
  lines.push(`## Objective (this cycle only)`);
  lines.push(objective(e, a).split("\n\n")[0]);
  lines.push(``);
  lines.push(`## In scope`);
  lines.push(bullets(sc.inScope));
  lines.push(``);
  lines.push(`## Explicitly OUT of scope (do not build)`);
  lines.push(bullets(sc.outOfScope));
  lines.push(``);
  lines.push(`## Inspect first (before any edits)`);
  lines.push(bullets([
    `Check git status, branch, and recent commits; note uncommitted work and preserve it.`,
    `Read the code paths this objective touches; write down the real starting point.`,
    `Confirm the framework, styling, routing, and deploy setup from the repo — do not assume.`,
    `Identify what is already working and must be preserved: ${or(a, "protect", "anything that works today")}.`,
  ]));
  lines.push(``);
  if (!quick) {
    lines.push(`## Requirements`);
    lines.push(`- UX: ${or(a, "core", "the one core action is obvious")}; clear first screen; no dead ends.`);
    lines.push(`- Architecture: reuse existing conventions; extract shared components only when reused; version + safe-parse any stored data.`);
    lines.push(`- Mobile: one-handed use, no horizontal overflow, tap targets ≥ 44px.`);
    lines.push(`- Accessibility: real labels, visible focus, keyboard reachable, not color-alone.`);
    lines.push(`- Performance: no needless client components; lazy images; graceful external-failure handling.`);
    lines.push(`- Security/data: secrets stay server-side; validate inputs; no new paid APIs without approval.`);
    lines.push(`- Content/brand: match the existing voice; plain, human copy; no unsupported claims.`);
    lines.push(``);
  }
  lines.push(`## Git safety`);
  lines.push(bullets([
    `Work on the existing branch's flow; if on the default branch and the change is risky, branch first.`,
    `Commit only intentional files. Never commit secrets.`,
    quick ? `Keep the change small and reversible.` : `Batch related edits into one clear commit with a real message.`,
  ]));
  lines.push(``);
  lines.push(`## Build & test`);
  lines.push(bullets([
    `Run lint, typecheck, tests, and the production build.`,
    `Fix errors caused by this work before continuing.`,
    deep ? `Add focused tests for the new logic and edge cases.` : `Add or update tests where it's cheap and high-value.`,
  ]));
  lines.push(``);
  lines.push(`## Completion criteria`);
  lines.push(bullets([
    `The objective is met and verified in the running app (not just compiling).`,
    or(a, "success", "the stated success condition holds"),
    `Lint, typecheck, tests, and production build all pass.`,
    `Nothing that previously worked is broken.`,
  ]));
  lines.push(``);
  lines.push(`## Report back (be honest)`);
  lines.push(bullets([
    `What actually changed, and what you verified in the running app.`,
    `git status, branch, commit IDs, files changed.`,
    `lint / typecheck / tests / production-build results (actual output).`,
    `Anything you intentionally deferred, and any real blockers.`,
    `Do NOT claim unfinished work is complete.`,
  ]));
  if (deep) {
    lines.push(``);
    lines.push(`## Deep-build extras`);
    lines.push(bullets([
      `Produce a short repository audit (what works, what's broken/mocked, data sources, licensing).`,
      `Use a phased implementation; commit at safe checkpoints.`,
      `Document deployment + any legal/data-source boundaries.`,
      `Tag the stable result.`,
    ]));
  }
  lines.push(``);
  lines.push(`## Preserve for later (do NOT build now)`);
  lines.push(bullets([`Anything in the OUT of scope list above.`, `Ideas that surface mid-build — note them for the next cycle.`]));
  return lines.join("\n");
}

function nonTechPrompt(e: Engine, a: A, dest: Destination): string {
  const head = `# ${or(a, "name", "Project")} — ${e.name} (for ${DESTINATION_LABELS[dest]})`;
  const body: Record<string, string[]> = {
    idea: [
      `Help me pressure-test and sharpen this idea, then give me ONE simple real-world test.`,
      `Idea: ${or(a, "rough", "as described")}`,
      `Who it's for: ${or(a, "who", "as described")}. Why it matters: ${or(a, "why", "as described")}.`,
      `Constraint: ${or(a, "constraint", "none stated")}.`,
      `Deliver: strongest interpretation, the target user, the simplest test I can run this week, honest reasons to pursue or pause, and whether this should go to Build, Sell, Plan, or stay a creative iDontCry spark.`,
    ],
    sell: [
      `Help me turn this into a real offer and a first validation test.`,
      `Selling: ${or(a, "product", "as described")}. Customer: ${or(a, "customer", "as described")}. Problem: ${or(a, "problem", "as described")}.`,
      `Existing: ${or(a, "exists", "nothing yet")}. Channel idea: ${or(a, "channel", "open")}. Constraint: ${or(a, "constraint", "none stated")}.`,
      `Deliver: the offer + format, a price hypothesis, sales-page requirements, the delivery process, and ONE validation test to get a real yes/no.`,
    ],
    grow: [
      `Help me pick the single highest-leverage experiment.`,
      `Evidence so far: ${or(a, "evidence", "as described")}. Bottleneck: ${or(a, "bottleneck", "as described")}. Number to move: ${or(a, "measure", "as described")}.`,
      `Deliver: one growth hypothesis, the smallest experiment to test it, exactly what to measure, a decision rule, and a time boundary. No new experiment until there's evidence.`,
    ],
    plan: [
      `Help me turn this into a clear, human plan.`,
      `Outcome: ${or(a, "outcome", "as described")}. Current state: ${or(a, "situation", "as described")}. Deadline: ${or(a, "deadline", "none")}. People: ${or(a, "people", "just me")}.`,
      `Deliver: 2–4 phases, milestones, dependencies, owners, top risks, and the immediate next action.`,
    ],
    etsy: [
      `Help me vet this product idea and package it for Etsy launch.`,
      `Product idea: ${or(a, "idea", "as described")}. Brand: ${or(a, "brand", "open")}. Type: ${or(a, "productType", "open")}.`,
      `Buyer: ${or(a, "buyer", "as described")}. Tone: ${or(a, "tone", "open")}. Format: ${or(a, "format", "open")}. Concept: ${or(a, "concept", "as described")}.`,
      `Main concern: ${or(a, "concern", "none stated")}.`,
      `Deliver: buyer clarity assessment, product decision (Build First / Refine / Park / Avoid) with honest reasoning, complete Etsy listing draft (title, short desc, long desc, 13 tags, price hypothesis), social launch pack (hooks, captions, Reel/Story/post ideas, hashtags), fulfillment path, legal/trademark flags, and Open Mirror placement guidance.`,
    ],
  };
  const lines = body[e.id] ?? [`Help me with the ${e.name} for "${or(a, "name", "this project")}".`];
  return `${head}\n\n${lines.join("\n")}\n\nBe specific to my answers. If something important is missing, tell me what to decide — don't invent it.`;
}

function verify(e: Engine, a: A): string {
  const base = [
    `The objective is actually met — verified by using it, not just building it.`,
    `Success condition: ${or(a, "success", val(a, "measure") || "the result you defined")}.`,
    `Nothing that worked before is broken.`,
  ];
  if (e.technical) base.push(`lint, typecheck, tests, and production build all pass.`, `Mobile behaves; no horizontal overflow.`);
  return bullets(base);
}

function returnTemplate(a: A, e: Engine, dest: Destination): string {
  const tech = e.technical && dest === "claude-code";
  const rows = [
    `PROJECT: ${or(a, "name", "")}`,
    `ENGINE: ${e.name}`,
    `BUILD CYCLE:`,
    `TOOL USED: ${DESTINATION_LABELS[dest]}`,
    ``,
    `WHAT CHANGED:`,
    ``,
    `WHAT WORKS:`,
    ``,
    `WHAT DID NOT WORK:`,
    ``,
  ];
  if (tech) {
    rows.push(
      `FILES CHANGED:`, ``, `COMMITS:`, ``, `LINT:`, `TYPECHECK:`, `TESTS:`, `PRODUCTION BUILD:`, `DEPLOYMENT:`, ``,
      `BLOCKERS:`, ``, `TOOL'S FINAL REPORT:`, ``,
    );
  } else {
    rows.push(`RESULT / EVIDENCE:`, ``, `BLOCKERS:`, ``, `NOTES:`, ``);
  }
  return rows.join("\n");
}

// ---- Public API --------------------------------------------------------
export function generatePackage(
  e: Engine,
  a: A,
  stage: BuildStage,
  depth: Depth,
  destination: Destination,
): ExecutionPackage {
  const sc = scope(e, a);
  const mainPrompt =
    destination === "claude-code" || (destination === "developer" && e.technical)
      ? claudeCodePrompt(e, a, stage, depth)
      : nonTechPrompt(e, a, destination);
  return {
    createdAt: new Date().toISOString(),
    depth,
    destination,
    understanding: understanding(e, a),
    direction: direction(e, a, stage),
    objective: objective(e, a),
    inScope: sc.inScope,
    outOfScope: sc.outOfScope,
    design: design(e, a),
    architecture: architecture(e, a),
    sequence: sequence(),
    mainPrompt,
    verify: verify(e, a),
    returnTemplate: returnTemplate(a, e, destination),
    nextCycleNote: `After you run this and return with results, StepInTheRing will inspect what actually happened and recommend Fix, Refine, Expand, or Launch — then generate the next focused package. Strong products are built in passes, not one giant request.`,
    specialties: generateSpecialties(e.id, e.specialties, a, stage),
  };
}

// Flatten a package into one copyable document.
export function packageToText(e: Engine, a: A, p: ExecutionPackage): string {
  const parts = [
    `# ${val(a, "name") || "Project"} — ${e.name} execution package`,
    `\n## 1. Engine Understanding\n${p.understanding}`,
    `\n## 2. Recommended Direction\n${p.direction}`,
    `\n## 3. Current Objective\n${p.objective}`,
    `\n## 4. In Scope\n${bullets(p.inScope)}`,
    `\n## 5. Out of Scope\n${bullets(p.outOfScope)}`,
    p.design ? `\n## 6. Design Direction\n${p.design}` : "",
    `\n## 7. Architecture\n${p.architecture}`,
    `\n## 8. Execution Sequence\n${p.sequence}`,
    `\n## 9. The Prompt (${DESTINATION_LABELS[p.destination]})\n${p.mainPrompt}`,
    `\n## 10. Verify (definition of done)\n${p.verify}`,
    `\n## 11. Return With Results\n${p.returnTemplate}`,
    `\n## 12. Next Cycle\n${p.nextCycleNote}`,
  ];
  return parts.filter(Boolean).join("\n");
}
