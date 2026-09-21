export type OwnerBuildCategory =
  | "websites"
  | "real-world"
  | "games"
  | "media"
  | "products"
  | "experiments";

export type OwnerBuildStatus = "Live" | "Product" | "Game" | "Experiment" | "In progress";

export type OwnerBuild = {
  name: string;
  description: string;
  category: OwnerBuildCategory;
  categoryLabel: string;
  lesson: string;
  href: string;
  external: boolean;
  status: OwnerBuildStatus;
  emoji: string;
  accent: string;
  featured?: boolean;
};

// Public, verified destinations only. Keep this registry small enough to
// review whenever a new build becomes part of the showroom.
export const OWNER_BUILD_CATEGORIES: Array<{ id: "all" | OwnerBuildCategory; label: string }> = [
  { id: "all", label: "All builds" },
  { id: "websites", label: "Websites & causes" },
  { id: "real-world", label: "Family & real-world tools" },
  { id: "games", label: "Games & interactive" },
  { id: "media", label: "Books & media" },
  { id: "products", label: "Products & systems" },
  { id: "experiments", label: "Experiments" },
];

export const OWNER_BUILDS: OwnerBuild[] = [
  {
    name: "Step In The Ring",
    description: "Turn a rough idea into a clear plan, a first build, and a next move.",
    category: "products",
    categoryLabel: "Products & systems",
    lesson: "What it shows: a creation tool can make the next step feel concrete without taking the idea away from its owner.",
    href: "/",
    external: false,
    status: "Product",
    emoji: "🥊",
    accent: "#2BA6FF",
    featured: true,
  },
  {
    name: "Ready to Build",
    description: "A computer-first path for checking, protecting, preparing, and building with the machine you already have.",
    category: "products",
    categoryLabel: "Products & systems",
    lesson: "What it shows: a practical product can explain the safe first step before asking someone to buy or build.",
    href: "/products/ready-to-build",
    external: false,
    status: "Product",
    emoji: "🧰",
    accent: "#60A5FA",
    featured: true,
  },
  {
    name: "CrossHeartPray",
    description: "A quiet daily place to read Scripture, follow a reading plan, and pray.",
    category: "websites",
    categoryLabel: "Websites & causes",
    lesson: "What it shows: stored source material, thoughtful pacing, and small daily actions can make a calm public website.",
    href: "https://crossheartpray.com",
    external: true,
    status: "Live",
    emoji: "✝️",
    accent: "#C9A94A",
    featured: true,
  },
  {
    name: "TheDJCares",
    description: "Music, videos, podcasts, and sermons selected on purpose rather than by an endless algorithm.",
    category: "media",
    categoryLabel: "Books & media",
    lesson: "What it shows: an approved catalog and ordinary media players can support a useful experience without inventing every recommendation.",
    href: "https://thedjcares.com",
    external: true,
    status: "Live",
    emoji: "🎵",
    accent: "#7FB3D5",
    featured: true,
  },
  {
    name: "DontCloneMeTom",
    description: "Handwritten-name trading cards for real dogs, with a Dog of the Day and a card maker.",
    category: "websites",
    categoryLabel: "Websites & causes",
    lesson: "What it shows: a small, specific idea can become a memorable product with a clear visual voice.",
    href: "https://dontclonemetom.com",
    external: true,
    status: "Live",
    emoji: "🐶",
    accent: "#E0894A",
  },
  {
    name: "iDontCry",
    description: "A family playground of games, experiments, and small interactive experiences.",
    category: "real-world",
    categoryLabel: "Family & real-world tools",
    lesson: "What it shows: a project family can hold many small experiences while keeping each one easy to open.",
    href: "https://idontcry.com",
    external: true,
    status: "Live",
    emoji: "😂",
    accent: "#F5A524",
  },
  {
    name: "iDontCry Sports Desk",
    description: "Follow school and college sports through schedules, results, and family-focused team pages.",
    category: "real-world",
    categoryLabel: "Family & real-world tools",
    lesson: "What it shows: a useful data product can combine trusted source connections, stored records, and thoughtful navigation without inventing scores.",
    href: "https://idontcry.com/sports",
    external: true,
    status: "Live",
    emoji: "🏟️",
    accent: "#F5A524",
    featured: true,
  },
  {
    name: "iDontCry Football",
    description: "A playable football game built for a quick start and a real score to beat.",
    category: "games",
    categoryLabel: "Games & interactive",
    lesson: "What it shows: a game can teach its rule on the screen and make the next play obvious on a phone.",
    href: "https://idontcry.com/games/football",
    external: true,
    status: "Game",
    emoji: "🏈",
    accent: "#F5A524",
  },
  {
    name: "OpenDoku",
    description: "Sudoku with a second puzzle hidden in every tile.",
    category: "games",
    categoryLabel: "Games & interactive",
    lesson: "What it shows: a familiar rule can become a fresh experience when the interaction adds one clear twist.",
    href: "https://opendoku.com",
    external: true,
    status: "Game",
    emoji: "🧩",
    accent: "#6FBF9B",
  },
  {
    name: "WatchedNotWatched",
    description: "Keep track of what you have watched and find the next thing worth your night.",
    category: "media",
    categoryLabel: "Books & media",
    lesson: "What it shows: search, saved choices, and provider data can turn a common frustration into a focused tool.",
    href: "https://watchednotwatched.com/?mode=screen",
    external: true,
    status: "Live",
    emoji: "🎬",
    accent: "#8FA3B0",
    featured: true,
  },
  {
    name: "ReadNotRead",
    description: "The book-focused experience for finding, tracking, and exploring what you want to read.",
    category: "media",
    categoryLabel: "Books & media",
    lesson: "What it shows: one product can support a distinct mode when the copy, data, and navigation agree.",
    href: "https://watchednotwatched.com/?mode=book",
    external: true,
    status: "Live",
    emoji: "📚",
    accent: "#8FA3B0",
  },
  {
    name: "Open Mirror",
    description: "The hub that holds the family of sites and their shared design system together.",
    category: "websites",
    categoryLabel: "Websites & causes",
    lesson: "What it shows: a shared foundation can give many small products a consistent front door.",
    href: "https://openmirrorllc.com",
    external: true,
    status: "Live",
    emoji: "🪞",
    accent: "#D6CDBE",
  },
  {
    name: "PleaseBeReady",
    description: "A short daily readiness check with practical gear that backs it up.",
    category: "websites",
    categoryLabel: "Websites & causes",
    lesson: "What it shows: a narrow promise and a repeatable daily action can be enough for a useful site.",
    href: "https://pleasebeready.com",
    external: true,
    status: "Live",
    emoji: "🧭",
    accent: "#9CB380",
  },
  {
    name: "WhatAmIAI",
    description: "A plain-language look at what AI systems are and are not.",
    category: "experiments",
    categoryLabel: "Experiments",
    lesson: "What it shows: an unfinished idea can still be useful when its questions are made clear.",
    href: "https://whatamiai.com",
    external: true,
    status: "In progress",
    emoji: "🤖",
    accent: "#B0A695",
  },
  {
    name: "Five Hour Sprint",
    description: "A focused build-window plan for turning one working session into a concrete packet.",
    category: "products",
    categoryLabel: "Products & systems",
    lesson: "What it shows: a useful constraint can turn a large ambition into one finishable work session.",
    href: "/products/five-hour-sprint",
    external: false,
    status: "Product",
    emoji: "⏱️",
    accent: "#2BA6FF",
  },
];

export function ownerBuildsForCategory(category: "all" | OwnerBuildCategory): OwnerBuild[] {
  return category === "all" ? OWNER_BUILDS : OWNER_BUILDS.filter((build) => build.category === category);
}
