-- Migration 027: Relax FK constraints on brilliant_student_requests applicant_user_id & reviewed_by
-- This allows both admin_users and users table IDs to be stored safely without constraint violations.
BEGIN;

ALTER TABLE brilliant_student_requests DROP CONSTRAINT IF EXISTS brilliant_student_requests_applicant_user_id_fkey;
ALTER TABLE brilliant_student_requests DROP CONSTRAINT IF EXISTS brilliant_student_requests_reviewed_by_fkey;

COMMIT;
