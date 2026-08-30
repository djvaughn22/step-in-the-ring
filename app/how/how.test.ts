// ONE model, not three. This used to be a five-step loop, then a second
// seven-step "longer version" of the same loop, then a third technical
// playbook underneath — three descriptions of one product. The middle one
// also told every visitor to "send it to Open Mirror to push," as if that
// were the normal finish line. It isn't. This test locks the single model
// and the removed old-story language back in.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import liveProducts from "../live/live-products.json";

const src = readFileSync(join(__dirname, "page.tsx"), "utf8");
const playbook = readFileSync(join(__dirname, "Playbook.tsx"), "utf8");

describe("How It Works — one coherent loop", () => {
  it("defines exactly one five-step loop, the same one the homepage shows", () => {
    expect(src).toMatch(/const LOOP = \[/);
    expect((src.match(/n: "0\d"/g) ?? []).length).toBe(5);
    // No second competing step list.
    expect(src).not.toMatch(/const STEPS = \[/);
  });

  it("uses the same step titles as the homepage loop", () => {
    for (const title of ["Say it", "Shape it", "Make it", "Try it", "Go again"]) {
      expect(src).toContain(title);
    }
  });

  it("connects the loop to Create, Engines, Builds and Library", () => {
    expect(src).toMatch(/const NAV_CONCEPTS = \[/);
    for (const name of ["Create", "Engines", "Builds", "Library"]) {
      expect(src).toContain(name);
    }
  });

  it("never tells a visitor Open Mirror is the normal finish line", () => {
    for (const phrase of [
      "send it to open mirror",
      "open mirror pushes",
      "open mirror deploys",
      "hand it to your builder",
      "made it out of the ring",
      "next round",
    ]) {
      expect(src.toLowerCase()).not.toContain(phrase);
    }
  });

  it("makes an honest, narrow account claim instead of a blanket one", () => {
    // Superseded 2026-08-24: opening an Engine no longer needs a sign-in —
    // only making a Build follow you to another device does.
    expect(src).toMatch(/no account needed/i);
    expect(src).toMatch(/sign in only if you want a\s*\n?\s*build to follow you/i);
    expect(src.toLowerCase()).not.toContain("sign in when you want to");
  });

  it("keeps the technical playbook labeled as software-specific and opt-in", () => {
    expect(playbook).toMatch(/details/);
    expect(playbook.toLowerCase()).toContain("building software");
    expect(playbook.toLowerCase()).not.toContain("send it to open mirror");
  });
});

// The Ring-as-portal correction (2026-08-30): near the end of the
// explanation, show restrained, REAL proof that things get pushed live from
// inside an Engine — not founder vanity, not a portfolio, and never
// fabricated. This must read from the same live-products.json /live and
// /explore already read, never a hand-typed duplicate list that could drift.
describe("How It Works — real proof near the end, not a portfolio", () => {
  it("reads live-products.json directly rather than hand-listing entries", () => {
    expect(src).toMatch(/import liveProducts from "\.\.\/live\/live-products\.json"/);
  });

  it("shows a small number of real entries, not the whole catalog", () => {
    expect(src).toMatch(/\.slice\(0, 3\)/);
    // Sanity: there really is more in the data than the page shows, so the
    // slice is restraint, not just "there happen to be exactly 3".
    expect(liveProducts.length).toBeGreaterThan(3);
  });

  it("names it plainly as real, pushed work — not a claim about the owner", () => {
    expect(src).toMatch(/Made through the Ring/);
    expect(src).toMatch(/Pushed live from inside an Engine, not a mockup/);
  });

  it("links to the full list instead of duplicating it", () => {
    expect(src).toMatch(/href="\/live"/);
  });
});
