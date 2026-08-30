// Home's returning-user strip must never leak a specific Build's title,
// stage, or next-move text — the owner rejected a private Build's real
// title and next-move text appearing on the front door (2026-08-22; see
// docs/sitr-feature-inventory.md's Sprint 2 privacy-correction section for
// why this fixture uses fictional content, not the owner's own words). It
// still has to offer a real way back into the actual latest build.
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ContinueStrip, { KeepGoingCard } from "./ContinueStrip";
import { newBuild, type BuildRecordV1 } from "./build";

function build(patch: Partial<BuildRecordV1> = {}): BuildRecordV1 {
  return {
    ...newBuild("A song about a train moving through summer rain.", "2026-08-20T00:00:00.000Z"),
    id: "b1",
    title: "Summer Rain Song",
    currentAction: "Right now: write it.",
    ...patch,
  };
}

describe("KeepGoingCard", () => {
  it("never prints the Build's title", () => {
    const html = renderToStaticMarkup(createElement(KeepGoingCard, { latest: build() }));
    expect(html).not.toContain("Summer Rain Song");
  });

  it("never prints the Build's next-move text", () => {
    const html = renderToStaticMarkup(createElement(KeepGoingCard, { latest: build() }));
    expect(html).not.toContain("Right now");
    expect(html).not.toContain("write it");
  });

  it("never prints the Build's stage label or status", () => {
    const html = renderToStaticMarkup(createElement(KeepGoingCard, { latest: build({ stage: "bring" }) }));
    expect(html).not.toContain("Bring it");
    const shaped = renderToStaticMarkup(createElement(KeepGoingCard, { latest: build({ stage: "shape" }) }));
    expect(shaped).not.toContain("Shape it");
  });

  it("uses plain generic copy instead", () => {
    // 2026-08-29 visual rescue: the old bulky panel had a "Keep going"
    // section label above the sentence — dropped along with the panel
    // chrome in favor of one compact strip that IS the sentence.
    const html = renderToStaticMarkup(createElement(KeepGoingCard, { latest: build() }));
    expect(html).toContain("Continue your latest build.");
  });

  it("drops the old awkward phrasing", () => {
    const html = renderToStaticMarkup(createElement(KeepGoingCard, { latest: build() }));
    expect(html).not.toMatch(/pick up (the|where you)/i);
    expect(html).not.toContain("Bring it");
    expect(html).not.toContain("Or start something new below");
  });

  it("still gives a real, working continue action to the actual latest build", () => {
    const html = renderToStaticMarkup(createElement(KeepGoingCard, { latest: build({ id: "abc123" }) }));
    expect(html).toContain('href="/builds/abc123"');
    expect(html).toContain("Continue");
  });

  it("still offers a way to Your Builds, where titles do belong", () => {
    const html = renderToStaticMarkup(createElement(KeepGoingCard, { latest: build() }));
    expect(html).toContain('href="/builds"');
    expect(html).toContain("Your builds");
  });
});

describe("ContinueStrip", () => {
  it("renders nothing before the Build fetch resolves (signed-out visitors see nothing extra)", () => {
    expect(renderToStaticMarkup(createElement(ContinueStrip))).toBe("");
  });
});

// The bulky card-styled panel is gone — one compact, full-width strip that
// collapses to nothing when there's no work to continue.
describe("KeepGoingCard — compact strip, not a card", () => {
  it("uses the dedicated compact-strip class, not the general-purpose .card panel", () => {
    const html = renderToStaticMarkup(createElement(KeepGoingCard, { latest: build() }));
    expect(html).toContain('class="continue-strip"');
    expect(html).not.toMatch(/class="card"/);
  });
});
