// ─────────────────────────────────────────────────────────────────────────────
// THE SITE REGISTRY — one source of truth for every page Step In The Ring has,
// who is allowed to open it, and where it belongs in the product.
//
// Why this exists: before this file, the navigation, the Library, the About
// page and the tests each carried their own hand-kept list of routes. They
// drifted. Working pages went unlinked; the menu described a product that had
// moved on. Now navigation, the Everything directory and the route tests all
// read from HERE.
//
// Rules for this file:
//   - Every non-dynamic page under app/ must appear exactly once. A test walks
//     the filesystem and fails if a page is missing, or if a listed page has no
//     file on disk. That test is the whole point — drift is the enemy.
//   - `access` is a PRODUCT statement, not a security mechanism. The real
//     enforcement lives in middleware.ts (member), the page's own server check
//     (owner, paid) and app/preview/previewAuth.ts (shared preview). A test
//     asserts this file agrees with middleware; nothing here grants anything.
//   - API routes are never listed. They are not pages and must not be
//     presented to a person as somewhere to go.
//   - No secrets. No passcodes. No local paths. This file is public source and
//     it ships in the bundle.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The four access classes. These are different kinds of door and must never be
 * collapsed into each other — in particular, a shared preview passcode is NOT
 * a substitute for owner-only or member-only protection.
 */
export type Access =
  /** Anyone. No door at all. */
  | "public"
  /** Anyone holding the shared preview passcode. A courtesy door for things
   *  the owner wants to hand to one person — never for private data. */
  | "preview"
  /** A signed-in member. Enforced in middleware.ts and/or the page. */
  | "member"
  /** The owner only. Enforced server-side in the page. Never downgraded. */
  | "owner";

/**
 * Where a page sits in the product. These are the SAME eight words the menu,
 * the Everything directory and the homepage use, in this order. A page that
 * does not fit one of them does not have a home yet, which is the bug the
 * group is there to expose.
 *
 *   create  — where you say what you want to make
 *   engines — focused tools that make one part of a thing
 *   builds  — the things you are actually making
 *   library — work you saved and can use again
 *   learn   — how this works, and what it is
 *   proof   — real things that got made
 *   account — signing in, membership, shared previews
 *   owner   — the owner's own tools
 */
export type PageGroup =
  | "create"
  | "engines"
  | "builds"
  | "library"
  | "learn"
  | "proof"
  | "account"
  | "owner";

export interface SitePage {
  /** Route path as a visitor types it. */
  path: string;
  /** Plain human name. Not a route name, not a component name. */
  name: string;
  /** One sentence: what you can actually do here. No marketing. */
  what: string;
  access: Access;
  group: PageGroup;
  /** True for the handful of doors in the primary menu. */
  inNav?: boolean;
  /** Kept out of search on purpose (unfinished, or preview-only). */
  noindex?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// EVERY PAGE
// ─────────────────────────────────────────────────────────────────────────────

export const SITE_PAGES: SitePage[] = [
  // ── Create ─────────────────────────────────────────────────────────────
  {
    path: "/",
    name: "Home",
    what: "The front door: say what you want to make, or pick up something you already started.",
    access: "public",
    group: "create",
  },
  {
    path: "/create",
    name: "Create",
    what: "Say what you want to make in your own words, or pick a starting point if you do not know yet.",
    access: "public",
    group: "create",
    inNav: true,
  },

  // ── Engines ────────────────────────────────────────────────────────────
  {
    path: "/engines",
    name: "Engines",
    what: "Every focused tool here, grouped by what it helps you do, with what it gives you back.",
    access: "public",
    group: "engines",
    inNav: true,
  },
  {
    path: "/engines/room",
    name: "The Engine Room",
    what: "Where an engine actually runs. Needs an account.",
    access: "member",
    group: "engines",
    noindex: true,
  },
  {
    path: "/five-hour-sprint-tool",
    name: "Five Hour Sprint",
    what: "Plan a single five-hour build window and walk out with the packet to run it.",
    access: "member",
    group: "engines",
  },
  {
    path: "/build-machine",
    name: "Build Machine",
    what: "Turn a computer you already have into one that can build what you're making.",
    access: "public",
    group: "engines",
  },
  {
    path: "/build",
    name: "Your first build, step by step",
    what: "Six short rounds that end with something real running on your own screen. No account.",
    access: "public",
    group: "engines",
  },

  // ── Builds ─────────────────────────────────────────────────────────────
  {
    path: "/builds",
    name: "Builds",
    what: "The things you're actually making. Open one and pick up where you stopped.",
    access: "public",
    group: "builds",
    inNav: true,
  },

  // ── Library ────────────────────────────────────────────────────────────
  {
    path: "/library",
    name: "Library",
    what: "Work you saved and can use again, and the starting points you can run from.",
    access: "public",
    group: "library",
    inNav: true,
  },

  // ── Learn ──────────────────────────────────────────────────────────────
  {
    path: "/how",
    name: "How it works",
    what: "The whole loop in five steps, then the longer version if you want it.",
    access: "public",
    group: "learn",
  },
  {
    path: "/about",
    name: "About",
    what: "What this is, who makes it, and what happens to what you type.",
    access: "public",
    group: "learn",
  },
  {
    path: "/products/five-hour-sprint",
    name: "The Five Hour Sprint",
    what: "How to finish a real deliverable inside one focused window on a modest budget.",
    access: "public",
    group: "learn",
  },

  // ── Proof ──────────────────────────────────────────────────────────────
  {
    path: "/explore",
    name: "Explore",
    what: "Real things that got made. Open them — they're live.",
    access: "public",
    group: "proof",
  },
  {
    path: "/live",
    name: "Pushed live",
    what: "Every build that went idea → tested locally → pushed live, newest first.",
    access: "public",
    group: "proof",
  },
  {
    path: "/everything",
    name: "Everything",
    what: "The whole directory: every page in Step In The Ring and what's behind a door.",
    access: "public",
    group: "proof",
  },
  {
    path: "/shop",
    name: "Shop",
    what: "Original products from the Design Shop. Nothing is listed yet — this is a work-in-progress preview.",
    access: "preview",
    group: "proof",
    noindex: true,
  },

  // ── Account ────────────────────────────────────────────────────────────
  {
    path: "/account",
    name: "Account",
    what: "Your membership, your saved work, and how to leave with it.",
    access: "member",
    group: "account",
  },
  {
    path: "/membership",
    name: "Membership",
    what: "What membership includes and how the open beta works.",
    access: "public",
    group: "account",
  },
  {
    path: "/members/login",
    name: "Sign in",
    what: "Sign in to reach your saved builds from any device.",
    access: "public",
    group: "account",
  },
  {
    path: "/members/signup",
    name: "Create an account",
    what: "Make an account so your builds follow you between devices.",
    access: "public",
    group: "account",
  },
  {
    path: "/preview",
    name: "Preview access",
    what: "Enter the passcode you were given to open a shared preview.",
    access: "public",
    group: "account",
    noindex: true,
  },

  // ── Owner only ─────────────────────────────────────────────────────────
  // Listed so the directory is honest about what exists. Listing a door is
  // not opening it — every one of these checks the owner session server-side.
  {
    path: "/owner",
    name: "Owner entrance",
    what: "Owner sign-in for the tools below.",
    access: "owner",
    group: "owner",
  },
  {
    path: "/owner/members",
    name: "Members",
    what: "Owner view of member accounts and entitlements.",
    access: "owner",
    group: "owner",
  },
  {
    path: "/owner/feedback",
    name: "Feedback",
    what: "Owner view of feedback sent from inside the product.",
    access: "owner",
    group: "owner",
  },
  {
    path: "/owner/tester-codes",
    name: "Tester codes",
    what: "Owner tool for issuing and revoking time-limited tester access.",
    access: "owner",
    group: "owner",
  },
  {
    path: "/author",
    name: "Author's Room",
    what: "The owner's private writing workspace. Nothing in it leaves this browser.",
    access: "owner",
    group: "owner",
  },
  {
    path: "/projects",
    name: "Project OS",
    what: "The owner's ledger ABOVE a build: lifecycle, evidence and decisions. Not a second copy of Builds.",
    access: "owner",
    group: "owner",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUPS
// ─────────────────────────────────────────────────────────────────────────────

export function pagesInGroup(group: PageGroup): SitePage[] {
  return SITE_PAGES.filter((p) => p.group === group);
}

export function pagesWithAccess(access: Access): SitePage[] {
  return SITE_PAGES.filter((p) => p.access === access);
}

/**
 * The primary menu. Four words, and they are the product's four ideas in the
 * order a person meets them: start something, use a tool on it, keep working
 * on it, come back to what you saved. Home is the wordmark, not a menu item —
 * every site puts home there and a fifth link buys nothing.
 *
 * Derived from the registry, never hand-kept twice.
 */
const NAV_ORDER = ["/create", "/engines", "/builds", "/library"];

export function navPages(): SitePage[] {
  return SITE_PAGES.filter((p) => p.inNav).sort(
    (a, b) => NAV_ORDER.indexOf(a.path) - NAV_ORDER.indexOf(b.path),
  );
}

/** Paths a visitor with the shared preview passcode may open. */
export function previewPaths(): string[] {
  return pagesWithAccess("preview").map((p) => p.path);
}

export function pageAt(path: string): SitePage | undefined {
  return SITE_PAGES.find((p) => p.path === path);
}

/** Human label for an access class, used everywhere a door is shown. */
export const ACCESS_LABEL: Record<Access, string> = {
  public: "Open to anyone",
  preview: "Needs a preview passcode",
  member: "Needs an account",
  owner: "Owner only",
};

// ─────────────────────────────────────────────────────────────────────────────
// THE ECOSYSTEM — real projects, verified from their own repositories.
//
// Rules: nothing here is aspirational. A `liveUrl` means the site is up. A
// `repoUrl` is only filled in when that repository is already public — a
// private repository is labelled private and its address is NOT printed,
// because the address is not ours to hand out.
// ─────────────────────────────────────────────────────────────────────────────

export type ProjectStatus = "live" | "building" | "retired";

export interface EcosystemProject {
  name: string;
  emoji: string;
  /** What it is, in one sentence a stranger understands. */
  what: string;
  /** Who it's for. Plain words. */
  who: string;
  /** What is actually real about it today. No promises. */
  real: string;
  liveUrl?: string;
  /** Only when the repository is genuinely public. */
  repoUrl?: string;
  repoPublic: boolean;
  status: ProjectStatus;
  /** The product's own colour, so a wall of tiles doesn't read as one grey
   *  list. Each site already has an identity; the directory should show it. */
  accent: string;
  /** Shown on the home page. A SHORT row of the strongest ones — the point is
   *  "people really finish things here", and five makes that point as well as
   *  ten. Step In The Ring is a product, not the Open Mirror portfolio; the
   *  full list lives on /explore and on Open Mirror itself. */
  featured?: boolean;
}

export const ECOSYSTEM: EcosystemProject[] = [
  {
    name: "CrossHeartPray",
    emoji: "✝️",
    what: "A quiet daily place to read Scripture, follow a reading plan, and pray.",
    who: "Anyone who wants a calm daily habit instead of another feed.",
    real: "Daily Hope, a 52- and 104-week reading plan, Life Essentials, and Bible Bingo 7 all run today.",
    liveUrl: "https://crossheartpray.com",
    repoPublic: false,
    status: "live",
    featured: true,
    accent: "#C9A94A",
  },
  {
    name: "iDontCry",
    emoji: "😂",
    what: "An arcade where an idea becomes a game you can actually play on a phone.",
    who: "Kids, families, and anyone with five minutes.",
    real: "Circuit, Football, Baseball, Skiing, Track & Field and Piano Corner are playable now, each with its own install.",
    liveUrl: "https://idontcry.com",
    repoPublic: false,
    status: "live",
    featured: true,
    accent: "#F5A524",
  },
  {
    name: "OpenDoku",
    emoji: "🧩",
    what: "Sudoku with a second puzzle hidden in every tile.",
    who: "Puzzle people who finished ordinary sudoku.",
    real: "SlopeDoku, SurfDoku and MineDoku are live. MineDoku was published by the Game Engine here.",
    liveUrl: "https://opendoku.com",
    repoPublic: false,
    status: "live",
    featured: true,
    accent: "#6FBF9B",
  },
  {
    name: "WatchedNotWatched",
    emoji: "🎬",
    what: "Keep track of what you've watched and find the next thing worth your night.",
    who: "Anyone tired of scrolling three apps to find nothing.",
    real: "Search, tracking, a Top 222 list, and a recommendation desk that costs nothing to run.",
    liveUrl: "https://watchednotwatched.com",
    repoPublic: false,
    status: "live",
    featured: true,
    accent: "#8FA3B0",
  },
  {
    name: "DontCloneMeTom",
    emoji: "🐶",
    what: "Trading cards for real dogs, with names written by hand.",
    who: "Dog people.",
    real: "A Dog of the Day, a card maker, and a hand-written name book behind 283 dogs.",
    liveUrl: "https://dontclonemetom.com",
    repoPublic: false,
    status: "live",
    featured: true,
    accent: "#E0894A",
  },
  {
    name: "TheDJCares",
    emoji: "🎵",
    what: "Music and encouragement, picked on purpose rather than by an algorithm.",
    who: "Someone who needs the right song more than the next song.",
    real: "The Digital DJ deck and an encouragement library run today.",
    liveUrl: "https://thedjcares.com",
    repoPublic: false,
    status: "live",
    accent: "#7FB3D5",
  },
  {
    name: "PleaseBeReady",
    emoji: "🧰",
    what: "A short daily readiness check and the gear that actually backs it up.",
    who: "Anyone who wants to be a little more prepared without going down a rabbit hole.",
    real: "The daily check is live and every listed item was title-verified by hand.",
    liveUrl: "https://pleasebeready.com",
    repoPublic: false,
    status: "live",
    accent: "#9CB380",
  },
  {
    name: "WhatAmIAI",
    emoji: "🤖",
    what: "A plain-language look at what these systems are and are not.",
    who: "Anyone who has been told AI is magic and suspects otherwise.",
    real: "Six modes and a phone-first path are built; still being finished.",
    liveUrl: "https://whatamiai.com",
    repoPublic: false,
    status: "building",
    accent: "#B0A695",
  },
  {
    name: "Open Mirror",
    emoji: "🪞",
    what: "The company page that holds all of it together.",
    who: "Anyone who wants to see the whole body of work at once.",
    real: "The hub lists every site, and its shared header, footer and theme are copied out to all of them.",
    liveUrl: "https://openmirrorllc.com",
    repoPublic: false,
    status: "live",
    accent: "#D6CDBE",
  },
  {
    name: "Step In The Ring",
    emoji: "🥊",
    what: "This site: say what you want to make, and leave with a real first build.",
    who: "Someone with something in their head and no idea what step one is.",
    real: "The idea reading, saved Builds, the Engine Room and the Build Machine all run today.",
    liveUrl: "https://stepinthering.com",
    repoPublic: false,
    status: "live",
    accent: "#2BA6FF",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PREVIEWS THAT LIVE ON ANOTHER SITE
//
// Some previews the owner hands out are not pages of this site. They are
// listed so the directory is complete, and linked so they are findable — but
// each keeps its OWN door and its own passcode. Nothing here weakens the
// protection on the far side, and no passcode appears in this file.
// ─────────────────────────────────────────────────────────────────────────────

export interface ExternalPreview {
  name: string;
  what: string;
  /** Why it is behind a door, in one honest line. */
  why: string;
  href: string;
  /** Which site actually holds the door. */
  host: string;
}

export const EXTERNAL_PREVIEWS: ExternalPreview[] = [
  {
    name: "Health plan example",
    what: "A worked example of a family health document — the questions to ask, the plan, the cautions, and what to bring to the doctor.",
    why: "It's an anonymized demonstration of the format, not anyone's records, and it's shared one person at a time rather than published.",
    href: "https://idontcry.com/family/health-plan-example",
    host: "iDontCry",
  },
];
