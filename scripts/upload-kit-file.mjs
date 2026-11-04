#!/usr/bin/env node
// Owner tool: store a new version of the Ready to Build Kit PDF in the site's
// private Postgres, where /kit/download reads it for confirmed buyers. The
// newest upload is what every buyer gets from then on.
//
//   node --env-file=.env.production.local scripts/upload-kit-file.mjs <pdf> <version>
//
// The file stays out of Git and /public. This script never prints
// DATABASE_URL or any other secret. Re-uploading the same version replaces it.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const [file, version] = process.argv.slice(2);
if (!file || !version) {
  console.error("Usage: node scripts/upload-kit-file.mjs <path-to-pdf> <version, e.g. 1.0>");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Pull it with the Vercel CLI first (see docs/ready-to-build.md).");
  process.exit(1);
}

const bytes = readFileSync(file);
if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") {
  console.error("That file doesn't look like a PDF.");
  process.exit(1);
}
// Vercel functions answer with at most 4.5 MB.
if (bytes.length > 4 * 1024 * 1024) {
  console.error(`The PDF is ${(bytes.length / 1048576).toFixed(1)} MB. Keep it under 4 MB so the download route can send it.`);
  process.exit(1);
}

const sha256 = createHash("sha256").update(bytes).digest("hex");
const filename = `Ready-to-Build-Kit-v${version}.pdf`;
const ddl = readFileSync(new URL("../migrations/005_kit_files.sql", import.meta.url), "utf8");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
try {
  await pool.query(ddl);
  await pool.query(
    `INSERT INTO sitr_kit_files (product, version, filename, content_type, bytes, sha256)
     VALUES ('ready-to-build-kit', $1, $2, 'application/pdf', $3, $4)
     ON CONFLICT (product, version) DO UPDATE
       SET filename = EXCLUDED.filename, bytes = EXCLUDED.bytes, sha256 = EXCLUDED.sha256, uploaded_at = now()`,
    [version, filename, bytes, sha256],
  );
  console.log(`Stored ${path.basename(file)} as ${filename}: ${bytes.length} bytes, sha256 ${sha256.slice(0, 16)}…`);
} finally {
  await pool.end();
}
