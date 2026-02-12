-- Migration: Add 'tag' column to leads and deals tables
-- Tag values: 'Channel' or 'End Customer'

ALTER TABLE leads ADD COLUMN IF NOT EXISTS tag VARCHAR(50);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS tag VARCHAR(50);
