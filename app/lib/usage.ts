// ─────────────────────────────────────────────────────────────────────────────
// USAGE COUNTS — how the owner sees whether people use this, without
// watching anyone.
//
// What is counted: an allowlisted event name plus a short structural label
// (a page slug, an engine id). Never what someone typed, never a query
// string, never an IP, cookie, user id or device id. "Daily visitor" is a
// flag this browser keeps for itself so it says "new day" once; nothing that
// identifies the browser is sent.
//
// Browsers asking not to be tracked (Do Not Track / Global Privacy Control)
// send nothing. The owner's own visits are dropped server-side.
// ─────────────────────────────────────────────────────────────────────────────

import { SITE_PAGES } from "../site/registry";

export const USAGE_EVENTS = [
  "page-view",
  "daily-visitor",
  "returning-visitor",
  "idea-shaped",
  "engine-start",
  "engine-output",
  "first-build-round",
  "feedback-sent",
] as const;
export type UsageEvent = (typeof USAGE_EVENTS)[number];

export function isUsageEvent(v: unknown): v is UsageEvent {
  return typeof v === "string" && (USAGE_EVENTS as readonly string[]).includes(v);
}

/** Labels are slugs: lowercase letters, digits and dashes, 40 at most. */
export function cleanSource(v: unknown): string {
  return typeof v === "string" ? v.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40) : "";
}

const PUBLIC_PATHS = new Set(SITE_PAGES.filter((p) => p.access === "public").map((p) => p.path));

/**
 * The page slug for a pathname, or null when the page is not a public page
 * (owner and member pages are never counted). Query strings never get here.
 */
export function pageSlug(pathname: string): string | null {
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (/^\/builds\/[^/]+$/.test(path)) return "builds-item";
  if (!PUBLIC_PATHS.has(path)) return null;
  return path === "/" ? "home" : cleanSource(path.slice(1).replace(/\//g, "-"));
}

/** Respect a browser's request not to be tracked. */
export function trackingRefused(nav: { doNotTrack?: string | null; globalPrivacyControl?: boolean } | undefined): boolean {
  if (!nav) return true;
  return nav.doNotTrack === "1" || nav.globalPrivacyControl === true;
}

/** Fire-and-forget count from the browser. Never throws, never waits. */
export function countUsage(event: UsageEvent, source = ""): void {
  try {
    if (typeof window === "undefined") return;
    if (trackingRefused(navigator as Navigator & { globalPrivacyControl?: boolean })) return;
    const body = JSON.stringify({ event, source: cleanSource(source) });
    if (navigator.sendBeacon?.("/api/usage", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/usage", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {
    // counting must never break a page
  }
}
