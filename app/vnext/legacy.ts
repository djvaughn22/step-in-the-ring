// ─────────────────────────────────────────────────────────────────────────────
// THE COMPATIBILITY BRIDGE — everything a person made here before vNext.
//
// vNext changed the way in. It did NOT change where anybody's work lives.
// Every key below is still written and read by its original owner module,
// exactly as it was. This file only LOOKS.
//
// LAW: read-only. Nothing in this module writes, migrates, clears, or
// normalizes a byte of stored work. A rushed migration that loses somebody's
// saved plan is worse than a slightly ugly bridge — so there is no migration.
// If a shape can't be read, the row says so honestly and still hands over the
// route that CAN open it.
// ─────────────────────────────────────────────────────────────────────────────

export interface LegacySource {
  key: string;
  /** What the person calls it. */
  label: string;
  emoji: string;
  /** The surface that already knows how to open this work. */
  href: string;
  /** IndexedDB stores are counted by their own module, not here. */
  storage: "local" | "indexeddb";
  /** For stores that hold a blank form after one visit: true only when the
   *  person actually put something in. Without it, opening a tool once would
   *  show up as "work". */
  hasWork?: (parsed: unknown) => boolean;
  /** The person's own name for the latest thing in here, shown back to
   *  them on Your work (their browser, their words). Never sent anywhere. */
  titleOf?: (parsed: unknown) => string | null;
}

/** A short, single-line version of something the person typed. */
function shortTitle(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.replace(/\s+/g, " ").trim();
  if (!t) return null;
  return t.length > 60 ? `${t.slice(0, 57).trimEnd()}…` : t;
}

const field = (name: string) => (parsed: unknown) =>
  parsed && typeof parsed === "object" ? shortTitle((parsed as Record<string, unknown>)[name]) : null;

/** The most recently touched item in a list (by updatedAt when it has one). */
function latestOf(list: unknown, name: string): string | null {
  if (!Array.isArray(list) || list.length === 0) return null;
  const items = list.filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
  const sorted = [...items].sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")));
  const pick = sorted.some((x) => x.updatedAt) ? sorted[0] : items[items.length - 1];
  return pick ? shortTitle(pick[name]) : null;
}

/** Any of these fields holds real text (or a non-empty list). */
function filled(fields: string[]): (parsed: unknown) => boolean {
  return (parsed) => {
    if (!parsed || typeof parsed !== "object") return false;
    const o = parsed as Record<string, unknown>;
    return fields.some((f) => {
      const v = f.includes(".") ? (o[f.split(".")[0]] as Record<string, unknown> | undefined)?.[f.split(".")[1]] : o[f];
      return (typeof v === "string" && v.trim().length > 0) || (Array.isArray(v) && v.length > 0);
    });
  };
}

export interface LegacyFinding extends LegacySource {
  /** See LegacySource.titleOf. */
  title?: string | null;
  /** How many saved things are in there. `null` = present but not countable. */
  count: number | null;
  present: boolean;
}

/**
 * Every pre-vNext place a person's work can be sitting. Adding a key here is
 * how a surface gets found by Your Work — it is not how it gets migrated.
 * Keep in sync with docs/step-in-the-ring-vnext-preservation.md.
 */
export const LEGACY_SOURCES: LegacySource[] = [
  { key: "sitr-plans-v3", label: "Saved plans", emoji: "📋", href: "/", storage: "local" },
  { key: "sitr-creation-current-v1", label: "Your last creation", emoji: "✨", href: "/", storage: "local" },
  { key: "sitr-engine-projects-v1", label: "Engine Room projects", emoji: "🧰", href: "/engines/room", storage: "local", titleOf: (p) => latestOf((p as { projects?: unknown } | null)?.projects, "name") },
  { key: "creation-engine-projects-v1", label: "Engine projects (earlier key)", emoji: "🧰", href: "/engines/room", storage: "local" },
  { key: "sitr-projects-v1", label: "Project OS records", emoji: "🗂️", href: "/projects", storage: "local" },
  { key: "sitr-music-songs-v1", label: "Songs", emoji: "🎵", href: "/engines/room?engine=music", storage: "local" },
  { key: "sitr-build-machine-v1", label: "Build Machine progress", emoji: "💻", href: "/build-machine", storage: "local" },
  { key: "sitr-first-app-v1", label: "First build walkthrough", emoji: "🧱", href: "/build", storage: "local" },
  { key: "sitr-game-world-v1", label: "Game world", emoji: "🎮", href: "/engines/room?engine=game", storage: "local" },
  { key: "sitr-builder-defaults-v1", label: "Builder defaults", emoji: "⚙️", href: "/", storage: "local" },
  { key: "sitr-story-partner", label: "Story Partner work", emoji: "📓", href: "/author", storage: "indexeddb" },
  // The free tools and the Sprint planner (2026-10-04): they always saved to
  // this browser, but nothing pointed back to them.
  { key: "fhs-sprints", label: "Five Hour Sprint plans", emoji: "⏱️", href: "/five-hour-sprint-tool", storage: "local", titleOf: (p) => latestOf(p, "deliverable") },
  { key: "sitr-tool-first-version", label: "First version cutter", emoji: "✂️", href: "/tools/first-version", storage: "local", hasWork: filled(["idea", "doneMeans", "items"]), titleOf: field("idea") },
  { key: "sitr-tool-try-it", label: "Try-it script", emoji: "🧪", href: "/tools/try-it", storage: "local", hasWork: filled(["what", "task", "notes.did", "notes.stuck", "notes.said", "notes.change"]), titleOf: field("what") },
  { key: "sitr-tool-one-liner", label: "One-line explainer", emoji: "💬", href: "/tools/one-liner", storage: "local", hasWork: filled(["name", "what", "who", "helps"]), titleOf: field("name") },
  { key: "sitr-tool-launch-checklist", label: "Launch checklist", emoji: "✅", href: "/tools/launch-checklist", storage: "local", hasWork: filled(["done"]) },
];

function countOf(raw: string): number | null {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.length;
    if (parsed && typeof parsed === "object") {
      // Common shapes: { items: [...] } / { projects: [...] } / a bare record.
      for (const field of ["items", "projects", "plans", "records", "songs"]) {
        const v = (parsed as Record<string, unknown>)[field];
        if (Array.isArray(v)) return v.length;
      }
      return 1;
    }
    return 1;
  } catch {
    // Present but unreadable by this scanner. The owning surface still opens it.
    return null;
  }
}

function titleFrom(source: LegacySource, parsed: unknown): string | null {
  try {
    return source.titleOf ? source.titleOf(parsed) : null;
  } catch {
    return null;
  }
}

/**
 * Look for pre-vNext work in this browser. Returns only what is actually there.
 * Safe on the server and in a browser with storage blocked — returns [].
 */
export function findLegacyWork(sources: LegacySource[] = LEGACY_SOURCES): LegacyFinding[] {
  if (typeof window === "undefined") return [];
  const out: LegacyFinding[] = [];
  for (const source of sources) {
    if (source.storage === "indexeddb") {
      // Story Partner owns its own IndexedDB and its own local mirror. We only
      // note the mirror's presence — opening the room is what reads the work.
      let present = false;
      try {
        present = window.localStorage.getItem(`${source.key}-v1`) !== null;
      } catch {
        present = false;
      }
      if (present) out.push({ ...source, present: true, count: null });
      continue;
    }
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(source.key);
    } catch {
      raw = null;
    }
    if (raw === null) continue;
    if (source.hasWork) {
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
      if (source.hasWork(parsed)) out.push({ ...source, present: true, count: null, title: titleFrom(source, parsed) });
      continue;
    }
    const count = countOf(raw);
    if (count === 0) continue; // an empty list is not "work you left here"
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
    out.push({ ...source, present: true, count, title: titleFrom(source, parsed) });
  }
  return out;
}
