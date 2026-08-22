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

/**
 * WHAT AN ENGINE HELPS YOU DO — the five shelves on /engines.
 *
 * These are verbs, not architecture. A person arriving with something in their
 * head does not know whether they need "the Design Shop Engine"; they know
 * they want to make something. Every group below is backed by real engines
 * that actually run, and an engine with no group simply does not appear on the
 * engines page (the Engine Room itself, the owner ledger, the shop).
 */
export type EngineGroup = "start" | "make" | "plan" | "finish";

export const ENGINE_GROUPS: { id: EngineGroup; title: string; note: string }[] = [
  { id: "start", title: "Start", note: "Help me figure out what I'm making." },
  { id: "make", title: "Make", note: "Help me create part of it — software, a design, a song, a story, a fix." },
  { id: "plan", title: "Plan", note: "Help me work through it — dates, people, a finish line." },
  { id: "finish", title: "Finish", note: "Help me get it out into the world." },
];

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
  /** Which shelf on /engines. Omitted means it is not a creation tool and
   *  does not belong on that page. */
  group?: EngineGroup;
  /** "Use it when…" — the sentence that tells somebody this is their tool.
   *  Written for a person who has never heard of any of these names. */
  useWhen?: string;
  /** A one-line concrete example so the card is not abstract. */
  example?: string;
  /** A plainer name for the card, when the internal one is not obvious. */
  title?: string;
  /** Shown on Home's "Tools for the job" row — the 4-5 broadly useful ones,
   *  not all 12. Curation, not a reflection of every engine's real value. */
  featured?: boolean;
}

/** Which shelf each engine sits on, and when a person should reach for it. */
const ENGINE_META: Record<string, { group: EngineGroup; useWhen: string; example: string; title?: string }> = {
  idea: {
    group: "start",
    useWhen: "You have three versions of the same idea and keep going in circles.",
    example: "\u201cA card game for my kids\u201d comes out as four versions, scored, and you leave with one.",
  },
  build: {
    group: "make",
    useWhen: "You know what you want to make and need the actual first build.",
    example: "A site that tracks your kids' chores becomes an MVP scope and a prompt you paste into your coding tool.",
  },
  fix: {
    group: "make",
    useWhen: "Something you already made broke, and you do not want to break the rest of it.",
    example: "\u201cThe login stopped working\u201d becomes a repair plan that inspects before it edits.",
  },
  "design-shop": {
    group: "make",
    title: "Design Shop",
    useWhen: "You want to make something people can buy \u2014 a print, a shirt, a sticker, a mug.",
    example: "One product idea becomes five directions, scored, and an Etsy listing you can paste in.",
  },
  music: {
    group: "make",
    useWhen: "You have words, a melody in your head, a voice memo, or nothing at all.",
    example: "A hummed chorus becomes a song project with a real arrangement to record.",
  },
  game: {
    group: "make",
    useWhen: "You want to make a puzzle world and play it.",
    example: "MineDoku was made this way and is live on OpenDoku.",
  },
  story: {
    group: "make",
    title: "Story Partner",
    useWhen: "You want to turn things that actually happened into a book.",
    example: "Memories go in in any order; characters, scenes and a chapter outline come out.",
  },
  howto: {
    group: "make",
    title: "How To Anything",
    useWhen: "You already know how to fix something and want to teach it.",
    example: "One repair you have done becomes a script, a shot list and a YouTube listing.",
  },
  plan: {
    group: "plan",
    useWhen: "The thing you are organising is not software \u2014 an event, a season, a move.",
    example: "A fundraiser becomes phases, owners, dates and the next concrete action.",
  },
  sell: {
    group: "finish",
    useWhen: "You want money to change hands and do not know what you are actually selling.",
    example: "\u201cI could do this for people\u201d becomes a customer, an offer, a price and a first test.",
  },
  launch: {
    group: "finish",
    useWhen: "It works on your screen and now real people have to see it.",
    example: "A finished site becomes a readiness check, a blocker list and one number to watch.",
  },
  grow: {
    group: "finish",
    useWhen: "It is live and quiet, and you want to move one real number.",
    example: "Forty visitors a week becomes one hypothesis and the smallest test that proves it.",
  },
  etsy: {
    group: "finish",
    useWhen: "Superseded by the Design Shop.",
    example: "Kept so older saved work still opens.",
  },
};

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
    group: "make",
    useWhen: "The computer you own cannot build the thing yet.",
    example: "An eight-year-old laptop ends up running the same tools this site was built with.",
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
    group: "make",
    title: "Your first build",
    useWhen: "You have never built anything and want the whole thing walked through once.",
    example: "Six short rounds that end with something real running on your own screen. No account.",
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
    group: "plan",
    useWhen: "You have one free evening and want to finish something instead of opening tabs.",
    example: "Five hours becomes a packet: what you are making, in what order, and when to stop.",
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
    name: "The Engine Room",
    emoji: "🧰",
    what: "Where an engine actually runs, and where your engine projects are saved.",
    href: "/engines/room",
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
    href: `/engines/room?engine=${e.id}`,
    activation: e.activation ?? "beta",
    needs: ENGINE_NEEDS[e.id] ?? [],
    ownerOnly: (e.activation ?? "beta") === "owner-only",
    group: ENGINE_META[e.id]?.group,
    useWhen: ENGINE_META[e.id]?.useWhen,
    example: ENGINE_META[e.id]?.example,
    title: ENGINE_META[e.id]?.title,
  }));
}

/** Every capability vNext knows about. Engines first-class, surfaces beside them. */
export function allCapabilities(): Capability[] {
  return [...SURFACES, ...fromEngines()];
}

/** The name to print on a card: the plainer one when there is one. */
export function displayName(c: Capability): string {
  return c.title ?? c.name;
}

/** Everything that belongs on the engines page, shelf by shelf, in order.
 *  Hidden engines and surfaces without a group never appear. */
export function enginesByGroup(): { id: EngineGroup; title: string; note: string; items: Capability[] }[] {
  const all = allCapabilities();
  return ENGINE_GROUPS.map((g) => ({
    ...g,
    // Working first, then beta, then owner-only. Nobody should have to scan
    // past three things they cannot open to find the one they can.
    items: all
      .filter((c) => c.group === g.id && !HIDDEN_FROM_ENGINES.has(c.id))
      .sort((a, b) => rank(a) - rank(b) || displayName(a).localeCompare(displayName(b))),
  })).filter((g) => g.items.length > 0);
}

function rank(c: Capability): number {
  if (c.ownerOnly) return 2;
  return c.activation === "working" ? 0 : 1;
}

/** Superseded rows kept alive for old saved work, never advertised again. */
const HIDDEN_FROM_ENGINES = new Set(["etsy"]);

/** Home's "Tools for the job" row — curated, not the whole registry. */
const FEATURED_IDS = ["idea", "build", "design-shop", "music", "five-hour-sprint"];

export function featuredCapabilities(): Capability[] {
  const all = allCapabilities();
  return FEATURED_IDS.map((id) => all.find((c) => c.id === id)).filter((c): c is Capability => !!c);
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
