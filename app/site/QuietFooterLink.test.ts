// 2026-08-30 nav simplification: "Everything" (the full site directory) was
// removed from the primary header chrome so it no longer competes with How
// and Account. It stays reachable, sitewide, from this one quiet footer
// line instead — never deleted, just demoted. These tests lock that the
// link exists, points at the real route, and stays out of the LOCKED,
// family-wide OpenMirrorFooter (see that file's own header comment: edit
// only in the hub repo, never here).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "QuietFooterLink.tsx"), "utf8");
const layout = readFileSync(join(__dirname, "..", "layout.tsx"), "utf8");
const omFooter = readFileSync(join(__dirname, "..", "OpenMirrorFooter.tsx"), "utf8");

describe("QuietFooterLink", () => {
  it("links to the real /everything route", () => {
    expect(src).toMatch(/href="\/everything"/);
  });

  it("is mounted sitewide in the root layout, between the page content and the shared Open Mirror footer", () => {
    expect(layout).toMatch(/<QuietFooterLink \/>/);
    const bodyStart = layout.indexOf("<RingHeader");
    const body = layout.slice(bodyStart);
    expect(body.indexOf("<QuietFooterLink")).toBeLessThan(body.indexOf("<OpenMirrorFooter"));
  });

  it("never touches the locked, family-wide OpenMirrorFooter", () => {
    expect(omFooter).not.toMatch(/everything/i);
  });
});

// 2026-08-30 lower-page cleanup: the open-beta safety line and feedback
// link used to live in a "closing" section at the bottom of Home only,
// next to a duplicate second "Start something" button. Both moved here so
// every page carries the safety line once, instead of Home repeating it.
describe("QuietFooterLink carries the open-beta safety line", () => {
  it("states the open-beta safety line", () => {
    expect(src).toMatch(/Open beta\. Keep a copy of anything important\./);
  });

  it("links to the real feedback destination", () => {
    expect(src).toMatch(/href="\/account#feedback"/);
  });

  it("carries no duplicate big creation CTA — this is a footer, not a second hero", () => {
    const body = src.slice(src.indexOf("export default function"));
    expect(body).not.toMatch(/btn-gold|btn-big|Start something/);
  });
});
