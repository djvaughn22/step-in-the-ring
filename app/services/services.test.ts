import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BUDGETS, CARE_PLANS, CARE_TERMS, INDEPENDENCE_NOTICE, NOT_INCLUDED, OFFERS, SERVICE_CHOICES } from "./offers";
import { WORK, SPOTLIGHT_WORK, TILE_WORK, FEATURED_WORK, ecosystemFor, isExternal } from "../work/work";

const visible = (path: string) => readFileSync(path, "utf8").replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

describe("Build it with us: honest offers", () => {
  it("has the four introductory services, in order, with the owner's prices", () => {
    expect(OFFERS.map((o) => [o.name, o.price])).toEqual([
      ["Website Review", "$149"],
      ["Starter Website", "$499"],
      ["Business Website", "$999"],
      ["Custom Website or Web App", "Starting at $2,499"],
    ]);
    expect(CARE_PLANS.map((c) => c.price)).toEqual(["$49 a month", "$99 a month", "$199 a month"]);
  });

  it("never promises unlimited anything, guarantees, or 24/7", () => {
    const all = JSON.stringify({ OFFERS, NOT_INCLUDED, CARE_PLANS });
    expect(all).not.toMatch(/unlimited|guarantee|24\/7|always available/i);
    expect(CARE_TERMS).toMatch(/No 24\/7 support and no uptime guarantee/);
  });

  it("states timing as usual, never as a promise", () => {
    for (const o of OFFERS) expect(o.timing).toMatch(/^(Usually|Timing is set)/);
  });

  it("keeps the independence notice word for word, naming no employer", () => {
    expect(INDEPENDENCE_NOTICE).toBe(
      "Step In The Ring is independently owned and operated by Open Mirror LLC. All services are provided outside other employment, using independent resources, and are not affiliated with or endorsed by any employer. We do not undertake projects that conflict with existing employment obligations.",
    );
    // Owner, 2026-11-10 later: the full notice lives once, in About's
    // Disclaimer. The footer carries a short note that links there, and no
    // other page repeats it.
    const about = readFileSync("app/about/page.tsx", "utf8");
    expect(about).toContain("{INDEPENDENCE_NOTICE}");
    expect(about).toMatch(/id="disclaimer"/);
    const footer = readFileSync("app/site/QuietFooterLink.tsx", "utf8");
    expect(footer).not.toContain("INDEPENDENCE_NOTICE");
    expect(footer).toContain('href="/about#disclaimer"');
    expect(footer).toMatch(/independent Open Mirror LLC project/);
    expect(footer).toMatch(/not\s+affiliated with or endorsed by any employer/);
    for (const path of ["app/services/page.tsx", "app/request/page.tsx", "app/builds/OwnerBuildsShowroom.tsx", "app/create/RingApp.tsx"]) {
      const src = readFileSync(path, "utf8");
      expect(src, path).not.toContain("INDEPENDENCE_NOTICE");
      expect(src, path).not.toMatch(/independently owned and operated/);
    }
  });

  it("offers every service and a not-sure option on the form", () => {
    expect(SERVICE_CHOICES.map((s) => s.id)).toEqual(["review", "starter", "business", "custom", "care", "not-sure"]);
    expect(BUDGETS[0]).toEqual({ id: "", label: "Prefer not to say" });
  });

  it("no page sells, subscribes or checks out", () => {
    for (const path of ["app/services/page.tsx", "app/builds/OwnerBuildsShowroom.tsx", "app/work/Portfolio.tsx", "app/request/page.tsx", "app/request/RequestForm.tsx"]) {
      const src = visible(path);
      expect(src, path).not.toMatch(/stripe|checkout|subscribe|buy now|add to cart/i);
      expect(src, path).not.toMatch(/revolutionary|game.?chang|AI[- ]powered|10x|magic/i);
    }
  });
});

describe("Our work: real projects, labelled as our own", () => {
  // Nov 10: Our work and Made here were two lists that disagreed. One list now
  // (app/work/work.ts), shown on Made here as showcase tiles; /work redirects there.
  it("every outside address belongs to a live project in the registry", () => {
    for (const w of WORK) {
      for (const href of [w.href, ...(w.links ?? []).map((l) => l.href)]) {
        expect(href, w.name).toMatch(/^(https:\/\/|\/)/);
        if (isExternal(href)) expect(ecosystemFor(href)?.status, `${w.name} ${href}`).toBe("live");
      }
    }
  });

  it("lists every live, presentable sister site, and nothing unfinished", () => {
    const names = WORK.map((w) => w.name);
    for (const n of ["WatchedNotWatched", "OpenDoku", "PleaseBeReady", "CrossHeartPray", "TheDJCares", "DontCloneMeTom.com", "Open Mirror"]) expect(names).toContain(n);
    expect(names).not.toContain("WhatAmIAI");
    expect(new Set(names).size).toBe(names.length);
    // Showcase tiles (owner, Nov 10): two spotlights, then two full rows of four.
    expect(SPOTLIGHT_WORK.map((w) => w.name)).toEqual(["iDontCry Sports Desk", "iDontCry Family Arcade"]);
    expect(TILE_WORK.length % 4).toBe(0);
    expect(names).not.toContain("Step In The Ring");
  });

  it("names the iDontCry sports pages and games instead of hiding them", () => {
    const sports = WORK.find((w) => w.name === "iDontCry Sports Desk")!;
    const arcade = WORK.find((w) => w.name === "iDontCry Family Arcade")!;
    expect(sports.href).toBe("https://idontcry.com/sports");
    expect(sports.links?.map((l) => l.label)).toEqual(expect.arrayContaining(["Add a team", "Explore sports"]));
    expect(arcade.links?.map((l) => l.label)).toEqual(expect.arrayContaining(["Football", "Baseball", "Skiing", "Track & Field", "Circuit"]));
    expect(FEATURED_WORK.map((w) => w.name)).toEqual(expect.arrayContaining(["iDontCry Sports Desk", "iDontCry Family Arcade"]));
    expect(FEATURED_WORK.length).toBeLessThanOrEqual(4);
  });

  it("keeps CrossHeartPray as the one Outreach card (owner, Oct 8)", () => {
    expect(WORK.filter((w) => w.tag === "Outreach").map((w) => w.name)).toEqual(["CrossHeartPray"]);
  });

  it("says plainly that these are not client work, and invents no numbers", () => {
    expect(visible("app/builds/OwnerBuildsShowroom.tsx")).toContain("not client work");
    expect(visible("app/create/RingApp.tsx")).toContain("not client work");
    const words = JSON.stringify(WORK.map((w) => [w.name, w.line, w.links]));
    expect(words).not.toMatch(/\d{2,}|client|customer|testimonial|users|visitors/i);
  });
});
