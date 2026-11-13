// @vitest-environment jsdom
// The promise (owner brief, 2026-11-05), held in place. A first-time visitor
// should quickly understand what they can make, that they can start without
// coding, and that they can guide the AI through changes until it fits. This
// replaces the 2026-10-07/22 "no AI in public copy" rule on purpose.
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import RingApp from "../create/RingApp";
import { BRAND_ONE_LINE, BRAND_OWNERSHIP, MAKE_SIGNATURE, WHY_THE_NAME } from "./brand";
import StarterHome from "../starter/StarterHome";
import { WORK } from "../work/work";
import { metadata } from "../layout";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(), usePathname: () => "/", useRouter: () => ({ replace: () => {}, push: () => {} }) }));

function homeText(): string {
  const div = document.createElement("div");
  div.innerHTML = renderToStaticMarkup(createElement(RingApp, { mode: "home" }));
  return div.textContent ?? "";
}

function starterHomeText(): string {
  const div = document.createElement("div");
  div.innerHTML = renderToStaticMarkup(createElement(StarterHome));
  return div.textContent ?? "";
}

/** Every public page a first-time visitor is likely to read, as source. */
const PUBLIC_SOURCES = [
  "app/starter/StarterHome.tsx",
  "app/starter/StarterEditor.tsx",
  "app/starter/examples.ts",
  "app/start/page.tsx",
  "app/examples/page.tsx",
  "app/examples/[slug]/page.tsx",
  "app/services/page.tsx",
  "app/services/offers.ts",
  "app/site/brand.ts",
  "app/create/RingApp.tsx",
  "app/create/WorkWithAI.tsx",
  "app/create/starting-points.ts",
  "app/create/ai-messages.ts",
  "app/vnext/SteppedIn.tsx",
  "app/how/page.tsx",
  "app/about/page.tsx",
  "app/tools/page.tsx",
  "app/engines/page.tsx",
  "app/whats-built/page.tsx",
  "app/site/RingHeader.tsx",
  "app/site/QuietFooterLink.tsx",
  "app/layout.tsx",
  "app/manifest.ts",
  "app/opengraph-image.tsx",
];

/** Strip comments: they may discuss what the copy must not say. */
function visibleSource(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "");
}

// 2026-11-11 (owner brief): the home page is the website starter. It leads
// with the result and the ownership difference, in plain words.
describe("the website starter on the home page", () => {
  const text = starterHomeText();

  it("says what this is, for whom, and what you get", () => {
    // Overnight 2026-11-12: service-led home. The starter stays one click away.
    expect(text).toContain("Get your business online. Without the headache.");
    expect(text).toContain("Tell us about your project");
    expect(text).toContain("Choose your example");
  });

  it("says plainly that we don't host the site", () => {
    expect(text).toContain(BRAND_OWNERSHIP);
    expect(BRAND_OWNERSHIP).toContain("doesn't host your website");
  });

  it("offers help as an option, never as the only way", () => {
    expect(text).toContain("Rather do it yourself?");
    expect(text).toContain("written quote");
  });

  it("keeps the other capabilities one link away", () => {
    expect(text).toContain("Make it with AI");
  });

  it("makes no claims it can't back up", () => {
    expect(text).not.toMatch(/in an hour|in minutes|guarantee|testimonial|trusted by|\d+ (?:businesses|customers|owners)/i);
  });
});

describe("the retired lines stay retired", () => {
  it.each(PUBLIC_SOURCES)("%s has none of them", (path) => {
    expect(visibleSource(path)).not.toMatch(/bring your idea to life|fight the AI|AI magic|let's build it/i);
  });
});

// The make-with-AI front door, unchanged in substance, now on /make.
describe("the promise on the make-with-AI front door", () => {
  const text = homeText();

  it("says what this is and that AI is how it gets made", () => {
    expect(text).toContain(MAKE_SIGNATURE);
    expect(text).toContain("Make it with AI.");
  });

  it("says you can start without coding", () => {
    expect(text).toContain("no coding needed");
  });

  it("says you guide the AI through changes until it fits", () => {
    expect(text).toContain("Keep going until it's right.");
    expect(text).toContain("tell the AI what to change");
  });

  it("shows what you can make, for very different people, without naming them", () => {
    for (const thing of ["a game", "a website", "a study guide", "a family cookbook", "a song", "a work plan"]) {
      expect(text).toContain(thing);
    }
    for (const example of ["A game about dragons", "A study guide", "A website for work", "A birthday poem"]) {
      expect(text).toContain(example);
    }
    expect(text).not.toMatch(/\b(?:for|even) (?:kids|seniors|grandparents|grandmas?|boomers|non-technical)\b/i);
  });

  it("is honest about where the AI lives, and names no favorite", () => {
    expect(text).toContain("This site doesn't run an AI");
    expect(text).toContain("ChatGPT, Claude, Copilot or Gemini");
  });

  it("keeps the kids note", () => {
    expect(text).toContain("kids should do this with a parent");
  });

  it("explains the name once", () => {
    expect(text.split(WHY_THE_NAME).length - 1).toBe(1);
  });
});

describe("the name is a place you step into, never a fight", () => {
  it("puts you and the AI on the same side", () => {
    expect(WHY_THE_NAME).toContain("You and the AI are on the same side");
  });

  it.each(PUBLIC_SOURCES)("%s has no fight in it", (path) => {
    expect(visibleSource(path)).not.toMatch(/\b(?:fight|fighter|fighting|opponent|punch|knockout|knock out|boxing|boxer|tag team|hot tag|your corner|bell rings?)\b|🥊/i);
  });

  it("the showroom card for this site lost its boxing glove", () => {
    const self = WORK.find((b) => b.name === "Step In The Ring");
    expect(self?.emoji).not.toBe("🥊");
  });
});

describe("the language stays plain", () => {
  it.each(PUBLIC_SOURCES)("%s has no hype and no insider words", (path) => {
    expect(visibleSource(path)).not.toMatch(/vibe.?cod|AI[- ]powered|supercharge|game.?chang|revolutioni[sz]e|unleash|cutting.?edge|magic(?:al)?\b|prompt engineering|10x|no-?code/i);
  });

  it("says nothing about free on the pages that carry the promise", () => {
    for (const path of ["app/create/WorkWithAI.tsx", "app/how/page.tsx", "app/about/page.tsx", "app/site/brand.ts"]) {
      expect(visibleSource(path)).not.toMatch(/\bfree\b/i);
    }
  });
});

describe("the promise travels", () => {
  it("search results and the app manifest carry the same line", () => {
    expect(BRAND_ONE_LINE).toMatch(/example/);
    expect(BRAND_ONE_LINE).toMatch(/download/);
    expect(metadata.description).toBe(BRAND_ONE_LINE);
    expect(readFileSync("app/manifest.ts", "utf8")).toContain("BRAND_ONE_LINE");
  });

  it("the share card says it too", () => {
    const card = readFileSync("app/opengraph-image.tsx", "utf8");
    expect(card).toContain("A website for your business.");
    expect(card).toContain("Yours to keep.");
  });

  it("the old tagline is gone from every public surface", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((f) => {
        const p = join(dir, f);
        return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) && !/\.test\./.test(f) ? [p] : [];
      });
    for (const path of walk("app")) {
      // The unreachable legacy landing markup in RingApp is comment-free source
      // that can never render; everything else must have moved on.
      // 2026-11-10: the owner brought "Bring your idea to life" back as the
      // lead line (app/site/brand.ts BRAND_PROMISE). Only the older wording
      // stays retired.
      expect(visibleSource(path), path).not.toMatch(/Make the first version real/);
    }
  });
});
