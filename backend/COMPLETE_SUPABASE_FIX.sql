-- 🔧 COMPLETE FIX: Run this on Supabase SQL Editor
-- This adds BOTH missing columns: view_access + dashboard_preferences

-- 1. Add view_access column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS view_access VARCHAR(50) NOT NULL DEFAULT 'presales';

-- 2. Add dashboard_preferences column (JSONB for storing widget layout)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS dashboard_preferences JSONB DEFAULT '{"widgets": [], "lastModified": null}'::jsonb;

-- 3. Add index for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_users_dashboard_preferences
ON users USING gin(dashboard_preferences);

-- 4. Update admin users to have 'both' view access
UPDATE users
SET view_access = 'both'
WHERE role IN ('admin', 'superadmin');

-- 5. Verify everything worked
SELECT
    email,
    role,
    view_access,
    dashboard_preferences
FROM users
LIMIT 5;
