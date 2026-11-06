import { describe, expect, it } from "vitest";
import { newRecord, viewOf } from "../creation/record";
import { AI_APPS, MOVES, exampleFor, firstMessage, nextMessage, purposeOf } from "./ai-messages";

const message = (idea: string, answers: Record<string, string> = {}, exclusions: string[] = []) =>
  firstMessage(viewOf(newRecord(idea, { answers, exclusions })));

// One real first idea from each kind of person the site is for. Fictional, and
// deliberately including ideas the rules misread (see the law in ai-messages.ts).
const IDEAS = [
  "a game about dragons where you collect gold",
  "a website about my pet hamster",
  "a comic about a robot who wants to be a chef",
  "a study guide for my biology final",
  "a flashcard app for my spanish vocab",
  "a slideshow about the water cycle for science class",
  "a one page website for my dental office",
  "a spreadsheet to track my client invoices",
  "a weekly newsletter for my real estate clients",
  "a training checklist for new hires",
  "a cookbook of my family recipes for my grandkids, with the stories behind each dish",
  "a birthday poem for my granddaughter who loves horses",
  "a family tree for our reunion",
  "a letter to my insurance company about a denied claim",
  "a song about a train moving through summer rain",
  "something to help my small church",
  "My faucet is leaking",
  "Something broke: the contact form on my website stopped working",
];

describe("firstMessage — works for anyone, whatever the rules guessed", () => {
  it.each(IDEAS)("keeps their words verbatim and stays short: %s", (idea) => {
    const text = message(idea);
    expect(text).toContain(idea);
    expect(text.split(/\s+/).length).toBeLessThan(140);
  });

  it.each(IDEAS)("carries no brief-speak, no hype and no wrong-world content: %s", (idea) => {
    const text = message(idea);
    expect(text).not.toMatch(/scope|version-one promise|deliverable|stakeholder|mvp|prompt|premise|central character/i);
    expect(text).not.toMatch(/vibe|magic|supercharge|unlock|revolution|powerful|seamless|leverage/i);
    expect(text).not.toMatch(/##|\*\*/);
  });

  it("is the same every time", () => {
    expect(message(IDEAS[0])).toBe(message(IDEAS[0]));
  });

  it("asks for a real first try and sets up the back and forth", () => {
    const text = message("a birthday poem for my granddaughter who loves horses");
    expect(text).toMatch(/^I want to make this: a birthday poem/);
    expect(text).toContain("make a first version now");
    expect(text).toContain("ask me what I'd like to change");
    expect(text).toContain("keep everything else as it is");
  });

  it("asks for blanks rather than invented facts", () => {
    expect(message("a one page website for my dental office")).toContain("leave a clear blank");
  });

  it("says no coding on anything that could take code", () => {
    for (const idea of ["a one page website for my dental office", "a game about dragons where you collect gold", "something to help my small church"]) {
      expect(message(idea)).toContain("I don't know how to code");
    }
  });

  it("never brings up code on a poem, a song or a study guide", () => {
    for (const idea of ["a birthday poem for my granddaughter who loves horses", "a song about a train moving through summer rain", "a study guide for my biology final"]) {
      expect(message(idea)).not.toMatch(/\bcode\b/);
    }
  });

  it("does not tell a coder's AI that they can't code", () => {
    expect(message("a dashboard for my github repo, in typescript")).not.toContain("I don't know how to code");
  });

  it("is honest that a song may not come back as sound", () => {
    expect(message("a song about a train moving through summer rain")).toContain("If you can't make audio");
  });

  it("does not ask an AI to make something when someone asked for help", () => {
    const text = message("My faucet is leaking");
    expect(text).toMatch(/^I could use some help with this: My faucet is leaking/);
    expect(text).not.toContain("first version");
    expect(text).toContain("health, money or the law");
  });

  it("treats something broken as a repair", () => {
    const text = message("Something broke: the contact form on my website stopped working");
    expect(text).toMatch(/^Something isn't working/);
    expect(text).toContain("don't change anything that's already working");
    expect(text).not.toContain("first version");
  });

  it("adds what they answered in their own words and skips what they skipped", () => {
    const text = message("a game about dragons", { versionOne: "You tap to fly.", audience: "" });
    expect(text).toContain("More about what I want: You tap to fly.");
    expect(text).not.toMatch(/More about what I want: You tap to fly\. {2}/);
  });

  it("carries a handoff's exclusions", () => {
    expect(message("a game about dragons", {}, ["ads", "accounts"])).toContain("Please leave out: ads, accounts.");
  });

  it("puts a long or multi-line idea on its own lines", () => {
    expect(message("a game about dragons\nwhere you collect gold")).toContain("I want to make this:\n\na game about dragons\nwhere you collect gold");
  });
});

describe("nextMessage — saying what to change", () => {
  it("has five moves, and only finishing needs no words", () => {
    expect(MOVES.map((m) => m.id)).toEqual(["change", "broke", "confused", "different", "done"]);
    expect(MOVES.filter((m) => m.ask === null).map((m) => m.id)).toEqual(["done"]);
  });

  it("gives nothing to copy until there are words", () => {
    for (const m of MOVES.filter((x) => x.ask)) expect(nextMessage(m.id, "   ")).toBe("");
  });

  it("keeps their words verbatim in every move", () => {
    for (const m of MOVES.filter((x) => x.ask)) {
      expect(nextMessage(m.id, "  Keep the part about the pony.  ")).toContain("\n\nKeep the part about the pony.\n\n");
    }
  });

  it("protects what is already right when asking for a change", () => {
    expect(nextMessage("change", "Shorter.")).toContain("Keep everything else as it is");
  });

  it("asks for plain words when something failed or made no sense", () => {
    expect(nextMessage("broke", "Nothing moved.")).toContain("everyday words");
    expect(nextMessage("confused", "What is a host?")).toContain("no technical terms");
  });

  it("finishes without being asked for anything", () => {
    expect(nextMessage("done", "")).toContain("final version");
  });

  it("offers a closer example when it can, and a general one when it can't", () => {
    const change = MOVES[0];
    expect(exampleFor(change, "site")).toContain("phone number");
    expect(exampleFor(change, "unknown")).toBe(change.example);
    expect(exampleFor(MOVES[1], "site")).toBe(MOVES[1].example);
  });
});

describe("AI_APPS", () => {
  it("lists real https links in alphabetical order, so the order recommends nothing", () => {
    const names = AI_APPS.map((a) => a.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    for (const a of AI_APPS) expect(a.href).toMatch(/^https:\/\/[a-z.]+\/$/);
  });
});

describe("purposeOf — not everybody came to make something", () => {
  const view = (idea: string) => viewOf(newRecord(idea));

  it("reads what they came to do", () => {
    expect(purposeOf(view("a birthday poem for my granddaughter"))).toBe("make");
    expect(purposeOf(view("I need help with my taxes"))).toBe("help");
    expect(purposeOf(view("My faucet is leaking"))).toBe("help");
    expect(purposeOf(view("Something broke: the contact form on my website stopped working"))).toBe("fix");
  });

  it("finishes in words that fit", () => {
    expect(nextMessage("done", "", "make")).toContain("final version");
    expect(nextMessage("done", "", "help")).toContain("what I should do next");
    expect(nextMessage("done", "", "help")).not.toContain("final version");
    expect(nextMessage("done", "", "fix")).toContain("what was wrong");
  });
});
