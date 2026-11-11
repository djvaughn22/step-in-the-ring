// Made here (Nov 10): one grouped portfolio from app/work/work.ts. It replaced
// the old filterable showroom list, which disagreed with Our work.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import OwnerBuildsShowroom from "./OwnerBuildsShowroom";
import { WORK, WORK_GROUPS } from "../work/work";

const html = () => renderToStaticMarkup(createElement(OwnerBuildsShowroom));

describe("Made here", () => {
  it("keeps one h1 and both next steps at the top and the bottom", () => {
    const h = html();
    expect(h.match(/<h1/g)).toHaveLength(1);
    expect(h).toContain("See what we&#x27;ve built.");
    expect(h).toMatch(/<a class="btn btn-gold" href="\/create">Make something like this/);
    expect(h.match(/href="\/request"/g)?.length).toBe(2);
    expect(h).toContain('href="/services"');
    expect(h).toContain("not client work");
  });

  it("shows every project once, under its group heading", () => {
    const h = html();
    for (const g of WORK_GROUPS) expect(h).toContain(`>${g.title}</h2>`);
    const cards = h.match(/<article class="pf-card"/g) ?? [];
    expect(cards).toHaveLength(WORK.length);
    for (const w of WORK) expect(h).toContain(`>${w.name.replace(/&/g, "&amp;")}</h3>`);
  });

  it("opens outside sites in a new tab and keeps this site's pages in place", () => {
    const h = html();
    expect(h).toContain('href="https://crossheartpray.com" target="_blank" rel="noopener noreferrer"');
    expect(h).toContain('href="https://idontcry.com/games/football" target="_blank" rel="noopener noreferrer"');
    expect(h).toMatch(/<a class="pf-visit" href="\/products\/ready-to-build">/);
    expect(h).toContain('href="/five-hour-sprint-tool"');
    expect(h).not.toContain('href="/products/five-hour-sprint"');
  });

  it("every card ends with its Visit link", () => {
    const cards = html().split('<article class="pf-card"').slice(1);
    for (const c of cards) expect(c.replace(/<\/article>[\s\S]*$/, "")).toMatch(/class="pf-visit"[^>]*>[^<]*(<span[^>]*>[^<]*<\/span>)?<\/a>$/);
  });
});
