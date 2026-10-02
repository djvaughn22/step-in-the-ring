import { describe, expect, it } from "vitest";
import sitemap, { sitemapPaths } from "./sitemap";
import robots from "./robots";

describe("sitemap", () => {
  it("lists the free tools and public pages, never a door or a noindex page", () => {
    const paths = sitemapPaths();
    for (const p of ["/", "/tools", "/tools/first-version", "/tools/try-it", "/tools/launch-checklist", "/five-hour-sprint-tool", "/engines"]) {
      expect(paths).toContain(p);
    }
    for (const p of ["/owner", "/projects", "/author", "/account", "/engines/room", "/preview"]) {
      expect(paths).not.toContain(p);
    }
    expect(sitemap().every((e) => e.url.startsWith("https://stepinthering.com"))).toBe(true);
  });

  it("is announced in robots.txt", () => {
    expect(robots().sitemap).toBe("https://stepinthering.com/sitemap.xml");
  });
});
