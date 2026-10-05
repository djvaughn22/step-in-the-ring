-- Step In The Ring — feedback from anyone, account or not (2026-10-04).
-- PgMemberStore also runs this on first use (VISITOR_FEEDBACK_DDL in
-- app/members/store.ts), so applying it by hand is optional.
-- Apply:    psql "$DATABASE_URL" -f migrations/004_visitor_feedback.sql
-- Rollback: psql "$DATABASE_URL" -f migrations/004_visitor_feedback_down.sql

CREATE TABLE IF NOT EXISTS visitor_feedback (
  id           text PRIMARY KEY,
  category     text NOT NULL,
  message      text NOT NULL,
  context_url  text NOT NULL DEFAULT '',
  reply_email  text NOT NULL DEFAULT '',
  status       text NOT NULL DEFAULT 'new',
  created_at   timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS visitor_feedback_created_idx ON visitor_feedback(created_at);
CREATE INDEX IF NOT EXISTS member_events_created_idx ON member_events(created_at);
