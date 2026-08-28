-- Rollback for migrations/003_sprint_applications.sql
-- Apply: psql "$DATABASE_URL" -f migrations/003_sprint_applications_down.sql

DROP INDEX IF EXISTS sprint_applications_created_idx;
DROP INDEX IF EXISTS sprint_applications_status_idx;
DROP TABLE IF EXISTS sprint_applications;
