-- Comprint CRM Complete Database Schema for Supabase
-- Run this ENTIRE script in the Supabase SQL Editor
-- This creates all tables with all required columns

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables (uncomment if you want to start fresh)
-- DROP TABLE IF EXISTS leads CASCADE;
-- DROP TABLE IF EXISTS contacts CASCADE;
-- DROP TABLE IF EXISTS accounts CASCADE;
-- DROP TABLE IF EXISTS deals CASCADE;
-- DROP TABLE IF EXISTS tasks CASCADE;
-- DROP TABLE IF EXISTS calendar_events CASCADE;
-- DROP TABLE IF EXISTS tickets CASCADE;
-- DROP TABLE IF EXISTS campaigns CASCADE;
-- DROP TABLE IF EXISTS emails CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;
-- DROP TABLE IF EXISTS roles CASCADE;

-- Leads table (complete)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  company VARCHAR(200),
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  status VARCHAR(50) DEFAULT 'New',
  source VARCHAR(100),
  score INTEGER DEFAULT 0,
  owner VARCHAR(100),
  lead_category VARCHAR(50),
  account_type VARCHAR(50),
  industry VARCHAR(100),
  job_title VARCHAR(150),
  budget DECIMAL(15, 2),
  website VARCHAR(255),
  notes TEXT,
  tags TEXT[],
  last_active TIMESTAMP WITH TIME ZONE,
  avatar TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to leads if table exists
DO $$
BEGIN
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS mobile VARCHAR(50);
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_category VARCHAR(50);
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS account_type VARCHAR(50);
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS job_title VARCHAR(150);
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget DECIMAL(15, 2);
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS website VARCHAR(255);
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[];
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS avatar TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Contacts table (complete)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  job_title VARCHAR(150),
  department VARCHAR(100),
  account_id UUID,
  account_name VARCHAR(200),
  type VARCHAR(50) DEFAULT 'Customer',
  status VARCHAR(50) DEFAULT 'Active',
  owner VARCHAR(100),
  avatar TEXT DEFAULT '',
  notes TEXT,
  tags TEXT[],
  preferred_contact VARCHAR(50),
  last_contacted TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to contacts
DO $$
BEGIN
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mobile VARCHAR(50);
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS department VARCHAR(100);
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS account_id UUID;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tags TEXT[];
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS preferred_contact VARCHAR(50);
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_contacted TIMESTAMP WITH TIME ZONE;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS avatar TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Accounts table (complete)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  industry VARCHAR(100),
  website VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  revenue DECIMAL(15, 2) DEFAULT 0,
  employees INTEGER DEFAULT 0,
  location VARCHAR(200),
  health_score INTEGER DEFAULT 0,
  logo TEXT DEFAULT '',
  type VARCHAR(50) DEFAULT 'Customer',
  status VARCHAR(50) DEFAULT 'Active',
  owner VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to accounts
DO $$
BEGIN
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS email VARCHAR(255);
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS website VARCHAR(255);
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS logo TEXT;
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS description TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Deals table (complete)
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  company VARCHAR(200),
  account_id UUID,
  value DECIMAL(15, 2) DEFAULT 0,
  stage VARCHAR(50) DEFAULT 'Discovery',
  probability INTEGER DEFAULT 0,
  owner VARCHAR(100),
  closing_date DATE,
  type VARCHAR(50) DEFAULT 'New Business',
  description TEXT,
  notes TEXT,
  contact_id UUID,
  contact_name VARCHAR(200),
  next_step TEXT,
  forecast VARCHAR(50),
  lead_source VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to deals
DO $$
BEGIN
  ALTER TABLE deals ADD COLUMN IF NOT EXISTS account_id UUID;
  ALTER TABLE deals ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE deals ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE deals ADD COLUMN IF NOT EXISTS contact_id UUID;
  ALTER TABLE deals ADD COLUMN IF NOT EXISTS contact_name VARCHAR(200);
  ALTER TABLE deals ADD COLUMN IF NOT EXISTS next_step TEXT;
  ALTER TABLE deals ADD COLUMN IF NOT EXISTS forecast VARCHAR(50);
  ALTER TABLE deals ADD COLUMN IF NOT EXISTS lead_source VARCHAR(100);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Tasks table (complete)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(300) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'Task',
  status VARCHAR(50) DEFAULT 'Not Started',
  priority VARCHAR(50) DEFAULT 'Normal',
  due_date DATE,
  due_time TIME,
  assigned_to VARCHAR(100),
  created_by VARCHAR(100),
  completed_at TIMESTAMP WITH TIME ZONE,
  related_to JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to tasks
DO $$
BEGIN
  ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_time TIME;
  ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
  ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
  ALTER TABLE tasks ADD COLUMN IF NOT EXISTS related_to JSONB;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Calendar Events table (complete)
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(300) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'Meeting',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  location VARCHAR(200),
  meeting_link TEXT,
  owner VARCHAR(100),
  color VARCHAR(20) DEFAULT '#4f46e5',
  reminder INTEGER,
  attendees JSONB DEFAULT '[]',
  related_to JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets table (complete)
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(50) UNIQUE,
  subject VARCHAR(300) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'Open',
  priority VARCHAR(50) DEFAULT 'Normal',
  type VARCHAR(50) DEFAULT 'Bug',
  category VARCHAR(100),
  contact_id UUID,
  contact_name VARCHAR(200),
  contact_email VARCHAR(255),
  account_id UUID,
  account_name VARCHAR(200),
  assigned_to VARCHAR(100),
  assigned_team VARCHAR(100),
  due_date DATE,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns table (complete)
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) DEFAULT 'Email',
  status VARCHAR(50) DEFAULT 'Draft',
  start_date DATE,
  end_date DATE,
  budget DECIMAL(15, 2) DEFAULT 0,
  actual_cost DECIMAL(15, 2) DEFAULT 0,
  expected_revenue DECIMAL(15, 2) DEFAULT 0,
  actual_revenue DECIMAL(15, 2) DEFAULT 0,
  description TEXT,
  owner VARCHAR(100),
  target_audience TEXT,
  goals TEXT,
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emails table (complete)
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject VARCHAR(500) NOT NULL,
  body TEXT,
  from_address VARCHAR(255),
  to_addresses TEXT[] DEFAULT '{}',
  cc TEXT[],
  bcc TEXT[],
  status VARCHAR(50) DEFAULT 'draft',
  sent_at TIMESTAMP WITH TIME ZONE,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  track_opens BOOLEAN DEFAULT FALSE,
  track_clicks BOOLEAN DEFAULT FALSE,
  related_to JSONB,
  template_id UUID,
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) DEFAULT 'info',
  title VARCHAR(200) NOT NULL,
  message TEXT,
  link TEXT,
  related_to JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table
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

-- Roles table
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

-- Disable RLS for now (simpler for development)
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE emails DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;

-- Seed default profiles
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

-- Seed default roles
INSERT INTO roles (id, name, description, permissions, color)
VALUES
  ('role-1', 'Admin', 'Full access to all features', ARRAY['view_dashboard', 'view_leads', 'create_leads', 'edit_leads', 'delete_leads', 'view_deals', 'create_deals', 'edit_deals', 'delete_deals', 'view_contacts', 'create_contacts', 'edit_contacts', 'delete_contacts', 'view_accounts', 'create_accounts', 'edit_accounts', 'delete_accounts', 'view_reports', 'export_data', 'manage_users', 'manage_settings'], 'purple'),
  ('role-2', 'Sales Manager', 'Manage sales team', ARRAY['view_dashboard', 'view_leads', 'create_leads', 'edit_leads', 'delete_leads', 'view_deals', 'create_deals', 'edit_deals', 'delete_deals', 'view_contacts', 'create_contacts', 'edit_contacts', 'delete_contacts', 'view_accounts', 'create_accounts', 'edit_accounts', 'view_reports', 'export_data'], 'blue'),
  ('role-3', 'Sales Rep', 'Standard sales access', ARRAY['view_dashboard', 'view_leads', 'create_leads', 'edit_leads', 'view_deals', 'create_deals', 'edit_deals', 'view_contacts', 'create_contacts', 'edit_contacts', 'view_accounts'], 'green'),
  ('role-4', 'Marketing', 'Marketing access', ARRAY['view_dashboard', 'view_leads', 'create_leads', 'view_reports'], 'orange'),
  ('role-5', 'Support', 'Support access', ARRAY['view_dashboard', 'view_contacts', 'edit_contacts', 'view_accounts'], 'teal')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  color = EXCLUDED.color;

-- Success message
SELECT 'Schema created successfully! Make sure to add SUPABASE_URL and SUPABASE_ANON_KEY to your Vercel environment variables.' as message;
