-- Rollback for 002_feedback.sql. Destroys all stored tester feedback —
-- owner decision only.
DROP TABLE IF EXISTS member_feedback;
