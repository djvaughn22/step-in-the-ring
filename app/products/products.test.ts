// Ways to make it real (owner direction, Nov 25 2026). These pages restore
// the commercial structure (do it yourself, do it with us, have us build it)
// without selling anything yet: honest status, no prices, no paid-help offer
// while paid help is paused, and official sources for government steps.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AVAILABILITY_LABEL, DETAIL_LABELS, HELP_LINE, PATHS, paidItems, publicPaths, readyMailto } from "./catalog";
import { SITE_PAGES } from "../site/registry";
import { PAID_HELP_OPEN } from "../site/paidHelp";

const APP = path.join(__dirname, "..");
// The two guide pages and the scope summary were removed (owner, Nov 26-27
// 2026); git tag pre-overnight-20261127 keeps them.
const PAGES = ["products/page.tsx", "products/catalog.ts"];
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

  it("say six plain things about everything someone would pay for", () => {
    expect(paidItems().length).toBeGreaterThanOrEqual(6);
    for (const item of paidItems()) {
      expect(item.detail, item.title).toBeDefined();
      for (const key of Object.keys(DETAIL_LABELS) as (keyof typeof DETAIL_LABELS)[]) {
        expect(item.detail![key].trim().length, `${item.title}: ${key}`).toBeGreaterThan(8);
      }
    }
  });


  it("offer no paid help while it is paused", () => {
    const build = PATHS.find((p) => p.id === "build-it")!;
    if (!PAID_HELP_OPEN) {
      expect(build.items.every((i) => i.availability === "paused")).toBe(true);
      expect(build.items.every((i) => /aren't taking new projects/.test(i.line))).toBe(true);
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




  it("ask to be told when it's ready by plain email, nothing stored", () => {
    expect(readyMailto("X")).toMatch(/^mailto:ask@openmirrorllc\.com\?subject=/);
  });
});

// Owner direction (Nov 26-27 2026): remove premature monetization. The planned
// paid products stay in catalog.ts as the record, but the public pages list
// only what someone can use today, and bigger help is one plain email.
describe("the public pages list only what's usable now", () => {
  it("show free things only, and no have-us-build-it path while paid help is paused", () => {
    const shown = publicPaths().flatMap((p) => p.items);
    expect(shown.length).toBeGreaterThanOrEqual(5);
    expect(shown.every((i) => i.availability === "free")).toBe(true);
    if (!PAID_HELP_OPEN) expect(publicPaths().some((p) => p.id === "build-it")).toBe(false);
  });

  it("the products page reads publicPaths, not the full list, and asks for no sign-ups", () => {
    const src = visible("products/page.tsx");
    expect(src).toContain("publicPaths()");
    expect(src).not.toMatch(/PATHS\.map/);
    expect(src).not.toMatch(/hear when|tell me when/i);
    expect(src).toContain("HELP_LINE");
    expect(HELP_LINE).toBe("Want help with something bigger? Email the owner for more details.");
  });

  it("send the not-for-sale guide pages and the paused scope summary somewhere free", () => {
    const cfg = readFileSync(path.join(APP, "..", "next.config.ts"), "utf8");
    expect(cfg).toContain('{ source: "/products/old-laptop-to-build-machine", destination: "/build-machine", permanent: false }');
    expect(cfg).toContain('{ source: "/products/start-your-own-business", destination: "/engines", permanent: false }');
    expect(cfg).toContain('{ source: "/services/estimate", destination: "/services", permanent: false }');
    const paths = SITE_PAGES.map((p) => p.path);
    for (const gone of ["/products/old-laptop-to-build-machine", "/products/start-your-own-business", "/services/estimate"]) {
      expect(paths).not.toContain(gone);
    }
  });

  it("the website editor downloads the files again, with no have-us-build-it button", () => {
    const editor = visible("starter/StarterEditor.tsx");
    expect(editor).toContain("Download site files");
    expect(editor).toMatch(/makeZip\(exportEntries\(draft\)\)/);
    expect(editor).not.toMatch(/Have us build it|services\/estimate/);
    expect(editor).toContain("HELP_MAILTO");
  });
});
