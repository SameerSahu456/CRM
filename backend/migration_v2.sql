-- Migration V2: Roles simplification, new columns, deal_activities table
-- Run this against your Supabase database before deploying code changes

-- 1. Add designation and location to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS designation VARCHAR(200);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- 2. Add new columns to deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS contact_no VARCHAR(50);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS designation VARCHAR(200);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS next_follow_up DATE;

-- 3. Create deal_activities table (mirrors lead_activities)
CREATE TABLE IF NOT EXISTS deal_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deal_activities_deal_id ON deal_activities(deal_id);

-- 4. Migrate user roles
UPDATE users SET role = 'sales' WHERE role = 'salesperson';
UPDATE users SET role = 'productmanager' WHERE role IN ('producthead', 'branchhead', 'salesmanager');

-- 5. Update roles table
DELETE FROM roles WHERE name IN ('branchhead', 'salesmanager');
UPDATE roles SET name = 'sales', label = 'Sales' WHERE name = 'salesperson';
UPDATE roles SET name = 'productmanager', label = 'Product Manager' WHERE name = 'producthead';
INSERT INTO roles (id, name, label, is_system, is_active)
SELECT uuid_generate_v4(), 'productmanager', 'Product Manager', true, true
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'productmanager');
