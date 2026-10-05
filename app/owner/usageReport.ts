// Turns raw usage rows (event, source, Central day, count) into what the
// owner actually asks: are people coming, are they coming back, and what do
// they use? Pure, so it is tested without a database.

import type { EventSummaryRow } from "../members/store";
import { SITE_PAGES } from "../site/registry";
import { pageSlug } from "../lib/usage";

export interface UsageTotals {
  visitors: number;
  returning: number;
  pageViews: number;
  ideas: number;
  engineStarts: number;
  engineOutputs: number;
  firstBuildRounds: number;
  feedback: number;
}

export interface UsageReport {
  last7: UsageTotals;
  last30: UsageTotals;
  /** Newest first, every day in the window even when nothing happened. */
  days: { day: string; visitors: number; pageViews: number; ideas: number; engineOutputs: number }[];
  topPages: { name: string; slug: string; views: number }[];
  engines: { id: string; starts: number; outputs: number }[];
}

const EMPTY: UsageTotals = { visitors: 0, returning: 0, pageViews: 0, ideas: 0, engineStarts: 0, engineOutputs: 0, firstBuildRounds: 0, feedback: 0 };

const FIELD: Record<string, keyof UsageTotals> = {
  "daily-visitor": "visitors",
  "returning-visitor": "returning",
  "page-view": "pageViews",
  "idea-shaped": "ideas",
  "engine-start": "engineStarts",
  "engine-output": "engineOutputs",
  "first-build-round": "firstBuildRounds",
  "feedback-sent": "feedback",
};

/** Central-time day keys, newest first: today and the n-1 days before it. */
export function dayKeys(now: Date, n: number): string[] {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" });
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(fmt.format(new Date(now.getTime() - i * 86_400_000)));
  return [...new Set(out)];
}

const SLUG_NAME = new Map(
  SITE_PAGES.filter((p) => p.access === "public").map((p) => [pageSlug(p.path) ?? "", p.name] as const),
);
SLUG_NAME.set("builds-item", "A single build");

export function buildUsageReport(rows: EventSummaryRow[], now: Date = new Date()): UsageReport {
  const days30 = dayKeys(now, 30);
  const in7 = new Set(days30.slice(0, 7));
  const in30 = new Set(days30);
  const last7 = { ...EMPTY };
  const last30 = { ...EMPTY };
  const perDay = new Map<string, { visitors: number; pageViews: number; ideas: number; engineOutputs: number }>();
  const pages = new Map<string, number>();
  const engines = new Map<string, { starts: number; outputs: number }>();

  for (const r of rows) {
    if (!in30.has(r.day)) continue;
    const field = FIELD[r.event];
    if (!field) continue;
    last30[field] += r.count;
    if (in7.has(r.day)) last7[field] += r.count;

    const d = perDay.get(r.day) ?? { visitors: 0, pageViews: 0, ideas: 0, engineOutputs: 0 };
    if (field === "visitors" || field === "pageViews" || field === "ideas" || field === "engineOutputs") d[field] += r.count;
    perDay.set(r.day, d);

    if (r.event === "page-view" && r.source) pages.set(r.source, (pages.get(r.source) ?? 0) + r.count);
    if ((r.event === "engine-start" || r.event === "engine-output") && r.source) {
      const e = engines.get(r.source) ?? { starts: 0, outputs: 0 };
      if (r.event === "engine-start") e.starts += r.count;
      else e.outputs += r.count;
      engines.set(r.source, e);
    }
  }

  return {
    last7,
    last30,
    days: days30.slice(0, 14).map((day) => ({ day, ...(perDay.get(day) ?? { visitors: 0, pageViews: 0, ideas: 0, engineOutputs: 0 }) })),
    topPages: [...pages]
      .map(([slug, views]) => ({ slug, name: SLUG_NAME.get(slug) ?? slug, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15),
    engines: [...engines]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.starts + b.outputs - (a.starts + a.outputs)),
  };
}
