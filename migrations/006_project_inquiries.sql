-- Step In The Ring: project requests for Build it with us (2026-11-10).
-- Numbered 006 because 005 is the unmerged kit branch's sitr_kit_files.
-- PgMemberStore also runs this on first use (PROJECT_INQUIRIES_DDL in
-- app/members/store.ts), so applying it by hand is optional.
-- Apply:    psql "$DATABASE_URL" -f migrations/006_project_inquiries.sql
-- Rollback: psql "$DATABASE_URL" -f migrations/006_project_inquiries_down.sql

CREATE TABLE IF NOT EXISTS project_inquiries (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  email         text NOT NULL,
  organization  text NOT NULL DEFAULT '',
  site_url      text NOT NULL DEFAULT '',
  project_type  text NOT NULL,
  service       text NOT NULL,
  description   text NOT NULL,
  timeline      text NOT NULL,
  budget        text NOT NULL DEFAULT '',
  status        text NOT NULL DEFAULT 'new',
  created_at    timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS project_inquiries_created_idx ON project_inquiries(created_at);
