// ─────────────────────────────────────────────────────────────────────────────
// THE CAPABILITY REGISTRY — vNext's canonical catalog of what Step In The Ring
// can already do.
//
// Why this exists: the vNext experience asks one question ("What do you want
// to create?") and must never make a person pick an engine first. But nothing
// we built is allowed to disappear. So the old surfaces stop being NAVIGATION
// and become CAPABILITIES: metadata rows that a Build can reach for, and that
// the Your Work library can list.
//
// Rules for this file:
//   - METADATA AND ADAPTERS ONLY. No capability logic is duplicated here.
//     Engine rows are derived from app/engines/engines.ts (the real registry);
//     this file adds the vNext-facing fields (need tags, where it lives).
//   - Adding a row NEVER hides an old route. Old routes keep working exactly
//     as they did; this is a directory, not a gate.
//   - `needs` are plain human words a person might use about their idea. The
//     matcher is deterministic string work — no model calls, ever.
// ─────────────────────────────────────────────────────────────────────────────

import { ENGINES, type EngineActivation } from "../engines/engines";

export type CapabilityKind = "engine" | "tool" | "surface";

export interface Capability {
  /** Stable id. For engines this IS the engine id — old saved work keys off it. */
  id: string;
  kind: CapabilityKind;
  name: string;
  emoji: string;
  /** One plain sentence: what you walk away holding. */
  what: string;
  /** Where it lives today. Every one of these already works. */
  href: string;
  /** Honest activation, same vocabulary as the engine registry. */
  activation: EngineActivation;
  /** Plain words a person might use when this capability is the right one. */
  needs: string[];
  /** True when only the owner can actually use it (kept visible, labelled). */
  ownerOnly?: boolean;
}

/** Extra vNext-facing metadata for engine rows, keyed by engine id. */
const ENGINE_NEEDS: Record<string, string[]> = {
  idea: ["idea", "decide", "choose", "which version", "compare", "not sure"],
  build: ["build", "app", "website", "software", "code", "repo"],
  sell: ["sell", "price", "customers", "revenue", "money", "buyers"],
  launch: ["launch", "release", "announce", "go live", "publish"],
  fix: ["fix", "broken", "repair", "bug", "stuck", "not working"],
  grow: ["grow", "audience", "traffic", "more people", "reach"],
  plan: ["plan", "schedule", "milestones", "timeline", "organize"],
  etsy: ["etsy", "listing", "shop", "product listing"],
  "design-shop": ["design", "artwork", "print", "shirt", "sticker", "mug", "merch", "logo"],
  game: ["game", "puzzle", "play", "arcade", "level"],
  howto: ["how to", "tutorial", "teach", "guide", "video", "explain"],
  story: ["story", "book", "novel", "write", "memoir", "characters", "chapter"],
  music: ["music", "song", "lyrics", "album", "melody", "record"],
};

/** Non-engine surfaces that are real capabilities in their own right. */
const SURFACES: Capability[] = [
  {
    id: "planner",
    kind: "surface",
    name: "Read my idea",
    emoji: "🥊",
    what: "Say a rough idea in your own words and get back what it really is, the smartest first version, and the tools it needs.",
    href: "/",
    activation: "working",
    needs: ["idea", "start", "anything", "not sure", "rough"],
  },
  {
    id: "build-machine",
    kind: "tool",
    name: "Build Machine",
    emoji: "💻",
    what: "Turn an old computer into a machine that can actually build what you're making.",
    href: "/build-machine",
    activation: "working",
    needs: ["computer", "laptop", "setup", "old machine", "environment"],
  },
  {
    id: "first-app",
    kind: "tool",
    name: "Your first build, step by step",
    emoji: "🧱",
    what: "A beginner walkthrough that ends with something real running on your own screen.",
    href: "/build",
    activation: "working",
    needs: ["beginner", "first", "never built", "step by step", "learn"],
  },
  {
    id: "five-hour-sprint",
    kind: "tool",
    name: "Five Hour Sprint",
    emoji: "⏱️",
    what: "One disciplined five-hour block that ends with a finished piece instead of an open tab.",
    href: "/five-hour-sprint-tool",
    activation: "working",
    needs: ["focus", "finish", "deadline", "sprint", "today", "procrastinating"],
  },
  {
    id: "live",
    kind: "surface",
    name: "Live builds",
    emoji: "📦",
    what: "Things that were built through the Ring and are live on the internet right now.",
    href: "/live",
    activation: "working",
    needs: ["examples", "proof", "what came out of this"],
  },
  {
    id: "engine-room",
    kind: "surface",
    name: "Engine Room",
    emoji: "🧰",
    what: "Every engine in one room, with an honest status on each one.",
    href: "/engines",
    activation: "beta",
    needs: ["engines", "tools", "everything"],
  },
  {
    id: "project-os",
    kind: "surface",
    name: "Project OS",
    emoji: "🗂️",
    what: "The evidence ledger: what's proven, what's assumed, and the one next action.",
    href: "/projects",
    activation: "working",
    ownerOnly: true,
    needs: ["evidence", "proof", "status", "ledger"],
  },
  {
    id: "author-room",
    kind: "surface",
    name: "The Author's Room",
    emoji: "📓",
    what: "Story Partner's private writing room — local-first, nothing leaves the browser.",
    href: "/author",
    activation: "working",
    ownerOnly: true,
    needs: ["writing room", "private", "manuscript"],
  },
  {
    id: "shop",
    kind: "surface",
    name: "Shop",
    emoji: "🛍️",
    what: "Things Open Mirror has made that you can buy.",
    href: "/shop",
    activation: "working",
    needs: ["buy", "shop", "products"],
  },
];

/** The engine id Builds persist under. Hidden from the Engine Room picker. */
export const BUILD_ENGINE_ID = "vnext-build";

/** Engine ids that are internal plumbing for vNext, never shown as capabilities. */
const INTERNAL_ENGINE_IDS = new Set([BUILD_ENGINE_ID]);

function fromEngines(): Capability[] {
  return ENGINES.filter((e) => !INTERNAL_ENGINE_IDS.has(e.id)).map((e) => ({
    id: e.id,
    kind: "engine" as const,
    name: e.name,
    emoji: e.emoji,
    what: e.output ?? e.tagline,
    href: `/engines?engine=${e.id}`,
    activation: e.activation ?? "beta",
    needs: ENGINE_NEEDS[e.id] ?? [],
    ownerOnly: (e.activation ?? "beta") === "owner-only",
  }));
}

/** Every capability vNext knows about. Engines first-class, surfaces beside them. */
export function allCapabilities(): Capability[] {
  return [...SURFACES, ...fromEngines()];
}

export function capabilityById(id: string): Capability | undefined {
  return allCapabilities().find((c) => c.id === id);
}

/** A capability a visitor can actually use today. Honesty, enforced in code. */
function usableNow(c: Capability): boolean {
  if (c.ownerOnly) return false;
  return c.activation === "working" || c.activation === "beta";
}

/**
 * Deterministic intent matching — plain substring work over the person's own
 * words. No model call, ever; the same sentence always gets the same answer.
 *
 * This is a helpful shortcut, never a gate: a Build is created from the intent
 * whether or not anything matches here. And it only ever offers capabilities
 * a person can actually open — pointing somebody at an owner-only engine,
 * however well it matches their words, is a dead end dressed as help.
 */
export function capabilitiesForIntent(intent: string, limit = 3): Capability[] {
  const text = ` ${intent.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ")} `;
  if (text.trim().length === 0) return [];
  const scored = allCapabilities()
    .filter(usableNow)
    .map((c) => {
      let score = 0;
      for (const need of c.needs) {
        if (text.includes(` ${need} `) || text.includes(` ${need}s `)) score += 2;
        else if (text.includes(need)) score += 1;
      }
      return { c, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.c.id.localeCompare(b.c.id));
  return scored.slice(0, limit).map((row) => row.c);
}
