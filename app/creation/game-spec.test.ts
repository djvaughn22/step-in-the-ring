// The serious-game package, executed — through the REAL handoff path.
//
// A game creation arriving from iDontCry's Game Lab must come out of the
// game adapter as a full development package: loop, feel, fairness,
// sessions, phone, cost, proof, playtest, verdict. And when the creator has
// NOT locked the mechanic, the spec must say so and demand honest candidate
// work instead of pretending the first idea is the game.

import { describe, expect, it } from "vitest";
import { adapterFor, adapterForType } from "./adapters";
import { DEFAULT_BUILDER_DEFAULTS } from "./builder-defaults";
import { readHandoffFromSearch } from "./handoff";
import { newRecord, recordFromHandoff, viewOf } from "./record";
import { recommendEngines } from "./recommend";
import { parseCreationRecord, type HandoffPayloadV1 } from "./types";

/** The exact payload iDontCry's Game Lab emits for the serious-game project. */
const GAME_LAB_PAYLOAD: HandoffPayloadV1 = {
  v: 1,
  source: "idontcry",
  flow: "game-lab",
  idea:
    "An original, instantly understandable, skill-based phone game with a powerful “one more try” loop. The exact mechanic is not yet locked and must be developed honestly.",
  typeHint: "game",
  facts: {
    player:
      "Start with the owner as the first demanding player, then broaden to ordinary mobile players across ages and cultures.",
    goal:
      "Get better, beat a previous result, survive longer, solve more efficiently, or achieve a more satisfying perfect action through genuine player skill.",
  },
};

/** The whole-package coverage every game spec must carry. */
const REQUIRED_COVERAGE: RegExp[] = [
  /one-sentence rule/i,
  /touch verb/i,          // exact player input
  /Core loop/i,           // moment-to-moment loop
  /Anticipation/i,
  /Satisfaction/i,
  /Win state/i,
  /Loss state/i,
  /Restart: one tap/i,
  /Score measures skill/i,
  /Best result saved/i,   // high-score meaning
  /Improvement is visible/i,
  /Difficulty ramps/i,
  /Fairness/i,
  /deterministic vs random/i,
  /Procedural variation/i,
  /under two minutes/i,   // short sessions
  /chained restarts/i,    // long sessions
  /portrait/i,
  /haptics/i,
  /no server/i,           // low-cost technical model
  /Smallest playable proof/i,
  /Do not add/i,
  /playtest/i,
  /Kill-or-continue/i,
];

describe("the game adapter is a serious game-development package", () => {
  it("decodes the Game Lab handoff URL exactly as iDontCry encodes it", () => {
    const search = `?cr=${encodeURIComponent(JSON.stringify(GAME_LAB_PAYLOAD))}`;
    const decoded = readHandoffFromSearch(search);
    expect(decoded).not.toBeNull();
    expect(decoded!.idea).toBe(GAME_LAB_PAYLOAD.idea);
    expect(decoded!.facts?.player).toBe(GAME_LAB_PAYLOAD.facts!.player);
    expect(decoded!.facts?.goal).toBe(GAME_LAB_PAYLOAD.facts!.goal);
    // The whole payload fits a URL safely — the fallback never has to fire.
    expect(search.length).toBeLessThanOrEqual(1800 + 4);
  });

  it("preserves the creator's exact words end to end, and routes to the Build lane", () => {
    const record = recordFromHandoff(GAME_LAB_PAYLOAD);
    expect(record.originalIdea).toBe(GAME_LAB_PAYLOAD.idea);
    expect(record.source).toBe("idontcry");
    expect(record.sourceFlow).toBe("game-lab");
    expect(record.facts.player).toBe(GAME_LAB_PAYLOAD.facts!.player);
    expect(record.facts.goal).toBe(GAME_LAB_PAYLOAD.facts!.goal);

    const v = viewOf(record);
    expect(v.creationType).toBe("game");
    expect(adapterForType(v.creationType).engineId).toBe("game");
    expect(recommendEngines(v).primary?.engineId).toBe("build");

    // A record survives a save/load round trip byte-identically where it counts.
    const revived = parseCreationRecord(JSON.parse(JSON.stringify(record)));
    expect(revived?.originalIdea).toBe(record.originalIdea);
    expect(revived?.facts).toEqual(record.facts);
  });

  it("covers the whole development package, and does not merely echo the idea", () => {
    const v = viewOf(recordFromHandoff(GAME_LAB_PAYLOAD));
    const spec = adapterFor("game")!.spec(v);
    const text = spec.map((s) => `${s.title}\n${s.lines.join("\n")}`).join("\n\n");

    for (const re of REQUIRED_COVERAGE) {
      expect(text, `game spec missing ${re}`).toMatch(re);
    }
    // The creator's facts ride into the spec (player + goal), and the spec
    // adds far more than it received.
    expect(text).toContain("first demanding player");
    expect(text).toContain("beat a previous result");
    expect(text.length).toBeGreaterThan(GAME_LAB_PAYLOAD.idea.length * 8);

    // The prompt keeps the exact words and the doctrine.
    const prompt = adapterFor("game")!.prompt(v, DEFAULT_BUILDER_DEFAULTS);
    expect(prompt).toContain(GAME_LAB_PAYLOAD.idea);
    expect(prompt).toMatch(/energy systems/i);
    expect(prompt).toMatch(/Manipulative daily-reward/i);
  });

  it("exposes the unlocked mechanic as the open decision, and demands candidates", () => {
    const v = viewOf(recordFromHandoff(GAME_LAB_PAYLOAD));
    const text = adapterFor("game")!
      .spec(v)
      .map((s) => `${s.title}\n${s.lines.join("\n")}`)
      .join("\n\n");
    expect(text).toMatch(/open decision: the core mechanic/i);
    expect(text).toMatch(/3–5 genuinely different core loops/);
    expect(text).toMatch(/ONE smallest playable proof of the winner/);
  });

  it("does NOT raise the open-mechanic section when the mechanic is stated", () => {
    const locked = newRecord(
      "A game where you stack pancakes before they slide off the plate.",
      { facts: { typeHint: "game" } },
    );
    const text = adapterFor("game")!
      .spec(viewOf(locked))
      .map((s) => `${s.title}\n${s.lines.join("\n")}`)
      .join("\n\n");
    expect(text).not.toMatch(/open decision: the core mechanic/i);
    // The rest of the package is still the full one.
    expect(text).toMatch(/Kill-or-continue/);
    expect(text).toMatch(/deterministic vs random/i);
  });
});
