// ─────────────────────────────────────────────────────────────────────────────
// THE BUILD — vNext's one persistent object.
//
// A Build is what a person is making. It is created the moment somebody says
// what they want, and it survives everything after: shaping, proving,
// building, going live, growing.
//
// PERSISTENCE: a Build is stored through the EXISTING account-linked project
// store (app/members/projects.ts → ProjectRecord) under the reserved engine id
// `vnext-build`, with this record serialized into the project's `content`
// JSON. There is deliberately no second storage stack. The server owns the id,
// the owner and the timestamps; this file owns the shape.
//
// Laws:
//   - `intent` is the person's own words. It is never rewritten, only added
//     to. Everything else is derived or explicitly chosen.
//   - `parseBuild` always returns a current-version record or null. It never
//     throws and never drops a field it doesn't recognize (see `extra`) —
//     forward compatibility is how old work survives a newer app.
//   - Stage only moves through `advance`; nothing else writes `stage`.
//   - A Build never claims more than it can prove. `stage` is a statement
//     about work, not a marketing label — same discipline as the Project OS
//     evidence ladder, which stays the deeper record for anything published.
// ─────────────────────────────────────────────────────────────────────────────

export const BUILD_RECORD_VERSION = 1 as const;

/** BRING IT → SHAPE / PROVE IT → BUILD IT → LIVE → GROW */
export type BuildStage = "bring" | "shape" | "build" | "live" | "grow";

export const BUILD_STAGES: BuildStage[] = ["bring", "shape", "build", "live", "grow"];

export const BUILD_STAGE_LABEL: Record<BuildStage, string> = {
  bring: "Bring it",
  shape: "Shape it",
  build: "Build it",
  live: "Live",
  grow: "Grow",
};

/** The one line shown on the Build card. Plain, never hype. */
export const BUILD_STAGE_LINE: Record<BuildStage, string> = {
  bring: "You said what you want to make.",
  shape: "Working out what version one actually is.",
  build: "Making the real thing.",
  live: "It's out there.",
  grow: "Making it better with what you learn.",
};

export interface BuildRecordV1 {
  version: typeof BUILD_RECORD_VERSION;
  /** Server-owned once saved; empty string on a Build that hasn't been saved. */
  id: string;
  title: string;
  /** The person's own words. Write-once in spirit: appended to, never replaced. */
  intent: string;
  stage: BuildStage;
  createdAt: string;
  updatedAt: string;
  /** Optional shaping fields — filled in as they become known, never invented. */
  goal?: string;
  audience?: string;
  constraints?: string;
  /** The single next thing worth doing. Plain sentence. */
  currentAction?: string;
  /** Capability ids (app/vnext/capabilities.ts) this Build has reached for. */
  capabilitiesUsed: string[];
  /** Anything real that came out: a link, a file, a saved plan. */
  artifacts: BuildArtifact[];
  /** Append-only. Newest last. */
  history: BuildEvent[];
  /** Fields written by a newer version of the app. Preserved untouched. */
  extra?: Record<string, unknown>;
}

export interface BuildArtifact {
  id: string;
  label: string;
  /** Where it lives: a route here, an external URL, or a storage key. */
  ref: string;
  kind: "link" | "route" | "local" | "file";
  createdAt: string;
}

export interface BuildEvent {
  at: string;
  /** One plain sentence in the past tense. */
  note: string;
  stage?: BuildStage;
}

const KNOWN_KEYS = new Set([
  "version", "id", "title", "intent", "stage", "createdAt", "updatedAt",
  "goal", "audience", "constraints", "currentAction", "capabilitiesUsed",
  "artifacts", "history", "extra",
]);

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/** A title a person recognizes, derived from their own words. Never invented. */
export function titleFromIntent(intent: string): string {
  const clean = intent.replace(/\s+/g, " ").trim();
  if (!clean) return "Untitled build";
  const firstSentence = clean.split(/(?<=[.!?])\s/)[0] ?? clean;
  const short = firstSentence.length > 60 ? `${firstSentence.slice(0, 57).trimEnd()}…` : firstSentence;
  return short.charAt(0).toUpperCase() + short.slice(1);
}

/** A brand-new Build from what somebody said. `now` is injected so tests are stable. */
export function newBuild(intent: string, now: string = new Date().toISOString()): BuildRecordV1 {
  const clean = intent.replace(/\s+/g, " ").trim();
  return {
    version: BUILD_RECORD_VERSION,
    id: "",
    title: titleFromIntent(clean),
    intent: clean,
    stage: "bring",
    createdAt: now,
    updatedAt: now,
    currentAction: "Say more about it, or read it back and shape version one.",
    capabilitiesUsed: [],
    artifacts: [],
    history: [{ at: now, note: "You stepped in.", stage: "bring" }],
  };
}

/**
 * Safe parse. Returns a current-version record or null — never throws.
 * Unknown fields are preserved in `extra` so a Build written by a newer app
 * is not quietly stripped when an older one reads it.
 */
export function parseBuild(raw: unknown): BuildRecordV1 | null {
  const o = typeof raw === "string" ? safeJson(raw) : raw;
  if (!o || typeof o !== "object" || Array.isArray(o)) return null;
  const r = o as Record<string, unknown>;
  const intent = str(r.intent);
  if (!intent) return null;
  const createdAt = str(r.createdAt) ?? new Date(0).toISOString();

  const extraEntries = Object.entries(r).filter(([k]) => !KNOWN_KEYS.has(k));
  const carriedExtra =
    r.extra && typeof r.extra === "object" && !Array.isArray(r.extra)
      ? { ...(r.extra as Record<string, unknown>) }
      : {};
  for (const [k, v] of extraEntries) carriedExtra[k] = v;

  const stage = BUILD_STAGES.includes(r.stage as BuildStage) ? (r.stage as BuildStage) : "bring";

  return {
    version: BUILD_RECORD_VERSION,
    id: str(r.id) ?? "",
    title: str(r.title) ?? titleFromIntent(intent),
    intent,
    stage,
    createdAt,
    updatedAt: str(r.updatedAt) ?? createdAt,
    goal: str(r.goal),
    audience: str(r.audience),
    constraints: str(r.constraints),
    currentAction: str(r.currentAction),
    capabilitiesUsed: Array.isArray(r.capabilitiesUsed)
      ? r.capabilitiesUsed.filter((c): c is string => typeof c === "string")
      : [],
    artifacts: Array.isArray(r.artifacts)
      ? r.artifacts.flatMap((a) => {
          const art = parseArtifact(a);
          return art ? [art] : [];
        })
      : [],
    history: Array.isArray(r.history)
      ? r.history.flatMap((h) => {
          const ev = parseEvent(h);
          return ev ? [ev] : [];
        })
      : [],
    ...(Object.keys(carriedExtra).length ? { extra: carriedExtra } : {}),
  };
}

function parseArtifact(raw: unknown): BuildArtifact | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const label = str(r.label);
  const ref = str(r.ref);
  if (!label || !ref) return null;
  const kind = ["link", "route", "local", "file"].includes(String(r.kind))
    ? (r.kind as BuildArtifact["kind"])
    : "link";
  return {
    id: str(r.id) ?? ref,
    label,
    ref,
    kind,
    createdAt: str(r.createdAt) ?? new Date(0).toISOString(),
  };
}

function parseEvent(raw: unknown): BuildEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const note = str(r.note);
  if (!note) return null;
  return {
    at: str(r.at) ?? new Date(0).toISOString(),
    note,
    ...(BUILD_STAGES.includes(r.stage as BuildStage) ? { stage: r.stage as BuildStage } : {}),
  };
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Move a Build forward. History is append-only; the intent is untouched. */
export function advance(
  build: BuildRecordV1,
  stage: BuildStage,
  note: string,
  now: string = new Date().toISOString(),
): BuildRecordV1 {
  return {
    ...build,
    stage,
    updatedAt: now,
    history: [...build.history, { at: now, note, stage }],
  };
}

/** Record that a Build reached for one of the existing capabilities. */
export function recordCapabilityUse(
  build: BuildRecordV1,
  capabilityId: string,
  now: string = new Date().toISOString(),
): BuildRecordV1 {
  if (build.capabilitiesUsed.includes(capabilityId)) return build;
  return {
    ...build,
    updatedAt: now,
    capabilitiesUsed: [...build.capabilitiesUsed, capabilityId],
  };
}

/** What goes in the account-linked project's `content` column. */
export function serializeBuild(build: BuildRecordV1): string {
  return JSON.stringify(build);
}

/** The stored-project shape this module needs. Structural, so it stays
 *  decoupled from the member store's own record type. */
export interface StoredProjectRow {
  id: string;
  title: string;
  engineId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Account rows → Builds, newest first. The server owns identity and
 * timestamps; the record owns meaning. A row that will not parse is skipped,
 * never guessed at and never deleted — it stays in the account exactly as it
 * is, and a later version can read it.
 */
export function buildsFromProjects(
  rows: StoredProjectRow[],
  buildEngineId: string,
): BuildRecordV1[] {
  return rows
    .filter((r) => r.engineId === buildEngineId)
    .flatMap((r) => {
      const parsed = parseBuild(r.content);
      if (!parsed) return [];
      return [{ ...parsed, id: r.id, title: r.title, createdAt: r.createdAt, updatedAt: r.updatedAt }];
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
