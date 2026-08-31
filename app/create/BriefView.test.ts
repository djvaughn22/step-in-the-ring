// "Make the result feel human" checkpoint (2026-08-30). Security
// invariant, checked at the source level: this component must never use
// dangerouslySetInnerHTML, no matter what future edit touches it — the
// text it renders includes a person's own typed words.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "BriefView.tsx"), "utf8");

describe("BriefView never renders raw HTML", () => {
  it("contains no dangerouslySetInnerHTML anywhere in the component", () => {
    // Matches actual prop usage ("dangerouslySetInnerHTML={") — not the
    // word appearing in this file's own explanatory comments.
    expect(src).not.toMatch(/dangerouslySetInnerHTML\s*=/);
  });

  it("reuses the site's existing section-label and list styles rather than inventing new CSS", () => {
    expect(src).toMatch(/className="plan-label"/);
    expect(src).toMatch(/className="plan-list"/);
  });

  it("parses through the pure, tested parser rather than its own ad hoc string logic", () => {
    expect(src).toMatch(/import \{ parseBriefBlocks \} from "\.\.\/creation\/brief-blocks"/);
  });
});
