// ─────────────────────────────────────────────────────────────────────────────
// OUR WORK: selected Open Mirror projects, as a portfolio for Build it with us.
//
// Rules (owner brief, 2026-11-10):
//   - These are Open Mirror's own projects, planned, built and run by us.
//     None of them is client work, and the page says so.
//   - No invented clients, testimonials, traffic, revenue or statistics.
//   - "Shows" is what a customer could hire us for, stated plainly, and true
//     of the live site today.
//   - Names, addresses and colours come from the registry's ECOSYSTEM, so a
//     renamed or retired project can't linger here.
// ─────────────────────────────────────────────────────────────────────────────

import { ECOSYSTEM, type EcosystemProject } from "../site/registry";

export interface WorkItem {
  name: string;
  /** What it is, one line. */
  what: string;
  /** What it shows a customer we can do. */
  shows: string[];
}

export const WORK: WorkItem[] = [
  {
    name: "iDontCry",
    what: "A family sports desk with scores, schedules and results, plus an arcade of phone games.",
    shows: [
      "A large site that updates from public sources",
      "Phone-first layouts and touch games",
      "Many sections kept easy to find",
    ],
  },
  {
    name: "PleaseBeReady",
    what: "A readiness checklist and planner, with a store of hand-checked supplies.",
    shows: [
      "A big catalog with search that understands everyday words",
      "Planners people return to",
      "Clear product disclosures",
    ],
  },
  {
    name: "CrossHeartPray",
    what: "A calm daily place to read Scripture, follow a reading plan and pray.",
    shows: [
      "Daily content on a schedule",
      "Reading plans that remember where you are",
      "A quiet, readable design",
    ],
  },
  {
    name: "DontCloneMeTom.com",
    what: "Rescue dogs near you, gathered from shelter listings, with a Dog of the Day.",
    shows: [
      "Listings gathered from other sites every day",
      "Filters and use-my-location search",
      "A daily feature picked automatically",
    ],
  },
  {
    name: "WatchedNotWatched",
    what: "Keep track of what you've watched and find the next thing worth your night.",
    shows: ["Fast search over a large catalog", "Lists saved on your device", "Recommendations people can browse"],
  },
  {
    name: "Step In The Ring",
    what: "This site: a workspace for making things with AI, with tools, guides and this request form.",
    shows: ["Guided, step-by-step flows", "Privacy built in: what you type stays on your device", "A secure request form with an owner inbox"],
  },
];

export function workWithIdentity(): (WorkItem & { project: EcosystemProject })[] {
  return WORK.map((w) => {
    const project = ECOSYSTEM.find((p) => p.name === w.name);
    if (!project || !project.liveUrl || project.status !== "live") throw new Error(`Portfolio entry ${w.name} is not a live project in the registry`);
    return { ...w, project };
  });
}
