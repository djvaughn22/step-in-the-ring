// @vitest-environment jsdom
//
// The Library, actually rendered, in every state a real person can land in.
// Its saved-work section needs an account and therefore a database, so local
// development can never show it. It is checked here instead.

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import LibraryClient, { type SavedItem } from "./LibraryClient";

const SONG: SavedItem = {
  id: "p1",
  title: "Grandfather Song",
  madeWith: "Music Engine",
  emoji: "🎵",
  href: "/engines/room?engine=music&p=p1",
  updatedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
};

const STICKER: SavedItem = {
  id: "p2",
  title: "Dog Dad sticker",
  madeWith: "Design Shop",
  emoji: "🎨",
  href: "/engines/room?engine=design-shop&p=p2",
  updatedAt: new Date().toISOString(),
};

function page(props: Partial<Parameters<typeof LibraryClient>[0]> = {}) {
  return renderToStaticMarkup(
    createElement(LibraryClient, {
      saved: [],
      signedIn: true,
      storeConfigured: true,
      listFailed: false,
      ...props,
    }),
  );
}

describe("Your work", () => {
  it("is about the visitor's own work, not the tool catalog", () => {
    const html = page({ signedIn: false });
    expect(html).toContain("Your work");
    expect(html).not.toContain("Idea Engine");
    expect(html).not.toContain("Fix Engine");
  });

  it("never asks a visitor to sign in or make an account", () => {
    const html = page({ signedIn: false });
    expect(html).not.toContain("/members/login");
    expect(html).not.toContain("/members/signup");
    expect(html).not.toMatch(/sign in/i);
    expect(html).toContain("No account needed");
  });

  it("lists what an engine made for a signed-in tester, what made it, and when", () => {
    const html = page({ saved: [STICKER, SONG] });
    expect(html).toContain("On your tester account");
    expect(html).toContain("Grandfather Song");
    expect(html).toContain("Music Engine");
    expect(html).toContain("Dog Dad sticker");
    expect(html).toContain("3 days ago");
    expect(html).toContain("today");
    expect(html).toContain("/engines/room?engine=music&amp;p=p1");
    expect(html).toContain("/builds#your-builds");
  });

  it("never reports a database failure as having nothing saved", () => {
    const html = page({ listFailed: true });
    expect(html).toContain("didn&#x27;t load");
    expect(html).toContain("nothing was lost");
  });

  it("does not repeat the Create page's starting points", () => {
    const html = page({ signedIn: false });
    expect(html).not.toContain("/create?stem=");
    expect(html).toContain('href="/create"');
  });
});
