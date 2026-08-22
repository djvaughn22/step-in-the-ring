// The Engine Room's shared result screen used to tell every engine —
// including Sell, Grow and Plan, which produce a plan a person carries out
// themselves, not code — that the normal next step was "Send to Open Mirror
// to build free" and then "send it to Open Mirror to push" to go live. That
// implied Open Mirror was a required step after using an Engine. It isn't.
//
// These tests lock in: the universal framing is gone, the real
// software-shipping option (still useful for build/fix/launch) is gated
// behind the engine's own `technical` flag rather than shown to everyone,
// and the honest "what's next" message only claims what the code actually
// does — a local save plus a real, existing account-import path — never a
// fabricated one-tap "Save to Build" or "Save to Library".

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ENGINES } from "./engines";

const src = readFileSync(join(__dirname, "EngineSystem.tsx"), "utf8");

describe("Engine Room end state — no universal Open Mirror step", () => {
  it("no longer shows the universal build-for-me CTA outside the technical gate", () => {
    // The old universal phrasing must not appear at all.
    expect(src).not.toMatch(/Send to Open Mirror to build free/);
  });

  it("no longer has a universal \"road to live\" section", () => {
    expect(src.toLowerCase()).not.toContain("the road to live");
  });

  it("gates the software-shipping option behind the engine's own technical flag", () => {
    expect(src).toMatch(/\{e\.technical &&/);
    // The gated block is the only place Open Mirror is offered as an action.
    const gated = src.slice(src.indexOf("{e.technical &&"));
    expect(gated).toMatch(/Email Open Mirror to build it/);
    expect(gated).toMatch(/Ask Open Mirror to push it live/);
  });

  it("tells every engine the honest, real thing: saved locally, and a real path into an account", () => {
    expect(src).toMatch(/What&apos;s next/);
    expect(src).toMatch(/saved right here in Your projects/);
    // Real capability that already exists (/account's import button) —
    // not a fabricated one-tap "save to library" action.
    expect(src).toMatch(/href="\/account"/);
    expect(src).not.toMatch(/Save to (Build|Library)/);
  });

  it("the technical gate matches real engine metadata, not a guess", () => {
    const technical = new Set(ENGINES.filter((e) => e.technical).map((e) => e.id));
    const nonTechnical = new Set(ENGINES.filter((e) => !e.technical).map((e) => e.id));
    // Software-shipping engines: the gate should apply to them.
    expect(technical.has("build")).toBe(true);
    expect(technical.has("fix")).toBe(true);
    expect(technical.has("launch")).toBe(true);
    // Real-world-plan engines must never see shipping/deploy language.
    expect(nonTechnical.has("sell")).toBe(true);
    expect(nonTechnical.has("grow")).toBe(true);
    expect(nonTechnical.has("plan")).toBe(true);
    // Story and Music already leave via their own studios before reaching
    // this shared component, and are non-technical either way.
    expect(nonTechnical.has("story")).toBe(true);
    expect(nonTechnical.has("music")).toBe(true);
  });
});
