// The engine-room generator now reads intake through the creation system:
// typed understanding, engine-fit, and adapter prompts — not label echoes.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getEngine } from "./engines";
import { generatePackage } from "./generator";

function makeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
}
beforeEach(() => vi.stubGlobal("window", { localStorage: makeStorage() }));
afterEach(() => vi.unstubAllGlobals());

const IDEA = "A tool that helps teachers pick a five-minute class activity.";

describe("engine packages are materially different", () => {
  it("build vs plan vs sell produce different prompts for the same idea", () => {
    const build = generatePackage(getEngine("build")!, { name: "Five", purpose: IDEA }, "Building", "full", "claude-code");
    const plan = generatePackage(getEngine("plan")!, { name: "Five", outcome: IDEA }, "Planning", "full", "chatgpt");
    const sell = generatePackage(getEngine("sell")!, { name: "Five", product: IDEA }, "Shaping", "full", "chatgpt");
    expect(build.mainPrompt).toMatch(/States that must exist/i);
    expect(plan.mainPrompt).toMatch(/phases/i);
    expect(sell.mainPrompt).toMatch(/Price hypothesis/i);
    expect(build.mainPrompt).not.toBe(plan.mainPrompt);
    expect(plan.mainPrompt).not.toBe(sell.mainPrompt);
  });

  it("understanding interprets instead of echoing labels", () => {
    const pkg = generatePackage(getEngine("build")!, { name: "Dog", purpose: "I want to solve dog boredom. Keep a dog busy and entertained." }, "Building", "full", "claude-code");
    expect(pkg.understanding).toMatch(/looking after the dog/i);
    expect(pkg.understanding).toMatch(/Version-one promise/i);
    expect(pkg.understanding).toMatch(/Software:/);
    expect(pkg.understanding).not.toMatch(/not stated — the build must inspect/);
  });

  it("engine-fit warns without blocking when the lane is wrong", () => {
    const pkg = generatePackage(getEngine("build")!, { name: "Tee", purpose: "A funny dog dad t-shirt design to sell on Etsy." }, "Building", "full", "claude-code");
    expect(pkg.direction).toMatch(/can still be built here/i);
  });

  it("a game in the Build Engine gets the game specification", () => {
    const pkg = generatePackage(getEngine("build")!, { name: "Stack", purpose: "A game where you stack pancakes before they slide off the plate." }, "Building", "full", "claude-code");
    expect(pkg.mainPrompt).toMatch(/Core loop/i);
    expect(pkg.mainPrompt).toMatch(/Smallest playable proof/i);
    expect(pkg.direction).not.toMatch(/can still be built here/i);
  });

  it("empty intake falls back to the classic package without crashing", () => {
    const pkg = generatePackage(getEngine("build")!, {}, "Building", "full", "claude-code");
    expect(pkg.mainPrompt.length).toBeGreaterThan(100);
  });
});

describe("owner login detour preserves an arriving creation", () => {
  // The old client-side access gate is gone (its codes shipped in the public
  // bundle). The Engine Room now sits behind the server-side owner gate, and
  // the login detour must not lose a handed-over creation:
  //  - the localStorage seed is untouched by a server login round-trip, and
  //  - safeReturnTo keeps the full query string, so URL handoffs survive.

  it("the engine seed survives — the login round-trip never touches localStorage", () => {
    window.localStorage.setItem("sitr-engine-seed", JSON.stringify({ engineId: "design-shop", raw: "sticker idea" }));
    expect(window.localStorage.getItem("sitr-engine-seed")).toContain("sticker idea");
  });

  it("the handoff rides the URL, which the login detour never rewrites", async () => {
    const { safeReturnTo } = await import("../owner/gate");
    const { readHandoffFromSearch, handoffToIntake } = await import("../creation/handoff");
    const search = `?engine=design-shop&cr=${encodeURIComponent(JSON.stringify({
      v: 1, source: "idontcry", flow: "dream-shop", idea: "Dog Dad sticker",
      facts: { audience: "Dog Lovers", productType: "Sticker" },
    }))}`;
    const before = readHandoffFromSearch(search);
    // What the owner is returned to after login is the same path + search.
    // The room, not the public catalog: the login detour only ever returns
    // somebody to a protected path.
    const returned = safeReturnTo(`/engines/room${search}`);
    expect(returned).toBe(`/engines/room${search}`);
    const after = readHandoffFromSearch(returned.slice(returned.indexOf("?")));
    expect(before).toEqual(after);
    expect(handoffToIntake("design-shop", after!).customer).toBe("Dog Lovers");
  });
});
