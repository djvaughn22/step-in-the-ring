// Source-hygiene checks for the owner boundary. These scan the repository's
// app/ source (not build output — scripts/scan-public-bundles.mjs covers that
// after every build) and pin three rules:
//   1. The old client-side access gate stays deleted — its codes shipped in
//      the public bundle, which is why it was removed.
//   2. No "use client" file imports the server-side auth/session modules, so
//      secrets and salts can never be pulled across the client boundary.
//   3. No NEXT_PUBLIC_* env var smuggles a password or secret to the client.

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const APP = path.join(process.cwd(), "app");

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts")) yield p;
  }
}

describe("owner-boundary source hygiene", () => {
  it("the old client-side access gate stays deleted", () => {
    expect(existsSync(path.join(APP, "engines", "access.ts"))).toBe(false);
    expect(existsSync(path.join(APP, "engines", "AccessGate.tsx"))).toBe(false);
    for (const file of walk(APP)) {
      const text = readFileSync(file, "utf8");
      expect(text, `${file} references the removed access gate`).not.toContain("ACCESS_CODES");
    }
  });

  it("no client component imports the server-side auth or session modules", () => {
    for (const file of walk(APP)) {
      const text = readFileSync(file, "utf8");
      if (!/^\s*"use client"/.test(text)) continue;
      expect(text, `${file} is a client file importing server auth`).not.toMatch(
        /from\s+"[^"]*(?:author\/auth|owner\/session|owner\/gate)"/,
      );
    }
  });

  it("no NEXT_PUBLIC env var carries password or secret material", () => {
    for (const file of walk(APP)) {
      const text = readFileSync(file, "utf8");
      const bad = text.match(/NEXT_PUBLIC_\w*(PASSWORD|SECRET|TOKEN|KEY)\w*/i);
      expect(bad, `${file} exposes ${bad?.[0]} to the client`).toBeNull();
    }
  });
});
