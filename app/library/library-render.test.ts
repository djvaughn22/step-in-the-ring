// @vitest-environment jsdom
//
// The Library, actually rendered, in every state a real person can land in.
// Its saved-work section needs an account and therefore a database, so local
// development can never show it. It is checked here instead.

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import LibraryClient, { type SavedItem } from "./LibraryClient";
import { STARTING_POINTS } from "../create/starting-points";

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

describe("The Library", () => {
  it("is about saved work, not about the tool catalog", () => {
    // It used to list all twelve engines, which is what /engines is for now.
    // Two pages listing the same tools is a duplicate, not a library.
    const html = page();
    expect(html).toContain("Saved work");
    expect(html).not.toContain("Idea Engine");
    expect(html).not.toContain("Fix Engine");
  });

  it("lists what an engine made, what made it, and when", () => {
    const html = page({ saved: [STICKER, SONG] });
    expect(html).toContain("Grandfather Song");
    expect(html).toContain("Music Engine");
    expect(html).toContain("Dog Dad sticker");
    expect(html).toContain("3 days ago");
    expect(html).toContain("today");
    // Back to the engine that made it — the only thing that can open it.
    expect(html).toContain("/engines/room?engine=music&amp;p=p1");
  });

  it("sends somebody with nothing saved somewhere useful", () => {
    const html = page();
    expect(html).toContain("Nothing saved yet");
    expect(html).toContain("/engines");
  });

  it("never reports a database failure as an empty library", () => {
    const html = page({ listFailed: true });
    expect(html).toContain("didn&#x27;t load");
    expect(html).toContain("nothing was lost");
  });

  it("tells a signed-out visitor what signing in actually buys them", () => {
    const html = page({ signedIn: false });
    expect(html).toContain("follow you to another device");
    expect(html).toContain("/members/login");
  });

  it("offers every starting point as something you can run again", () => {
    const html = page();
    for (const sp of STARTING_POINTS) {
      expect(html, sp.label).toContain(sp.label);
    }
    // Each one opens the create flow with the sentence half written, and the
    // stem is what makes that true.
    expect(html).toContain("/create?stem=");
  });

  it("points at Builds for work in progress, so the two never blur", () => {
    const html = page({ saved: [SONG] });
    expect(html).toContain("/builds");
  });
});
