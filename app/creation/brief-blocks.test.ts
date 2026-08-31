// "Make the result feel human" checkpoint (2026-08-30). The generated
// brief used to render as raw "## heading" / "- bullet" markdown source
// inside a monospace box — the single most visible "this is a technical
// tool" moment across every journey, general-help included. This parser
// turns that small, closed format into typed blocks a component renders
// as ordinary site typography (see BriefView.tsx) — never
// dangerouslySetInnerHTML, so nothing in a person's own words can ever
// become HTML.

import { describe, expect, it } from "vitest";
import { parseBriefBlocks } from "./brief-blocks";

describe("parseBriefBlocks", () => {
  it("reads a '## ' line as a heading, stripped of the markers", () => {
    const blocks = parseBriefBlocks("## Scope and permissions\nStart fresh.");
    expect(blocks[0]).toEqual({ kind: "heading", text: "Scope and permissions" });
  });

  it("reads consecutive '- ' lines as one bullets block", () => {
    const blocks = parseBriefBlocks("- First\n- Second\n- Third");
    expect(blocks).toEqual([{ kind: "bullets", items: ["First", "Second", "Third"] }]);
  });

  it("reads a plain line as a paragraph", () => {
    const blocks = parseBriefBlocks("Just a sentence, no markers.");
    expect(blocks).toEqual([{ kind: "paragraph", text: "Just a sentence, no markers." }]);
  });

  it("a label line immediately followed by bullets becomes two adjacent blocks, in order", () => {
    const blocks = parseBriefBlocks("Manual setup (one time):\n- Create an account\n- Connect it once");
    expect(blocks).toEqual([
      { kind: "paragraph", text: "Manual setup (one time):" },
      { kind: "bullets", items: ["Create an account", "Connect it once"] },
    ]);
  });

  it("blank lines separate blocks but never appear as their own block", () => {
    const blocks = parseBriefBlocks("## Title\n\nA paragraph.\n\n- One\n- Two\n\n## Next");
    expect(blocks.map((b) => b.kind)).toEqual(["heading", "paragraph", "bullets", "heading"]);
  });

  it("parses a real generated brief end to end with no markers left over in any block's text", () => {
    const brief = [
      "## Scope and permissions",
      "Start fresh. Nothing exists yet — do not assume access to any codebase or prior files.",
      "",
      "## Original intent — the creator's exact words",
      "“My faucet is leaking.”",
      "Serve this intent. Do not replace it with a nearby idea you like better.",
      "",
      "## Be honest about what's missing",
      "- Step In The Ring only has the words above — not the actual bill, document, mechanic, or object.",
      "- Say plainly what you'd need to see to give a real answer.",
    ].join("\n");
    const blocks = parseBriefBlocks(brief);
    expect(blocks.some((b) => b.kind === "heading" && b.text === "Scope and permissions")).toBe(true);
    for (const b of blocks) {
      const text = b.kind === "bullets" ? b.items.join(" ") : b.text;
      expect(text).not.toMatch(/^##\s/);
      expect(text).not.toMatch(/^-\s/);
    }
  });

  it("is a pure function — the same text always parses the same way", () => {
    const brief = "## A\nOne.\n\n- x\n- y";
    expect(parseBriefBlocks(brief)).toEqual(parseBriefBlocks(brief));
  });

  it("a person's own words are never interpreted as HTML — they stay plain text content", () => {
    // The parser only classifies LINE SHAPE (##, -, plain); it never touches
    // tag characters, and the block text is rendered as React text content
    // (BriefView.tsx), never dangerouslySetInnerHTML. This documents the
    // contract at the parser boundary: a `<` or `>` survives untouched,
    // ready to be auto-escaped by React the same way any other text is.
    const blocks = parseBriefBlocks('“<script>alert(1)</script>”');
    expect(blocks).toEqual([{ kind: "paragraph", text: "“<script>alert(1)</script>”" }]);
  });
});
