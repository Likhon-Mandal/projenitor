-- Migration 022: Update users table for the new registration flow
BEGIN;

-- Make email nullable
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Make password_hash nullable
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add mobile_number column
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20) UNIQUE;

-- Add status column
DO $$ BEGIN
  CREATE TYPE user_account_status AS ENUM ('pending', 'approved', 'rejected', 'active');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS status user_account_status DEFAULT 'pending';

-- We also need a way for admins to see which member they requested to link to
-- member_id is already there.

COMMIT;
