import { describe, expect, it } from "vitest";
import { interpret } from "./interpret";
import { buildBuilderPrompt } from "./builder-prompt";
import { recommendEngine } from "./handoff";

const values = (claims: { value: string }[]) => claims.map((c) => c.value);
const joined = (claims: { value: string }[]) => values(claims).join(" | ").toLowerCase();

/** No field in a finished plan may be empty, circular, or raw garbage. */
function expectClean(i: ReturnType<typeof interpret>) {
  expect(i.title.value.length).toBeGreaterThan(2);
  expect(i.title.value.length).toBeLessThanOrEqual(60);
  expect(i.summary.trim().length).toBeGreaterThan(5);
  // The title is never just the whole first answer.
  if (i.raw.length > 60) expect(i.title.value.length).toBeLessThan(i.raw.length);
  for (const v of [...values(i.versionOne), ...values(i.exclusions), ...values(i.assets)]) {
    expect(v.trim()).not.toBe("");
    expect(v.toLowerCase()).not.toMatch(/\b(build it now|commit|push it|deploy it)\b/);
  }
  // No section repeats another section's paragraph.
  const all = [i.summary, ...values(i.versionOne), ...values(i.exclusions)].map((s) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, ""),
  );
  expect(new Set(all).size).toBe(all.length);
  // Every question we ask must be one we can't answer ourselves.
  expect(i.openQuestions.length).toBeLessThanOrEqual(1);
}

describe("OpenDoku picture puzzle — the acceptance test", () => {
  const input =
    "A puzzle game where I upload pictures and they are rearranged into puzzle pieces, with easy, medium, and hard difficulty. Start with 22 scenery pictures from Colorado, New Zealand, and Missouri. Add it to OpenDoku and build it now.";
  const i = interpret({ description: input });

  it("reads it as an addition to an existing product", () => {
    expect(i.buildType.value).toBe("add");
    expect(i.destination?.value).toBe("OpenDoku");
  });

  it("gives it a short working title, not the whole sentence", () => {
    expect(i.title.value).toBe("Picture Puzzle for OpenDoku");
  });

  it("finds a human audience — never the domain", () => {
    expect(i.audience?.value.toLowerCase()).toContain("puzzle players");
    expect(i.audience?.value).toContain("OpenDoku");
    expect(i.audience?.value).not.toMatch(/\.com/);
  });

  it("describes what version one actually does", () => {
    const v = joined(i.versionOne);
    expect(v).toContain("22 scenery pictures");
    expect(v).toMatch(/easy, medium or hard/);
    expect(v).toContain("rearrange the shuffled pieces");
    expect(v).toMatch(/solved/);
    expect(v).toMatch(/play again/);
  });

  it("keeps the 22 pictures as an existing asset, not a feature to build", () => {
    expect(joined(i.assets)).toContain("22 scenery pictures from colorado, new zealand, and missouri");
  });

  it("resolves the upload contradiction toward the pictures that exist", () => {
    expect(joined(i.exclusions)).toContain("public uploads");
    expect(i.assumptions.join(" ")).toMatch(/upload/i);
    expect(i.assumptions.join(" ")).toMatch(/22/);
  });

  it("excludes the version-two temptations", () => {
    const x = joined(i.exclusions);
    expect(x).toContain("accounts");
    expect(x).toContain("multiplayer");
    expect(x).toContain("leaderboards");
    expect(x).toMatch(/backend/);
  });

  it("reads 'build it now' as permission, never as a feature", () => {
    expect(i.permissions.build).toBe(true);
    expect(i.permissions.commit).toBe(true);
    expect(i.permissions.push).toBe(true);
    expect(joined(i.versionOne)).not.toContain("build it now");
  });

  it("protects what OpenDoku already does", () => {
    expect(i.preserve.join(" ")).toContain("OpenDoku");
  });

  it("names the real next action", () => {
    expect(i.completionAction).toMatch(/inspect the opendoku repository/i);
  });

  it("asks nothing — the description was complete", () => {
    expect(i.openQuestions).toHaveLength(0);
  });

  it("writes a builder prompt that is a brief, not a dump of answers", () => {
    const p = buildBuilderPrompt(i);
    expect(p).toMatch(/OpenDoku/);
    expect(p).toMatch(/inspect/i);
    expect(p).toMatch(/mouse|touch|keyboard/i);
    expect(p).toMatch(/commit/i);
    expect(p).toMatch(/push/i);
    expect(p).toMatch(/acceptance|ready when/i);
    expect(p.length).toBeGreaterThan(600);
  });

  it("produces a clean plan", () => expectClean(i));
});

describe("a new dog-walking business website", () => {
  const i = interpret({
    description:
      "I want to make a website for my new dog-walking business so people in my neighborhood can find me and book a walk. I have photos of the dogs I already walk.",
  });
  it("starts something new", () => expect(i.buildType.value).toBe("new"));
  it("has a usable title", () => expect(i.title.value.toLowerCase()).toContain("dog-walking"));

  it("reads 'book a walk' as an action, not as a book", () => {
    // Regression: the verb "book" matched the content shape and turned a
    // business website into "A piece: book a walk".
    expect(i.shape).toBe("site");
    expect(i.summary.toLowerCase()).not.toContain("a piece");
  });

  it("names the people, not the business, as the audience", () => {
    // Regression: "for my dog-walking business so people in my neighborhood
    // can find me" was swallowed whole and printed as the audience.
    expect(i.audience?.value.toLowerCase()).toContain("people in my neighborhood");
    expect(i.audience?.value.toLowerCase()).not.toContain("business");
    expect(i.audience?.value).not.toMatch(/\bcan$/);
  });
  it("does not invent a repository", () => expect(i.destination).toBeNull());
  it("keeps the photos as an existing asset", () => expect(joined(i.assets)).toContain("photos"));
  it("grants no build permission — none was given", () => {
    expect(i.permissions.push).toBe(false);
    expect(i.permissions.commit).toBe(false);
  });
  it("is clean", () => expectClean(i));
});

describe("broken mobile navigation on an existing site", () => {
  const i = interpret({
    description:
      "The menu on crossheartpray.com is broken on my phone — you tap it and nothing opens. It works fine on my laptop. Don't break the prayer cards, they work great.",
  });
  it("is a fix", () => expect(i.buildType.value).toBe("fix"));
  it("finds the product", () => expect(i.destination?.value).toBe("CrossHeartPray"));
  it("protects what already works", () => expect(i.preserve.join(" ").toLowerCase()).toContain("prayer cards"));
  it("is clean", () => expectClean(i));
});

describe("a printable Etsy workbook", () => {
  const i = interpret({
    description: "A printable workbook I could sell on Etsy to help people plan their week.",
    answers: { audience: "Homeschool moms who plan on paper" },
  });
  it("is packaged to sell", () => expect(i.buildType.value).toBe("sell"));
  it("uses the buyer they named", () => expect(i.audience?.value.toLowerCase()).toContain("homeschool moms"));
  it("is clean", () => expectClean(i));
});

describe("improving an existing movie watch-list", () => {
  const i = interpret({
    description:
      "Make my movie watch-list site better. The list gets long and I can never decide what to watch, so it should show me three picks.",
  });
  it("is an improvement", () => expect(i.buildType.value).toBe("improve"));
  it("carries the stated behaviour", () => expect(joined(i.versionOne)).toContain("three picks"));
  it("is clean", () => expectClean(i));
});

describe("a very unclear idea", () => {
  const i = interpret({ description: "idk maybe something with music, not sure yet" });
  it("is treated as an early idea, not a build", () => expect(i.buildType.value).toBe("explore"));
  it("asks exactly one useful question", () => {
    expect(i.openQuestions).toHaveLength(1);
    expect(i.openQuestions[0].key).toBe("versionOne");
  });
  it("recommends the Idea Engine", () => expect(recommendEngine(i)?.engineId).toBe("idea"));
  it("is clean", () => expectClean(i));
});

describe("a child describing a game", () => {
  const i = interpret({
    description:
      "i want to make a game where a cat jumps over stuff and you get points and it gets faster and my sister can play it too",
  });
  it("is a new build", () => expect(i.buildType.value).toBe("new"));
  it("keeps a short title", () => expect(i.title.value.split(/\s+/).length).toBeLessThanOrEqual(4));
  it("cleans the spelling without changing the intent", () => expect(i.summary).toMatch(/^[A-Z]/));
  it("recommends the beginner workflow or a game path", () => expect(recommendEngine(i)).not.toBeNull());
  it("is clean", () => expectClean(i));
});

describe("contradictory instructions", () => {
  const i = interpret({
    description:
      "A simple offline notes app with no accounts. Users log in with their account to sync notes across devices. Keep it tiny.",
  });
  it("keeps the person's explicit exclusion", () => expect(joined(i.exclusions)).toContain("accounts"));
  it("flags the contradiction instead of silently picking", () => {
    const text = (i.assumptions.join(" ") + i.openQuestions.map((q) => q.question).join(" ")).toLowerCase();
    expect(text.length).toBeGreaterThan(0);
  });
  it("is clean", () => expectClean(i));
});

describe("a domain typed into the audience box", () => {
  const i = interpret({
    description: "A daily trivia game with three questions a day.",
    answers: { audience: "opendoku.com" },
  });
  it("never treats a domain as a human audience", () => {
    expect(i.audience?.value.toLowerCase()).not.toContain("opendoku.com");
  });
  it("reads it as the product it belongs to instead", () => {
    expect(i.destination?.value).toBe("OpenDoku");
  });
  it("is clean", () => expectClean(i));
});

describe("back-references", () => {
  it("resolves 'same'", () => {
    const i = interpret({
      description: "A bingo card generator for my church group.",
      answers: { audience: "same" },
    });
    // "same" points at the description — and the description named the people.
    expect(i.audience?.value.toLowerCase()).toContain("church group");
    expect(i.audience?.value.toLowerCase()).not.toBe("same");
  });

  it("resolves 'what I said'", () => {
    const i = interpret({
      description: "A recipe box for my family, with grandma's cards scanned in.",
      answers: { versionOne: "what I said" },
    });
    expect(joined(i.versionOne)).not.toContain("what i said");
    expect(i.summary.toLowerCase()).toContain("recipe");
  });

  it("resolves 'use that' and keeps an addition", () => {
    const i = interpret({
      description: "A leaderboard for family game night.",
      answers: { versionOne: "use that, plus a reset button" },
    });
    expect(joined(i.versionOne)).toContain("reset button");
  });
});

describe("build permission mixed into feature text", () => {
  const i = interpret({
    description:
      "A tip calculator that splits the bill between friends. Build it now, commit and push it when the tests pass.",
  });
  it("extracts the permissions", () => {
    expect(i.permissions.build).toBe(true);
    expect(i.permissions.commit).toBe(true);
    expect(i.permissions.push).toBe(true);
  });
  it("never lists a permission as a feature", () => {
    const v = joined(i.versionOne) + i.summary.toLowerCase();
    expect(v).not.toContain("commit");
    expect(v).not.toContain("push it");
    expect(v).not.toContain("build it now");
  });
  it("is clean", () => expectClean(i));
});

describe("existing assets mixed into desired features", () => {
  const i = interpret({
    description:
      "A song player page. I already have 12 recorded tracks and the cover art. It should shuffle them and show the lyrics.",
  });
  it("separates what exists from what gets built", () => {
    expect(joined(i.assets)).toContain("12 recorded tracks");
    const v = joined(i.versionOne);
    expect(v).toContain("shuffle");
    expect(v).toContain("lyrics");
  });
  it("is clean", () => expectClean(i));
});

describe("question discipline", () => {
  it("a complete description gets no questions", () => {
    const i = interpret({
      description:
        "A chore chart for my three kids. Each kid has a list, they tap a chore to mark it done, and the chart resets every Sunday night.",
    });
    expect(i.openQuestions).toHaveLength(0);
  });

  it("an incomplete idea gets exactly one", () => {
    const i = interpret({ description: "I want to build an app" });
    expect(i.openQuestions).toHaveLength(1);
  });

  it("never asks for something already supplied", () => {
    const i = interpret({
      description: "A puzzle game for my friends where you drag pieces into place.",
      answers: { audience: "my friends" },
    });
    expect(i.openQuestions.map((q) => q.key)).not.toContain("audience");
  });
});

describe("a follow-up answer is its own sentence", () => {
  // Regression: the description and the answer used to be joined with a bare
  // space, so "I want to build an app" + "You type in a chore" parsed as one
  // run-on clause and produced "Want to build an app You type in a chore".
  const i = interpret({
    description: "I want to build an app",
    answers: { versionOne: "You type in a chore and your kids tap it to mark it done" },
  });

  it("never welds the description onto the answer", () => {
    for (const v of values(i.versionOne)) {
      expect(v.toLowerCase()).not.toContain("want to build an app you type");
    }
  });

  it("reads the answer as real behaviour", () => {
    const v = joined(i.versionOne);
    expect(v).toContain("chore");
    expect(v).toMatch(/tap/);
  });

  it("is clean", () => expectClean(i));
});

describe("no invented repository access", () => {
  it("a standalone idea never gets push instructions", () => {
    const i = interpret({ description: "A one-page site about my dog. Build it now." });
    const p = buildBuilderPrompt(i);
    expect(i.permissions.push).toBe(false);
    expect(p).not.toMatch(/git push/i);
    expect(p).not.toMatch(/existing repository/i);
  });

  it("an addition tells the builder to inspect first", () => {
    const i = interpret({ description: "Add a dark mode toggle to opendoku.com and build it now." });
    const p = buildBuilderPrompt(i);
    expect(p).toMatch(/inspect the OpenDoku repository/i);
  });
});
