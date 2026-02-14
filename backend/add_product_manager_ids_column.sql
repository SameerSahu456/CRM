-- Migration: Add product_manager_ids column to master_categories
-- This replaces the single product_manager_id with a multi-select TEXT field
-- storing a JSON array of user IDs, e.g. '["uuid1","uuid2"]'
-- Run this in your Supabase SQL editor

ALTER TABLE master_categories
ADD COLUMN IF NOT EXISTS product_manager_ids TEXT DEFAULT '[]';

-- Migrate existing single assignments to the new array column
UPDATE master_categories
SET product_manager_ids = CASE
  WHEN product_manager_id IS NOT NULL THEN '["' || product_manager_id::text || '"]'
  ELSE '[]'
END
WHERE product_manager_ids = '[]' OR product_manager_ids IS NULL;
