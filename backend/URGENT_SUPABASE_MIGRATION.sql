-- ⚠️ URGENT: Run this IMMEDIATELY on Supabase SQL Editor
-- This fixes the production login issue

-- Add view_access column
ALTER TABLE users ADD COLUMN IF NOT EXISTS view_access VARCHAR(50) NOT NULL DEFAULT 'presales';

-- Update admin users
UPDATE users SET view_access = 'both' WHERE role IN ('admin', 'superadmin');

-- Verify it worked
SELECT email, role, view_access FROM users LIMIT 10;
