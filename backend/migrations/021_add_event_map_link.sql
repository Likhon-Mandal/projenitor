-- Migration 021: Add map_link column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS map_link TEXT;
