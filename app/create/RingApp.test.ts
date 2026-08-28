// Home/Create hierarchy: START stays the one obvious creation CTA, and the
// duplicate local "Pick up the last one" return path (competing with the
// generic Build-based Keep Going strip) is gone for good. Source-inspection,
// same technique as EngineSystem.test.ts — RingApp mounts client-side state
// this heavy to unit-render meaningfully, so the guarantee that matters is
// "the dead code and the duplicate CTA never come back."
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "RingApp.tsx"), "utf8");
const css = readFileSync(join(__dirname, "..", "globals.css"), "utf8");

describe("RingApp — one creation CTA, one quiet return path", () => {
  it("Start remains the dominant, only submit action on the creation box", () => {
    expect(src).toMatch(/submitLabel="Start"/);
  });

  it("the duplicate 'Pick up the last one' return path is gone", () => {
    expect(src).not.toMatch(/Pick up the last one/);
    expect(src).not.toMatch(/continueLast/);
    expect(src).not.toMatch(/hasLastCreation/);
  });

  it("the one remaining returning-user offer is the shared, generic ContinueStrip", () => {
    expect(src).toMatch(/<ContinueStrip \/>/);
  });
});

// 2026-08-27 visual-conversion correction: a restrained inline text link
// ("Would rather not do it alone? Finish one thing in five hours, with the
// owner.") failed owner acceptance — a stranger scrolled past it without
// noticing the paid path existed. It was replaced with a visibly elevated
// opportunity panel occupying real space in the first screen, not another
// text link, so these tests lock the panel's presence and pin the failed
// phrasing so it cannot quietly come back.
describe("RingApp home hero — the opportunity panel", () => {
  it("removes the failed restrained inline Sprint link entirely", () => {
    expect(src).not.toMatch(/Would rather not do it alone/);
    expect(src).not.toMatch(/with the owner/);
  });

  it("keeps the idea-entry field working inside the make-something column", () => {
    // theBox (CreationEntry) still renders inside stage-make, not removed
    // or replaced by opportunity content.
    const make = src.slice(src.indexOf('className="stage-make"'), src.indexOf('className="opportunity-panel"'));
    expect(make).toContain("{theBox}");
    expect(make).toContain('href="#idea-description"');
    expect(make).toContain("Start creating");
  });

  it("offers exactly three opportunity cards, each pointed at the right destination", () => {
    const panel = src.slice(src.indexOf('className="opportunity-panel"'));
    expect(panel).toContain("Choose your way in");

    expect(panel).toMatch(/opp-card-free[\s\S]*?href="\/create"/);
    expect(panel).toMatch(/opp-card-sprint[\s\S]*?href="\/products\/five-hour-sprint"/);
    expect(panel).toMatch(/opp-card-team[\s\S]*?href="\/products\/five-hour-sprint\/apply\?format=team"/);
  });

  it("shows real Sprint pricing in the first screen, not just a link to find it later", () => {
    const panel = src.slice(src.indexOf('className="opportunity-panel"'));
    expect(panel).toMatch(/\$1,500/);
    expect(panel).toMatch(/\$5,000/);
  });

  it("makes Five Hour Sprint the visually dominant card, not an equal fourth option", () => {
    const panelCss = css.slice(css.indexOf(".opp-card-sprint {"), css.indexOf(".opp-card-free {"));
    // Bigger padding and a filled brand-blue background, versus the plain
    // outlined free/team cards — the visual weight the owner asked for.
    expect(panelCss).toMatch(/background:\s*linear-gradient/);
    expect(panelCss).toMatch(/border:\s*2px solid var\(--accent\)/);
  });

  it("reorders the panel so Sprint outranks the free path on phone, without changing desktop order", () => {
    const mobileBlock = css.slice(css.lastIndexOf("@media (max-width: 940px)"));
    expect(mobileBlock).toMatch(/\.opp-card-sprint\s*\{\s*order:\s*1/);
    expect(mobileBlock).toMatch(/\.opp-card-free\s*\{\s*order:\s*2/);
  });

  it("has no duplicate Sprint entry point competing with the opportunity panel in the hero", () => {
    const hero = src.slice(src.indexOf('if (stage === "landing") {', src.indexOf("HOME — the front door")));
    const sprintLinks = hero.match(/href="\/products\/five-hour-sprint/g) ?? [];
    // One in the opportunity panel's Sprint card, one in the Team card
    // (a distinct destination, not a duplicate) — never a third, redundant
    // inline mention.
    expect(sprintLinks.length).toBe(2);
  });
});
