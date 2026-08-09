// vNext regression guards — the shell AND the preservation rules.
//
// Two jobs here. First: the Build object and the capability registry behave.
// Second, and more important: prove that turning Step In The Ring into a
// creation-first product did not quietly cost anybody their work. Every
// pre-vNext route still resolves, every storage key is still known, and the
// engines are all still reachable.

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  advance, buildsFromProjects, newBuild, parseBuild, serializeBuild, titleFromIntent,
  useCapability, BUILD_STAGES,
} from "./build";
import { allCapabilities, capabilitiesForIntent, capabilityById, BUILD_ENGINE_ID } from "./capabilities";
import { LEGACY_SOURCES, findLegacyWork } from "./legacy";
import { ENGINES } from "../engines/engines";

const ROOT = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

describe("Build — the one persistent object", () => {
  it("is created from the person's own words, unrewritten", () => {
    const b = newBuild("  a game where   you dodge falling tacos ", "2026-08-08T00:00:00.000Z");
    expect(b.intent).toBe("a game where you dodge falling tacos");
    expect(b.stage).toBe("bring");
    expect(b.history).toHaveLength(1);
    expect(b.version).toBe(1);
  });

  it("derives a recognizable title without inventing content", () => {
    expect(titleFromIntent("A one-page website for my dog. It shows his name.")).toBe(
      "A one-page website for my dog.",
    );
    expect(titleFromIntent("")).toBe("Untitled build");
    expect(titleFromIntent("x".repeat(200)).length).toBeLessThanOrEqual(60);
  });

  it("round-trips through serialize/parse", () => {
    const b = newBuild("a leaderboard for family game night", "2026-08-08T00:00:00.000Z");
    const back = parseBuild(serializeBuild(b));
    expect(back).toEqual(b);
  });

  it("never throws on junk and returns null instead", () => {
    expect(parseBuild("not json")).toBeNull();
    expect(parseBuild(null)).toBeNull();
    expect(parseBuild([])).toBeNull();
    expect(parseBuild({ intent: "   " })).toBeNull();
  });

  it("PRESERVES fields written by a newer version of the app", () => {
    const parsed = parseBuild({
      version: 1,
      intent: "a song about the drive home",
      somethingFromTomorrow: { deep: true },
    });
    expect(parsed?.extra).toEqual({ somethingFromTomorrow: { deep: true } });
  });

  it("falls back to a known stage rather than trusting a bad one", () => {
    expect(parseBuild({ intent: "x", stage: "shipping-it" })?.stage).toBe("bring");
    for (const s of BUILD_STAGES) {
      expect(parseBuild({ intent: "x", stage: s })?.stage).toBe(s);
    }
  });

  it("advances stage through history only, leaving the intent alone", () => {
    const b = newBuild("a puzzle game", "2026-08-08T00:00:00.000Z");
    const next = advance(b, "shape", "Version one written down.", "2026-08-08T01:00:00.000Z");
    expect(next.stage).toBe("shape");
    expect(next.intent).toBe(b.intent);
    expect(next.history).toHaveLength(2);
    expect(b.history).toHaveLength(1); // the original is untouched
  });

  it("records a capability once, not every time it is opened", () => {
    const b = newBuild("a design for a shirt");
    const once = useCapability(b, "design-shop");
    const twice = useCapability(once, "design-shop");
    expect(twice.capabilitiesUsed).toEqual(["design-shop"]);
  });

  it("drops artifacts and events that carry no meaning, keeping the good ones", () => {
    const parsed = parseBuild({
      intent: "a website for my dog",
      artifacts: [{ label: "Live site", ref: "https://example.com", kind: "link" }, { label: "" }, null],
      history: [{ note: "You stepped in." }, {}, "nope"],
    });
    expect(parsed?.artifacts).toHaveLength(1);
    expect(parsed?.history).toHaveLength(1);
  });
});

describe("Builds read back off an account", () => {
  const row = (over: Partial<Parameters<typeof buildsFromProjects>[0][number]> = {}) => ({
    id: "p1",
    title: "Family leaderboard",
    engineId: BUILD_ENGINE_ID,
    content: serializeBuild(newBuild("a leaderboard for family game night", "2026-08-01T00:00:00.000Z")),
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...over,
  });

  it("takes only Build rows, newest first", () => {
    const out = buildsFromProjects(
      [
        row({ id: "old", updatedAt: "2026-08-01T00:00:00.000Z" }),
        row({ id: "engine-work", engineId: "music" }),
        row({ id: "new", updatedAt: "2026-08-07T00:00:00.000Z" }),
      ],
      BUILD_ENGINE_ID,
    );
    expect(out.map((b) => b.id)).toEqual(["new", "old"]);
  });

  it("lets the server own identity and timestamps", () => {
    const out = buildsFromProjects([row({ id: "server-id", title: "Renamed on the account" })], BUILD_ENGINE_ID);
    expect(out[0].id).toBe("server-id");
    expect(out[0].title).toBe("Renamed on the account");
  });

  it("SKIPS an unreadable row instead of guessing — and never destroys it", () => {
    const out = buildsFromProjects([row({ id: "bad", content: "{}" }), row({ id: "good" })], BUILD_ENGINE_ID);
    expect(out.map((b) => b.id)).toEqual(["good"]);
  });
});

describe("Capability registry — nothing we built disappeared", () => {
  const caps = allCapabilities();

  it("lists EVERY engine in the engine registry", () => {
    const visible = ENGINES.filter((e) => e.id !== BUILD_ENGINE_ID);
    for (const engine of visible) {
      const cap = capabilityById(engine.id);
      expect(cap, `engine ${engine.id} missing from the capability registry`).toBeDefined();
      expect(cap?.href).toContain(engine.id);
    }
  });

  it("keeps hidden engines reachable so old saved work still opens", () => {
    // Etsy is a deliberate hidden duplicate — hiding it from the picker must
    // never mean a person cannot get back to an Etsy project they saved.
    expect(capabilityById("etsy")).toBeDefined();
  });

  it("does not surface the Build store as an engine anybody opens", () => {
    expect(caps.find((c) => c.id === BUILD_ENGINE_ID)).toBeUndefined();
  });

  it("gives every capability a route and an honest status", () => {
    for (const c of caps) {
      expect(c.href.length, c.id).toBeGreaterThan(0);
      expect(c.what.length, c.id).toBeGreaterThan(0);
      expect(c.activation, c.id).toBeTruthy();
    }
  });

  it("matches plain human words to capabilities, deterministically", () => {
    const song = capabilitiesForIntent("a song about the drive home").map((c) => c.id);
    expect(song).toContain("music");
    const shirt = capabilitiesForIntent("a design for a shirt my sister would wear").map((c) => c.id);
    expect(shirt).toContain("design-shop");
    // Same input, same answer — no model, no randomness.
    expect(capabilitiesForIntent("a song about the drive home")).toEqual(
      capabilitiesForIntent("a song about the drive home"),
    );
  });

  it("NEVER suggests something a visitor cannot actually open", () => {
    // The Game Engine and the Author's Room match these words perfectly and
    // are both owner-only. Sending somebody there is a dead end dressed as
    // help — the suggestion list must stay usable-only.
    for (const intent of [
      "a game where you dodge falling tacos",
      "I want to write a story about my grandfather",
    ]) {
      for (const hit of capabilitiesForIntent(intent)) {
        expect(hit.ownerOnly, `${hit.id} suggested for "${intent}"`).not.toBe(true);
        expect(["working", "beta"]).toContain(hit.activation);
      }
    }
  });

  it("returns nothing rather than guessing when there is nothing to go on", () => {
    expect(capabilitiesForIntent("   ")).toEqual([]);
  });
});

describe("Preservation — pre-vNext work is still findable", () => {
  it("knows every storage key the old surfaces write", () => {
    // Anti-regression: these keys are the user's work. Removing one from
    // LEGACY_SOURCES makes that work invisible in Your Work.
    const required = [
      "sitr-plans-v3",
      "sitr-creation-current-v1",
      "sitr-engine-projects-v1",
      "creation-engine-projects-v1",
      "sitr-projects-v1",
      "sitr-music-songs-v1",
      "sitr-build-machine-v1",
      "sitr-first-app-v1",
      "sitr-story-partner",
    ];
    const known = LEGACY_SOURCES.map((s) => s.key);
    for (const key of required) expect(known, `${key} is no longer discoverable`).toContain(key);
  });

  it("is read-only — the bridge never writes, clears or migrates", () => {
    const src = read("app/vnext/legacy.ts");
    expect(src).not.toMatch(/localStorage\.(setItem|removeItem|clear)/);
    const ui = read("app/vnext/LegacyWork.tsx");
    expect(ui).not.toMatch(/localStorage\.(setItem|removeItem|clear)/);
  });

  it("is safe with no browser at all", () => {
    expect(findLegacyWork()).toEqual([]);
  });

  it("keeps every pre-vNext route on disk", () => {
    const routes = [
      "app/page.tsx", "app/about/page.tsx", "app/how/page.tsx", "app/build/page.tsx",
      "app/build-machine/page.tsx", "app/live/page.tsx", "app/engines/page.tsx",
      "app/projects/page.tsx", "app/account/page.tsx", "app/author/page.tsx",
      "app/shop/page.tsx", "app/membership/page.tsx", "app/five-hour-sprint-tool/page.tsx",
      "app/products/five-hour-sprint/page.tsx", "app/members/login/page.tsx",
      "app/members/signup/page.tsx", "app/owner/page.tsx",
    ];
    for (const r of routes) expect(existsSync(join(ROOT, r)), `${r} was removed`).toBe(true);
  });

  it("keeps the Build store's reserved engine row, or every saved Build orphans", () => {
    expect(ENGINES.find((e) => e.id === BUILD_ENGINE_ID)?.hidden).toBe(true);
  });
});

describe("The new shell", () => {
  const home = read("app/page.tsx");
  const layout = read("app/layout.tsx");

  it("leads with Live your dream in the hero, once", () => {
    expect(home).toContain("Live your dream.");
    expect(home.match(/Live your dream\./g)).toHaveLength(1);
  });

  it("asks the one question through the shared creation entry", () => {
    expect(home).toContain("CreationEntry");
    expect(read("app/vnext/CreationEntry.tsx")).toContain("What do you want to create?");
  });

  it("does not paste an engine catalog onto the hero", () => {
    const hero = home.slice(home.indexOf('stage === "landing"'), home.indexOf("What's under it"));
    const engineLinks = hero.match(/\/engines\?engine=/g) ?? [];
    expect(engineLinks.length).toBe(0);
  });

  it("keeps primary navigation to a handful of doors", () => {
    const links = layout.match(/\{ emoji: "[^"]+", name: "[^"]+", href: "[^"]+" \}/g) ?? [];
    expect(links.length).toBeLessThanOrEqual(5);
    expect(layout).toContain('href: "/builds"');
    expect(layout).toContain('href: "/library"');
    expect(layout).toContain('href: "/account"');
  });

  it("still opens the Engine Room as an explained door, not a footnote", () => {
    expect(home).toContain("The Engine Room");
    expect(home).toContain('href="/engines"');
  });

  it("keeps the Open Mirror footer and nav mounted", () => {
    expect(layout).toContain("OpenMirrorFooter");
    expect(layout).toContain("OpenMirrorNav");
  });

  it("lets a signed-out visitor reach their own local work", () => {
    const mw = read("middleware.ts");
    const publicList = mw.slice(mw.indexOf("PUBLIC_ROUTES"), mw.indexOf("function isPublicRoute"));
    expect(publicList).toContain('"/builds"');
    expect(publicList).toContain('"/library"');
  });
});
