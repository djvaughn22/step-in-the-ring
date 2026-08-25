// Source-level locks for the theme system's two real-world bugs, found
// during the 2026-08-24 mobile pass. No jsdom in this repo's vitest config
// (environment: "node", only *.test.ts globbed) — these assert against the
// actual script/CSS strings shipped to the browser, the same pattern used
// throughout this codebase for anything that can't be unit-tested as a pure
// function (see app/site/registry.test.ts, app/members/membership.test.ts).

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "OpenMirrorTheme.tsx"), "utf8");

describe("theme default", () => {
  it("the init script defaults an unset/unreadable preference to dark, never light", () => {
    // The one line that decides the product default. If this ever reads
    // '"dark":"light"' or similar, a fresh visitor gets light by default.
    expect(src).toMatch(/localStorage\.getItem\("om-theme"\)\s*===\s*"light"\s*\?\s*"light"\s*:\s*"dark"/);
  });

  it("never defaults from prefers-color-scheme — dark is the product choice, not a media query guess", () => {
    expect(src).not.toMatch(/prefers-color-scheme/);
  });
});

describe("native chrome (color-scheme) stays in sync with the page", () => {
  // Bug: the page content was already dark by default, but nothing told
  // the BROWSER that — so mobile Safari/Chrome guessed the native chrome
  // (scrollbar, form controls, iOS overscroll rubber-band) from the OS's
  // prefers-color-scheme, which is light for most people. That read as
  // "mobile shows white" even though every actual pixel of page content
  // was rendering the correct dark colors the whole time.
  it("the init script sets color-scheme on first run and on every later load", () => {
    expect(src).toMatch(/d\.style\.colorScheme\s*=\s*t/);
    expect(src).toMatch(/d\.style\.colorScheme\s*=\s*d\.dataset\.omTheme/);
  });

  it("applyTheme (the toggle's click handler) also sets it, so switching theme updates native chrome too", () => {
    const start = src.indexOf("function applyTheme");
    const applyTheme = src.slice(start, src.indexOf("\n}", start));
    expect(applyTheme).toMatch(/document\.documentElement\.style\.colorScheme\s*=\s*theme/);
  });

  it("the light-theme CSS block still declares its own color-scheme too", () => {
    expect(src).toMatch(/html\[data-om-theme="light"\]\s*\{[^}]*color-scheme:\s*light/);
  });
});

describe("layout.tsx ships a static dark color-scheme meta tag", () => {
  const layout = readFileSync(join(__dirname, "layout.tsx"), "utf8");
  it("declares colorScheme: \"dark\" in the viewport export", () => {
    // Server-rendered, present before any JS runs — the actual fix for the
    // first-paint white flash; the script-based sync above is the fallback
    // for after an explicit theme change.
    expect(layout).toMatch(/colorScheme:\s*"dark"/);
  });
});
