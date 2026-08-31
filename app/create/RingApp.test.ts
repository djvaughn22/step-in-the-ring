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

  // 2026-08-29 overnight visual rescue: the hero used to carry a second,
  // redundant "Start creating" anchor button directly under the box's own
  // working "Start" submit — visually two CTAs stacked on top of each
  // other for the exact same act. Locked gone for good.
  it("the home hero has no second 'Start creating' CTA competing with the box's own Start button", () => {
    const heroStart = src.indexOf('if (stage === "landing") {', src.indexOf("HOME — the front door"));
    const hero = src.slice(heroStart, src.indexOf('/* ── STEPPED IN'));
    expect(hero).not.toMatch(/Start creating/);
    expect(hero).not.toMatch(/stage-primary-row/);
  });

  it("ContinueStrip renders as its own section, not stacked inside the hero's make-something column", () => {
    const make = src.slice(src.indexOf('className="stage-make"'), src.indexOf("{/* ── RIGHT: REAL PROOF"));
    expect(make).not.toMatch(/<ContinueStrip/);
  });
});

// 2026-08-30 lower-page cleanup (Checkpoint C): Home used to end with a
// "closing" section repeating the hero's "Made in The Ring" line behind a
// second, duplicate big "Start something" button — the box's own Start
// button is the one dominant creation action on the page, full stop. The
// open-beta safety line that lived there moved to the sitewide quiet
// footer (every page, not just Home) instead of being repeated per page.
describe("RingApp home — no closing-section duplicate CTA", () => {
  it("the landing hero has no second big Start button after the loop", () => {
    const heroStart = src.indexOf('if (stage === "landing") {', src.indexOf("HOME — the front door"));
    const hero = src.slice(heroStart, src.indexOf('/* ── STEPPED IN'));
    expect(hero).not.toMatch(/className="closing"/);
    expect(hero).not.toMatch(/Start something/);
  });

  it("the open-beta line no longer lives in RingApp — it moved to the sitewide footer", () => {
    expect(src).not.toMatch(/Open beta\. Keep a copy/);
  });
});

// Ring-as-portal correction (2026-08-30): the Result screen's always-present
// takeaway prompt used to say "Copy it into the building tool you already
// use" — software-coded language on a card that also fires for a song, a
// poem, or a plan (adapterForType already writes type-appropriate content;
// only this static wrapper sentence assumed software). It is the exact
// AI/tool/person/self handoff moment the product's front door is about, so
// it has to read that way for every creation type, not just code.
describe("RingApp result screen — the takeaway prompt isn't software-only language", () => {
  it("never assumes the reader is pasting into a coding tool", () => {
    expect(src).not.toMatch(/building tool you already use/);
  });

  it("names the real range of where this goes: AI, a person, or yourself", () => {
    expect(src).toMatch(/Bring it to an AI, hand it to a person, or just start on it yourself\./);
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
    const make = src.slice(src.indexOf('className="stage-make"'), src.indexOf("{/* ── RIGHT: REAL PROOF"));
    expect(make).toContain("{theBox}");
  });

  it("shows exactly the three featured products beside the box, driven by the real registry — the rest live in their own band below, not stacked in the aside", () => {
    const asideStart = src.indexOf('className="stage-proof"');
    const panel = src.slice(asideStart, src.indexOf("</aside>", asideStart));
    expect(panel).toContain("Made in The Ring");
    expect(panel).toContain("HOME_PROOF_PRIMARY");
    expect(panel).not.toContain("HOME_PROOF_MORE");
    expect(panel).toMatch(/target="_blank"/);
  });

  it("every other real, live product gets its own full-width band below the hero", () => {
    const band = src.slice(src.indexOf('more-products-band"'), src.indexOf("</section>", src.indexOf('more-products-band"')));
    expect(band).toContain("More made here");
    expect(band).toContain("HOME_PROOF_MORE");
    expect(band).not.toContain("HOME_PROOF_PRIMARY");
    expect(band).toMatch(/target="_blank"/);
  });

  it("has no leftover opp-card styling in globals.css", () => {
    expect(css).not.toMatch(/\.opp-card/);
    expect(css).not.toMatch(/\.opportunity-panel/);
  });

  it("every proof card — featured and 'more made here' — is one whole clickable link, safely external, with a real description", () => {
    const asideStart = src.indexOf('className="stage-proof"');
    const aside = src.slice(asideStart, src.indexOf("</aside>", asideStart));
    const bandStart = src.indexOf('more-products-band"');
    const band = src.slice(bandStart, src.indexOf("</section>", bandStart));
    for (const panel of [aside, band]) {
      // Every card opens on <a ...> and closes on </a> — no nested <a> (a
      // second, separate "Open" link) exists anywhere inside either map.
      const anchorOpens = panel.match(/<a\b/g) ?? [];
      const anchorCloses = panel.match(/<\/a>/g) ?? [];
      expect(anchorOpens.length).toBe(anchorCloses.length);
      expect(anchorOpens.length).toBeGreaterThan(0);
      expect(panel).not.toMatch(/<a\b[^>]*>\s*Open\s*<\/a>/);
      expect(panel.match(/rel="noopener noreferrer"/g)?.length).toBe(anchorOpens.length);
      // The one-sentence description (p.what) rides along on every card.
      expect(panel).toContain("proof-what");
      expect(panel).toContain("{p.what}");
    }
  });

  it("the compact 'more made here' row carries no price, offer, or CTA", () => {
    const bandStart = src.indexOf('more-products-band"');
    const more = src.slice(bandStart, src.indexOf("</section>", bandStart));
    expect(more).not.toMatch(/\$\s?\d/);
    expect(more).not.toMatch(/\b(buy|sale|sign up|book now|free trial)\b/i);
  });

  it("the more-products grid uses a relative/fractional track, not a fixed pixel width that could overflow a phone screen", () => {
    const grid = css.slice(css.indexOf(".more-products {"), css.indexOf("}", css.indexOf(".more-products {")) + 1);
    // minmax(0, 1fr), not bare 1fr — a bare fr track's automatic minimum is
    // content-based, which the nowrap+ellipsis .proof-what description
    // would blow past the viewport instead of actually truncating.
    expect(grid).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(grid).not.toMatch(/\d+px 1fr|\bwidth:\s*\d{3,}px/);
  });

  // Real mobile overflow bug found and fixed during this rescue: the
  // single-column mobile override for .stage used a bare `1fr`, whose
  // automatic minimum is content-based. Once the proof cards' one-line
  // description used white-space: nowrap for ellipsis truncation, its full
  // untruncated text width forced the shared grid track — and the whole
  // page — wider than a phone viewport. minmax(0, 1fr) fixes it by capping
  // the track's minimum at 0 regardless of content.
  it("the mobile .stage override caps the track minimum at 0, so a long proof description can't force horizontal overflow", () => {
    const mobileBlock = css.slice(css.indexOf("@media (max-width: 940px)"));
    const stageRule = mobileBlock.slice(mobileBlock.indexOf(".stage {"), mobileBlock.indexOf("}") + 1);
    expect(stageRule).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
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

// Mom-and-dad first-time journey audit (2026-08-30). Confirmed live: the
// "What I think you're making" card showed an "Explore an early idea" pill
// directly beside "Help figuring this out" — a software buildType
// assumption contradicting the sentence right next to it that says this
// isn't something to build at all.
describe("UnderstoodCard — the buildType pill doesn't contradict general-help", () => {
  it("hides the buildType pill only for general-help, not for every creation", () => {
    const fn = src.slice(src.indexOf("function UnderstoodCard"), src.indexOf("function UnderstoodCard") + 1200);
    expect(fn).toMatch(/view\?\.creationType !== "general-help"/);
    // The creationType pill itself stays for everyone, general-help included.
    expect(fn).toMatch(/\{view && <span className="pill">\{CREATION_TYPE_LABEL\[view\.creationType\]\}<\/span>\}/);
  });
});
