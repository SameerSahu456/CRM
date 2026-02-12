-- Migration: Add view_access column to users table
-- Run this on your Supabase database

-- Add view_access column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS view_access VARCHAR(50) NOT NULL DEFAULT 'presales';

-- Add check constraint to ensure valid values
ALTER TABLE users
ADD CONSTRAINT check_view_access
CHECK (view_access IN ('presales', 'postsales', 'both'));

-- Set admin users to have 'both' access
UPDATE users
SET view_access = 'both'
WHERE role IN ('admin', 'superadmin');

-- Add comment
COMMENT ON COLUMN users.view_access IS 'Determines which view the user has access to: presales, postsales, or both';
