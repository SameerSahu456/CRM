-- Comprint CRM - PostgreSQL Database Initialization Script
-- Run: psql -U postgres -f init_db.sql
--
-- 1. Creates the zenith_crm database (if not exists)
-- 2. Creates all 20 tables with proper types, constraints, FKs
-- 3. Adds indexes for performance
-- 4. Seeds profiles, roles, and email templates

-- ============================================================
-- DATABASE CREATION (run as superuser / postgres role)
-- ============================================================
SELECT 'CREATE DATABASE zenith_crm'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'zenith_crm')\gexec

\connect zenith_crm

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CORE TABLES (12)
-- ============================================================

-- 1. Leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  company VARCHAR(200),
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  fax VARCHAR(50),
  status VARCHAR(50) DEFAULT 'New',
  source VARCHAR(100),
  score INTEGER DEFAULT 0,
  owner VARCHAR(100),
  lead_category VARCHAR(20) DEFAULT 'Warm',
  account_type VARCHAR(50) DEFAULT 'Prospect',
  industry VARCHAR(100),
  job_title VARCHAR(150),
  budget DECIMAL(15, 2),
  website VARCHAR(255),
  notes TEXT,
  tags TEXT[],
  last_active TIMESTAMP WITH TIME ZONE,
  avatar TEXT DEFAULT '',
  -- Extended fields
  no_of_employees INTEGER,
  annual_revenue DECIMAL(15, 2),
  rating VARCHAR(20) DEFAULT 'None',
  skype_id VARCHAR(100),
  secondary_email VARCHAR(255),
  twitter VARCHAR(100),
  -- Order info
  sample_requested BOOLEAN DEFAULT FALSE,
  sample_received BOOLEAN DEFAULT FALSE,
  sample_sent BOOLEAN DEFAULT FALSE,
  sample_details TEXT,
  -- Forms info (printing industry)
  no_of_pieces INTEGER,
  gsm INTEGER,
  size VARCHAR(100),
  paper_type VARCHAR(100),
  finish VARCHAR(100),
  -- Billing address
  billing_street TEXT,
  billing_city VARCHAR(100),
  billing_state VARCHAR(100),
  billing_zip_code VARCHAR(20),
  billing_country VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Contacts
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

-- 3. Accounts
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
  -- Extended fields
  company_industry VARCHAR(100),
  endcustomer_accounts_category VARCHAR(100),
  payment_terms VARCHAR(50) DEFAULT 'Net 30',
  account_status VARCHAR(50) DEFAULT 'Active',
  partner VARCHAR(200),
  lead_category VARCHAR(20) DEFAULT 'Warm',
  new_leads INTEGER DEFAULT 0,
  -- Tax & legal
  pan_no VARCHAR(20),
  gstin_no VARCHAR(20),
  -- Products info
  products_we_selling TEXT,
  products_they_selling TEXT,
  -- Other info
  references_info TEXT,
  bank_statement TEXT,
  documents TEXT,
  -- Contact info
  contact_designation VARCHAR(100),
  contact_others TEXT,
  other_designation_name VARCHAR(100),
  -- Address
  locate_map TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Deals
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

-- 5. Tasks
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

-- 6. Calendar Events
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

-- 7. Tickets
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

-- 8. Campaigns
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

-- 9. Emails
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

-- 10. Notifications
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

-- 11. Profiles (string PK)
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

-- 12. Roles (string PK)
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  permissions TEXT[] DEFAULT '{}',
  color VARCHAR(50) DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- SUB-ENTITY TABLES (8)
-- ============================================================

-- 13. Lead Notes
CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Lead Activities
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  outcome VARCHAR(100),
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Lead Tasks
CREATE TABLE IF NOT EXISTS lead_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'Pending',
  priority VARCHAR(20) DEFAULT 'Normal',
  due_date DATE,
  due_time TIME,
  assigned_to VARCHAR(100),
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 16. Lead Calls
CREATE TABLE IF NOT EXISTS lead_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  call_type VARCHAR(20) NOT NULL,
  subject VARCHAR(300) NOT NULL,
  call_purpose VARCHAR(100),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  start_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  call_result VARCHAR(100),
  description TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. Account Notes
CREATE TABLE IF NOT EXISTS account_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. Account Activities
CREATE TABLE IF NOT EXISTS account_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  outcome VARCHAR(100),
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. Account Documents
CREATE TABLE IF NOT EXISTS account_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name VARCHAR(300) NOT NULL,
  file_type VARCHAR(50),
  file_url TEXT,
  file_size INTEGER,
  category VARCHAR(100),
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS (updated_at auto-update)
-- ============================================================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'leads', 'contacts', 'accounts', 'deals', 'tasks',
    'calendar_events', 'tickets', 'campaigns', 'emails',
    'profiles', 'roles', 'lead_notes', 'lead_tasks',
    'email_templates', 'account_notes'
  ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %s', t, t);
    EXECUTE format(
      'CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t, t
    );
  END LOOP;
END $$;

-- ============================================================
-- INDEXES
-- ============================================================

-- Lead sub-entity indexes
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead_id ON lead_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_calls_lead_id ON lead_calls(lead_id);

-- Account sub-entity indexes
CREATE INDEX IF NOT EXISTS idx_account_notes_account_id ON account_notes(account_id);
CREATE INDEX IF NOT EXISTS idx_account_activities_account_id ON account_activities(account_id);
CREATE INDEX IF NOT EXISTS idx_account_activities_created_at ON account_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_account_documents_account_id ON account_documents(account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_gstin ON accounts(gstin_no);
CREATE INDEX IF NOT EXISTS idx_accounts_payment_terms ON accounts(payment_terms);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default profiles
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

-- Default roles
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

-- Default email templates
INSERT INTO email_templates (name, subject, body, category) VALUES
  ('Welcome Email', 'Welcome to Comprint CRM!', 'Dear {{firstName}},

Thank you for your interest in Comprint. We are excited to connect with you!

Our team will be in touch shortly to discuss how we can help meet your printing needs.

Best regards,
{{ownerName}}
Comprint Team', 'Welcome'),
  ('Follow-up Email', 'Following up on our conversation', 'Hi {{firstName}},

I wanted to follow up on our recent conversation regarding {{company}}''s printing requirements.

Do you have any questions I can help answer? I''d be happy to schedule a call at your convenience.

Best regards,
{{ownerName}}', 'Follow-up'),
  ('Quote Request', 'Your Quote Request from Comprint', 'Dear {{firstName}},

Thank you for requesting a quote. We are reviewing your requirements and will get back to you within 24-48 hours with a detailed proposal.

In the meantime, feel free to reach out if you have any questions.

Best regards,
{{ownerName}}
Comprint Team', 'Quote'),
  ('Meeting Invitation', 'Meeting Invitation: Discuss Your Printing Needs', 'Hi {{firstName}},

I would like to schedule a meeting to discuss how Comprint can support {{company}}''s printing requirements.

Would any of the following times work for you?
- [Option 1]
- [Option 2]
- [Option 3]

Please let me know what works best for your schedule.

Best regards,
{{ownerName}}', 'Meeting')
ON CONFLICT DO NOTHING;

-- ============================================================
SELECT 'Comprint CRM database initialized successfully!' AS message;
