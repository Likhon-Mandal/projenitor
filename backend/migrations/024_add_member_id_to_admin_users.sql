-- Migration: Add member_id to admin_users to link admins directly with main members database
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES members(id);

-- Populate existing admin_users with member_id from users table if matching by email
UPDATE admin_users a
SET member_id = u.member_id
FROM users u
WHERE LOWER(a.email) = LOWER(u.email) AND a.member_id IS NULL AND u.member_id IS NOT NULL;
