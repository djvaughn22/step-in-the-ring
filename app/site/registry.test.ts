// The registry is only worth having if it can't quietly go stale. These tests
// walk the real filesystem and the real middleware and fail when the directory
// stops describing the site.
//
// If one of these fails, the fix is almost never to edit the test. It is to
// add the row you forgot, or delete the row for the page you deleted.

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import {
  SITE_PAGES,
  ECOSYSTEM,
  EXTERNAL_PREVIEWS,
  navPages,
  previewPaths,
  pageAt,
} from "./registry";

const APP = path.join(process.cwd(), "app");

/** Every non-dynamic page route that actually exists on disk. */
function routesOnDisk(dir = APP, prefix = ""): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    // Route groups, private folders, API routes and dynamic segments are not
    // pages a person navigates to by name.
    if (entry === "api" || entry.startsWith("_") || entry.startsWith("[")) continue;
    if (entry.startsWith("(") ) {
      out.push(...routesOnDisk(full, prefix));
      continue;
    }
    const routePath = `${prefix}/${entry}`;
    if (existsSync(path.join(full, "page.tsx")) || existsSync(path.join(full, "page.ts"))) {
      out.push(routePath);
    }
    out.push(...routesOnDisk(full, routePath));
  }
  return out;
}

const DISK = ["/", ...routesOnDisk()].sort();
const LISTED = SITE_PAGES.map((p) => p.path).sort();

describe("the registry describes the real site", () => {
  it("lists every page that exists on disk — no orphans", () => {
    const missing = DISK.filter((r) => !LISTED.includes(r));
    expect(
      missing,
      `these pages exist but nobody can find them — add them to SITE_PAGES: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("lists no page that does not exist", () => {
    const ghosts = LISTED.filter((r) => !DISK.includes(r));
    expect(
      ghosts,
      `these are listed but have no page.tsx: ${ghosts.join(", ")}`,
    ).toEqual([]);
  });

  it("has no duplicate paths", () => {
    expect(new Set(LISTED).size).toBe(LISTED.length);
  });

  it("gives every page a plain name and a real sentence", () => {
    for (const p of SITE_PAGES) {
      expect(p.name.trim().length, p.path).toBeGreaterThan(0);
      expect(p.what.trim().length, p.path).toBeGreaterThan(20);
      expect(p.what.trim().endsWith("."), `${p.path}: "what" should be a sentence`).toBe(true);
    }
  });
});

describe("the registry agrees with the real enforcement", () => {
  const middleware = readFileSync(path.join(process.cwd(), "middleware.ts"), "utf8");
  const protectedBlock = middleware.split("PROTECTED_ROUTES")[1]?.split("]")[0] ?? "";
  const publicBlock = middleware.split("PUBLIC_ROUTES")[1]?.split("]")[0] ?? "";

  it("never marks a middleware-protected route as public", () => {
    for (const p of SITE_PAGES) {
      if (p.access !== "public") continue;
      expect(
        protectedBlock.includes(`"${p.path}"`),
        `${p.path} is called public here but middleware requires a session`,
      ).toBe(false);
    }
  });

  it("keeps every owner page out of the public middleware list, or gated in its own page", () => {
    for (const p of SITE_PAGES) {
      if (p.access !== "owner") continue;
      const file = path.join(APP, p.path.slice(1), "page.tsx");
      const src = readFileSync(file, "utf8");
      const middlewareGated = protectedBlock.includes(`"${p.path}"`);
      const selfGated = /isOwnerAuthed|isAuthorAuthed|OwnerLogin|AuthorLogin/.test(src);
      expect(
        middlewareGated || selfGated,
        `${p.path} claims owner-only but nothing checks it`,
      ).toBe(true);
    }
  });

  it("gates every preview page inside the page itself, not in middleware", () => {
    for (const p of previewPaths()) {
      const src = readFileSync(path.join(APP, p.slice(1), "page.tsx"), "utf8");
      expect(
        src.includes("isPreviewAuthorized"),
        `${p} is marked preview but does not check the preview session`,
      ).toBe(true);
      expect(
        publicBlock.includes(`"${p}"`),
        `${p} is a preview page and must not be listed public in middleware`,
      ).toBe(false);
    }
  });

  it("marks a preview page noindex — unfinished work does not belong in search", () => {
    for (const p of previewPaths()) {
      expect(pageAt(p)?.noindex, `${p} should be noindex`).toBe(true);
    }
  });
});

describe("the menu", () => {
  it("stays small enough to read", () => {
    expect(navPages().length).toBeLessThanOrEqual(6);
  });

  it("only ever points at public pages", () => {
    for (const p of navPages()) {
      expect(p.access, `${p.path} is in the menu`).toBe("public");
    }
  });

  it("starts at the front page", () => {
    expect(navPages()[0].path).toBe("/");
  });
});

describe("the ecosystem list is evidence, not marketing", () => {
  it("gives every project a live address or no address at all", () => {
    for (const p of ECOSYSTEM) {
      if (p.liveUrl) expect(p.liveUrl, p.name).toMatch(/^https:\/\//);
    }
  });

  it("never prints the address of a private repository", () => {
    for (const p of ECOSYSTEM) {
      if (!p.repoPublic) {
        expect(p.repoUrl, `${p.name}: private repo address must not be published`).toBeUndefined();
      }
    }
  });

  it("never leaks a local path or an ssh remote", () => {
    const blob = JSON.stringify([...ECOSYSTEM, ...EXTERNAL_PREVIEWS]);
    expect(blob).not.toMatch(/\/home\//);
    expect(blob).not.toMatch(/git@/);
    expect(blob).not.toMatch(/\.git\b/);
  });

  it("says something real about each project", () => {
    for (const p of ECOSYSTEM) {
      expect(p.real.trim().length, p.name).toBeGreaterThan(25);
      expect(p.who.trim().length, p.name).toBeGreaterThan(5);
    }
  });
});

describe("nothing in the registry is a secret", () => {
  const source = readFileSync(path.join(APP, "site", "registry.ts"), "utf8");

  it("contains no passcode-shaped literal", () => {
    // This file ships in the client bundle. A shared code in here is a leak.
    expect(source).not.toMatch(/passcode\s*[:=]\s*["'`]/i);
    expect(source).not.toMatch(/password\s*[:=]\s*["'`]/i);
    expect(source).not.toMatch(/\b\d{4,}\b/);
  });
});
