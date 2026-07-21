// The evidence ledger — how a project proves what it claims.
//
// The whole point: "planned", "generated", "mocked", "locally working",
// "test passing", "deployed" and "verified live" are DIFFERENT statements,
// and the interface must never blur them. A claim earns a level only from
// evidence entries that actually support that level.

export type EvidenceType =
  | "command"            // a command that was run
  | "unit-test"
  | "integration-test"
  | "build"
  | "persistence-check"  // save → reload → still there
  | "manual-check"       // a human drove the flow
  | "http-check"         // a URL was requested and the response inspected
  | "production-check"   // the live production surface was inspected
  | "sandbox-integration"// a real external sandbox/production boundary, not a mock
  | "screenshot"
  | "other";

export type EvidenceResult = "pass" | "fail" | "blocked" | "not-applicable" | "unverified";

export type EvidenceEnvironment = "local" | "ci" | "preview" | "production" | "sandbox";

export type EvidenceProducer = "owner" | "claude" | "automated-check" | "system";

export interface EvidenceEntry {
  id: string;
  /** The claim being tested — e.g. "ratings persist across a reload". */
  claim: string;
  type: EvidenceType;
  /** The command, test name, URL, or manual check that produced this. */
  ran: string;
  /** Safe result summary. Never secrets, tokens, or private data. */
  summary: string;
  result: EvidenceResult;
  at: string;
  environment: EvidenceEnvironment;
  /** The acceptance criterion this speaks to, when there is one. */
  criterion?: string;
  /** A safe artifact reference (file name, screenshot label) — never a secret. */
  artifact?: string;
  producedBy: EvidenceProducer;
  notes?: string;
}

export const EVIDENCE_TYPE_LABEL: Record<EvidenceType, string> = {
  command: "Command run",
  "unit-test": "Unit test",
  "integration-test": "Integration test",
  build: "Build",
  "persistence-check": "Persistence check (save → reload)",
  "manual-check": "Manual check",
  "http-check": "HTTP check",
  "production-check": "Production check",
  "sandbox-integration": "Real integration boundary (sandbox/production)",
  screenshot: "Screenshot",
  other: "Other",
};

export const EVIDENCE_RESULT_LABEL: Record<EvidenceResult, string> = {
  pass: "Pass",
  fail: "Fail",
  blocked: "Blocked",
  "not-applicable": "Not applicable",
  unverified: "Unverified",
};

/* ── The claim ladder ─────────────────────────────────────────────────── */

/**
 * Maturity levels a claim can hold, weakest to strongest. The UI must show
 * the level the evidence supports — never a stronger one.
 */
export type ClaimLevel =
  | "planned"          // exists only as intent
  | "generated"        // an artifact exists; nothing shows it works
  | "mocked"           // works against fake data or a fake boundary
  | "locally-working"  // a human or check drove it locally
  | "test-passing"     // automated tests pass
  | "deployed"         // it shipped somewhere real
  | "verified-live";   // the live production surface was inspected and passed

export const CLAIM_LEVEL_LABEL: Record<ClaimLevel, string> = {
  planned: "Planned — nothing built yet",
  generated: "Generated — exists, unproven",
  mocked: "Mocked — works against fake data only",
  "locally-working": "Working locally",
  "test-passing": "Tests passing",
  deployed: "Deployed — live, not yet verified",
  "verified-live": "Verified live",
};

const LEVEL_ORDER: ClaimLevel[] = [
  "planned", "generated", "mocked", "locally-working",
  "test-passing", "deployed", "verified-live",
];

export const levelRank = (l: ClaimLevel) => LEVEL_ORDER.indexOf(l);

/** What level a single passing evidence entry supports. Nothing else counts. */
function levelOf(e: EvidenceEntry): ClaimLevel | null {
  if (e.result !== "pass") return null;
  if (e.type === "production-check" && e.environment === "production") return "verified-live";
  if (e.environment === "production") return "deployed";
  if (e.type === "unit-test" || e.type === "integration-test") return "test-passing";
  if (e.type === "sandbox-integration" && e.environment === "sandbox") {
    return "test-passing";
  }
  if (e.type === "persistence-check" || e.type === "manual-check" || e.type === "http-check"
    || e.type === "build" || e.type === "command" || e.type === "production-check") {
    // A "production check" outside production is just a check somewhere else.
    return "locally-working";
  }
  if (e.type === "screenshot") return "generated";
  return "generated";
}

/**
 * The strongest level a set of entries supports. No entries → planned.
 * A failing entry newer than a pass overturns that pass — a red check is
 * not erased by an older green one.
 */
export function ledgerLevel(relevant: EvidenceEntry[]): ClaimLevel {
  if (!relevant.length) return "planned";
  let strongest: ClaimLevel = "generated";
  for (const e of relevant) {
    const lvl = levelOf(e);
    if (lvl && levelRank(lvl) > levelRank(strongest)) {
      const overturned = relevant.some(
        (f) => f.result === "fail" && f.at > e.at,
      );
      if (!overturned) strongest = lvl;
    }
  }
  return strongest;
}

/** The strongest level the ledger supports for one named claim. */
export function claimLevel(entries: EvidenceEntry[], claim: string): ClaimLevel {
  return ledgerLevel(entries.filter((e) => e.claim === claim));
}

/* ── Specific claims with hard requirements ───────────────────────────── */

/** "Verified live" requires a passing production check. Nothing weaker. */
export function canClaimVerifiedLive(entries: EvidenceEntry[]): boolean {
  return entries.some(
    (e) => e.type === "production-check" && e.environment === "production" && e.result === "pass",
  );
}

/** "Data persists" requires a passing save → reload check. */
export function canClaimPersistence(entries: EvidenceEntry[]): boolean {
  return entries.some((e) => e.type === "persistence-check" && e.result === "pass");
}

/**
 * "The integration works" requires a real boundary — a sandbox or production
 * result. A mocked response proves the mock, not the integration.
 */
export function canClaimIntegration(entries: EvidenceEntry[]): boolean {
  return entries.some(
    (e) =>
      e.type === "sandbox-integration" &&
      (e.environment === "sandbox" || e.environment === "production") &&
      e.result === "pass",
  );
}

/* ── Construction + safe parsing ──────────────────────────────────────── */

export const newEvidenceId = () =>
  `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const TYPES = new Set<string>(Object.keys(EVIDENCE_TYPE_LABEL));
const RESULTS = new Set<string>(Object.keys(EVIDENCE_RESULT_LABEL));
const ENVS = new Set<string>(["local", "ci", "preview", "production", "sandbox"]);
const PRODUCERS = new Set<string>(["owner", "claude", "automated-check", "system"]);

const isStr = (v: unknown): v is string => typeof v === "string";

/** Malformed entries are dropped, never allowed to crash a saved project. */
export function parseEvidenceEntry(v: unknown): EvidenceEntry | null {
  if (!v || typeof v !== "object") return null;
  const p = v as Record<string, unknown>;
  if (!isStr(p.claim) || !p.claim.trim()) return null;
  if (!isStr(p.type) || !TYPES.has(p.type)) return null;
  if (!isStr(p.result) || !RESULTS.has(p.result)) return null;
  return {
    id: isStr(p.id) && p.id ? p.id : newEvidenceId(),
    claim: p.claim.trim().slice(0, 300),
    type: p.type as EvidenceType,
    ran: isStr(p.ran) ? p.ran.slice(0, 400) : "",
    summary: isStr(p.summary) ? p.summary.slice(0, 600) : "",
    result: p.result as EvidenceResult,
    at: isStr(p.at) ? p.at : new Date().toISOString(),
    environment: isStr(p.environment) && ENVS.has(p.environment)
      ? (p.environment as EvidenceEnvironment)
      : "local",
    criterion: isStr(p.criterion) && p.criterion.trim() ? p.criterion.slice(0, 300) : undefined,
    artifact: isStr(p.artifact) && p.artifact.trim() ? p.artifact.slice(0, 200) : undefined,
    producedBy: isStr(p.producedBy) && PRODUCERS.has(p.producedBy)
      ? (p.producedBy as EvidenceProducer)
      : "owner",
    notes: isStr(p.notes) && p.notes.trim() ? p.notes.slice(0, 600) : undefined,
  };
}
