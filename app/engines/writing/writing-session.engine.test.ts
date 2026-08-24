// "There's no Story Engine yet" was a dead end. This locks in the real
// replacement: useful story material immediately from the idea itself.
import { describe, expect, it } from "vitest";
import {
  addEnding, addProblem, buildShape, detectType, keepShape, nextPrompt,
  parseWritingSession, startWriting, writeOpening,
} from "./writing-session.engine";

const DOG_MAYOR = "I want to write a funny bedtime story about a dog who thinks he's mayor";

describe("writing session — the required proof case", () => {
  it("detects a story from the idea text", () => {
    expect(detectType(DOG_MAYOR)).toBe("story");
  });

  it("gives real, specific story material immediately — not a dead end", () => {
    const s = startWriting(DOG_MAYOR);
    const shape = buildShape(s);
    expect(shape).toMatch(/STORY SHAPE/);
    expect(shape.toLowerCase()).not.toMatch(/no story engine|not built|planned/);
    // The "secretly believes they're X" premise should surface the role.
    expect(shape).toMatch(/mayor/i);
    expect(shape).toMatch(/takes the "job" very seriously/i);
  });

  it("writes a real opening line with no extra input needed", () => {
    const s = writeOpening(startWriting(DOG_MAYOR));
    const shape = buildShape(s);
    expect(shape).toMatch(/OPENING LINE/);
  });

  it("asks one question at a time, not everything up front", () => {
    let s = startWriting(DOG_MAYOR);
    expect(nextPrompt(s)?.title).toMatch(/problem/i);
    s = addProblem(s, "the parade permit gets denied");
    expect(nextPrompt(s)?.title).toMatch(/end/i);
    s = addEnding(s, "the whole street shows up anyway");
    expect(nextPrompt(s)).toBeNull();
    const shape = buildShape(s);
    expect(shape).toContain("the parade permit gets denied");
    expect(shape).toContain("the whole street shows up anyway");
  });

  it("keeping the shape stops the questions early", () => {
    expect(nextPrompt(keepShape(startWriting(DOG_MAYOR)))).toBeNull();
  });
});

describe("writing session — other types get real, honest material too", () => {
  it("a note gets a note-shaped structure, not a story template", () => {
    const shape = buildShape(startWriting("a birthday note for my dad"));
    expect(shape).toMatch(/NOTE SHAPE/);
  });

  it("an article gets an article-shaped structure", () => {
    const shape = buildShape(startWriting("a blog article about my garden"));
    expect(shape).toMatch(/ARTICLE SHAPE/);
  });

  it("never claims the shape is a finished piece", () => {
    expect(buildShape(startWriting("something to write")).toLowerCase());
  });
});

describe("writing session persistence", () => {
  it("safely round-trips", () => {
    const s = addProblem(startWriting(DOG_MAYOR), "trouble");
    const parsed = parseWritingSession(JSON.parse(JSON.stringify(s)));
    expect(parsed).toEqual(s);
  });

  it("repairs a corrupted record instead of discarding it", () => {
    const parsed = parseWritingSession({ id: "x", type: "not-real", round: 99 });
    expect(parsed).not.toBeNull();
    expect(parsed!.round).toBe(0);
  });

  it("returns null for non-sessions", () => {
    expect(parseWritingSession(null)).toBeNull();
    expect(parseWritingSession({})).toBeNull();
  });
});
