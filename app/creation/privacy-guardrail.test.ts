// Sprint 2 privacy correction (2026-08-29): a Build carrying the owner's own
// private personal story reached production. The pipeline is deterministic —
// no model call, so it structurally cannot invent facts it wasn't given (see
// the law comment atop app/vnext/shape.ts) — but that guarantee had never
// been written down as a test. This locks it in, using only the fictional
// examples from the standing test set (see docs/sitr-feature-inventory.md's
// Sprint 2 privacy-correction section) — never the owner's real words.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { newRecord, viewOf } from "./record";
import { shapingFromView } from "../vnext/shape";
import { recommendEngines } from "./recommend";
import { adapterForType } from "./adapters";
import { DEFAULT_BUILDER_DEFAULTS } from "./builder-defaults";
import { buildPackMarkdown } from "./build-pack";

/** Sensitive-personal-history vocabulary — never invented by a deterministic
 *  reading, only ever present because the person themselves wrote it. */
const SENSITIVE_TERMS = [
  "divorce", "divorced", "loneliness", "lonely", "faith journey",
  "jesus", "prayer", "praying", "depression", "anxiety", "therapy",
  "bankruptcy", "in debt", "fired", "laid off", "lawsuit", "custody battle",
];

// The product's own generic "not medical/financial/legal advice" disclaimer
// (app/creation/classify.ts's deriveSafetyConstraints) legitimately mentions
// "diagnosis" whenever a health topic is present — appropriate boilerplate,
// not an invented personal fact. Excluded from the leakage check only; the
// terms above are never appropriate for the pipeline to introduce on its own.

const FICTIONAL_EXAMPLES = [
  "A public park volunteer schedule website.",
  "A phone puzzle game where colored tiles rotate.",
  "A fictional mobile car-wash booking service.",
  "A song about a train moving through summer rain.",
  "A printable mountain-trail poster.",
  "A community book-swap event plan.",
  "A fictional coffee-shop website that gets visits but no newsletter signups.",
  "A demo inventory app whose login broke after an update.",
];

function fullOutputText(raw: string): string {
  const view = viewOf(newRecord(raw));
  const shaping = shapingFromView(view);
  const rec = recommendEngines(view);
  const prompt = adapterForType(view.creationType).prompt(view, DEFAULT_BUILDER_DEFAULTS);
  const pack = buildPackMarkdown(view, prompt);
  return [
    shaping.title, shaping.reading, shaping.kind, shaping.forWhom ?? "",
    shaping.realMeans, ...shaping.versionOne, shaping.firstMove, shaping.softwareNote ?? "",
    rec.primary?.why ?? "", rec.promptPathWhy ?? "", prompt, pack,
  ].join("\n");
}

describe("a neutral creation never gains invented sensitive personal detail", () => {
  for (const raw of FICTIONAL_EXAMPLES) {
    it(`"${raw.slice(0, 50)}..." stays free of every sensitive term — none were in the input`, () => {
      const text = fullOutputText(raw).toLowerCase();
      for (const term of SENSITIVE_TERMS) {
        expect(text, `output for "${raw}" must not contain "${term}"`).not.toContain(term);
      }
    });
  }
});

describe("explicit user-supplied sensitive content is preserved, not embellished", () => {
  // A fictional fixture authored for this test only — never the owner's own
  // words. The person chose to write about therapy and anxiety themselves;
  // the pipeline must keep exactly that, and invent nothing further.
  const raw = "A private journal app to track my therapy appointments and manage anxiety day to day.";

  it("the record keeps the person's exact words, untouched", () => {
    const view = viewOf(newRecord(raw));
    expect(view.record.originalIdea).toBe(raw);
  });

  it("nothing beyond what was written gets introduced", () => {
    const text = fullOutputText(raw).toLowerCase();
    const unwritten = SENSITIVE_TERMS.filter((t) => !raw.toLowerCase().includes(t));
    for (const term of unwritten) {
      expect(text, `output must not introduce "${term}" — the person never wrote it`).not.toContain(term);
    }
  });
});

/** Every file under app/ that isn't a test, this file included last. */
function findSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) findSourceFiles(full, out);
    else if (/\.(ts|tsx|md)$/.test(entry) && !entry.endsWith(".test.ts") && !entry.endsWith(".test.tsx")) {
      out.push(full);
    }
  }
  return out;
}

describe("demo, seed, and example content stays fictional and neutral", () => {
  const appRoot = join(__dirname, "..");
  const files = findSourceFiles(appRoot);

  it("no product-facing source or doc file contains this incident's exact wording", () => {
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      expect(src, file).not.toMatch(/loneliness song/i);
    }
  });

  it("app/create/starting-points.ts — the Create page's own example chips — has none of the sensitive terms", () => {
    const src = readFileSync(join(appRoot, "create", "starting-points.ts"), "utf8").toLowerCase();
    for (const term of SENSITIVE_TERMS) {
      expect(src, `starting-points.ts must not contain "${term}"`).not.toContain(term);
    }
  });
});
