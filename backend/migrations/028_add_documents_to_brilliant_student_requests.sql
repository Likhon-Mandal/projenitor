-- Migration 028: Add documents JSONB column to brilliant_student_requests
BEGIN;

ALTER TABLE brilliant_student_requests ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;

COMMIT;
