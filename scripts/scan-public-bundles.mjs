// Build-output security scan — runs automatically after every `npm run build`
// (postbuild), including on Vercel, and FAILS the build on a hit.
//
// It scans the public client bundles (.next/static) for material that must
// never ship to a visitor's browser:
//   1. Server-only auth markers: the owner-password env-var name and the
//      HMAC salts from app/author/auth.ts. Any of these in a client bundle
//      means server auth code leaked across the client boundary.
//   2. The LIVE VALUES of secret env vars, when they are present at build
//      time (they are on Vercel). The values themselves are never printed —
//      only the name of the variable that leaked and the offending file.
//   3. Known dead markers that must stay dead (the old client-side access
//      gate that shipped its codes in the bundle).
//
// Keep this list honest: only strings that genuinely must never appear in
// public JS. Engine UI code is client-side by design and is not scanned for.

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const STATIC_DIR = path.join(process.cwd(), ".next", "static");

const FORBIDDEN_MARKERS = [
  "STORY_OWNER_PASSWORD",
  "STORY_SESSION_SECRET",
  "sitr-author-pw-v1",
  "sitr-author-session-secret-v1",
  "ACCESS_CODES",
  "sitr-engine-access-v1",
];

// Secret VALUES — checked only when set in the build environment.
const SECRET_ENV_VARS = ["STORY_OWNER_PASSWORD", "STORY_SESSION_SECRET"];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(js|txt|json|css)$/.test(name)) yield p;
  }
}

let failures = 0;

try {
  statSync(STATIC_DIR);
} catch {
  console.error(`scan-public-bundles: ${STATIC_DIR} not found — run after next build.`);
  process.exit(1);
}

for (const file of walk(STATIC_DIR)) {
  const text = readFileSync(file, "utf8");
  const rel = path.relative(process.cwd(), file);
  for (const marker of FORBIDDEN_MARKERS) {
    if (text.includes(marker)) {
      console.error(`LEAK: forbidden marker "${marker}" in public bundle ${rel}`);
      failures++;
    }
  }
  for (const name of SECRET_ENV_VARS) {
    const value = process.env[name];
    if (value && value.length >= 4 && text.includes(value)) {
      console.error(`LEAK: the value of ${name} appears in public bundle ${rel}`);
      failures++;
    }
  }
}

if (failures > 0) {
  console.error(`scan-public-bundles: FAILED — ${failures} leak(s) in public build output.`);
  process.exit(1);
}
console.log("scan-public-bundles: clean — no secret markers or secret values in public bundles.");
