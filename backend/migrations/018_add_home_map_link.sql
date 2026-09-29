-- Migration 018: Add Google Map link column to homes table
ALTER TABLE homes ADD COLUMN IF NOT EXISTS map_link TEXT;
