-- Rollback for 001_membership.sql. Destroys ALL membership data — owner
-- decision only. Order respects foreign keys.
DROP TABLE IF EXISTS member_events;
DROP TABLE IF EXISTS member_stripe_events;
DROP TABLE IF EXISTS member_tester_codes;
DROP TABLE IF EXISTS member_projects;
DROP TABLE IF EXISTS member_sessions;
DROP TABLE IF EXISTS member_entitlements;
DROP TABLE IF EXISTS member_users;
