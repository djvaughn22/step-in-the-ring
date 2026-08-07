-- Step In The Ring — structured tester feedback (2026-08-06 beta reset).
-- Apply:    psql "$DATABASE_URL" -f migrations/002_feedback.sql
-- Rollback: psql "$DATABASE_URL" -f migrations/002_feedback_down.sql

CREATE TABLE IF NOT EXISTS member_feedback (
  id           text PRIMARY KEY,
  user_id      text NOT NULL REFERENCES member_users(id) ON DELETE CASCADE,
  category     text NOT NULL,
  message      text NOT NULL,
  context_url  text NOT NULL DEFAULT '',
  status       text NOT NULL DEFAULT 'new',
  created_at   timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS member_feedback_user_idx ON member_feedback(user_id);
CREATE INDEX IF NOT EXISTS member_feedback_status_idx ON member_feedback(status);
