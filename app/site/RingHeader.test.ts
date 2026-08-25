// Locks the 2026-08-24 mobile fix: the theme toggle used to live inside
// .ring-bar-end, which is display:none at phone widths — mobile had NO way
// to change appearance at all. Fixed by hiding only .ring-bar-end's LINKS
// on phone (globals.css) while the container — and the toggle inside it —
// stays visible. This file asserts the shape of that fix at the source
// level (see app/OpenMirrorTheme.test.ts's header comment for why: no
// jsdom in this repo).

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const header = readFileSync(join(__dirname, "RingHeader.tsx"), "utf8");
const css = readFileSync(join(__dirname, "..", "globals.css"), "utf8");

describe("the theme toggle is reachable on mobile", () => {
  it("OpenMirrorThemeToggle is still mounted inside .ring-bar-end", () => {
    const barEnd = header.slice(header.indexOf('className="ring-bar-end"'));
    expect(barEnd.slice(0, barEnd.indexOf("</div>"))).toContain("<OpenMirrorThemeToggle");
  });

  it("the mobile breakpoint hides .ring-bar-end's LINKS, not the container itself", () => {
    const mobileBlock = css.slice(css.indexOf("@media (max-width: 860px)"));
    const block = mobileBlock.slice(0, mobileBlock.indexOf("\n}\n") + 3);
    // The old bug: `.ring-nav, .ring-bar-end { display: none; }` — asserting
    // the negative directly so a regression (re-hiding the whole container)
    // fails loudly instead of silently passing a looser check.
    expect(block).not.toMatch(/\.ring-bar-end\s*\{\s*display:\s*none/);
    expect(block).toMatch(/\.ring-bar-end\s+a\s*\{[^}]*display:\s*none/);
  });
});

describe("the primary nav still carries every door in the mobile sheet", () => {
  it("the phone menu is built from primary + SECONDARY, nothing dropped", () => {
    expect(header).toMatch(/\.\.\.primary\.map/);
    expect(header).toMatch(/\.\.\.SECONDARY/);
  });

  it("SECONDARY still names How, Everything and Account", () => {
    const secondary = header.slice(header.indexOf("const SECONDARY"), header.indexOf("];", header.indexOf("const SECONDARY")));
    for (const name of ["How", "Everything", "Account"]) {
      expect(secondary).toContain(`"${name}"`);
    }
  });
});
