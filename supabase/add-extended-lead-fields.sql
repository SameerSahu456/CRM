-- Comprint CRM Extended Lead Fields Migration
-- Run this in the Supabase SQL Editor to add all extended lead fields

-- Add Lead Information fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS mobile VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fax VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS no_of_employees INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS annual_revenue DECIMAL(15, 2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS rating VARCHAR(20) DEFAULT 'None';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS skype_id VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS secondary_email VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS twitter VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS job_title VARCHAR(150);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_category VARCHAR(20) DEFAULT 'Warm';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS account_type VARCHAR(50) DEFAULT 'Prospect';

-- Add Order Info fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sample_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sample_received BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sample_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sample_details TEXT;

-- Add Forms Info fields (printing industry specific)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS no_of_pieces INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gsm INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS size VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS paper_type VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS finish VARCHAR(100);

-- Add Billing Address Information
ALTER TABLE leads ADD COLUMN IF NOT EXISTS billing_street TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS billing_city VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS billing_state VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS billing_zip_code VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS billing_country VARCHAR(100);

-- Add Tags field (JSONB for array of tags)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';

-- Create Lead Notes table
CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Lead Activities/Timeline table
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'call_scheduled', 'call_logged', 'email_sent', 'task_created', 'status_changed', 'note_added', 'tag_added', 'owner_changed'
  title VARCHAR(300) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  outcome VARCHAR(100),
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Lead Tasks table
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

-- Create Lead Calls table
CREATE TABLE IF NOT EXISTS lead_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  call_type VARCHAR(20) NOT NULL, -- 'scheduled', 'logged'
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

-- Create Email Templates table
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

-- Apply updated_at triggers
CREATE TRIGGER update_lead_notes_updated_at
  BEFORE UPDATE ON lead_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_tasks_updated_at
  BEFORE UPDATE ON lead_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default email templates
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead_id ON lead_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_calls_lead_id ON lead_calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at DESC);
