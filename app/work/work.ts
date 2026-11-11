// ─────────────────────────────────────────────────────────────────────────────
// OUR WORK: the one list of what Open Mirror has built, shown on Made here
// (/builds, which /work redirects to) and, for the featured few, on the home
// page. There used to be two lists (Made here and Our work) that disagreed;
// this replaced both.
//
// Rules:
//   - These are Open Mirror's own projects, planned, built and run by us.
//     None of them is client work, and the page says so.
//   - No invented clients, testimonials, traffic, revenue or statistics.
//   - Only live, presentable projects. Every outside address must belong to a
//     project marked live in the registry's ECOSYSTEM, and every address was
//     opened before it was listed. Unfinished projects stay off.
//   - "shows" is what a customer could hire us for, plain and true today.
//   - `links` name the real things inside a project (the games, the sports
//     pages) so they aren't hidden in a generic description.
// ─────────────────────────────────────────────────────────────────────────────

import { ECOSYSTEM } from "../site/registry";

export type WorkGroupId = "sports-games" | "everyday" | "daily" | "here";

export const WORK_GROUPS: { id: WorkGroupId; title: string; note: string }[] = [
  { id: "sports-games", title: "Sports and games", note: "A live sports desk and games you can play in the browser." },
  { id: "everyday", title: "Everyday tools and catalogs", note: "Search, lists and planners people come back to." },
  { id: "daily", title: "Family, faith and music", note: "Sites with something new each day." },
  { id: "here", title: "On this site, and the company", note: "Tools that run here, and the hub that ties every site together." },
];

export interface WorkLink {
  label: string;
  href: string;
}

export interface WorkItem {
  name: string;
  group: WorkGroupId;
  /** A short tag on the card. CrossHeartPray is "Outreach" (owner, Oct 8). */
  tag: "Live" | "Games" | "Tool" | "Outreach";
  emoji: string;
  accent: string;
  href: string;
  /** What it is, one line. */
  what: string;
  /** What it shows a customer we can build, one line. */
  shows: string;
  /** Named things inside it, each a real page. */
  links?: WorkLink[];
  /** One of the few shown on the home page. */
  featured?: boolean;
}

const IDC = "https://idontcry.com";

export const WORK: WorkItem[] = [
  {
    name: "iDontCry Sports Desk",
    group: "sports-games",
    tag: "Live",
    emoji: "🏟️",
    accent: "#F5A524",
    href: `${IDC}/sports`,
    what: "Scores, schedules, results and playoff brackets for the high school, college and pro teams a family follows.",
    shows: "A site that updates itself from public sources, with saved teams and no sign-up.",
    links: [
      { label: "Sports Desk", href: `${IDC}/sports` },
      { label: "Add a team", href: `${IDC}/sports/follow` },
      { label: "Explore sports", href: `${IDC}/sports/explore` },
    ],
    featured: true,
  },
  {
    name: "iDontCry Family Arcade",
    group: "sports-games",
    tag: "Games",
    emoji: "🎮",
    accent: "#F5A524",
    href: `${IDC}/games`,
    what: "Games you play right in the browser on a phone or computer. No download, and progress saves on your device.",
    shows: "Touch controls, quick starts and games built to feel good on a phone.",
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
    group: "sports-games",
    tag: "Games",
    emoji: "🧩",
    accent: "#6FBF9B",
    href: "https://opendoku.com",
    what: "Sudoku with a twist in every board, plus picture puzzles made from your own photo.",
    shows: "Puzzle rules and fresh boards that run in the browser.",
    links: [
      { label: "SurfDoku", href: "https://opendoku.com/surfdoku/" },
      { label: "MineDoku", href: "https://opendoku.com/minedoku/" },
      { label: "Picture Sudoku", href: "https://opendoku.com/picture-sudoku/" },
      { label: "Face Slide", href: "https://opendoku.com/face-slide/" },
    ],
  },
  {
    name: "PleaseBeReady",
    group: "everyday",
    tag: "Live",
    emoji: "🧰",
    accent: "#9CB380",
    href: "https://pleasebeready.com",
    what: "A readiness checklist, a stock-up planner and a store of hand-checked supplies.",
    shows: "A large catalog with search that understands everyday words.",
    featured: true,
  },
  {
    name: "WatchedNotWatched",
    group: "everyday",
    tag: "Live",
    emoji: "🎬",
    accent: "#8FA3B0",
    href: "https://watchednotwatched.com",
    what: "Keep track of what you've watched and find the next thing worth your night. Books too.",
    shows: "Fast search over a large catalog, with lists saved on your device.",
    links: [
      { label: "Movies and shows", href: "https://watchednotwatched.com/?mode=screen" },
      { label: "Books (ReadNotRead)", href: "https://watchednotwatched.com/?mode=book" },
    ],
  },
  {
    name: "DontCloneMeTom.com",
    group: "everyday",
    tag: "Live",
    emoji: "🐶",
    accent: "#E0894A",
    href: "https://dontclonemetom.com",
    what: "Rescue dogs near you, gathered from shelter listings, with a Dog of the Day.",
    shows: "Listings gathered from other sites every day, with filters and location search.",
  },
  {
    name: "iDontCry",
    group: "daily",
    tag: "Live",
    emoji: "😂",
    accent: "#F5A524",
    href: IDC,
    what: "The family site around the sports desk and games: jokes, piano lessons and kid-safe search.",
    shows: "Many sections under one menu, easy to find on a phone.",
    links: [
      { label: "Jokes", href: `${IDC}/jokes` },
      { label: "Piano Corner", href: `${IDC}/piano` },
      { label: "Learn", href: `${IDC}/learn` },
    ],
  },
  {
    name: "CrossHeartPray",
    group: "daily",
    tag: "Outreach",
    emoji: "✝️",
    accent: "#C9A94A",
    href: "https://crossheartpray.com",
    what: "A quiet daily place to read Scripture, follow a reading plan and pray.",
    shows: "Daily content on a schedule, and reading plans that remember where you are.",
    featured: true,
  },
  {
    name: "TheDJCares",
    group: "daily",
    tag: "Live",
    emoji: "🎵",
    accent: "#7FB3D5",
    href: "https://thedjcares.com",
    what: "Music, videos and encouragement, picked on purpose rather than by an algorithm.",
    shows: "A hand-picked library and a music player built around it.",
  },
  {
    name: "Step In The Ring",
    group: "here",
    tag: "Tool",
    emoji: "🟦",
    accent: "#2BA6FF",
    href: "/",
    what: "This site: free tools for making things with AI, and the request form for hiring us.",
    shows: "Step-by-step flows, and a secure form with an owner inbox.",
  },
  {
    name: "Ready to Build",
    group: "here",
    tag: "Tool",
    emoji: "🧰",
    accent: "#60A5FA",
    href: "/products/ready-to-build",
    what: "A guide that checks the computer you have and helps you set it up for building.",
    shows: "A question-at-a-time guide that explains each step before anything changes.",
  },
  {
    name: "Five Hour Sprint",
    group: "here",
    tag: "Tool",
    emoji: "⏱️",
    accent: "#60A5FA",
    href: "/five-hour-sprint-tool",
    what: "A planner that turns one five-hour work session into a concrete plan.",
    shows: "A focused planning tool with a clear end result.",
  },
  {
    name: "Open Mirror",
    group: "here",
    tag: "Live",
    emoji: "🪞",
    accent: "#D6CDBE",
    href: "https://openmirrorllc.com",
    what: "The company site that lists every project and shares one header, footer and theme with them.",
    shows: "A shared design kept in step across many sites.",
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

export function workByGroup(): { group: (typeof WORK_GROUPS)[number]; items: WorkItem[] }[] {
  return WORK_GROUPS.map((group) => ({ group, items: WORK.filter((w) => w.group === group.id) }));
}

export const FEATURED_WORK: WorkItem[] = WORK.filter((w) => w.featured);
