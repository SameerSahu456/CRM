-- Migration: Add product_manager_id column to master_categories
-- This allows assigning a product manager (user) to each category
-- Run this in your Supabase SQL editor or via psql

ALTER TABLE master_categories
ADD COLUMN IF NOT EXISTS product_manager_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Optional: Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_master_categories_product_manager
ON master_categories(product_manager_id);
