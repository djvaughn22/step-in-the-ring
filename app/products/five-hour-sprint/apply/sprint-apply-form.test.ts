// The "Bring a team" and "Team Sprint" opportunity cards link here with
// ?format=team — this locks that the query param actually pre-fills the
// team-size field instead of being a dead decoration on the URL.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const formSrc = readFileSync(join(__dirname, "SprintApplyForm.tsx"), "utf8");
const pageSrc = readFileSync(join(__dirname, "page.tsx"), "utf8");

describe("Sprint apply form — ?format=team pre-fill", () => {
  it("reads the format query param and pre-selects team size, never auto-submitting", () => {
    expect(formSrc).toMatch(/searchParams\.get\("format"\)\s*===\s*"team"/);
    expect(formSrc).not.toMatch(/auto.?submit/i);
  });

  it("wraps the form in Suspense so useSearchParams does not break static rendering", () => {
    expect(pageSrc).toMatch(/<Suspense[\s\S]*<SprintApplyForm/);
  });
});
