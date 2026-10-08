-- Migration 029: Add reason and institution columns to eminent_figures
ALTER TABLE eminent_figures ADD COLUMN IF NOT EXISTS reason VARCHAR(255);
ALTER TABLE eminent_figures ADD COLUMN IF NOT EXISTS institution VARCHAR(255);
