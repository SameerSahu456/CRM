-- Comprint CRM Database Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  company VARCHAR(200),
  email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'New',
  source VARCHAR(100),
  score INTEGER DEFAULT 0,
  owner VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  job_title VARCHAR(150),
  account_name VARCHAR(200),
  type VARCHAR(50) DEFAULT 'Customer',
  status VARCHAR(50) DEFAULT 'Active',
  owner VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  industry VARCHAR(100),
  revenue DECIMAL(15, 2) DEFAULT 0,
  employees INTEGER DEFAULT 0,
  location VARCHAR(200),
  health_score INTEGER DEFAULT 0,
  type VARCHAR(50) DEFAULT 'Customer',
  status VARCHAR(50) DEFAULT 'Active',
  owner VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deals table
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  company VARCHAR(200),
  value DECIMAL(15, 2) DEFAULT 0,
  stage VARCHAR(50) DEFAULT 'Discovery',
  probability INTEGER DEFAULT 0,
  owner VARCHAR(100),
  closing_date DATE,
  type VARCHAR(50) DEFAULT 'New Business',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(300) NOT NULL,
  type VARCHAR(50) DEFAULT 'Task',
  status VARCHAR(50) DEFAULT 'Not Started',
  priority VARCHAR(50) DEFAULT 'Normal',
  due_date DATE,
  assigned_to VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar Events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(300) NOT NULL,
  type VARCHAR(50) DEFAULT 'Meeting',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(200),
  owner VARCHAR(100),
  color VARCHAR(20) DEFAULT '#4f46e5',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(50) UNIQUE,
  subject VARCHAR(300) NOT NULL,
  status VARCHAR(50) DEFAULT 'Open',
  priority VARCHAR(50) DEFAULT 'Normal',
  type VARCHAR(50) DEFAULT 'Bug',
  contact_name VARCHAR(200),
  account_name VARCHAR(200),
  assigned_to VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) DEFAULT 'Email',
  status VARCHAR(50) DEFAULT 'Draft',
  budget DECIMAL(15, 2) DEFAULT 0,
  actual_revenue DECIMAL(15, 2) DEFAULT 0,
  owner VARCHAR(100),
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emails table
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject VARCHAR(500) NOT NULL,
  from_address VARCHAR(255),
  to_addresses TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'draft',
  sent_at TIMESTAMP WITH TIME ZONE,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) DEFAULT 'info',
  title VARCHAR(200) NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (user profiles for authentication)
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  avatar TEXT DEFAULT '',
  role VARCHAR(50) DEFAULT 'Sales Rep',
  status VARCHAR(50) DEFAULT 'Active',
  phone VARCHAR(50) DEFAULT '',
  department VARCHAR(100) DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles table (for RBAC)
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  permissions TEXT[] DEFAULT '{}',
  color VARCHAR(50) DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables
           WHERE table_schema = 'public'
           AND table_name IN ('leads', 'contacts', 'accounts', 'deals', 'tasks', 'calendar_events', 'tickets', 'campaigns', 'emails', 'profiles', 'roles')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %s', t, t);
    EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
  END LOOP;
END $$;

-- Enable Row Level Security (optional, for future auth integration)
-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Seed data for profiles
INSERT INTO profiles (id, email, first_name, last_name, avatar, role, status, phone, department)
VALUES
  ('user-1', 'sarah.jenkins@comprint.com', 'Sarah', 'Jenkins', '', 'Admin', 'Active', '+1 555-0101', 'Sales'),
  ('user-2', 'michael.chen@comprint.com', 'Michael', 'Chen', '', 'Sales Manager', 'Active', '+1 555-0102', 'Sales'),
  ('user-3', 'emily.rodriguez@comprint.com', 'Emily', 'Rodriguez', '', 'Sales Rep', 'Active', '+1 555-0103', 'Sales'),
  ('user-4', 'david.kim@comprint.com', 'David', 'Kim', '', 'Support', 'Active', '+1 555-0104', 'Support')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  phone = EXCLUDED.phone,
  department = EXCLUDED.department;

-- Seed data for roles
INSERT INTO roles (id, name, description, permissions, color)
VALUES
  ('role-1', 'Admin', 'Full access to all features and settings', ARRAY['view_dashboard', 'view_leads', 'create_leads', 'edit_leads', 'delete_leads', 'view_deals', 'create_deals', 'edit_deals', 'delete_deals', 'view_contacts', 'create_contacts', 'edit_contacts', 'delete_contacts', 'view_accounts', 'create_accounts', 'edit_accounts', 'delete_accounts', 'view_reports', 'export_data', 'manage_users', 'manage_settings'], 'purple'),
  ('role-2', 'Sales Manager', 'Manage sales team and view reports', ARRAY['view_dashboard', 'view_leads', 'create_leads', 'edit_leads', 'delete_leads', 'view_deals', 'create_deals', 'edit_deals', 'delete_deals', 'view_contacts', 'create_contacts', 'edit_contacts', 'delete_contacts', 'view_accounts', 'create_accounts', 'edit_accounts', 'delete_accounts', 'view_reports', 'export_data', 'manage_users'], 'blue'),
  ('role-3', 'Sales Rep', 'Standard sales team member access', ARRAY['view_dashboard', 'view_leads', 'create_leads', 'edit_leads', 'view_deals', 'create_deals', 'edit_deals', 'view_contacts', 'create_contacts', 'edit_contacts', 'view_accounts', 'create_accounts', 'edit_accounts'], 'green'),
  ('role-4', 'Marketing', 'Access to leads and reporting', ARRAY['view_dashboard', 'view_leads', 'create_leads', 'edit_leads', 'view_contacts', 'view_accounts', 'view_reports'], 'orange'),
  ('role-5', 'Support', 'View-only access with contact management', ARRAY['view_dashboard', 'view_leads', 'view_deals', 'view_contacts', 'edit_contacts', 'view_accounts'], 'teal')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  color = EXCLUDED.color;
