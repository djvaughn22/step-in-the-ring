// @vitest-environment jsdom
//
// Your Builds, actually rendered, in every state a real person can land in.
// Like the workspace, this page needs an account and therefore a database, so
// local development can never show it. It is checked here instead.

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BuildsClient from "./BuildsClient";
import BuildDetail from "./[id]/BuildDetail";
import { newBuild, type BuildRecordV1 } from "../vnext/build";
import { shapeIntent } from "../vnext/shape";

const DOG =
  "A one-page website for my dog. It shows his name, one great photo, and a running " +
  "list of the socks he has stolen.";
const GAME = "A game where you dodge falling tacos and beat your friend's score.";

function made(intent: string, id: string, patch: Partial<BuildRecordV1> = {}): BuildRecordV1 {
  return {
    ...newBuild(intent, "2026-08-08T00:00:00.000Z", shapeIntent(intent) ?? undefined),
    id,
    ...patch,
  };
}

function page(props: Partial<Parameters<typeof BuildsClient>[0]> = {}) {
  return renderToStaticMarkup(
    createElement(BuildsClient, {
      builds: [],
      signedIn: true,
      canSave: true,
      storeConfigured: true,
      email: "maker@example.com",
      initialIntent: "",
      listFailed: false,
      ...props,
    }),
  );
}

describe("Your Builds", () => {
  it("invites a first build when there are none, without looking broken", () => {
    const html = page();
    expect(html).toContain("Create something");
    expect(html).toContain("What do you want to create?");
    expect(html).not.toContain("didn&#x27;t load");
  });

  it("leads with what you're making, and one obvious way to continue", () => {
    const html = page({ builds: [made(DOG, "b1")] });
    expect(html).toContain("Continue →");
    expect(html).toContain("Right now");
    // The reading, not the raw sentence, carries the card.
    expect(html).toContain("A one-page website for my dog.");
    expect(html).toContain("Start another");
  });

  it("keeps several builds distinct and each one continuable", () => {
    const html = page({ builds: [made(DOG, "b1"), made(GAME, "b2")] });
    expect(html).toContain('href="/builds/b1"');
    expect(html).toContain('href="/builds/b2"');
    expect((html.match(/Continue →/g) ?? []).length).toBe(2);
  });

  it("never reports a database hiccup as having no builds", () => {
    const html = page({ listFailed: true });
    expect(html).toContain("didn&#x27;t load");
    expect(html).toContain("nothing was lost");
  });

  it("says what an account without live access can and cannot do", () => {
    const html = page({ canSave: false });
    expect(html).toContain("needs live access");
  });

  it("shows a signed-out visitor how to keep what they started", () => {
    const html = page({
      signedIn: false,
      initialIntent: DOG,
    });
    expect(html).toContain("Ready to keep");
    expect(html).toContain("socks he has stolen");
    // Honest about what a draft is.
    expect(html).toContain("isn&#x27;t saved yet");
    expect(html).toContain("/members/login?returnTo=%2Fbuilds");
  });

  it("does not offer sign-in that cannot work", () => {
    const html = page({ signedIn: false, storeConfigured: false, initialIntent: DOG });
    expect(html).toContain("aren&#x27;t switched on");
    expect(html).not.toContain("/members/login");
  });

  it("says nothing about earlier work when there is none to show", () => {
    // The legacy bridge reads browser storage after mount and renders nothing
    // at all when it finds nothing — an empty "Your earlier work" heading
    // would imply something was lost.
    for (const signedIn of [true, false]) {
      expect(page({ signedIn })).not.toContain("Your earlier work");
    }
  });
});

describe("catching an older build up", () => {
  const bare: BuildRecordV1 = {
    version: 1,
    id: "old-1",
    title: "From before",
    intent: DOG,
    stage: "bring",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    currentAction: "Say more about it, or read it back and shape version one.",
    capabilitiesUsed: [],
    artifacts: [],
    history: [{ at: "2026-08-01T00:00:00.000Z", note: "You stepped in.", stage: "bring" }],
  };
  const detail = (b: BuildRecordV1, canEdit = true) =>
    renderToStaticMarkup(createElement(BuildDetail, { build: b, canEdit }));

  it("offers the re-read only when there is something to gain", () => {
    expect(detail(bare)).toContain("Read my words again");
    expect(detail(made(DOG, "new-1"))).not.toContain("Read my words again");
  });

  it("never offers it to someone who cannot change anything", () => {
    expect(detail(bare, false)).not.toContain("Read my words again");
  });
});
