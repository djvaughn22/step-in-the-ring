// Regression guard (2026-08-06 beta reset): no customer-visible dollar
// price may reappear in the public application surface while pricing is
// TBD. Scans app/ source for a literal "$<number>" pattern.
//
// The allowlist below is a hand-reviewed, closed set of files where a
// "$<digits>" pattern is either structural, not a price (SQL positional
// placeholders and regex replacement backreferences, both producing
// strings like "$1", "$2" that are never rendered to a visitor), or the dormant
// server-only billing amount:
//   - members/stripeCore.ts: server-only comment, the dormant Stripe amount.
// Usefulness-first (Oct 2026): nothing on the public site shows a price.
// The Sprint service page that once held the only approved public prices
// was retired, so no page belongs on this list.
// Anything added to this list must be re-verified as non-customer-visible.
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const APP_DIR = path.join(__dirname, "..");

const ALLOWLIST = new Set(
  [
    "members/store.ts", // SQL positional placeholders: $1, $2, ...
    "planner/signals.ts", // regex replacement backreferences: $1
    "planner/normalize.ts", // regex replacement backreferences: $1
    "members/stripeCore.ts", // server-only comment, real dormant Stripe price
  ].map((p) => path.join(APP_DIR, p)),
);

// A dollar sign directly followed by a digit — the shape of an actual price
// ("$7.77", "$10", "$1,200"). Does not match code punctuation or prose that
// merely mentions "dollars" in words.
const PRICE_PATTERN = /\$\s?\d[\d,]*(\.\d{1,2})?/;

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = path.join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      yield* walk(p);
    } else if (
      /\.(tsx?|jsx?)$/.test(name) &&
      !name.endsWith(".test.ts") &&
      !name.endsWith(".test.tsx")
    ) {
      yield p;
    }
  }
}

describe("public price guard", () => {
  it("no app/ source file shows a literal dollar price outside the reviewed allowlist", () => {
    const offenders: { file: string; match: string }[] = [];
    for (const file of walk(APP_DIR)) {
      if (ALLOWLIST.has(file)) continue;
      const text = readFileSync(file, "utf8");
      const match = text.match(PRICE_PATTERN);
      if (match) offenders.push({ file: path.relative(APP_DIR, file), match: match[0] });
    }
    expect(offenders).toEqual([]);
  });
});
