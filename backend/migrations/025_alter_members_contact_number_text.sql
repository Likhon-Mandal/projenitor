-- Migration 025: Expand contact_number in members table to TEXT to allow multiple phone numbers
BEGIN;

ALTER TABLE members ALTER COLUMN contact_number TYPE TEXT;

COMMIT;
