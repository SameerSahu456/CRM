-- Fixed Migration: Add view_access column to users table
-- Run this on your Supabase database (SQL Editor)

-- Step 1: Add view_access column (safe to run multiple times)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS view_access VARCHAR(50) NOT NULL DEFAULT 'presales';

-- Step 2: Add check constraint (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'check_view_access'
        AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT check_view_access
        CHECK (view_access IN ('presales', 'postsales', 'both'));
    END IF;
END $$;

-- Step 3: Update admin users to have 'both' access
UPDATE users
SET view_access = 'both'
WHERE role IN ('admin', 'superadmin');

-- Step 4: Add comment
COMMENT ON COLUMN users.view_access IS 'Determines which view the user has access to: presales, postsales, or both';

-- Step 5: Verify the migration
SELECT
    'Migration Complete!' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN view_access = 'presales' THEN 1 END) as presales_users,
    COUNT(CASE WHEN view_access = 'postsales' THEN 1 END) as postsales_users,
    COUNT(CASE WHEN view_access = 'both' THEN 1 END) as both_users
FROM users;
