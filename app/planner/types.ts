// The interpretation model — what StepInTheRing understood from a person's
// rough description. Everything downstream (the plan page, the builder prompt,
// the engine handoff) reads THIS, never the raw answers.
//
// The old planner had no layer here: buildPlan() copied seven form fields onto
// cards and joined them with newlines. Garbage in, same garbage on a card.

export type BuildType = "new" | "add" | "improve" | "fix" | "sell" | "explore";

export const BUILD_TYPE_LABEL: Record<BuildType, string> = {
  new: "Start something new",
  add: "Add to an existing product",
  improve: "Improve an existing product",
  fix: "Fix a problem",
  sell: "Package something to sell",
  explore: "Explore an early idea",
};

/**
 * How we know something.
 *  stated   — the person said it
 *  inferred — safe to assume for version one; we show the assumption
 *  confirm  — we need them to confirm before it drives the build
 */
export type Confidence = "stated" | "inferred" | "confirm";

export type Claim<T> = {
  value: T;
  confidence: Confidence;
  /** Why we believe it — shown on the "what we decided" list for inferences. */
  source?: string;
};

export const stated = <T>(value: T, source?: string): Claim<T> => ({ value, confidence: "stated", source });
export const inferred = <T>(value: T, source: string): Claim<T> => ({ value, confidence: "inferred", source });

/** What the builder is allowed to do. Never a product feature. */
export type Permissions = {
  build: boolean;
  commit: boolean;
  push: boolean;
  deploy: boolean;
};

export const NO_PERMISSIONS: Permissions = { build: false, commit: false, push: false, deploy: false };

/** The kind of thing being made. Drives version-one behaviour and exclusions. */
export type Shape = "game" | "site" | "tool" | "list" | "product" | "content" | "unknown";

export type OpenQuestion = {
  key: string;
  question: string;
  help: string;
  placeholder: string;
};

export type Interpretation = {
  /** Raw text is always kept — corrections re-run interpretation, never a form. */
  raw: string;
  buildType: Claim<BuildType>;
  title: Claim<string>;
  /** Plain-language summary. Never the whole first answer. */
  summary: string;
  shape: Shape;
  /** An existing product/repo/site this belongs to. Not an audience. */
  destination: Claim<string> | null;
  audience: Claim<string> | null;
  /** What's broken / missing for that person today. */
  need: Claim<string> | null;
  /** What better looks like the first time it works. */
  desiredResult: Claim<string> | null;
  versionOne: Claim<string>[];
  assets: Claim<string>[];
  constraints: string[];
  /** Working systems the builder must not break. */
  preserve: string[];
  exclusions: Claim<string>[];
  permissions: Permissions;
  completionAction: string;
  assumptions: string[];
  openQuestions: OpenQuestion[];
};

export const isInferred = <T>(c: Claim<T> | null): boolean => !!c && c.confidence !== "stated";
