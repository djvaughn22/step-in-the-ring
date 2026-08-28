-- Step In The Ring — Five Hour Sprint (paid service) applications (2026-08-27).
-- Apply:    psql "$DATABASE_URL" -f migrations/003_sprint_applications.sql
-- Rollback: psql "$DATABASE_URL" -f migrations/003_sprint_applications_down.sql
--
-- Not tied to member_users: an applicant asking about the paid Sprint
-- service does not need an account. This table is a lead list, not a
-- membership record.

CREATE TABLE IF NOT EXISTS sprint_applications (
  id                  text PRIMARY KEY,
  name                text NOT NULL,
  email               text NOT NULL,
  what_to_finish      text NOT NULL,
  success_looks_like  text NOT NULL,
  timing              text NOT NULL,
  team_size           text NOT NULL,
  marketing_consent   boolean NOT NULL DEFAULT false,
  status              text NOT NULL DEFAULT 'new',
  created_at          timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sprint_applications_status_idx ON sprint_applications(status);
CREATE INDEX IF NOT EXISTS sprint_applications_created_idx ON sprint_applications(created_at);
