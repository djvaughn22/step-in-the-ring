-- Step In The Ring Membership — initial schema (2026-08-04).
-- Apply:    psql "$DATABASE_URL" -f migrations/001_membership.sql
-- Rollback: psql "$DATABASE_URL" -f migrations/001_membership_down.sql
--
-- All membership tables are prefixed member_ so they can never collide with
-- future product tables. Raw session tokens and tester codes are NEVER
-- stored — only hashes.

CREATE TABLE IF NOT EXISTS member_users (
  id                     text PRIMARY KEY,
  email                  text NOT NULL UNIQUE,
  password_hash          text NOT NULL,
  email_verified         boolean NOT NULL DEFAULT false,
  created_at             timestamptz NOT NULL,
  updated_at             timestamptz NOT NULL,
  deletion_requested_at  timestamptz
);

CREATE TABLE IF NOT EXISTS member_sessions (
  token_hash  text PRIMARY KEY,
  user_id     text NOT NULL REFERENCES member_users(id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS member_sessions_user_idx ON member_sessions(user_id);

CREATE TABLE IF NOT EXISTS member_entitlements (
  user_id                 text PRIMARY KEY REFERENCES member_users(id) ON DELETE CASCADE,
  status                  text NOT NULL,
  source                  text NOT NULL,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  current_period_end      timestamptz,
  tester_code_id          text,
  revoked_at              timestamptz,
  admin_notes             text NOT NULL DEFAULT '',
  created_at              timestamptz NOT NULL,
  updated_at              timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS member_entitlements_customer_idx
  ON member_entitlements(stripe_customer_id);

CREATE TABLE IF NOT EXISTS member_projects (
  id          text PRIMARY KEY,
  user_id     text NOT NULL REFERENCES member_users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  engine_id   text NOT NULL,
  content     text NOT NULL,
  created_at  timestamptz NOT NULL,
  updated_at  timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS member_projects_user_idx ON member_projects(user_id);

CREATE TABLE IF NOT EXISTS member_tester_codes (
  id               text PRIMARY KEY,
  code_hash        text NOT NULL UNIQUE,
  label            text NOT NULL DEFAULT '',
  max_redemptions  integer NOT NULL,
  redemptions      integer NOT NULL DEFAULT 0,
  expires_at       timestamptz NOT NULL,
  revoked_at       timestamptz,
  created_at       timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS member_stripe_events (
  event_id    text PRIMARY KEY,
  created_at  timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS member_events (
  id          bigserial PRIMARY KEY,
  event       text NOT NULL,
  source      text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL
);
