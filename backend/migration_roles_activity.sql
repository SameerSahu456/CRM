-- ============================================================
-- Migration: Roles, Role Permissions & Activity Logs
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID extension (if not already)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. Roles table
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. Role Permissions table
-- ============================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    entity VARCHAR(50) NOT NULL,
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    CONSTRAINT uq_role_permissions_role_entity UNIQUE(role_id, entity)
);

-- ============================================================
-- 3. Activity Logs table
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_name VARCHAR(200),
    action VARCHAR(20) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    entity_name VARCHAR(255),
    changes JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type);

-- ============================================================
-- 4. Seed default system roles
-- ============================================================
INSERT INTO roles (name, label, is_system) VALUES
    ('superadmin', 'Super Admin', true),
    ('admin', 'Admin', true),
    ('businesshead', 'Business Head', true),
    ('branchhead', 'Branch Head', true),
    ('salesmanager', 'Sales Manager', true),
    ('producthead', 'Product Head', true),
    ('salesperson', 'Salesperson', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 5. Seed default permissions for each role
-- ============================================================

-- Helper: get role IDs
DO $$
DECLARE
    v_role_id UUID;
    v_entity TEXT;
    v_entities TEXT[] := ARRAY[
        'partners', 'leads', 'accounts', 'contacts', 'deals',
        'sales_entries', 'products', 'tasks', 'quotes', 'carepacks',
        'calendar_events', 'emails', 'reports'
    ];
BEGIN
    -- superadmin & admin: full access to everything
    FOR v_role_id IN
        SELECT id FROM roles WHERE name IN ('superadmin', 'admin')
    LOOP
        FOREACH v_entity IN ARRAY v_entities LOOP
            INSERT INTO role_permissions (role_id, entity, can_view, can_create, can_edit, can_delete)
            VALUES (v_role_id, v_entity, true, true, true, true)
            ON CONFLICT (role_id, entity) DO NOTHING;
        END LOOP;
    END LOOP;

    -- businesshead, branchhead, salesmanager: view/create/edit all, delete only own entities
    FOR v_role_id IN
        SELECT id FROM roles WHERE name IN ('businesshead', 'branchhead', 'salesmanager')
    LOOP
        FOREACH v_entity IN ARRAY v_entities LOOP
            INSERT INTO role_permissions (role_id, entity, can_view, can_create, can_edit, can_delete)
            VALUES (v_role_id, v_entity, true, true, true, false)
            ON CONFLICT (role_id, entity) DO NOTHING;
        END LOOP;
    END LOOP;

    -- producthead: view/create/edit products and reports; view others
    SELECT id INTO v_role_id FROM roles WHERE name = 'producthead';
    IF v_role_id IS NOT NULL THEN
        FOREACH v_entity IN ARRAY v_entities LOOP
            IF v_entity IN ('products', 'reports') THEN
                INSERT INTO role_permissions (role_id, entity, can_view, can_create, can_edit, can_delete)
                VALUES (v_role_id, v_entity, true, true, true, true)
                ON CONFLICT (role_id, entity) DO NOTHING;
            ELSE
                INSERT INTO role_permissions (role_id, entity, can_view, can_create, can_edit, can_delete)
                VALUES (v_role_id, v_entity, true, true, true, false)
                ON CONFLICT (role_id, entity) DO NOTHING;
            END IF;
        END LOOP;
    END IF;

    -- salesperson: view/create/edit own data, no delete
    SELECT id INTO v_role_id FROM roles WHERE name = 'salesperson';
    IF v_role_id IS NOT NULL THEN
        FOREACH v_entity IN ARRAY v_entities LOOP
            INSERT INTO role_permissions (role_id, entity, can_view, can_create, can_edit, can_delete)
            VALUES (v_role_id, v_entity, true, true, true, false)
            ON CONFLICT (role_id, entity) DO NOTHING;
        END LOOP;
    END IF;
END $$;
