-- Migration 014: Add profile_image_url to admin_users table
BEGIN;

ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

COMMIT;
