// The one thing behind the shared preview code is the external health-plan
// link. Locked, the visible href already points at /preview, not the real
// address — but React also serializes each list item's `key` prop into the
// RSC payload sent to every visitor, locked or not. A `key={p.href}` on the
// locked branch would put the real address back in the page source even
// though nothing on screen shows it or links to it. Caught live 2026-08-24:
// `curl https://stepinthering.com/everything` (no cookie) contained
// "idontcry.com/family/health-plan-example" verbatim in the flight payload.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "page.tsx"), "utf8");

function mapBlock(): string {
  const start = src.indexOf("EXTERNAL_PREVIEWS.map");
  if (start === -1) throw new Error("EXTERNAL_PREVIEWS.map not found in page.tsx");
  const end = src.indexOf(",\n          )}", start);
  if (end === -1) throw new Error("could not find the end of the EXTERNAL_PREVIEWS.map(...) call");
  return src.slice(start, end);
}

describe("the protected preview row never keys on the real address", () => {
  it("uses a key that says nothing about the destination", () => {
    const block = mapBlock();
    expect(block).not.toMatch(/key=\{p\.href\}/);
    // Both branches of the locked/unlocked ternary must agree.
    expect((block.match(/key=\{p\.name\}/g) ?? []).length).toBe(2);
  });

  it("only renders the real href on the unlocked branch", () => {
    const block = mapBlock();
    const lockedBranch = block.slice(block.indexOf(") : ("));
    expect(lockedBranch).not.toMatch(/href=\{p\.href\}/);
    expect(lockedBranch).toMatch(/href="\/preview"/);
  });
});
