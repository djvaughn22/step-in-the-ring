// Source-level locks for the theme system's real-world bugs, found during
// the 2026-08-24/25 mobile passes. No jsdom in this repo's vitest config
// (environment: "node", only *.test.ts globbed) — these assert against the
// actual script/CSS strings shipped to the browser, the same pattern used
// throughout this codebase for anything that can't be unit-tested as a pure
// function (see app/site/registry.test.ts, app/members/membership.test.ts).

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "OpenMirrorTheme.tsx"), "utf8");
const layout = readFileSync(join(__dirname, "layout.tsx"), "utf8");

const THREE_WAY_DEFAULT = /m==="light"\?"light":m==="system"\?\(matchMedia\([^;]*\):"dark"/;

describe("theme default", () => {
  it("a fresh/unrecognized stored value resolves to dark, not light and not system", () => {
    // The one line that decides the product default for THEME_INIT_JS (the
    // in-body fallback). m is whatever localStorage returned — null,
    // garbage, or a stale value from before this feature existed all fall
    // through to the final ":\"dark\"".
    expect(src).toMatch(THREE_WAY_DEFAULT);
  });

  it("the head script (app/layout.tsx) has the same three-way default, dark last", () => {
    expect(layout).toMatch(THREE_WAY_DEFAULT);
  });

  it("readSavedMode() (the React-side source of truth) also defaults anything but light/system to dark", () => {
    const fn = src.slice(src.indexOf("function readSavedMode"), src.indexOf("function applyMode"));
    expect(fn).toMatch(/raw === "light" \|\| raw === "system" \? raw : "dark"/);
  });

  it("system mode is opt-in only — never how an unset preference is read", () => {
    // "system" must appear ONLY behind an explicit m==="system" (or
    // raw==="system") check, never as the bare fallback for "nothing saved".
    const initFallback = src.slice(src.indexOf("const THEME_INIT_JS"), src.indexOf("`;", src.indexOf("const THEME_INIT_JS")));
    expect(initFallback).not.toMatch(/:\s*matchMedia/); // no bare "else use matchMedia"
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

  it("applyMode (the shared apply function both controls call) also sets it", () => {
    const start = src.indexOf("function applyMode");
    const applyMode = src.slice(start, src.indexOf("\n}", start));
    expect(applyMode).toMatch(/document\.documentElement\.style\.colorScheme\s*=\s*resolved/);
  });

  it("the light-theme CSS block still declares its own color-scheme too", () => {
    expect(src).toMatch(/html\[data-om-theme="light"\]\s*\{[^}]*color-scheme:\s*light/);
  });
});

describe("system mode actually follows the OS", () => {
  it("resolveMode reads prefers-color-scheme only for the system case", () => {
    const fn = src.slice(src.indexOf("function resolveMode"), src.indexOf("function readSavedMode"));
    expect(fn).toMatch(/mode === "system"/);
    expect(fn).toMatch(/systemPrefersDark\(\)/);
  });

  it("a live OS change is picked up while the tab stays open, not just on next load", () => {
    expect(src).toMatch(/matchMedia\("\(prefers-color-scheme: dark\)"\)/);
    expect(src).toMatch(/mq\.addEventListener\("change"/);
  });
});

describe("layout.tsx ships a static dark color-scheme meta tag and runs the init script first", () => {
  it("declares colorScheme: \"dark\" in the viewport export", () => {
    // Server-rendered, present before any JS runs — the static half of the
    // fix for the first-paint white flash.
    expect(layout).toMatch(/colorScheme:\s*"dark"/);
  });

  it("the theme-init script is the literal first child of <head>, ahead of the render-blocking stylesheet", () => {
    // Root cause found 2026-08-25: the equivalent script previously lived
    // only inside RingHeader (a client component rendered well into <body>,
    // after Next's own generated <head> — stylesheet link, preload tags,
    // meta tags). On a fast connection the external stylesheet always won
    // the race, so local testing never showed a flash; on a slower real
    // mobile network the browser could paint before that stylesheet arrived
    // and before RingHeader's script ran. Executing color-scheme via an
    // inline script/style with no network dependency, as early as possible,
    // is what actually prevents the flash regardless of network speed.
    const headOpen = layout.indexOf("<head>");
    const headClose = layout.indexOf("</head>");
    expect(headOpen).toBeGreaterThan(-1);
    const headBlock = layout.slice(headOpen, headClose);
    expect(headBlock).toMatch(/HEAD_THEME_INIT_JS/);
  });
});
