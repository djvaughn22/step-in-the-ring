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
}

export interface LegacyFinding extends LegacySource {
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
  { key: "sitr-plans-v3", label: "Saved plans", emoji: "🥊", href: "/", storage: "local" },
  { key: "sitr-creation-current-v1", label: "Your last creation", emoji: "✨", href: "/", storage: "local" },
  { key: "sitr-engine-projects-v1", label: "Engine Room projects", emoji: "🧰", href: "/engines", storage: "local" },
  { key: "creation-engine-projects-v1", label: "Engine projects (earlier key)", emoji: "🧰", href: "/engines", storage: "local" },
  { key: "sitr-projects-v1", label: "Project OS records", emoji: "🗂️", href: "/projects", storage: "local" },
  { key: "sitr-music-songs-v1", label: "Songs", emoji: "🎵", href: "/engines?engine=music", storage: "local" },
  { key: "sitr-build-machine-v1", label: "Build Machine progress", emoji: "💻", href: "/build-machine", storage: "local" },
  { key: "sitr-first-app-v1", label: "First build walkthrough", emoji: "🧱", href: "/build", storage: "local" },
  { key: "sitr-game-world-v1", label: "Game world", emoji: "🎮", href: "/engines?engine=game", storage: "local" },
  { key: "sitr-builder-defaults-v1", label: "Builder defaults", emoji: "⚙️", href: "/", storage: "local" },
  { key: "sitr-story-partner", label: "Story Partner work", emoji: "📓", href: "/author", storage: "indexeddb" },
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
    const count = countOf(raw);
    if (count === 0) continue; // an empty list is not "work you left here"
    out.push({ ...source, present: true, count });
  }
  return out;
}
