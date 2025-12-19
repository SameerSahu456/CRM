-- Comprint CRM Extended Account Fields Migration
-- Run this in the Supabase SQL Editor to add all extended account fields

-- Add Account Information fields
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS company_industry VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS endcustomer_accounts_category VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(50) DEFAULT 'Net 30';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'Active';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS partner VARCHAR(200);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS lead_category VARCHAR(20) DEFAULT 'Warm';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS new_leads INTEGER DEFAULT 0;

-- Add Tax & Legal Info fields
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS pan_no VARCHAR(20);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS gstin_no VARCHAR(20);

-- Add Products Info fields
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS products_we_selling TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS products_they_selling TEXT;

-- Add Other Info fields
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS references_info TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS bank_statement TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS documents TEXT;

-- Add Contact Info fields
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS contact_designation VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS contact_others TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS other_designation_name VARCHAR(100);

-- Add Address fields
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS locate_map TEXT;

-- Create Account Notes table
CREATE TABLE IF NOT EXISTS account_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Account Activities/Timeline table
CREATE TABLE IF NOT EXISTS account_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'call_scheduled', 'call_logged', 'email_sent', 'task_created', 'status_changed', 'note_added', 'deal_created', 'contact_added'
  title VARCHAR(300) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  outcome VARCHAR(100),
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Account Documents table
CREATE TABLE IF NOT EXISTS account_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name VARCHAR(300) NOT NULL,
  file_type VARCHAR(50),
  file_url TEXT,
  file_size INTEGER,
  category VARCHAR(100), -- 'bank_statement', 'reference', 'contract', 'other'
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Apply updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_account_notes_updated_at
  BEFORE UPDATE ON account_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_account_notes_account_id ON account_notes(account_id);
CREATE INDEX IF NOT EXISTS idx_account_activities_account_id ON account_activities(account_id);
CREATE INDEX IF NOT EXISTS idx_account_documents_account_id ON account_documents(account_id);
CREATE INDEX IF NOT EXISTS idx_account_activities_created_at ON account_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounts_gstin ON accounts(gstin_no);
CREATE INDEX IF NOT EXISTS idx_accounts_payment_terms ON accounts(payment_terms);
