// @vitest-environment jsdom
//
// The Build workspace, actually rendered.
//
// This surface cannot be reached in local development — it needs a member
// account, which needs a database. So it gets rendered here instead of being
// taken on trust, because "it compiles" is not the same as "it says the right
// thing", and the artifact list in particular puts stored text into an href.
//
// JSX is avoided on purpose: the suite is `app/**/*.test.ts`, and one render
// test is not worth widening it.

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BuildDetail from "./[id]/BuildDetail";
import { newBuild, type BuildRecordV1 } from "../vnext/build";
import { shapeIntent } from "../vnext/shape";

const SAID =
  "A one-page website for my dog. It shows his name, one great photo, and a running " +
  "list of the socks he has stolen.";

function build(patch: Partial<BuildRecordV1> = {}): BuildRecordV1 {
  const base = newBuild(SAID, "2026-08-08T00:00:00.000Z", shapeIntent(SAID) ?? undefined);
  return { ...base, id: "build-1", ...patch };
}

const render = (b: BuildRecordV1, canEdit = true) =>
  renderToStaticMarkup(createElement(BuildDetail, { build: b, canEdit }));

describe("the Build workspace answers the questions it exists to answer", () => {
  it("leads with what you're making and where it is", () => {
    const html = render(build());
    expect(html).toContain("What you&#x27;re making");
    expect(html).toContain("The next move");
    expect(html).toContain("Bring it");
    expect(html).toContain("Real means:");
  });

  it("keeps their own words reachable, never replaced", () => {
    const html = render(build());
    expect(html).toContain("socks he has stolen");
    expect(html).toContain("What you actually said");
  });

  it("says plainly when nothing has come out of it yet", () => {
    const html = render(build());
    expect(html).toContain("What came out of it");
    expect(html).toContain("Nothing yet.");
  });

  it("reads an old Build that has no shaping on it at all", () => {
    const bare: BuildRecordV1 = {
      version: 1,
      id: "old-1",
      title: "Something from before",
      intent: "What I said back then",
      stage: "shape",
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
      capabilitiesUsed: [],
      artifacts: [],
      history: [{ at: "2026-08-01T00:00:00.000Z", note: "You stepped in.", stage: "bring" }],
    };
    const html = render(bare);
    // With no reading, the person's own words carry the card.
    expect(html).toContain("What I said back then");
    expect(html).not.toContain("Real means:");
    expect(html).not.toContain("What version one does");
  });
});

describe("an artifact never becomes a way in", () => {
  const hostile = (ref: string) =>
    render(
      build({
        artifacts: [{ id: "a1", label: "Totally normal file", ref, kind: "link", createdAt: "2026-08-08T00:00:00.000Z" }],
      }),
    );

  it("renders a real link for a real destination", () => {
    const html = hostile("https://opendoku.com/slopedoku/");
    expect(html).toContain('href="https://opendoku.com/slopedoku/"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("shows a hostile ref as plain text, with no href at all", () => {
    for (const ref of ["javascript:alert(1)", "data:text/html,<script>", "//evil.example/x"]) {
      const html = hostile(ref);
      expect(html).toContain("Totally normal file");
      expect(html).not.toContain("javascript:");
      expect(html).not.toContain("data:text/html");
      expect(html).not.toContain('href="//evil.example/x"');
    }
  });

  it("keeps a page on this site in the same tab", () => {
    const html = hostile("/live");
    expect(html).toContain('href="/live"');
    expect(html).not.toContain('target="_blank"');
  });
});

describe("what happened", () => {
  it("shows the history newest first and lets you add to it", () => {
    const html = render(build());
    expect(html).toContain("What&#x27;s happened");
    expect(html).toContain("You stepped in.");
    expect(html).toContain("Write it down");
  });
});

describe("read-only access can look but not change", () => {
  it("offers no way to move the stage or add anything", () => {
    const html = render(build(), false);
    expect(html).toContain("Changing it needs live access");
    expect(html).not.toContain("Where it actually is");
    expect(html).not.toContain("Add it");
    expect(html).not.toContain("Save the next move");
    expect(html).not.toContain("Write it down");
  });
});
