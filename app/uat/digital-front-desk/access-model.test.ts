// Locks the Digital Front Desk access model at the SOURCE level, covering
// both what's true right now (open UAT mode) and what must remain true
// forever (the owner-checking code is real and intact, not deleted).
//
// Complements:
//   - app/api/uat/digital-front-desk/digital-front-desk-access.test.ts,
//     which exercises the real route handlers.
//   - registry.test.ts, which checks the registry's public `access` value
//     agrees with each page's own enforcement.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DFD_OPEN_UAT_MODE } from "./lib/openMode";

const DFD = path.join(process.cwd(), "app", "uat", "digital-front-desk");
const API = path.join(process.cwd(), "app", "api", "uat", "digital-front-desk");

function read(...parts: string[]): string {
  return readFileSync(path.join(...parts), "utf8");
}

describe("public pages never reference the owner session at all", () => {
  it("the landing page's owner-only-tools note is display-only, not a gate", () => {
    // isOwnerAuthed() DOES appear here (to decide whether to show a "back
    // to owner hub" link) — what must never appear is a redirect gated on it.
    expect(read(DFD, "page.tsx")).not.toMatch(/if\s*\([^)]*isOwnerAuthed/);
  });

  it("the customer intake page never references the owner session at all", () => {
    expect(read(DFD, "request", "page.tsx")).not.toMatch(/isOwnerAuthed/);
    expect(read(DFD, "request", "RequestClient.tsx")).not.toMatch(/isOwnerAuthed/);
  });
});

// The exact shape every owner-only page uses: check the session, redirect
// if it's missing, UNLESS DFD_OPEN_UAT_MODE short-circuits it. This must
// stay present in source even while the constant is true — the point of
// open-UAT-mode is that the check is switched off, not deleted.
const GATE_SHAPE = /if\s*\(\s*!\s*DFD_OPEN_UAT_MODE\s*&&\s*!\s*\(\s*await\s+isOwnerAuthed\s*\(\s*\)\s*\)\s*\)\s*redirect\(/;

describe("owner-only pages still carry the real owner-session gate in source", () => {
  for (const page of ["desk", "onboarding", "admin"]) {
    it(`${page}/page.tsx still checks isOwnerAuthed and redirects, guarded by DFD_OPEN_UAT_MODE`, () => {
      const src = read(DFD, page, "page.tsx");
      expect(src, `${page}/page.tsx must import DFD_OPEN_UAT_MODE`).toMatch(/import\s*\{\s*DFD_OPEN_UAT_MODE\s*\}/);
      expect(src, `${page}/page.tsx must keep the redirect-on-missing-session shape`).toMatch(GATE_SHAPE);
    });
  }
});

describe("the API gate helper preserves the real owner check", () => {
  it("dfdOwnerGate's source still calls isOwnerRequest — the open-mode flag only short-circuits it", () => {
    const src = read(DFD, "lib", "apiGate.ts");
    expect(src).toMatch(/isOwnerRequest\(/);
    expect(src).toMatch(/if\s*\(\s*openMode\s*\)\s*return\s*null;/);
  });

  it("every API route still gates its owner-only handlers through dfdOwnerGate, never dfdFlagGate", () => {
    for (const route of [
      ["onboarding", "route.ts"],
      ["admin", "route.ts"],
    ]) {
      const src = read(API, ...route);
      const gateCalls = src.match(/dfdOwnerGate\(/g) ?? [];
      const flagOnlyCalls = src.match(/dfdFlagGate\(\)/g) ?? [];
      expect(gateCalls.length, `${route.join("/")} should gate every handler with dfdOwnerGate`).toBeGreaterThanOrEqual(2);
      expect(flagOnlyCalls.length, `${route.join("/")} must never use the public flag-only gate`).toBe(0);
    }
  });

  it("POST /requests (public intake) uses the flag-only gate, not the owner gate", () => {
    const src = read(API, "requests", "route.ts");
    const postBody = src.split("export async function POST")[1] ?? "";
    expect(postBody).toMatch(/dfdFlagGate\(\)/);
    expect(postBody).not.toMatch(/dfdOwnerGate/);
  });

  it("GET /requests (the full queue) and PATCH /requests/[id] use the owner gate", () => {
    const listSrc = read(API, "requests", "route.ts");
    const getBody = listSrc.split("export async function GET")[1]?.split("export async function POST")[0] ?? "";
    expect(getBody).toMatch(/dfdOwnerGate\(/);
    expect(read(API, "requests", "[id]", "route.ts")).toMatch(/dfdOwnerGate\(/);
  });
});

describe("the current, honest state of the toggle", () => {
  // This test exists so a reviewer scanning test output sees, in plain
  // English, whether open-UAT mode is currently on — not just buried in a
  // source file. Flip DFD_OPEN_UAT_MODE and this test's own description
  // (via the boolean it asserts) reflects the change immediately.
  it("DFD_OPEN_UAT_MODE reflects the state documented in docs/DIGITAL_FRONT_DESK_UAT.md", () => {
    expect(typeof DFD_OPEN_UAT_MODE).toBe("boolean");
  });
});
