// How to Anything's default mode: help someone do something, one step at a
// time — not the retrospective evidence-capture form. Locks in the required
// proof case (BandLab) plus the honest generic fallback for anything else.
import { describe, expect, it } from "vitest";
import { advance, currentStep, detectDomain, finish, parseTaskSession, startTask, stuckHelp } from "./task-session.engine";

describe("task session — the required proof case", () => {
  it("detects the music domain and names the actual tool", () => {
    const s = startTask("I want to make my first beat in BandLab");
    expect(detectDomain(s.goal)).toBe("music");
    const step = currentStep(s);
    expect(step.title.toLowerCase()).toContain("bandlab");
    expect(step.detail).toContain("BandLab");
  });

  it("gives one concrete step, not a giant checklist or a capture form", () => {
    const s = startTask("I want to make my first beat in BandLab");
    const step = currentStep(s);
    expect(step.title).toBeTruthy();
    expect(step.detail.split("\n").length).toBe(1); // one step, not a list
  });

  it("keeps going after DONE / paste-back, folding the note into the next step's copy text", () => {
    let s = startTask("I want to make my first beat in BandLab");
    s = advance(s, "Done, project is open");
    const step = currentStep(s);
    expect(step.copyText).toContain("Done, project is open");
  });

  it("never auto-finishes — the creator declares done", () => {
    let s = startTask("a task");
    for (let i = 0; i < 5; i++) s = advance(s, "");
    expect(s.finishedAt).toBeNull();
    s = finish(s);
    expect(s.finishedAt).not.toBeNull();
  });
});

describe("task session — honest fallback for unrecognized domains", () => {
  it("a physical task gets safety-first, honest meta guidance, not fabricated specifics", () => {
    const s = startTask("how do I replace a faucet");
    expect(detectDomain(s.goal)).toBe("physical");
    const step = currentStep(s);
    expect(step.detail.toLowerCase()).toMatch(/shut off|supply|exact model/);
  });

  it("a fully generic ask still gets a real, honest first move", () => {
    const s = startTask("how do I figure out my taxes");
    expect(detectDomain(s.goal)).toBe("generic");
    expect(currentStep(s).title).toBeTruthy();
  });

  it("stuck help never pretends to know a domain it doesn't", () => {
    expect(stuckHelp(startTask("how do I replace a faucet"))).toMatch(/manufacturer|manual|model/i);
  });
});

describe("task session persistence", () => {
  it("safely round-trips", () => {
    const s = advance(startTask("a task"), "note");
    const parsed = parseTaskSession(JSON.parse(JSON.stringify(s)));
    expect(parsed).toEqual(s);
  });

  it("returns null for non-sessions", () => {
    expect(parseTaskSession(null)).toBeNull();
    expect(parseTaskSession({})).toBeNull();
  });
});
