// Regression coverage for the engine/surface registry that the Engines
// catalog, Home, and Create all read from — added during the 2026-08-27
// platform pass. If one of these fails, the fix is almost always to correct
// the registry entry, not this test.

import { describe, expect, it } from "vitest";
import { ENGINES } from "../engines/engines";
import {
  allCapabilities,
  BUILD_ENGINE_ID,
  enginesByGroup,
  featuredCapabilities,
} from "./capabilities";

describe("every registered engine appears exactly once", () => {
  it("has no duplicate engine ids in the raw registry", () => {
    const ids = ENGINES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has no duplicate capability ids once surfaces and engines are combined", () => {
    const ids = allCapabilities().map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("shows every visible engine on exactly one shelf", () => {
    const shelves = enginesByGroup();
    const seen = new Map<string, number>();
    for (const shelf of shelves) {
      for (const item of shelf.items) {
        seen.set(item.id, (seen.get(item.id) ?? 0) + 1);
      }
    }
    for (const [id, count] of seen) {
      expect(count, `${id} appears on ${count} shelves`).toBe(1);
    }
  });
});

describe("Five Hour Sprint is not an ordinary engine", () => {
  it("is not in the raw engine registry", () => {
    expect(ENGINES.find((e) => e.id === "five-hour-sprint")).toBeUndefined();
  });

  it("is a first-class surface/tool capability, not derived from an Engine row", () => {
    const capability = allCapabilities().find((c) => c.id === "five-hour-sprint");
    expect(capability).toBeDefined();
    expect(capability?.kind).toBe("tool");
  });

  it("is featured on Home alongside, not instead of, real engines", () => {
    const featured = featuredCapabilities();
    const ids = featured.map((c) => c.id);
    expect(ids).toContain("five-hour-sprint");
    // Home's featured row is proof it sits beside engines, not that it
    // replaced the idea of an engine catalog.
    expect(ids.length).toBeGreaterThan(1);
  });
});

describe("every engine on the catalog has what a person needs to decide", () => {
  const engineCapabilities = allCapabilities().filter(
    (c) => c.kind === "engine" && c.id !== BUILD_ENGINE_ID,
  );

  it("is not an empty catalog", () => {
    expect(engineCapabilities.length).toBeGreaterThan(5);
  });

  it("gives every engine a name, a purpose sentence, a route, and a truthful status", () => {
    for (const c of engineCapabilities) {
      expect(c.name?.trim().length, c.id).toBeGreaterThan(0);
      expect(c.what?.trim().length, `${c.id} needs a one-sentence purpose`).toBeGreaterThan(10);
      expect(c.href?.trim().length, `${c.id} needs a route`).toBeGreaterThan(0);
      expect(c.activation, `${c.id} needs a truthful access/status label`).toBeTruthy();
    }
  });

  it("gives every grouped engine a 'use this when' line", () => {
    for (const shelf of enginesByGroup()) {
      for (const item of shelf.items) {
        if (item.kind !== "engine") continue;
        expect(item.useWhen?.trim().length, `${item.id} on shelf ${shelf.id}`).toBeGreaterThan(0);
      }
    }
  });
});
