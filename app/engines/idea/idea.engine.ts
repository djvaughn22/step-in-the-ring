/**
 * Idea Engine — logic.
 *
 * Real output: ONE decision record — the version of the idea to try, who it's
 * for, the simplest first version, the tools, a dated first action, how to
 * tell if it worked, and the next engine — handed straight into that engine.
 *
 * The engine does the work: it lays out three genuinely different ways to
 * try the idea (cheapest test → smallest real version → the bigger version),
 * recommends one with a reason, and fills the decision in. The visitor picks
 * and can edit; they never score, rewrite, or fill in blanks.
 *
 * Deterministic, no external APIs.
 */

import { readProduct } from "../artifacts/product";
import { addDays, asThing, fmtDate, has, isUnknown, lowerFirst, plural, stripEnd, upperFirst } from "../artifacts/text";

// ---- Candidate ideas ----
export interface IdeaCandidate {
  id: string;
  text: string;
  origin: "yours" | "angle"; // typed by the user vs. generated variation
  scores?: Record<string, number>; // factorId → 1–5
}

// ---- Decision record (the real output) ----
export interface IdeaDecision {
  /** The idea as the person typed it. Saves from before 2026-10-28 held the
   *  chosen version's sentence here instead. */
  description: string;
  /** What to do with it: the chosen version. */
  approach?: string;
  intendedUser: string;
  problem: string;
  simplestFirstVersion: string;
  requiredTools: string;
  nextEngineId: string;
  firstAction: string;
  decidedAt: string;
  /** How to tell, by a date, whether the first version worked. Optional so
   *  decisions saved before it existed still load. */
  successTest?: string;
  /** Which version was picked and why it was recommended (or not). */
  whyThis?: string;
}

// Where a decided idea can go next, and how its intake gets prefilled.
export interface HandoffTarget {
  engineId: string;
  label: string;
  when: string; // plain guidance for choosing this target
}

export const HANDOFF_TARGETS: HandoffTarget[] = [
  { engineId: "build", label: "Build Engine", when: "It's an app, site, or tool — go build the first working version." },
  { engineId: "design-shop", label: "Design Shop Engine", when: "It's a product to design and sell — cards, printables, mugs, shirts." },
  { engineId: "sell", label: "Sell Engine", when: "The thing exists or is simple — package it as a real offer." },
  { engineId: "plan", label: "Plan Engine", when: "It's a real-world project, not software — organize the execution." },
];

/** Prefill the next engine's intake from the decision. Keys match each engine's intake in engines.ts. */
export function handoffAnswers(decision: IdeaDecision, projectName: string): Record<string, string> {
  const common = { name: projectName };
  switch (decision.nextEngineId) {
    case "build":
      // The Build Engine reads roles and actions out of one sentence, so the
      // original idea goes in whole — not the version's summary of it.
      return {
        ...common,
        purpose: decision.description,
        exists: "Nothing yet.",
      };
    case "design-shop":
      return {
        ...common,
        idea: decision.description,
        customer: decision.intendedUser,
        spark: decision.problem,
      };
    case "sell":
      return {
        ...common,
        product: decision.description,
        customer: decision.intendedUser,
        problem: decision.problem,
      };
    case "plan":
      return {
        ...common,
        outcome: decision.description,
        situation: `First version: ${decision.simplestFirstVersion}`,
      };
    default:
      return { ...common, rough: decision.description, who: decision.intendedUser };
  }
}

// ---- Versions: the engine's own work ----

export type IdeaShape = "software" | "product" | "service" | "event" | "content" | "general";

export interface IdeaVersion {
  id: "test" | "small" | "full";
  label: string;
  /** What this version IS, concretely, for this idea. */
  what: string;
  firstVersion: string;
  tools: string;
  effort: string;
  /** What success looks like, measurable. */
  test: string;
  nextEngineId: string;
}

export function shapeOf(raw: string): IdeaShape {
  // "board game" is not a software board.
  const text = raw.replace(/board[- ]games?/gi, "tabletop game");
  if (has(text, /\b(app|website|site|web page|tool|tracker|board|dashboard|bot|extension|software|platform|calculator|planner app|online)s?\b/)) return "software";
  if (has(text, /\b(party|event|meetup|club|class|workshop|camp|tournament|league|fundraiser|night|gathering|group)s?\b/)) return "event";
  if (has(text, /\b(book|blog|podcast|video|youtube|channel|newsletter|course|comic|story|series|zine)s?\b/)) return "content";
  if (has(text, /\b(service|business|tutor|lesson|coach|clean|walk|sit|mow|repair|cater|photograph|help people|for hire)/)) return "service";
  if (has(text, /\b(sell|shirt|mug|sticker|candle|print|printable|card|jewel|bake|cookie|soap|kit|product|shop|etsy|craft|handmade)/)) return "product";
  return "general";
}

const plain = (s: string) => lowerFirst(stripEnd(s));

export function ideaVersions(seed: string, who: string): IdeaVersion[] {
  const idea = plain(seed);
  const people = isUnknown(who) ? "" : plain(who);
  const forWho = people ? ` with ${people}` : "";
  const shape = shapeOf(seed);
  const thing = asThing(seed);
  if (shape === "software") {
    const p = readProduct(seed);
    const entities = p.entity && p.entity !== "item" ? plural(p.entity) : "it";
    const name = p.product && p.product !== "the app" ? p.product : idea;
    const roles = p.roles.length ? p.roles.map((r) => plural(r)).join(" and ") : people || "the people it's for";
    return [
      { id: "test", label: "Try it on paper first", what: `Run the ${name.replace(/^(a|an|the)\s+/, "")} for one week with no software: a printed sheet or a shared spreadsheet that ${roles} actually use.`, firstVersion: `A one-page printable (or shared spreadsheet) with the ${entities} for this week, put where everyone sees it.`, tools: "Paper, or a shared Google Sheet.", effort: "an hour", test: `By the end of the week, ${roles} used it on at least 5 of 7 days without being reminded.`, nextEngineId: "plan" },
      { id: "small", label: "Build the smallest working version", what: `A simple web page that does only this: ${idea}. One device, no accounts.`, firstVersion: `The ${name.replace(/^(a|an|the)\s+/, "")}, doing only what the sentence says — on one shared device, saved in the browser, nothing else.`, tools: "A coding assistant (Claude Code, Cursor or ChatGPT) and a browser. No accounts or hosting needed to start.", effort: "a weekend", test: `${upperFirst(roles)} use it for a week and you never have to explain it twice.`, nextEngineId: "build" },
      { id: "full", label: "The full version", what: `The ${name.replace(/^(a|an|the)\s+/, "")} on everyone's own phone, kept in sync, with reminders.`, firstVersion: "Everything in the smallest version, plus a small database so every phone sees the same thing.", tools: "A coding assistant, a hosted database, and web hosting (both have no-cost starter tiers).", effort: "2–3 weeks", test: "Each person opens it on their own phone at least 3 times a week.", nextEngineId: "build" },
    ];
  }
  if (shape === "product") {
    return [
      { id: "test", label: "Pre-sell before making many", what: `Make one sample of ${thing} and ask 10 likely buyers if they'd buy it at a set price.`, firstVersion: "One finished sample, photographed well.", tools: "Your phone camera and the materials for one.", effort: "a day or two", test: "3 of 10 people say yes at your price, and at least 1 actually pays.", nextEngineId: "sell" },
      { id: "small", label: "A small first batch", what: `Make a first batch (5–10) of ${thing} and list them in one place.`, firstVersion: "A batch of 5–10 and one listing with clear photos and price.", tools: "Materials for the batch and an Etsy or market-table setup.", effort: "a week", test: "Half the batch sells within three weeks.", nextEngineId: "design-shop" },
      { id: "full", label: "A small line", what: `Three variations of ${thing} under one name, with a simple shop page.`, firstVersion: "Three designs, a shop page, and a way to reorder supplies.", tools: "A shop page (Etsy or similar) and a supplier.", effort: "a month", test: "Steady weekly sales for a month.", nextEngineId: "design-shop" },
    ];
  }
  if (shape === "service") {
    return [
      { id: "test", label: "Do it once for real", what: `Offer ${thing} to 3 people you know${forWho} this week, at an introductory price, and ask for honest feedback.`, firstVersion: "One clear sentence of what you do, for whom, and the price — sent as a message.", tools: "Your phone and a payment app.", effort: "a few hours", test: "2 of 3 say they'd book again or recommend you.", nextEngineId: "sell" },
      { id: "small", label: "A simple bookable offer", what: `A one-page description of ${thing} with a way to book, shared locally.`, firstVersion: "A one-page offer with price, area, and a booking form.", tools: "A form tool and a payment app.", effort: "a weekend", test: "5 bookings in the first month.", nextEngineId: "sell" },
      { id: "full", label: "A steady business", what: `${upperFirst(idea)} with regular clients, a schedule, and repeat bookings.`, firstVersion: "Packages, a calendar, and a referral ask after each job.", tools: "Scheduling and invoicing tools.", effort: "a few months", test: "Half your clients book again within a month.", nextEngineId: "plan" },
    ];
  }
  if (shape === "event") {
    return [
      { id: "test", label: "A small pilot", what: `A small first run of ${thing} with 6–10 people${forWho}, at a place you already have access to.`, firstVersion: "One date, one place, a simple invite to 10 people.", tools: "A group text and a sign-up list.", effort: "two weeks of evenings", test: "At least 6 show up and most ask when the next one is.", nextEngineId: "plan" },
      { id: "small", label: "A proper first event", what: `${upperFirst(idea)} for 20–40 people with a few helpers.`, firstVersion: "A date, a venue, three helpers, and invitations out a month ahead.", tools: "Sign-up form, a shared checklist.", effort: "a month", test: "Turnout hits your number and costs stay in budget.", nextEngineId: "plan" },
      { id: "full", label: "A recurring thing", what: `${upperFirst(idea)} on a regular schedule, with a core team.`, firstVersion: "A season of dates and a team that shares the work.", tools: "A group channel and a calendar.", effort: "a season", test: "Regulars return without being chased.", nextEngineId: "plan" },
    ];
  }
  if (shape === "content") {
    return [
      { id: "test", label: "Make one piece", what: `One finished piece of ${thing}, shared with 10 people${forWho} who'd care.`, firstVersion: "One complete piece — not an outline — shared by link.", tools: "Whatever you'd make it with today.", effort: "a weekend", test: "At least 3 people respond on their own or ask for more.", nextEngineId: "plan" },
      { id: "small", label: "A short series", what: `Three pieces of ${thing}, released a week apart.`, firstVersion: "Three pieces and a place people can follow along.", tools: "One publishing place.", effort: "three weeks", test: "People who saw the first come back for the third.", nextEngineId: "plan" },
      { id: "full", label: "A regular schedule", what: `${upperFirst(idea)} on a steady schedule with a growing audience.`, firstVersion: "A schedule you can keep for three months.", tools: "A publishing place and a simple calendar.", effort: "three months", test: "Audience grows month over month.", nextEngineId: "plan" },
    ];
  }
  return [
    { id: "test", label: "Test it with five people", what: `Describe ${thing} to five people${forWho} it's meant for and ask whether they'd use it, and what they'd change.`, firstVersion: "A one-paragraph description and five conversations.", tools: "Your phone.", effort: "a few days", test: "3 of 5 say they'd use it and tell you something specific.", nextEngineId: "plan" },
    { id: "small", label: "The smallest real version", what: `The smallest version of ${thing} that someone can actually use.`, firstVersion: "One thing that works for one person, start to finish.", tools: "Whatever you already have.", effort: "a weekend", test: "One real person uses it twice without your help.", nextEngineId: "plan" },
    { id: "full", label: "The full version", what: `${upperFirst(idea)}, complete.`, firstVersion: "Everything you picture, built in stages.", tools: "Depends on what it becomes.", effort: "a few months", test: "It's used regularly by the people it's for.", nextEngineId: "plan" },
  ];
}

/** Which version to start with, and why — never the biggest by default. */
export function recommendVersion(seed: string, constraint: string): { id: IdeaVersion["id"]; why: string } {
  const c = isUnknown(constraint) ? "" : constraint.toLowerCase();
  const validated = has(seed, /people (already )?(ask|want|keep asking)|already (sell|have customers|have users)|waitlist|pre-?orders?/);
  if (/week|weekend|tonight|today|no time|busy|no money|budget|cheap|nothing to spend/.test(c)) {
    return { id: "test", why: `your limit (${stripEnd(constraint)}) points to the cheapest real test first` };
  }
  if (validated) return { id: "small", why: "people already want it, so the cheapest test is behind you — build the smallest real version" };
  if (shapeOf(seed) === "software") {
    return { id: "small", why: "the smallest working version is a weekend with a coding assistant, and it answers the real question — will people use it — faster than talking about it" };
  }
  return { id: "test", why: "it costs almost nothing and tells you whether the bigger versions are worth the effort" };
}

/** The finished decision for a picked version — nothing left blank. */
export function decisionFor(v: IdeaVersion, seed: string, who: string, problem: string, recommended: { id: string; why: string }, now: Date = new Date()): IdeaDecision {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const by = fmtDate(addDays(today, v.effort.includes("hour") || v.effort.includes("day") ? 2 : 7));
  const checkBy = fmtDate(addDays(today, v.effort.includes("month") ? 30 : 9));
  const firstStep: Record<IdeaVersion["id"], string> = {
    test: `${by}: make ${lowerFirst(v.firstVersion.replace(/\.$/, ""))}. Then start the test.`,
    small: v.nextEngineId === "build" ? `${by}: open the Build Engine (button below) and paste the build prompt it gives you into your coding assistant.` : `${by}: ${v.firstVersion.replace(/\.$/, "")}.`,
    full: `${by}: write down the smallest piece of this you could finish first, and start it.`,
  };
  return {
    description: stripEnd(seed) + ".",
    approach: v.what,
    intendedUser: isUnknown(who) ? "" : stripEnd(who),
    problem: isUnknown(problem) ? "" : stripEnd(problem),
    simplestFirstVersion: v.firstVersion,
    requiredTools: v.tools,
    nextEngineId: v.nextEngineId,
    firstAction: firstStep[v.id],
    successTest: `${v.test} Check on ${checkBy}.`,
    whyThis: v.id === recommended.id ? `Recommended: ${recommended.why}.` : `You picked this over the recommended version (${recommended.why}).`,
    decidedAt: now.toISOString(),
  };
}

export function decisionToMarkdown(d: IdeaDecision, title: string, versionLabel: string): string {
  const target = HANDOFF_TARGETS.find((t) => t.engineId === d.nextEngineId)?.label ?? d.nextEngineId;
  return [
    `# ${title}`,
    `_Idea decision — ${versionLabel}_`,
    "",
    d.whyThis ?? "",
    "",
    `**The idea:** ${d.description}`,
    d.approach ? `**What to do:** ${d.approach}` : "",
    d.intendedUser ? `**For:** ${d.intendedUser}` : "",
    d.problem ? `**Why it matters:** ${d.problem}` : "",
    `**First version:** ${d.simplestFirstVersion}`,
    `**Tools:** ${d.requiredTools}`,
    `**First action:** ${d.firstAction}`,
    d.successTest ? `**How you'll know:** ${d.successTest}` : "",
    `**Next:** ${target}`,
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n").trim() + "\n";
}
