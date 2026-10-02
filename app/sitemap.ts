import type { MetadataRoute } from "next";
import { SITE_PAGES } from "./site/registry";

// Built from the site registry, so a page can't be in the menu but missing
// here. Only public pages that are meant to be found: nothing behind a
// door, nothing marked noindex.
const BASE = "https://stepinthering.com";

export function sitemapPaths(): string[] {
  return SITE_PAGES.filter((p) => p.access === "public" && !p.noindex).map((p) => p.path);
}

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapPaths().map((path) => ({
    url: `${BASE}${path === "/" ? "" : path}`,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : path.startsWith("/tools") || path === "/create" ? 0.8 : 0.5,
  }));
}
