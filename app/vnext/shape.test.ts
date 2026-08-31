import { describe, expect, it } from "vitest";
import { shapeIntent } from "./shape";
import { isSafeRef, newBuild, parseBuild, serializeBuild } from "./build";
import { applyAction, parseAction } from "./actions";
import { allCapabilities } from "./capabilities";

const GAME =
  "A game where you dodge falling tacos and try to beat your friend's score. " +
  "One player, a score counter, and it gets faster the longer you last.";
const SITE =
  "A one-page website for my dog. It shows his name, one great photo, three facts " +
  "about him, and a running list of the socks he has stolen.";
const BOOK = "I want to write a book about my grandfather's war letters.";
const BROKEN = "my site is broken";
const VAGUE = "something cool";

describe("shapeIntent", () => {
  it("is deterministic — the same words always read the same way", () => {
    expect(shapeIntent(GAME)).toEqual(shapeIntent(GAME));
    expect(shapeIntent(BOOK)).toEqual(shapeIntent(BOOK));
  });

  it("returns null for nothing, so a caller never shows an empty reading", () => {
    expect(shapeIntent("")).toBeNull();
    expect(shapeIntent("   \n  ")).toBeNull();
  });

  it("reads a game as a game and gives a first move from version one", () => {
    const s = shapeIntent(GAME)!;
    expect(s.kind).toBe("A game");
    expect(s.versionOne.length).toBeGreaterThan(0);
    expect(s.firstMove).toContain(s.versionOne[0].charAt(0).toLowerCase() + s.versionOne[0].slice(1));
  });

  it("never invents version one for something that's broken", () => {
    const s = shapeIntent(BROKEN)!;
    expect(s.versionOne).toEqual([]);
    // A repair starts by reproducing it, not by building a first version.
    expect(s.firstMove.toLowerCase()).toContain("what goes wrong");
    expect(s.firstMove.toLowerCase()).not.toContain("version one");
  });

  it("reads 'works on X but not on Y' as a repair too, not just literal 'broken'", () => {
    // Owner test 2026-08-24: this phrase read as a brand-new site to build,
    // not a bug report, before app/planner/interpret.ts and this file's
    // isRepair() both learned the pattern.
    const s = shapeIntent("my website button works on desktop but not on my phone")!;
    expect(s.versionOne).toEqual([]);
    expect(s.firstMove.toLowerCase()).toContain("what goes wrong");
  });

  it("knows what done means for a repair, not what done means for a new thing", () => {
    const s = shapeIntent("My church website is broken, the donate button does nothing on phones")!;
    expect(s.realMeans.toLowerCase()).toContain("works again");
    // The goal of BUILDING a site is not the goal of FIXING one.
    expect(s.realMeans.toLowerCase()).not.toContain("knows what to do next");
  });

  it("never hands somebody their own problem back as the goal", () => {
    // The planner lifts "Every win gets disputed" out of the complaint and
    // marks it a STATED desired result. It is the problem, not done.
    const s = shapeIntent(
      "A leaderboard for family game night. Nobody remembers last week's score " +
        "so every win gets disputed.",
    )!;
    expect(s.realMeans.toLowerCase()).not.toContain("gets disputed");
    expect(s.realMeans.length).toBeGreaterThan(10);
  });

  it("still uses their own definition of done when they gave one", () => {
    const s = shapeIntent(
      "A website for my band. I'll know it works when someone books us from it.",
    )!;
    expect(s.realMeans.toLowerCase()).toContain("book");
  });

  it("does not mistake teaching a repair for doing one", () => {
    // The planner classifies on the bare verb "fix". A guide is not a repair,
    // and "write down exactly what goes wrong" would be confidently wrong.
    const s = shapeIntent("I want to teach people how to fix a bike tire")!;
    expect(s.firstMove.toLowerCase()).not.toContain("what goes wrong");
    expect(s.realMeans.toLowerCase()).not.toContain("works again");
    expect(s.helps.map((h) => h.id)).toContain("howto");
  });

  it("still knows a real repair when it sees one", () => {
    for (const said of [
      "my site is broken",
      "My church website is broken, the donate button does nothing on phones",
      "fix my checkout page, it crashes",
    ]) {
      const s = shapeIntent(said)!;
      expect(s.firstMove.toLowerCase()).toContain("what goes wrong");
      expect(s.versionOne).toEqual([]);
    }
  });

  it("points at the one question instead of echoing it back", () => {
    const s = shapeIntent("something cool")!;
    expect(s.firstMove).toContain("Answer the one question below");
    // And it is still the same question being asked underneath.
    expect(s.question).toBeTruthy();
  });

  it("puts the cheap real-world test first when software isn't the product", () => {
    // "Before building anything" was dropped 2026-08-30 — confirmed live,
    // it read as a contradiction right next to softwareNote saying this
    // isn't something to build/engineer at all (a song, a letter, a plan).
    const s = shapeIntent(BOOK)!;
    expect(s.firstMove.toLowerCase()).toContain("try the cheap version first");
    expect(s.firstMove.toLowerCase()).not.toContain("building");
    expect(s.softwareNote).toBeTruthy();
  });

  it("shows their own sentence when the summary comes out a fragment", () => {
    // One stated behaviour makes the planner summary collapse to "A game: a
    // score counter." — their sentence says far more, and it's still true.
    const s = shapeIntent(GAME)!;
    expect(s.reading.toLowerCase()).toContain("dodge falling tacos");
    expect(s.reading).not.toBe("A game: a score counter.");
  });

  it("keeps the planner summary when it actually says something", () => {
    const s = shapeIntent(BOOK)!;
    expect(s.reading.toLowerCase()).toContain("grandfather");
  });

  it("says nothing about software when software plainly IS the product", () => {
    expect(shapeIntent(SITE)!.softwareNote).toBeNull();
  });

  it("asks at most one thing, and only when it's worth asking", () => {
    const s = shapeIntent(SITE)!;
    expect(s.question?.key).toBe("audience");
    // The shaping still stands on its own — the question is never a gate.
    expect(s.realMeans).toBeTruthy();
    expect(s.firstMove).toBeTruthy();
  });

  it("always offers somewhere to go, even when nothing matched the words", () => {
    const s = shapeIntent(VAGUE)!;
    expect(s.helps.length).toBeGreaterThan(0);
    expect(s.helps.map((h) => h.id)).toContain("five-hour-sprint");
  });

  it("only ever offers capabilities a person can actually open", () => {
    // Game is deliberately NOT owner-only as of 2026-08-24 (its "new game
    // idea" path is fully client-side) — assert the general property
    // instead of hardcoding which engine is owner-only today: no `helps`
    // entry, for any of these inputs, may be one a visitor can't open.
    const ownerOnlyIds = new Set(allCapabilities().filter((c) => c.ownerOnly).map((c) => c.id));
    expect(ownerOnlyIds.size).toBeGreaterThan(0); // the property is only meaningful if one exists
    for (const said of [GAME, SITE, BOOK, BROKEN, VAGUE]) {
      const s = shapeIntent(said)!;
      for (const h of s.helps) expect(ownerOnlyIds.has(h.id), `${said} → ${h.id}`).toBe(false);
    }
  });

  it("gives a first move for every kind of thing somebody might say", () => {
    for (const said of [GAME, SITE, BOOK, BROKEN, VAGUE, "sell my woodworking on etsy"]) {
      const s = shapeIntent(said)!;
      expect(s.firstMove.trim().length).toBeGreaterThan(10);
      expect(s.realMeans.trim().length).toBeGreaterThan(10);
      expect(s.title.trim()).not.toBe("");
    }
  });
});

// Mom-and-dad first-time journey audit (2026-08-30). Confirmed live: "I
// don't understand this bill" and "My faucet is leaking" got "Before
// building anything, try the cheap version..." and a "What can help"
// section suggesting a five-hour sprint and a beginner app walkthrough —
// right after the product had correctly said this wasn't a build at all.
describe("general-help never talks like a build", () => {
  const BILL = "I don't understand this bill.";
  const FAUCET = "My faucet is leaking.";
  const LEARN = "Teach me how compound interest works.";

  it("the first move never says 'building' for a question or real trouble", () => {
    for (const said of [BILL, FAUCET]) {
      const s = shapeIntent(said)!;
      expect(s.firstMove.toLowerCase()).not.toContain("building");
      expect(s.firstMove.toLowerCase()).not.toContain("before building");
    }
  });

  it("'what can help' is empty rather than suggesting a wrong-direction tool", () => {
    // "Teach me how compound interest works" keyword-matches the How To
    // Anything Engine (it needs "teach"/"how to") — but that engine turns
    // the OWNER'S OWN proven fix into a published tutorial, the opposite
    // of wanting to learn something. Suggesting it is worse than nothing.
    const learn = shapeIntent(LEARN)!;
    expect(learn.helps).toHaveLength(0);

    // The no-keyword-match case: used to fall back to "Five Hour Sprint"
    // and "Your first build, step by step" — both build-shaped, both wrong.
    const bill = shapeIntent(BILL)!;
    expect(bill.helps).toHaveLength(0);
  });

});

describe("a Build started from a shaping", () => {
  it("carries the reading without ever touching the person's words", () => {
    const s = shapeIntent(SITE)!;
    const b = newBuild(SITE, "2026-08-08T00:00:00.000Z", s);
    expect(b.intent).toBe(SITE.replace(/\s+/g, " ").trim());
    expect(b.reading).toBe(s.reading);
    expect(b.goal).toBe(s.realMeans);
    expect(b.currentAction).toBe(s.firstMove);
    expect(b.versionOne).toEqual(s.versionOne);
    expect(b.stage).toBe("bring");
  });

  it("still works with no shaping at all", () => {
    const b = newBuild("just a sentence", "2026-08-08T00:00:00.000Z");
    expect(b.reading).toBeUndefined();
    expect(b.versionOne).toBeUndefined();
    expect(b.currentAction).toBeTruthy();
  });

  it("survives a round trip through storage", () => {
    const s = shapeIntent(GAME)!;
    const b = newBuild(GAME, "2026-08-08T00:00:00.000Z", s);
    const back = parseBuild(serializeBuild(b))!;
    expect(back.reading).toBe(b.reading);
    expect(back.versionOne).toEqual(b.versionOne);
    expect(back.goal).toBe(b.goal);
  });

  it("reads a Session 1 Build that predates shaping, losing nothing", () => {
    const legacy = JSON.stringify({
      version: 1,
      id: "abc",
      title: "An old build",
      intent: "A thing I said before shaping existed",
      stage: "shape",
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-02T00:00:00.000Z",
      currentAction: "Keep going.",
      capabilitiesUsed: ["idea"],
      artifacts: [],
      history: [{ at: "2026-08-01T00:00:00.000Z", note: "You stepped in.", stage: "bring" }],
    });
    const back = parseBuild(legacy)!;
    expect(back.intent).toBe("A thing I said before shaping existed");
    expect(back.stage).toBe("shape");
    expect(back.currentAction).toBe("Keep going.");
    expect(back.capabilitiesUsed).toEqual(["idea"]);
    expect(back.reading).toBeUndefined();
    expect(back.versionOne).toBeUndefined();
  });
});

describe("an artifact ref becomes an href, so it is a door", () => {
  it("takes a page here or an ordinary web address", () => {
    for (const ref of ["/builds/abc", "/live", "https://opendoku.com/slopedoku/", "http://example.com/x"]) {
      expect(isSafeRef(ref)).toBe(true);
    }
  });

  it("refuses anything that would run in the person's own session", () => {
    for (const ref of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "  javascript:alert(1)  ",
      "data:text/html;base64,PHNjcmlwdD4=",
      "vbscript:msgbox",
      "file:///etc/passwd",
      // Protocol-relative: looks local, goes somewhere else entirely.
      "//evil.example/x",
      "",
      "   ",
      `https://example.com/${"x".repeat(600)}`,
    ]) {
      expect(isSafeRef(ref)).toBe(false);
    }
  });

  it("is enforced on the server, not only in the form", () => {
    // parseAction is what the API route runs on an untrusted body.
    expect(parseAction({ type: "add-artifact", label: "A page", ref: "javascript:alert(1)" })).toBeNull();
    expect(parseAction({ type: "add-artifact", label: "A page", ref: "//evil.example" })).toBeNull();
    expect(parseAction({ type: "add-artifact", label: "A page", ref: "https://example.com" })).toEqual({
      type: "add-artifact",
      label: "A page",
      ref: "https://example.com",
    });
  });

  it("records the artifact and says so in history", () => {
    const b = newBuild("A site for my dog", "2026-08-08T00:00:00.000Z");
    const action = parseAction({ type: "add-artifact", label: "The first draft", ref: "/builds/x" })!;
    const result = applyAction(b, action, "2026-08-08T01:00:00.000Z");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.build.artifacts).toHaveLength(1);
    expect(result.build.artifacts[0].label).toBe("The first draft");
    expect(result.build.history.at(-1)!.note).toBe("Added The first draft.");
    // The words are still theirs.
    expect(result.build.intent).toBe("A site for my dog");
  });
});

describe("reading an older build again", () => {
  const OLD = {
    version: 1 as const,
    id: "old-1",
    title: "A one-page website for my dog",
    intent:
      "A one-page website for my dog. It shows his name, one great photo, and a running " +
      "list of the socks he has stolen.",
    stage: "shape" as const,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    currentAction: "Say more about it, or read it back and shape version one.",
    capabilitiesUsed: ["build"],
    artifacts: [],
    history: [{ at: "2026-08-01T00:00:00.000Z", note: "You stepped in.", stage: "bring" as const }],
  };

  const reread = (b: typeof OLD | Record<string, unknown>) =>
    applyAction(b as never, parseAction({ type: "reshape" })!, "2026-08-08T12:00:00.000Z");

  it("fills in what a Session 1 build never had", () => {
    const r = reread(OLD);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.build.reading).toBeTruthy();
    expect(r.build.versionOne!.length).toBeGreaterThan(0);
    expect(r.build.goal).toBeTruthy();
    // Our old placeholder is ours to replace; a real first move is better.
    expect(r.build.currentAction).not.toBe(OLD.currentAction);
    expect(r.build.history.at(-1)!.note).toBe("Read your words again.");
  });

  it("changes nothing that was already there", () => {
    const mine = {
      ...OLD,
      reading: "My own description of it",
      goal: "My own definition of done",
      audience: "My family",
      versionOne: ["The one thing I decided"],
      currentAction: "Call the printer back",
    };
    const r = reread(mine);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.build.reading).toBe("My own description of it");
    expect(r.build.goal).toBe("My own definition of done");
    expect(r.build.audience).toBe("My family");
    expect(r.build.versionOne).toEqual(["The one thing I decided"]);
    expect(r.build.currentAction).toBe("Call the printer back");
    // Nothing changed, so nothing is written to history.
    expect(r.build.history).toHaveLength(1);
  });

  it("never moves the stage, the words, the artifacts or the history", () => {
    const withWork = {
      ...OLD,
      stage: "live" as const,
      artifacts: [{ id: "a", label: "The live site", ref: "https://example.com", kind: "link" as const, createdAt: "x" }],
    };
    const r = reread(withWork);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.build.stage).toBe("live");
    expect(r.build.intent).toBe(OLD.intent);
    expect(r.build.title).toBe(OLD.title);
    expect(r.build.artifacts).toHaveLength(1);
    expect(r.build.capabilitiesUsed).toEqual(["build"]);
    // History only ever grows.
    expect(r.build.history.length).toBeGreaterThanOrEqual(OLD.history.length);
    expect(r.build.history[0]).toEqual(OLD.history[0]);
  });

  it("is idempotent — reading twice says nothing the second time", () => {
    const first = reread(OLD);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = applyAction(first.build, { type: "reshape" }, "2026-08-08T13:00:00.000Z");
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.build.history).toEqual(first.build.history);
  });
});
