-- Migration 016: Add name_bangla and name_english to members and admin_users tables
BEGIN;

ALTER TABLE members ADD COLUMN IF NOT EXISTS name_bangla VARCHAR(255);
ALTER TABLE members ADD COLUMN IF NOT EXISTS name_english VARCHAR(255);

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS name_bangla VARCHAR(255);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS name_english VARCHAR(255);

-- Backfill members from existing full_name if available
-- For members with Bengali characters
UPDATE members
SET name_bangla = TRIM(full_name)
WHERE name_bangla IS NULL 
  AND full_name IS NOT NULL 
  AND full_name ~ '[\u0980-\u09FF]';

-- For members with English / Latin characters
UPDATE members
SET name_english = TRIM(full_name)
WHERE name_english IS NULL 
  AND full_name IS NOT NULL 
  AND full_name ~ '[A-Za-z]';

-- Backfill admin_users from existing name
UPDATE admin_users
SET name_bangla = TRIM(name)
WHERE name_bangla IS NULL 
  AND name IS NOT NULL 
  AND name ~ '[\u0980-\u09FF]';

UPDATE admin_users
SET name_english = TRIM(name)
WHERE name_english IS NULL 
  AND name IS NOT NULL 
  AND name ~ '[A-Za-z]';

COMMIT;
