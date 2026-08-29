// Sprint 2 privacy correction (2026-08-29): confirms two things that must
// both stay true — track() is a thin, non-embellishing pass-through (it
// can't leak anything it wasn't handed), and no call site anywhere in the
// app hands it a person's own words. A raw idea, title, or summary reaching
// analytics is exactly the kind of unauthorized reuse the privacy rule in
// CLAUDE.md exists to prevent.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { track } from "./analytics";

describe("track() forwards only what it's given", () => {
  it("does not exist during SSR — no window, no call", () => {
    // This file's environment is plain "node" (no window global) — a throw
    // here would mean track() reached for something it shouldn't.
    expect(() => track("some_event", { a: 1 })).not.toThrow();
  });

  it("passes the params object through untouched, nothing appended", () => {
    const calls: unknown[] = [];
    (globalThis as { window?: unknown }).window = {
      gtag: (...args: unknown[]) => calls.push(args),
    };
    try {
      const params = { engine: "build" };
      track("engine_start", params);
      expect(calls).toEqual([["event", "engine_start", params]]);
    } finally {
      delete (globalThis as { window?: unknown }).window;
    }
  });
});

/** Every file under app/ that calls track(), except this one and analytics.ts itself. */
function findSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) findSourceFiles(full, out);
    else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith(".test.ts") && !entry.endsWith(".test.tsx")) {
      out.push(full);
    }
  }
  return out;
}

// A person's own words reach these identifiers by these exact names across
// the codebase (see app/planner/types.ts, app/creation/types.ts,
// app/vnext/build.ts) — none of them may appear inside a track() call's
// params object.
const RAW_TEXT_IDENTIFIERS = [
  "intent", "description", "originalIdea", "summary", "reading", "title",
  ".raw", "record",
];

describe("no call site sends raw creation text to analytics", () => {
  const appRoot = join(__dirname, "..");
  const files = findSourceFiles(appRoot);
  const callSites: { file: string; args: string }[] = [];
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(/\btrack\(\s*"[^"]+"\s*,\s*(\{[^}]*\})\s*\)/g)) {
      callSites.push({ file, args: m[1] });
    }
  }

  it("finds every real track() call site (sanity — a bad regex would silently pass with zero)", () => {
    expect(callSites.length).toBeGreaterThanOrEqual(10);
  });

  it("no track() params object references a raw-text field", () => {
    for (const { file, args } of callSites) {
      for (const ident of RAW_TEXT_IDENTIFIERS) {
        expect(args, `${file}: track(..., ${args}) must not reference "${ident}"`).not.toContain(ident);
      }
    }
  });
});
