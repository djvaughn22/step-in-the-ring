// Game Engine now distinguishes "make a NEW game" from "I already have one
// to re-theme/ship." This covers the new-game shaping logic: pick a genre,
// get a real first shape immediately, refine one question at a time, stop
// any time by keeping the shape.
import { describe, expect, it } from "vitest";
import {
  addFunHook, addObstacle, buildShape, changeGenre, keepShape, nextPrompt,
  parseGameIdeaSession, pickGenre, startGameIdea,
} from "./game-idea.engine";

describe("game idea shaping", () => {
  it("produces a real shape as soon as a genre is picked", () => {
    const s = pickGenre(startGameIdea("make a fun family friendly game"), "party");
    const shape = buildShape(s);
    expect(shape).toContain("Party / Family");
    expect(shape).toContain("make a fun family friendly game");
    expect(shape).toMatch(/Players:/);
    expect(shape).toMatch(/Restart:/);
  });

  it("asks one question at a time, not everything up front", () => {
    const s = pickGenre(startGameIdea("a game"), "arcade");
    expect(nextPrompt(s)?.title).toMatch(/obstacle/i);
    const withObstacle = addObstacle(s, "it gets faster");
    expect(nextPrompt(withObstacle)?.title).toMatch(/fun/i);
    const withFun = addFunHook(withObstacle, "beating your own score");
    expect(nextPrompt(withFun)).toBeNull();
    expect(buildShape(withFun)).toContain("it gets faster");
    expect(buildShape(withFun)).toContain("beating your own score");
  });

  it("keeping the shape stops the questions early", () => {
    const s = pickGenre(startGameIdea("a game"), "puzzle");
    const kept = keepShape(s);
    expect(nextPrompt(kept)).toBeNull();
  });

  it("changing genre resets to the picker", () => {
    const s = keepShape(pickGenre(startGameIdea("a game"), "cards"));
    const changed = changeGenre(s);
    expect(changed.genre).toBeNull();
    expect(changed.finished).toBe(false);
  });

  it("safely parses a round-tripped session", () => {
    const s = addObstacle(pickGenre(startGameIdea("a game"), "sports"), "the wind");
    const parsed = parseGameIdeaSession(JSON.parse(JSON.stringify(s)));
    expect(parsed).toEqual(s);
  });

  it("never claims a finished game — always frames it as a shape to build from", () => {
    const s = pickGenre(startGameIdea("a game"), "other");
    expect(buildShape(s).toLowerCase()).toContain("not a finished game");
  });
});
