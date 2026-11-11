// Made here (owner, Nov 10): big showcase tiles from app/work/work.ts. Two
// spotlight tiles (the iDontCry sports desk and arcade), one grid of tiles,
// and a quiet line for the tools on this site. It replaced a grouped layout.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import OwnerBuildsShowroom from "./OwnerBuildsShowroom";
import { ONSITE_WORK, SHOWCASE_COUNT, SPOTLIGHT_WORK, TILE_WORK } from "../work/work";

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
    expect(h).toContain(`${SHOWCASE_COUNT} live sites and games`);
  });

  it("shows the two spotlights, every tile once, and the on-site tools as a line", () => {
    const h = html();
    expect(h.match(/<article class="pf-spot"/g)).toHaveLength(SPOTLIGHT_WORK.length);
    expect(h.match(/class="pf-tile"/g)).toHaveLength(TILE_WORK.length);
    for (const w of [...SPOTLIGHT_WORK, ...TILE_WORK]) expect(h).toContain(w.name.replace(/&/g, "&amp;"));
    for (const w of ONSITE_WORK) expect(h).toContain(`href="${w.href}">${w.name}</a>`);
    expect(h).not.toMatch(/pf-group|What it shows/);
  });

  it("names the games and sports pages inside the spotlights", () => {
    const h = html();
    for (const label of ["Football", "Baseball", "Skiing", "Track &amp; Field", "Circuit", "Add a team"]) expect(h).toContain(`>${label}</a>`);
    expect(h).toContain("Play the Family Arcade");
    expect(h).toContain("Open the Sports Desk");
  });

  it("opens outside sites in a new tab and keeps this site's pages in place", () => {
    const h = html();
    expect(h).toContain('class="pf-tile" href="https://crossheartpray.com" target="_blank" rel="noopener noreferrer"');
    expect(h).toContain('href="https://idontcry.com/games/football" target="_blank" rel="noopener noreferrer"');
    expect(h).toContain('href="/products/ready-to-build">Ready to Build</a>');
    expect(h).toContain('href="/five-hour-sprint-tool"');
    expect(h).not.toContain('href="/products/five-hour-sprint"');
  });
});
