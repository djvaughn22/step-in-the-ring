// The status page is only useful if it is true. These tests keep it tied to
// the real catalog and the real routes, and keep sales language off it.
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import WhatsBuiltPage from "./page";
import { SITE_PAGES } from "../site/registry";
import { enginesByGroup } from "../vnext/capabilities";

const html = renderToStaticMarkup(createElement(WhatsBuiltPage));
const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
const engines = enginesByGroup().flatMap((g) => g.items).filter((c) => c.kind === "engine");
const publicPaths = new Set(SITE_PAGES.filter((p) => p.access === "public").map((p) => p.path));

describe("What's built", () => {
  it("is a registered public page", () => {
    expect(publicPaths.has("/whats-built")).toBe(true);
  });

  it("links only to public pages or to an engine visitors can open", () => {
    const openEngines = new Set(engines.filter((c) => !c.ownerOnly).map((c) => c.href));
    for (const href of hrefs) {
      if (href.startsWith("mailto:")) continue;
      const ok = publicPaths.has(href.split("#")[0]) || openEngines.has(href);
      expect(ok, `${href} is not an open page`).toBe(true);
    }
  });

  it("lists every engine on the Engines page, and never links an owner-only one", () => {
    for (const c of engines) {
      if (c.ownerOnly) expect(hrefs).not.toContain(c.href);
      else expect(hrefs).toContain(c.href);
    }
  });

  it("labels beta engines as beta, not as working", () => {
    const beta = engines.filter((c) => !c.ownerOnly && c.activation !== "working");
    expect(beta.length).toBeGreaterThan(0);
    const betaSection = html.split('id="beta"')[1]?.split('id="private"')[0] ?? "";
    for (const c of beta) expect(betaSection).toContain(c.href);
  });

  // Engine descriptions come from the catalog and may talk about pricing YOUR
  // product (the Sell Engine). The page's own words must sell nothing.
  it("sells nothing", () => {
    let text = html.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'");
    for (const c of engines) text = text.split(c.what.replace(/&/g, "&amp;")).join(" ");
    expect(text).not.toMatch(/\$\s?\d|\bprice|\bcheckout|\bbuy now|\bsubscribe|\bwaitlist/i);
  });
});
