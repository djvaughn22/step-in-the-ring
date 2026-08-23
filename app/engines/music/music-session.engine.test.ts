// Music Session engine: the "say what you want to make" replacement for the
// old static nine-row checklist. Locks in: intent-first start, tool-aware
// phrasing, one next move at a time, copy text that stands on its own,
// paste-back feeding the next move, progress advancing, and safe parsing.
import { describe, expect, it } from "vitest";
import {
  STAGE_ORDER, TOOLS, TOOL_LABELS, TOTAL_MOVES,
  advance, currentMove, detectProfile, isFinished, parseSession,
  progress, startSession, stuckHelp,
} from "./music-session.engine";

describe("detectProfile", () => {
  it("recognizes a reggae goal", () => {
    expect(detectProfile("a laid-back reggae beat")).toBe("reggae");
  });
  it("recognizes a hip-hop goal", () => {
    expect(detectProfile("a first hip-hop loop")).toBe("hiphop");
  });
  it("recognizes a piano goal", () => {
    expect(detectProfile("a simple piano idea")).toBe("piano");
  });
  it("recognizes a game/background-music goal", () => {
    expect(detectProfile("background music for a game")).toBe("ambient");
  });
  it("recognizes an already-started idea", () => {
    expect(detectProfile("a song from an idea I already have")).toBe("existing-idea");
  });
  it("falls back to generic for anything else", () => {
    expect(detectProfile("something fun")).toBe("generic");
    expect(detectProfile("")).toBe("generic");
  });
});

describe("startSession", () => {
  it("starts at step zero, unfinished, with a detected profile", () => {
    const s = startSession("a laid-back reggae beat", "bandlab");
    expect(s.stepIndex).toBe(0);
    expect(s.profile).toBe("reggae");
    expect(s.tool).toBe("bandlab");
    expect(s.finishedAt).toBeNull();
    expect(isFinished(s)).toBe(false);
  });

  it("accepts 'not sure yet' as a valid tool", () => {
    const s = startSession("something fun", "unsure");
    expect(s.tool).toBe("unsure");
    expect(TOOLS).toContain("unsure");
  });
});

describe("currentMove", () => {
  it("gives one move at a time, phrased for the chosen tool", () => {
    const s = startSession("a laid-back reggae beat", "bandlab");
    const move = currentMove(s);
    expect(move.title).toBeTruthy();
    expect(move.detail).toBeTruthy();
    expect(move.detail).toContain("BandLab");
  });

  it("never says the generic 'in your tool' phrase", () => {
    const goals = ["a laid-back reggae beat", "a first hip-hop loop", "a simple piano idea", "background music for a game", ""];
    for (const tool of TOOLS) {
      for (const goal of goals) {
        const s = startSession(goal, tool);
        for (let i = 0; i < TOTAL_MOVES; i++) {
          const m = currentMove({ ...s, stepIndex: i });
          expect(m.detail.toLowerCase()).not.toContain("in your tool");
          expect(m.copyText.toLowerCase()).not.toContain("in your tool");
        }
      }
    }
  });

  it("uses the actual tool name when a tool is chosen", () => {
    const s = startSession("a simple piano idea", "garageband");
    const move = currentMove(s);
    expect(move.copyText).toContain(TOOL_LABELS.garageband);
  });

  it("adapts instructions to the detected profile instead of one generic script", () => {
    const reggae = currentMove({ ...startSession("a laid-back reggae beat", "bandlab"), stepIndex: 1 });
    const piano = currentMove({ ...startSession("a simple piano idea", "garageband"), stepIndex: 1 });
    expect(reggae.title).not.toBe(piano.title);
    expect(reggae.detail).not.toBe(piano.detail);
  });

  it("folds the last pasted-back note into the next copy text", () => {
    let s = startSession("a first hip-hop loop", "fl-studio");
    s = advance(s, "Done. The beat feels too empty.");
    const move = currentMove(s);
    expect(move.copyText).toContain("The beat feels too empty");
  });
});

describe("advance / progress", () => {
  it("moves the step index forward and records the paste-back note", () => {
    let s = startSession("something fun", "unsure");
    s = advance(s, "Done!");
    expect(s.stepIndex).toBe(1);
    expect(s.log).toHaveLength(1);
    expect(s.log[0].note).toBe("Done!");
  });

  it("accepts a blank note — 'done' needs no explanation", () => {
    const s = advance(startSession("something fun", "unsure"), "");
    expect(s.stepIndex).toBe(1);
    expect(s.log[0].note).toBe("");
  });

  it("advances the stage rail as steps complete", () => {
    let s = startSession("something fun", "unsure");
    const first = progress(s).stageIndex;
    s = advance(s, "");
    const second = progress(s).stageIndex;
    expect(second).toBeGreaterThanOrEqual(first);
    expect(progress(s).stage).toBe(STAGE_ORDER[second]);
  });

  it("finishes after the last move and stays finished", () => {
    let s = startSession("something fun", "unsure");
    for (let i = 0; i < TOTAL_MOVES; i++) s = advance(s, "done");
    expect(isFinished(s)).toBe(true);
    expect(s.finishedAt).not.toBeNull();
    const after = advance(s, "should not move");
    expect(after).toBe(s);
  });
});

describe("stuckHelp", () => {
  it("gives tool-specific recovery tips, not a guess dressed as fact", () => {
    expect(stuckHelp("bandlab").join(" ")).toMatch(/BandLab|track|instrument/i);
    expect(stuckHelp("ardour").join(" ")).toMatch(/Ardour/);
  });
});

describe("parseSession", () => {
  it("round-trips a valid session", () => {
    const s = startSession("a laid-back reggae beat", "bandlab");
    const parsed = parseSession(JSON.parse(JSON.stringify(s)));
    expect(parsed).toEqual(s);
  });

  it("repairs a corrupted or partial record instead of discarding it", () => {
    const parsed = parseSession({ id: "abc", tool: "not-a-real-tool", stepIndex: 999 });
    expect(parsed).not.toBeNull();
    expect(parsed!.tool).toBe("unsure");
    expect(parsed!.stepIndex).toBe(TOTAL_MOVES);
  });

  it("returns null for garbage that isn't a session at all", () => {
    expect(parseSession(null)).toBeNull();
    expect(parseSession("hello")).toBeNull();
    expect(parseSession({})).toBeNull();
  });
});
