// Home's returning-user strip must never leak a specific Build's title,
// stage, or next-move text — the owner rejected "Loneliness Song" and
// "Right now: write it" appearing on the front door. It still has to offer a
// real way back into the actual latest build.
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ContinueStrip, { KeepGoingCard } from "./ContinueStrip";
import { newBuild, type BuildRecordV1 } from "./build";

function build(patch: Partial<BuildRecordV1> = {}): BuildRecordV1 {
  return {
    ...newBuild("A song about being lonely, with just a piano and my voice.", "2026-08-20T00:00:00.000Z"),
    id: "b1",
    title: "Loneliness Song",
    currentAction: "Right now: write it.",
    ...patch,
  };
}

describe("KeepGoingCard", () => {
  it("never prints the Build's title", () => {
    const html = renderToStaticMarkup(createElement(KeepGoingCard, { latest: build() }));
    expect(html).not.toContain("Loneliness Song");
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
    const html = renderToStaticMarkup(createElement(KeepGoingCard, { latest: build() }));
    expect(html).toContain("Keep going");
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
