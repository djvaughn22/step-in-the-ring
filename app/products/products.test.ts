// Ways to make it real (owner direction, Nov 25 2026). These pages restore
// the commercial structure (do it yourself, do it with us, have us build it)
// without selling anything yet: honest status, no prices, no paid-help offer
// while paid help is paused, and official sources for government steps.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AVAILABILITY_LABEL, PATHS, readyMailto } from "./catalog";
import { PAID_HELP_OPEN } from "../site/paidHelp";

const APP = path.join(__dirname, "..");
const PAGES = [
  "products/page.tsx",
  "products/old-laptop-to-build-machine/page.tsx",
  "products/start-your-own-business/page.tsx",
  "products/catalog.ts",
];
const visible = (rel: string) =>
  readFileSync(path.join(APP, rel), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "");

describe("the three ways to make it real", () => {
  it("are in the owner's order", () => {
    expect(PATHS.map((p) => p.title)).toEqual(["Do it yourself", "Do it with us", "Have us build it"]);
  });

  it("only ever link to pages that exist", () => {
    for (const item of PATHS.flatMap((p) => p.items)) {
      if (!item.href) continue;
      expect(existsSync(path.join(APP, item.href, "page.tsx")), item.href).toBe(true);
    }
  });

  it("put the two recovered guides first, not for sale yet", () => {
    const [first, second] = PATHS[0].items;
    expect(first.title).toBe("Old Laptop to Build Machine");
    expect(second.title).toBe("Start Your Own Business Game Plan");
    expect(first.availability).toBe("coming");
    expect(second.availability).toBe("coming");
    expect(AVAILABILITY_LABEL.coming).toBe("Not on sale yet");
  });

  it("offer no paid help while it is paused", () => {
    const build = PATHS.find((p) => p.id === "build-it")!;
    if (!PAID_HELP_OPEN) {
      expect(build.items.every((i) => i.availability === "paused" && !i.href)).toBe(true);
    }
  });
});

describe("the product pages", () => {
  it.each(PAGES)("%s shows no price, no checkout and no hype", (rel) => {
    const src = visible(rel);
    expect(src).not.toMatch(/\$\s?\d/);
    expect(src).not.toMatch(/buy now|add to cart|checkout|limited time|only \d+ left|was \$|sale ends/i);
    expect(src).not.toMatch(/AI[- ]powered|built with AI|supercharge|game.?chang|revolutioni[sz]e|guarantee|bring your idea to life/i);
  });

  it("say plainly that the guides aren't on sale yet", () => {
    for (const rel of PAGES.slice(1, 3)) expect(visible(rel)).toContain("AVAILABILITY_LABEL.coming");
  });

  it("keep the old-computer promise honest", () => {
    const src = visible("products/old-laptop-to-build-machine/page.tsx");
    expect(src).toContain("Not every old computer can do this.");
    expect(src).toMatch(/href="\/build-machine"/);
    expect(src).toMatch(/Will it erase my computer\?/);
  });

  it("treat business formation as education with official sources", () => {
    const src = visible("products/start-your-own-business/page.tsx");
    expect(src).toContain("not legal, tax or accounting advice");
    expect(src).toContain("https://www.irs.gov/");
    expect(src).toContain("https://www.sba.gov/");
    expect(src).toMatch(/never file anything, buy a domain or open an account for you/i);
    expect(src).toMatch(/Getting an EIN from the IRS is free/);
  });

  it("ask to be told when it's ready by plain email, nothing stored", () => {
    expect(readyMailto("X")).toMatch(/^mailto:ask@openmirrorllc\.com\?subject=/);
  });
});
