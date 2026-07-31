/**
 * Game Engine contract tests — world validation, template instantiation
 * (including Arcade Kit injection back-compat), registry upserts staying
 * idempotent on republish, and the generated PWA files.
 */

import { describe, expect, it } from "vitest";
import {
  ARCADE_KIT_MARKER, CARDS_END_MARKER, GAMES_END_MARKER, MINEDOKU_WORLD,
  buildHomepageCard, buildIconSvg, buildManifest, buildServiceWorker,
  checkTemplateHtml, instantiateTemplate, slugFromName, upsertGamesRegistry,
  upsertHomepageCard, validateWorld,
} from "./game-modes";
import { ARCADE_KIT_JS } from "./arcade-kit";

const TEMPLATE = `<!doctype html><html><head>
<!-- __DOKU_HEAD_START__ -->
<title>old</title>
<!-- __DOKU_HEAD_END__ -->
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>button { touch-action: manipulation; }</style>
</head><body>
${ARCADE_KIT_MARKER}
<script>
const THEME = /*__DOKU_THEME_START__*/{"old":true}/*__DOKU_THEME_END__*/;
</script>
</body></html>`;

describe("world validation", () => {
  it("MineDoku, the reference world, validates clean", () => {
    expect(validateWorld(MINEDOKU_WORLD)).toEqual([]);
  });

  it("rejects bad slugs, reserved paths, and broken tiers", () => {
    expect(validateWorld({ ...MINEDOKU_WORLD, slug: "X!" }).length).toBeGreaterThan(0);
    expect(validateWorld({ ...MINEDOKU_WORLD, slug: "api" }).length).toBeGreaterThan(0);
    const badTier = { ...MINEDOKU_WORLD.tiers[0], size: 9 };
    expect(validateWorld({ ...MINEDOKU_WORLD, tiers: [badTier, ...MINEDOKU_WORLD.tiers.slice(1)] }).length).toBeGreaterThan(0);
  });

  it("slugFromName strips to url-safe lowercase", () => {
    expect(slugFromName("Gem Hunter! 99")).toBe("gemhunter99");
  });
});

describe("template contract", () => {
  it("accepts a well-formed template", () => {
    const c = checkTemplateHtml(TEMPLATE);
    expect(c.errors).toEqual([]);
    expect(c.warnings).toEqual([]);
  });

  it("flags missing instantiation markers as hard errors", () => {
    const c = checkTemplateHtml("<html><body>nothing here</body></html>");
    expect(c.errors.length).toBe(2);
  });

  it("flags doctrine gaps as warnings, not blockers", () => {
    const noViewport = TEMPLATE.replace(/<meta name="viewport"[^>]*>/, "").replace("touch-action: manipulation;", "");
    const c = checkTemplateHtml(noViewport);
    expect(c.errors).toEqual([]);
    expect(c.warnings.length).toBe(2);
  });
});

describe("template instantiation", () => {
  it("swaps the theme and the head, and injects the Arcade Kit at its marker", () => {
    const html = instantiateTemplate(TEMPLATE, MINEDOKU_WORLD, ARCADE_KIT_JS);
    expect(html).toContain('"slug": "minedoku"');
    expect(html).not.toContain('{"old":true}');
    expect(html).toContain("MineDoku — mine the numbers");
    expect(html).toContain("window.ArcadeKit");
    expect(html).not.toContain(ARCADE_KIT_MARKER);
  });

  it("passes templates WITHOUT the kit marker through untouched (back-compat)", () => {
    const legacy = TEMPLATE.replace(ARCADE_KIT_MARKER, "");
    const html = instantiateTemplate(legacy, MINEDOKU_WORLD, ARCADE_KIT_JS);
    expect(html).not.toContain("window.ArcadeKit");
    // And with no kit provided at all, output is identical to the old path.
    expect(instantiateTemplate(legacy, MINEDOKU_WORLD)).toBe(html);
  });

  it("re-instantiating an instantiated game is stable (republish-safe)", () => {
    const once = instantiateTemplate(TEMPLATE, MINEDOKU_WORLD);
    const twice = instantiateTemplate(once, MINEDOKU_WORLD);
    expect(twice).toBe(once);
  });
});

describe("platform registries stay idempotent", () => {
  const index = `<html><body>\n${CARDS_END_MARKER} -->\n</body></html>`;
  const gamesJs = `const GAMES = [\n  ${GAMES_END_MARKER}\n];`;

  it("homepage card: insert once, republish replaces", () => {
    const first = upsertHomepageCard(index, MINEDOKU_WORLD);
    expect(first).toContain('href="/minedoku/"');
    const renamed = { ...MINEDOKU_WORLD, name: "MineDoku II" };
    const second = upsertHomepageCard(first, renamed);
    expect(second).toContain("MineDoku II");
    expect(second.match(/href="\/minedoku\/"/g)!.length).toBe(1);
  });

  it("games.js registry: insert once, republish replaces", () => {
    const first = upsertGamesRegistry(gamesJs, MINEDOKU_WORLD);
    expect(first).toContain('slug: "minedoku"');
    const second = upsertGamesRegistry(first, { ...MINEDOKU_WORLD, emoji: "🪙" });
    expect(second).toContain("🪙");
    expect(second.match(/slug: "minedoku"/g)!.length).toBe(1);
  });

  it("throws plainly when a platform file lost its marker", () => {
    expect(() => upsertHomepageCard("<html></html>", MINEDOKU_WORLD)).toThrow(/marker/);
    expect(() => upsertGamesRegistry("const GAMES = []", MINEDOKU_WORLD)).toThrow(/marker/);
  });
});

describe("generated PWA files", () => {
  it("manifest scopes the game to its own path", () => {
    const m = JSON.parse(buildManifest(MINEDOKU_WORLD));
    expect(m.start_url).toBe("/minedoku/");
    expect(m.scope).toBe("/minedoku/");
    expect(m.display).toBe("standalone");
  });

  it("service worker caches the game shell under a versioned key", () => {
    const sw = buildServiceWorker(MINEDOKU_WORLD);
    expect(sw).toContain("minedoku-v1");
    expect(sw).toContain("'/minedoku/'");
  });

  it("icon svg carries the world emoji and accent", () => {
    const svg = buildIconSvg(MINEDOKU_WORLD);
    expect(svg).toContain(MINEDOKU_WORLD.emoji);
    expect(svg).toContain(MINEDOKU_WORLD.accentDark);
  });

  it("homepage card escapes HTML in names — no tag can open", () => {
    const card = buildHomepageCard({ ...MINEDOKU_WORLD, name: 'A<b>"x' });
    expect(card).not.toContain("<b>");
    expect(card).toContain("&lt;b");
    expect(card).toContain("&quot;x");
  });
});
