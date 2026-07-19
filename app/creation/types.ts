// The canonical creation record — ONE creation that survives every move:
// iDontCry → planner → engine → another engine → prompt → export → resume.
//
// The record stores what the creator GAVE us (their words, their answers,
// their limits). Everything derived — classification, interpretation, plans,
// prompts — is recomputed from it deterministically, so a record can travel
// between engines without any engine's opinion being baked in as fact.

export const CREATION_SCHEMA_VERSION = 1 as const;

/** What kind of thing is being made. Not everything is software. */
export type CreationType =
  | "app"
  | "site"
  | "tool"
  | "list"
  | "game"
  | "physical-product"
  | "digital-product"
  | "printable"
  | "design"
  | "music"
  | "story"
  | "content"
  | "service"
  | "event-plan"
  | "unknown";

export const CREATION_TYPE_LABEL: Record<CreationType, string> = {
  app: "An app",
  site: "A site",
  tool: "A tool",
  list: "A list app",
  game: "A game",
  "physical-product": "A physical product",
  "digital-product": "A digital product",
  printable: "A printable",
  design: "A design",
  music: "Music",
  story: "A story",
  content: "A piece of content",
  service: "A service",
  "event-plan": "A real-world plan",
  unknown: "An idea",
};

/** Does version one actually need software? A recommendation, never a refusal. */
export type SoftwareVerdict = "central" | "helpful" | "optional" | "test-first";

export interface SoftwareCall {
  verdict: SoftwareVerdict;
  reason: string;
  /** The smallest credible non-software test, when one exists. */
  nonSoftwareTest?: string;
  /** The creator explicitly asked for software — honour it, but show the test. */
  explicitSoftwareRequest: boolean;
}

export const SOFTWARE_VERDICT_LABEL: Record<SoftwareVerdict, string> = {
  central: "Software is the product",
  helpful: "Software helps, but the content is the product",
  optional: "Software is optional here",
  "test-first": "Worth testing without software first",
};

export type CreationSource = "stepinthering" | "idontcry";
export type SourceFlow =
  | "planner"
  | "engine-room"
  | "dream-lab"
  | "game-lab"
  | "dream-shop"
  | "import";

export interface EngineVisit {
  engineId: string;
  at: string;
  why: string;
}

export interface CreationRecordV1 {
  schemaVersion: typeof CREATION_SCHEMA_VERSION;
  creationId: string;
  createdAt: string;
  updatedAt: string;
  source: CreationSource;
  sourceFlow: SourceFlow;
  /** Exactly what the creator said, never rewritten. */
  originalIdea: string;
  originalTitle?: string;
  /** Follow-up and intake answers, merged across engines. Never re-asked. */
  answers: Record<string, string>;
  /** Structured facts a handoff carried in (mode, vibe, player, goal…). */
  facts: Record<string, string>;
  requirements: string[];
  exclusions: string[];
  constraints: string[];
  /** The engine currently holding the creation, if any. */
  engineId?: string;
  /** Every engine this creation has moved through, in order. */
  journey: EngineVisit[];
}

/* ── Cross-domain handoff (iDontCry → StepInTheRing) ─────────────────────
   Carried in a `cr` query parameter as URI-encoded JSON. Versioned,
   validated on arrival, size-guarded on departure. The legacy `?idea=`
   parameter keeps working — this contract adds to it, never replaces it. */

export interface HandoffPayloadV1 {
  v: 1;
  source: "idontcry";
  flow: "dream-lab" | "game-lab" | "dream-shop";
  /** The creator's exact words. Required — a handoff without them is invalid. */
  idea: string;
  title?: string;
  typeHint?: CreationType;
  engineHint?: string;
  facts?: Record<string, string>;
  exclusions?: string[];
}

const CREATION_TYPES = new Set<string>([
  "app", "site", "tool", "list", "game", "physical-product", "digital-product",
  "printable", "design", "music", "story", "content", "service", "event-plan", "unknown",
]);
const HANDOFF_FLOWS = new Set(["dream-lab", "game-lab", "dream-shop"]);

const isStr = (v: unknown): v is string => typeof v === "string";

function cleanStringMap(v: unknown): Record<string, string> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (isStr(val) && val.trim() && k.length <= 40 && val.length <= 600) out[k] = val;
  }
  return out;
}

function cleanStringList(v: unknown, max = 12): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter(isStr).map((s) => s.trim()).filter((s) => s && s.length <= 300).slice(0, max);
}

/** Strict parse of a handoff payload. Anything malformed → null, never a crash. */
export function parseHandoffPayload(v: unknown): HandoffPayloadV1 | null {
  if (!v || typeof v !== "object") return null;
  const p = v as Record<string, unknown>;
  if (p.v !== 1) return null;
  if (p.source !== "idontcry") return null;
  if (!isStr(p.flow) || !HANDOFF_FLOWS.has(p.flow)) return null;
  if (!isStr(p.idea) || !p.idea.trim() || p.idea.length > 2000) return null;
  return {
    v: 1,
    source: "idontcry",
    flow: p.flow as HandoffPayloadV1["flow"],
    idea: p.idea.trim(),
    title: isStr(p.title) && p.title.trim() ? p.title.trim().slice(0, 80) : undefined,
    typeHint: isStr(p.typeHint) && CREATION_TYPES.has(p.typeHint) ? (p.typeHint as CreationType) : undefined,
    engineHint: isStr(p.engineHint) && p.engineHint.length <= 30 ? p.engineHint : undefined,
    facts: cleanStringMap(p.facts),
    exclusions: cleanStringList(p.exclusions),
  };
}

/** Strict parse of a stored/imported creation record. Malformed → null. */
export function parseCreationRecord(v: unknown): CreationRecordV1 | null {
  if (!v || typeof v !== "object") return null;
  const p = v as Record<string, unknown>;
  if (p.schemaVersion !== CREATION_SCHEMA_VERSION) return null;
  if (!isStr(p.creationId) || !isStr(p.originalIdea) || !p.originalIdea.trim()) return null;
  const source: CreationSource = p.source === "idontcry" ? "idontcry" : "stepinthering";
  const flows: SourceFlow[] = ["planner", "engine-room", "dream-lab", "game-lab", "dream-shop", "import"];
  const sourceFlow = flows.includes(p.sourceFlow as SourceFlow) ? (p.sourceFlow as SourceFlow) : "import";
  const journey: EngineVisit[] = Array.isArray(p.journey)
    ? (p.journey as unknown[])
        .filter((j): j is Record<string, unknown> => !!j && typeof j === "object")
        .filter((j) => isStr(j.engineId))
        .map((j) => ({
          engineId: j.engineId as string,
          at: isStr(j.at) ? j.at : new Date().toISOString(),
          why: isStr(j.why) ? j.why : "",
        }))
    : [];
  return {
    schemaVersion: CREATION_SCHEMA_VERSION,
    creationId: p.creationId,
    createdAt: isStr(p.createdAt) ? p.createdAt : new Date().toISOString(),
    updatedAt: isStr(p.updatedAt) ? p.updatedAt : new Date().toISOString(),
    source,
    sourceFlow,
    originalIdea: p.originalIdea.trim().slice(0, 4000),
    originalTitle: isStr(p.originalTitle) && p.originalTitle.trim() ? p.originalTitle.trim().slice(0, 80) : undefined,
    answers: cleanStringMap(p.answers),
    facts: cleanStringMap(p.facts),
    requirements: cleanStringList(p.requirements),
    exclusions: cleanStringList(p.exclusions),
    constraints: cleanStringList(p.constraints),
    engineId: isStr(p.engineId) ? p.engineId : undefined,
    journey,
  };
}
