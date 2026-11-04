-- Step In The Ring — the Ready to Build Kit file, kept private (2026-11-03).
-- The paid PDF never goes into Git or /public. scripts/upload-kit-file.mjs
-- runs this same statement before it stores a file, so applying it by hand
-- is optional. The site only ever reads this table.
-- Apply:    psql "$DATABASE_URL" -f migrations/005_kit_files.sql
-- Rollback: psql "$DATABASE_URL" -f migrations/005_kit_files_down.sql

CREATE TABLE IF NOT EXISTS sitr_kit_files (
  id            bigserial PRIMARY KEY,
  product       text NOT NULL,
  version       text NOT NULL,
  filename      text NOT NULL,
  content_type  text NOT NULL DEFAULT 'application/pdf',
  bytes         bytea NOT NULL,
  sha256        text NOT NULL,
  uploaded_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product, version)
);
