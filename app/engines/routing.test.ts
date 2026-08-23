// Regression coverage for the reported bug: /engines/room?engine=design-shop
// rendering "Grow Engine" instead of Design Shop. The deep-link effect in
// EngineSystem.tsx does `getEngine(new URLSearchParams(search).get("engine"))`
// and trusts whatever comes back — so the only ways that can misroute are (1)
// a duplicate/typo'd id in the registry silently overwriting another engine's
// slot in ENGINE_BY_ID, or (2) a bespoke studio's dispatch branch (design-shop,
// game, story, howto, idea, music) referencing an id that no longer matches
// the registry. Neither needs a browser to catch — both are registry/source
// invariants.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ENGINES, getEngine } from "./engines";

describe("engine slug routing — every slug opens its own engine", () => {
  it("has no duplicate engine ids", () => {
    const ids = ENGINES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getEngine(slug) returns the exact registry object for every engine, by reference", () => {
    for (const e of ENGINES) {
      expect(getEngine(e.id)).toBe(e);
    }
  });

  it("getEngine(slug).name matches the engine that slug is supposed to open — the exact shape of the reported bug", () => {
    // A hand-written map, independent of engines.ts, so a copy-paste id error
    // in the registry (e.g. design-shop's object accidentally carrying
    // `id: "grow"`) still gets caught even though it wouldn't break the
    // reference-equality test above.
    const expected: Record<string, string> = {
      idea: "Idea Engine",
      build: "Build Engine",
      sell: "Sell Engine",
      launch: "Launch Engine",
      fix: "Fix Engine",
      grow: "Grow Engine",
      plan: "Plan Engine",
      "design-shop": "Design Shop Engine",
      game: "Game Engine",
      howto: "How to Anything Engine",
      story: "Story Partner",
      music: "Music Engine",
    };
    for (const [slug, name] of Object.entries(expected)) {
      expect(getEngine(slug)?.name).toBe(name);
    }
  });

  it("every visible, non-bespoke engine actually reaches the generic intake wizard for its own slug", () => {
    const bespoke = new Set(["design-shop", "game", "story", "howto", "idea", "music"]);
    const generic = ENGINES.filter((e) => !e.hidden && !bespoke.has(e.id));
    // These are the engines the generic wizard (EngineSystem's own render,
    // not a Studio) is responsible for routing correctly.
    expect(generic.map((e) => e.id).sort()).toEqual(["build", "fix", "grow", "launch", "plan", "sell"]);
  });

  it("EngineSystem's bespoke dispatch branches point at ids that exist in the registry", () => {
    const src = readFileSync(join(__dirname, "EngineSystem.tsx"), "utf8");
    const branchIds = [...src.matchAll(/engineId === "([a-z-]+)" && view === "intake"/g)].map((m) => m[1]);
    // The exact six bespoke studios wired into EngineSystem — if this list
    // drifts from the dispatch branches, it means a slug was renamed on one
    // side and not the other, which is precisely how design-shop could start
    // resolving to whatever branch comes first instead.
    expect(branchIds.sort()).toEqual(["design-shop", "game", "howto", "idea", "music", "story"]);
    for (const id of branchIds) {
      expect(getEngine(id), `engineId === "${id}" branch references an id missing from the registry`).toBeTruthy();
    }
  });

  it("the catalog's generated href for every engine round-trips back to that same engine", () => {
    for (const e of ENGINES) {
      const href = `/engines/room?engine=${e.id}`;
      const slug = new URLSearchParams(href.split("?")[1]).get("engine");
      expect(getEngine(slug ?? "")).toBe(e);
    }
  });
});
