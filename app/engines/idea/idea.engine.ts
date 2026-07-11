/**
 * Idea Engine — logic.
 *
 * Real output: ONE selected idea, saved as a decision record with a clear
 * description, intended user, problem, simplest first version, required
 * tools, next engine, and first action — then handed directly into that
 * engine's intake.
 *
 * Deterministic, no external APIs. The user's own ideas come first; the
 * generator only adds a few distinct angles on request. Never 100 ideas.
 */

// ---- Candidate ideas ----
export interface IdeaCandidate {
  id: string;
  text: string;
  origin: "yours" | "angle"; // typed by the user vs. generated variation
  scores?: Record<string, number>; // factorId → 1–5
}

// ---- Comparison factors (transparent, equal weight) ----
export interface IdeaFactor {
  id: string;
  label: string;
  question: string;
}

export const IDEA_FACTORS: IdeaFactor[] = [
  { id: "excitement", label: "Excitement", question: "Will you still care about this in a month?" },
  { id: "problem", label: "Problem clarity", question: "Does it solve a real problem you can name in one sentence?" },
  { id: "firstVersion", label: "First-version ease", question: "Could a first version exist within a week using free tools?" },
  { id: "audience", label: "Audience access", question: "Can you personally reach the people it's for?" },
  { id: "fit", label: "Tool & skill fit", question: "Does it fit tools and skills you have or can get free?" },
];

export function totalScore(c: IdeaCandidate): number {
  if (!c.scores) return 0;
  return IDEA_FACTORS.reduce((sum, f) => sum + (c.scores?.[f.id] ?? 0), 0);
}

export function isFullyScored(c: IdeaCandidate): boolean {
  return IDEA_FACTORS.every((f) => typeof c.scores?.[f.id] === "number");
}

/** Rank: fully-scored ideas by total (desc); unscored sink to the bottom. Stable for ties. */
export function rankCandidates(candidates: IdeaCandidate[]): IdeaCandidate[] {
  return [...candidates].sort((a, b) => {
    const as = isFullyScored(a) ? totalScore(a) : -1;
    const bs = isFullyScored(b) ? totalScore(b) : -1;
    return bs - as;
  });
}

/**
 * Generate a few distinct angles on the user's seed idea. Template-based and
 * labeled as generated — these are prompts for the user's judgment, not
 * pretend market insight.
 */
export function generateAngles(seed: string, who: string): IdeaCandidate[] {
  const base = seed.trim();
  const audience = who.trim() || "the same people";
  const variants = [
    { id: "angle-smaller", text: `${base} — but the smallest version: one feature, one page, or one product, finished this week.` },
    { id: "angle-digital", text: `${base} — as a digital download or online tool instead of a physical thing or service.` },
    { id: "angle-narrow", text: `${base} — for a much narrower group: the specific slice of ${audience} you know personally.` },
    { id: "angle-service", text: `${base} — done for people as a simple service first, before building any product.` },
  ];
  return variants.map((v) => ({ id: v.id, text: v.text, origin: "angle" as const }));
}

// ---- Decision record (the real output) ----
export interface IdeaDecision {
  description: string;
  intendedUser: string;
  problem: string;
  simplestFirstVersion: string;
  requiredTools: string;
  nextEngineId: string;
  firstAction: string;
  decidedAt: string;
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
      return {
        ...common,
        purpose: decision.description,
        who: decision.intendedUser,
        core: decision.simplestFirstVersion,
        stack: decision.requiredTools,
        exists: "Nothing yet — this came out of the Idea Engine.",
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
        exists: decision.simplestFirstVersion,
      };
    case "plan":
      return {
        ...common,
        outcome: decision.description,
        situation: `Starting point: ${decision.simplestFirstVersion}. Tools: ${decision.requiredTools || "none yet"}.`,
      };
    default:
      return { ...common, rough: decision.description, who: decision.intendedUser };
  }
}
