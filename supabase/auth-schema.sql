-- Comprint CRM Authentication Schema for Supabase
-- Run this in the Supabase SQL Editor after enabling Authentication

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar VARCHAR(500),
  role VARCHAR(50) DEFAULT 'Sales Rep',
  status VARCHAR(50) DEFAULT 'Active',
  phone VARCHAR(50),
  department VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles table for RBAC
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  permissions TEXT[] DEFAULT '{}',
  color VARCHAR(50) DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description, permissions, color) VALUES
  ('Admin', 'Full access to all features and settings', ARRAY['view_dashboard', 'view_leads', 'create_leads', 'edit_leads', 'delete_leads', 'view_deals', 'create_deals', 'edit_deals', 'delete_deals', 'view_contacts', 'create_contacts', 'edit_contacts', 'delete_contacts', 'view_accounts', 'create_accounts', 'edit_accounts', 'delete_accounts', 'view_reports', 'export_data', 'manage_users', 'manage_settings'], 'purple'),
  ('Sales Manager', 'Manage sales team and view reports', ARRAY['view_dashboard', 'view_leads', 'create_leads', 'edit_leads', 'delete_leads', 'view_deals', 'create_deals', 'edit_deals', 'delete_deals', 'view_contacts', 'create_contacts', 'edit_contacts', 'delete_contacts', 'view_accounts', 'create_accounts', 'edit_accounts', 'view_reports', 'export_data', 'manage_users'], 'blue'),
  ('Sales Rep', 'Standard sales team member access', ARRAY['view_dashboard', 'view_leads', 'create_leads', 'edit_leads', 'view_deals', 'create_deals', 'edit_deals', 'view_contacts', 'create_contacts', 'edit_contacts', 'view_accounts'], 'green'),
  ('Marketing', 'Access to leads and reporting', ARRAY['view_dashboard', 'view_leads', 'create_leads', 'edit_leads', 'view_reports', 'export_data'], 'orange'),
  ('Support', 'View-only access with contact management', ARRAY['view_dashboard', 'view_contacts', 'create_contacts', 'edit_contacts', 'view_accounts'], 'teal')
ON CONFLICT (name) DO NOTHING;

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update timestamp trigger for profiles
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Users can view all profiles (for team directory)
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT TO authenticated USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Roles policies
-- Everyone can view roles
CREATE POLICY "Roles are viewable by authenticated users" ON roles
  FOR SELECT TO authenticated USING (true);

-- Only admins can modify roles
CREATE POLICY "Admins can insert roles" ON roles
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Admins can update roles" ON roles
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Admins can delete roles" ON roles
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin'
    )
  );
