// ─────────────────────────────────────────────────────────────────────────────
// OUR WORK: the one list of what Open Mirror has built, shown on Made here
// (/builds, which /work redirects to) and, for the featured few, on the home
// page.
//
// Layout (owner, Nov 10, after the grouped version): big showcase tiles. Two
// spotlight tiles for the iDontCry sports desk and arcade, then one grid of
// tiles, then a quiet line for the tools that live on this site. Little text.
//
// Rules:
//   - These are Open Mirror's own projects, planned, built and run by us.
//     None of them is client work, and the page says so.
//   - No invented clients, testimonials, traffic, revenue or statistics.
//   - Only live, presentable projects. Every outside address must belong to a
//     project marked live in the registry's ECOSYSTEM, and every address was
//     opened before it was listed. Unfinished projects (WhatAmIAI) stay off.
//   - `links` name the real things inside a project (the games, the sports
//     pages) so they aren't hidden in a generic description.
// ─────────────────────────────────────────────────────────────────────────────

import { ECOSYSTEM } from "../site/registry";

export interface WorkLink {
  label: string;
  href: string;
}

export interface WorkItem {
  name: string;
  /** spotlight = the big tiles up top; tile = the grid; onsite = the quiet line. */
  kind: "spotlight" | "tile" | "onsite";
  /** A short tag on the tile. CrossHeartPray is "Outreach" (owner, Oct 8). */
  tag: "Live" | "Games" | "Tool" | "Outreach";
  emoji: string;
  accent: string;
  href: string;
  /** One short line. */
  line: string;
  /** Named things inside it, each a real page. */
  links?: WorkLink[];
  /** One of the few shown on the home page. */
  featured?: boolean;
}

const IDC = "https://idontcry.com";

export const WORK: WorkItem[] = [
  {
    name: "iDontCry Sports Desk",
    kind: "spotlight",
    tag: "Live",
    emoji: "🏟️",
    accent: "#F5A524",
    href: `${IDC}/sports`,
    line: "Scores, schedules and playoff brackets for the high school, college and pro teams a family follows.",
    links: [
      { label: "Add a team", href: `${IDC}/sports/follow` },
      { label: "Explore sports", href: `${IDC}/sports/explore` },
    ],
    featured: true,
  },
  {
    name: "iDontCry Family Arcade",
    kind: "spotlight",
    tag: "Games",
    emoji: "🎮",
    accent: "#3B9EFF",
    href: `${IDC}/games`,
    line: "Games you play right in the browser, on a phone or a computer. No download.",
    links: [
      { label: "Football", href: `${IDC}/games/football` },
      { label: "Baseball", href: `${IDC}/games/baseball` },
      { label: "Skiing", href: `${IDC}/games/skiing` },
      { label: "Track & Field", href: `${IDC}/games/track-and-field` },
      { label: "Circuit", href: `${IDC}/games/circuit` },
      { label: "SlopeDoku", href: `${IDC}/snowdoku` },
    ],
    featured: true,
  },
  {
    name: "OpenDoku",
    kind: "tile",
    tag: "Games",
    emoji: "🧩",
    accent: "#6FBF9B",
    href: "https://opendoku.com",
    line: "Sudoku with a twist, plus puzzles made from your own photo.",
  },
  {
    name: "PleaseBeReady",
    kind: "tile",
    tag: "Live",
    emoji: "🧰",
    accent: "#E8833A",
    href: "https://pleasebeready.com",
    line: "A readiness checklist, a stock-up planner and hand-checked supplies.",
    featured: true,
  },
  {
    name: "WatchedNotWatched",
    kind: "tile",
    tag: "Live",
    emoji: "🎬",
    accent: "#8FA3B0",
    href: "https://watchednotwatched.com",
    line: "Track what you've watched and find what's next. Books too.",
  },
  {
    name: "DontCloneMeTom.com",
    kind: "tile",
    tag: "Live",
    emoji: "🐶",
    accent: "#E0894A",
    href: "https://dontclonemetom.com",
    line: "Rescue dogs near you, with a Dog of the Day.",
  },
  {
    name: "iDontCry",
    kind: "tile",
    tag: "Live",
    emoji: "😂",
    accent: "#F5A524",
    href: IDC,
    line: "The family site: jokes, piano lessons and kid-safe search.",
  },
  {
    name: "CrossHeartPray",
    kind: "tile",
    tag: "Outreach",
    emoji: "✝️",
    accent: "#C9A94A",
    href: "https://crossheartpray.com",
    line: "A quiet daily place to read Scripture and pray.",
    featured: true,
  },
  {
    name: "TheDJCares",
    kind: "tile",
    tag: "Live",
    emoji: "🎵",
    accent: "#7FB3D5",
    href: "https://thedjcares.com",
    line: "Music and encouragement, picked by hand.",
  },
  {
    name: "Open Mirror",
    kind: "tile",
    tag: "Live",
    emoji: "🪞",
    accent: "#D6CDBE",
    href: "https://openmirrorllc.com",
    line: "The company site that ties every project together.",
  },
  {
    name: "Ready to Build",
    kind: "onsite",
    tag: "Tool",
    emoji: "🧰",
    accent: "#60A5FA",
    href: "/products/ready-to-build",
    line: "Gets your computer ready for building.",
  },
  {
    name: "Five Hour Sprint",
    kind: "onsite",
    tag: "Tool",
    emoji: "⏱️",
    accent: "#60A5FA",
    href: "/five-hour-sprint-tool",
    line: "Plans one five-hour work session.",
  },
];

export function isExternal(href: string): boolean {
  return /^https:\/\//.test(href);
}

/** The ECOSYSTEM project an outside address belongs to, by host. */
export function ecosystemFor(href: string) {
  if (!isExternal(href)) return undefined;
  const host = new URL(href).host;
  return ECOSYSTEM.find((p) => p.liveUrl && new URL(p.liveUrl).host === host);
}

export const SPOTLIGHT_WORK: WorkItem[] = WORK.filter((w) => w.kind === "spotlight");
export const TILE_WORK: WorkItem[] = WORK.filter((w) => w.kind === "tile");
export const ONSITE_WORK: WorkItem[] = WORK.filter((w) => w.kind === "onsite");
/** Live sites and games, not counting the tools on this site. */
export const SHOWCASE_COUNT = SPOTLIGHT_WORK.length + TILE_WORK.length;
export const FEATURED_WORK: WorkItem[] = WORK.filter((w) => w.featured);
