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

// 2026-08-29 product reset: the visually elevated "opportunity panel"
// (Choose your way in / Five Hour Sprint from $1,500 / Team Sprint $5,000)
// failed owner acceptance a second time — the front door asked a stranger to
// choose between a free product and two paid services before they had made
// anything. It is gone for good, replaced by real, live proof beside the
// box. These tests lock that removal and the replacement so the sales wall
// cannot quietly come back.
describe("RingApp home hero — product-first, no sales wall", () => {
  const heroStart = src.indexOf('if (stage === "landing") {', src.indexOf("HOME — the front door"));
  const hero = src.slice(heroStart, src.indexOf('/* ── STEPPED IN'));

  it("shows no dollar pricing in the home hero", () => {
    expect(hero).not.toMatch(/\$\s?\d/);
  });

  it("offers no paid Sprint or Team Sprint choice in the home hero", () => {
    expect(hero).not.toMatch(/Choose your way in/);
    expect(hero).not.toMatch(/Finish it with help/);
    expect(hero).not.toMatch(/Bring a team/);
    expect(hero).not.toMatch(/opportunity-panel/);
    expect(hero).not.toMatch(/opp-card/);
    expect(hero).not.toMatch(/href="\/products\/five-hour-sprint/);
  });

  it("keeps the idea-entry field working inside the make-something column", () => {
    // theBox (CreationEntry) still renders inside stage-make, not removed
    // or replaced by sales content.
    const make = src.slice(src.indexOf('className="stage-make"'), src.indexOf('className="stage-proof"'));
    expect(make).toContain("{theBox}");
    expect(make).toContain('href="#idea-description"');
    expect(make).toContain("Start creating");
  });

  it("shows real, live proof beside the box instead", () => {
    const panel = src.slice(src.indexOf('className="stage-proof"'));
    expect(panel).toContain("Made in The Ring");
    expect(panel).toContain("ECOSYSTEM.filter");
    expect(panel).toMatch(/target="_blank"/);
  });

  it("has no leftover opp-card styling in globals.css", () => {
    expect(css).not.toMatch(/\.opp-card/);
    expect(css).not.toMatch(/\.opportunity-panel/);
  });
});

// Product reset Sprint 2: the door CTA used to pick between two independent
// engine recommenders — recommendEngines() (rich, drives what's shown) and
// the older recommendEngine() (narrower, decided ONLY whether the seed was
// rich or light) — and they disagreed on the engine id for the single most
// common destination ("first-build" vs "build"), so the richer seed never
// fired for it. /build reads its own sitr-build-seed key and nothing else,
// so that mismatch meant a silent, total loss of context: the person retyped
// their app name and purpose from scratch. These tests lock the fix — one
// recommender, one seed path, and /build's key always gets written.
describe("RingApp engine handoff — no retyping into /build", () => {
  it("no longer branches on a second, narrower engine recommendation", () => {
    expect(src).not.toMatch(/import \{ recommendEngine \}/);
    expect(src).not.toMatch(/engine\.seed\(\)/);
    expect(src).not.toMatch(/recommendEngine\(plan\)/);
  });

  it("the door always hands the whole record to seedEngineWithRecord", () => {
    expect(src).toMatch(/onClick=\{\(\) => seedEngineWithRecord\(engineRec\.primary!\.engineId\)\}/);
  });

  it("first-build additionally seeds /build's own key so it never opens blank", () => {
    const fn = src.slice(src.indexOf("function seedEngineWithRecord"), src.indexOf("function handleSave"));
    expect(fn).toMatch(/engineId === "first-build"/);
    expect(fn).toMatch(/BUILD_SEED_KEY/);
    expect(fn).toMatch(/appName: view\.interpretation\.title\.value/);
    expect(fn).toMatch(/purpose: view\.interpretation\.summary/);
  });

  it("imports the shared BUILD_SEED_KEY rather than repeating the string", () => {
    expect(src).toMatch(/import \{ BUILD_SEED_KEY \} from "\.\.\/planner\/handoff"/);
  });
});
