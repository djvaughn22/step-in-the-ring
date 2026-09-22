// Locks the Digital Front Desk access-model split at the SOURCE level, so a
// future edit that quietly re-adds a check (or removes one) is caught here
// rather than discovered by a customer or an owner. Complements:
//   - app/site/registry.test.ts, which checks the three owner-only pages
//     DO call isOwnerAuthed (generic "owner access" test), and that no
//     access:"public" page is ever listed in middleware's protected block.
//   - digital-front-desk-access.test.ts, which exercises the real API
//     route handlers for the same split.
//
// A Digital Front Desk that required a customer to sign in before
// submitting a request would defeat its own purpose — that is the specific
// regression this file exists to prevent.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const DFD = path.join(process.cwd(), "app", "uat", "digital-front-desk");
const API = path.join(process.cwd(), "app", "api", "uat", "digital-front-desk");

function read(...parts: string[]): string {
  return readFileSync(path.join(...parts), "utf8");
}

// The gating shape every owner-only page uses: check the session, redirect
// if it's missing. The landing page also CALLS isOwnerAuthed() (read-only,
// to decide whether to show a "back to owner hub" link) — that's fine and
// expected; what must never happen on a public page is this negate-and-
// redirect pattern actually blocking the response on it.
const GATES_ON_SESSION = /if\s*\(\s*!\s*\(\s*await\s+isOwnerAuthed/;

describe("Digital Front Desk: public pages never gate on the owner session", () => {
  it("the landing page does not redirect on a missing owner session", () => {
    expect(read(DFD, "page.tsx")).not.toMatch(GATES_ON_SESSION);
  });

  it("the customer intake page never references the owner session at all", () => {
    expect(read(DFD, "request", "page.tsx")).not.toMatch(/isOwnerAuthed/);
    expect(read(DFD, "request", "RequestClient.tsx")).not.toMatch(/isOwnerAuthed/);
  });
});

describe("Digital Front Desk: owner-only pages still gate on the owner session", () => {
  for (const page of ["desk", "onboarding", "admin"]) {
    it(`${page}/page.tsx redirects a logged-out visitor`, () => {
      expect(read(DFD, page, "page.tsx")).toMatch(GATES_ON_SESSION);
    });
  }
});

describe("Digital Front Desk: API routes use the matching gate", () => {
  it("POST /requests (public intake) uses the flag-only gate, not the owner gate", () => {
    const src = read(API, "requests", "route.ts");
    // Split the file at the POST export so the assertion is about POST's
    // own gate call, not GET's (which correctly uses the owner gate above it).
    const postBody = src.split("export async function POST")[1] ?? "";
    expect(postBody).toMatch(/dfdFlagGate\(\)/);
    expect(postBody).not.toMatch(/dfdOwnerGate/);
  });

  it("GET /requests (the full queue) uses the owner gate", () => {
    const src = read(API, "requests", "route.ts");
    const getBody = src.split("export async function GET")[1]?.split("export async function POST")[0] ?? "";
    expect(getBody).toMatch(/dfdOwnerGate\(/);
  });

  it("PATCH /requests/[id] (status, assignment, notes, next action) uses the owner gate", () => {
    expect(read(API, "requests", "[id]", "route.ts")).toMatch(/dfdOwnerGate\(/);
  });

  it("onboarding and admin routes use the owner gate on every handler", () => {
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
});
