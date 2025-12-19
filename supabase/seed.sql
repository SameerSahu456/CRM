-- Comprint CRM Seed Data
-- Run this after schema.sql to populate initial data

-- Seed Leads
INSERT INTO leads (first_name, last_name, company, email, status, source, score, owner) VALUES
  ('Alice', 'Freeman', 'Quantum Solutions', 'alice@quantum.io', 'New', 'Website', 85, 'Sarah Jenkins'),
  ('Bob', 'Smith', 'Design Co.', 'bob@design.co', 'Contacted', 'Referral', 62, 'Michael Chen'),
  ('Charlie', 'Davis', 'FinTech Plus', 'c.davis@fintech.com', 'Qualified', 'LinkedIn', 92, 'Sarah Jenkins'),
  ('Diana', 'Prince', 'Amazone Corp', 'diana@amazone.com', 'Lost', 'Trade Show', 24, 'Michael Chen'),
  ('Evan', 'Wright', 'Wright Logic', 'evan@wright.net', 'New', 'Website', 78, 'Sarah Jenkins'),
  ('Fiona', 'Garcia', 'Health First', 'fiona@healthfirst.org', 'Contacted', 'Cold Call', 71, 'Michael Chen'),
  ('George', 'Martinez', 'EduTech Inc', 'george@edutech.com', 'Qualified', 'Referral', 88, 'Sarah Jenkins'),
  ('Hannah', 'Lee', 'Green Energy Co', 'hannah@greenenergy.com', 'Proposal', 'Email Campaign', 55, 'Michael Chen');

-- Seed Contacts
INSERT INTO contacts (first_name, last_name, email, job_title, account_name, type, status, owner) VALUES
  ('John', 'Anderson', 'john.anderson@techflow.io', 'CEO', 'TechFlow Inc.', 'Customer', 'Active', 'Sarah Jenkins'),
  ('Maria', 'Santos', 'maria.santos@techflow.io', 'VP of Sales', 'TechFlow Inc.', 'Customer', 'Active', 'Sarah Jenkins'),
  ('Robert', 'Johnson', 'robert@globaldynamics.com', 'COO', 'Global Dynamics', 'Customer', 'Active', 'Michael Chen'),
  ('Jennifer', 'Williams', 'jennifer@securenet.io', 'CTO', 'SecureNet', 'Prospect', 'Active', 'Sarah Jenkins'),
  ('James', 'Brown', 'james@alphawave.net', 'Founder', 'Alpha Wave', 'Customer', 'Active', 'Michael Chen'),
  ('Lisa', 'Taylor', 'lisa@nextgen.tech', 'VP of Engineering', 'NextGen Systems', 'Customer', 'Active', 'Sarah Jenkins'),
  ('David', 'Miller', 'david.miller@innovate.io', 'Product Director', 'Innovate Labs', 'Prospect', 'Active', 'Michael Chen'),
  ('Sarah', 'Davis', 'sarah.davis@cloudpeak.com', 'Director of IT', 'CloudPeak', 'Customer', 'Inactive', 'Sarah Jenkins');

-- Seed Accounts
INSERT INTO accounts (name, industry, revenue, employees, location, health_score, type, status, owner) VALUES
  ('TechFlow Inc.', 'Software', 5000000, 120, 'San Francisco, CA', 92, 'Customer', 'Active', 'Sarah Jenkins'),
  ('Global Dynamics', 'Manufacturing', 12000000, 450, 'Chicago, IL', 78, 'Customer', 'Active', 'Michael Chen'),
  ('SecureNet', 'Cybersecurity', 2500000, 50, 'Austin, TX', 88, 'Prospect', 'Active', 'Sarah Jenkins'),
  ('Alpha Wave', 'Consulting', 800000, 15, 'New York, NY', 65, 'Customer', 'Active', 'Michael Chen'),
  ('NextGen Systems', 'Hardware', 7500000, 200, 'Boston, MA', 95, 'Customer', 'Active', 'Sarah Jenkins'),
  ('Innovate Labs', 'Research', 3200000, 80, 'Seattle, WA', 71, 'Prospect', 'Active', 'Michael Chen'),
  ('CloudPeak', 'Cloud Services', 9000000, 300, 'Denver, CO', 45, 'Customer', 'Churned', 'Sarah Jenkins'),
  ('DataVault', 'Data Storage', 4500000, 95, 'Portland, OR', 82, 'Customer', 'Active', 'Michael Chen');

-- Seed Deals
INSERT INTO deals (title, company, value, stage, probability, owner, closing_date, type) VALUES
  ('Enterprise License', 'TechFlow Inc.', 45000, 'Qualification', 20, 'Sarah Jenkins', '2024-12-24', 'New Business'),
  ('Q4 Marketing Audit', 'Global Dynamics', 12000, 'Qualification', 30, 'Michael Chen', '2024-12-28', 'New Business'),
  ('Security Suite Upgrade', 'SecureNet', 85000, 'Proposal', 60, 'Sarah Jenkins', '2025-01-15', 'Existing Business'),
  ('Consulting Retainer', 'Alpha Wave', 24000, 'Negotiation', 85, 'Michael Chen', '2024-12-30', 'Renewal'),
  ('Cloud Migration Project', 'NextGen Systems', 120000, 'Closed Won', 100, 'Sarah Jenkins', '2024-12-12', 'New Business'),
  ('Annual Support Contract', 'DataVault', 36000, 'Discovery', 40, 'Michael Chen', '2025-01-20', 'Renewal'),
  ('Platform Integration', 'Innovate Labs', 65000, 'Proposal', 55, 'Sarah Jenkins', '2025-02-01', 'New Business'),
  ('Data Analytics Package', 'TechFlow Inc.', 28000, 'Negotiation', 75, 'Sarah Jenkins', '2024-12-20', 'Existing Business'),
  ('Training Program', 'Global Dynamics', 8500, 'Closed Won', 100, 'Michael Chen', '2024-12-05', 'Existing Business'),
  ('Expansion Deal', 'CloudPeak', 55000, 'Closed Lost', 0, 'Sarah Jenkins', '2024-11-30', 'Existing Business');

-- Seed Tasks
INSERT INTO tasks (title, type, status, priority, due_date, assigned_to) VALUES
  ('Follow up with TechFlow on proposal', 'Follow-up', 'Not Started', 'High', '2024-12-12', 'Sarah Jenkins'),
  ('Send contract to Alpha Wave', 'Email', 'In Progress', 'Urgent', '2024-12-10', 'Michael Chen'),
  ('Schedule demo with SecureNet', 'Demo', 'Not Started', 'Normal', '2024-12-15', 'Sarah Jenkins'),
  ('Review Q4 pipeline report', 'Task', 'Completed', 'Normal', '2024-12-05', 'Sarah Jenkins'),
  ('Call with new lead', 'Call', 'Not Started', 'High', '2024-12-11', 'Sarah Jenkins'),
  ('Prepare quarterly business review', 'Task', 'In Progress', 'High', '2024-12-18', 'Michael Chen'),
  ('Update CRM with new contact info', 'Task', 'Not Started', 'Low', '2024-12-20', 'Michael Chen'),
  ('Send holiday greetings', 'Email', 'Not Started', 'Normal', '2024-12-22', 'Sarah Jenkins');

-- Seed Calendar Events
INSERT INTO calendar_events (title, type, start_time, end_time, location, owner, color) VALUES
  ('TechFlow Enterprise Demo', 'Demo', '2024-12-11T10:00:00Z', '2024-12-11T11:30:00Z', 'Zoom', 'Sarah Jenkins', '#4f46e5'),
  ('Alpha Wave Contract Review', 'Meeting', '2024-12-12T14:00:00Z', '2024-12-12T15:00:00Z', 'Conference Room A', 'Michael Chen', '#059669'),
  ('Team Standup', 'Meeting', '2024-12-10T09:00:00Z', '2024-12-10T09:30:00Z', 'Main Office', 'Sarah Jenkins', '#7c3aed'),
  ('Q4 Pipeline Review', 'Meeting', '2024-12-13T15:00:00Z', '2024-12-13T16:30:00Z', 'Board Room', 'Sarah Jenkins', '#dc2626'),
  ('SecureNet Discovery Call', 'Call', '2024-12-15T11:00:00Z', '2024-12-15T11:45:00Z', NULL, 'Sarah Jenkins', '#0891b2'),
  ('Sales Training Workshop', 'Webinar', '2024-12-16T13:00:00Z', '2024-12-16T16:00:00Z', 'Training Room', 'Sarah Jenkins', '#ea580c'),
  ('Holiday Office Party', 'Meeting', '2024-12-20T17:00:00Z', '2024-12-20T20:00:00Z', 'Main Lobby', 'Sarah Jenkins', '#059669'),
  ('Year-End Review Meeting', 'Meeting', '2024-12-27T10:00:00Z', '2024-12-27T12:00:00Z', 'Board Room', 'Sarah Jenkins', '#4f46e5');

-- Seed Tickets
INSERT INTO tickets (ticket_number, subject, status, priority, type, contact_name, account_name, assigned_to) VALUES
  ('TKT-001', 'Login issues', 'Open', 'High', 'Bug', 'John Anderson', 'TechFlow Inc.', 'David Kim'),
  ('TKT-002', 'Feature request: Dark mode', 'In Progress', 'Normal', 'Feature Request', 'Maria Santos', 'TechFlow Inc.', 'Emily Rodriguez'),
  ('TKT-003', 'Integration not working', 'Pending', 'Urgent', 'Bug', 'Robert Johnson', 'Global Dynamics', 'David Kim'),
  ('TKT-004', 'Billing question', 'Resolved', 'Low', 'Question', 'James Brown', 'Alpha Wave', 'Sarah Jenkins');

-- Seed Campaigns
INSERT INTO campaigns (name, type, status, budget, actual_revenue, owner, metrics) VALUES
  ('Q4 Product Launch', 'Email', 'Active', 15000, 45000, 'Emily Rodriguez', '{"sent": 5000, "opened": 2100, "clicked": 420, "leads": 45}'),
  ('Winter Webinar Series', 'Webinar', 'Scheduled', 5000, 0, 'Sarah Jenkins', '{"sent": 2000, "opened": 780, "clicked": 195, "leads": 0}'),
  ('LinkedIn Ads - Tech Leaders', 'Social', 'Active', 8000, 12000, 'Emily Rodriguez', '{"clicked": 320, "leads": 18}'),
  ('Customer Success Newsletter', 'Email', 'Completed', 2000, 15000, 'Michael Chen', '{"sent": 1500, "opened": 890, "clicked": 445, "leads": 0}');

-- Seed Emails
INSERT INTO emails (subject, from_address, to_addresses, status, sent_at, scheduled_at) VALUES
  ('Proposal for Enterprise License', 'sarah.jenkins@comprint.com', ARRAY['john.anderson@techflow.io'], 'sent', '2024-12-08T14:30:00Z', NULL),
  ('Meeting Follow-up', 'michael.chen@comprint.com', ARRAY['robert@globaldynamics.com'], 'sent', '2024-12-07T16:00:00Z', NULL),
  ('Product Demo Invitation', 'sarah.jenkins@comprint.com', ARRAY['jennifer@securenet.io'], 'scheduled', NULL, '2024-12-12T09:00:00Z'),
  ('Contract Review Request', 'michael.chen@comprint.com', ARRAY['james@alphawave.net'], 'draft', NULL, NULL);

-- Seed Notifications
INSERT INTO notifications (type, title, message, read) VALUES
  ('deal', 'Deal Updated', 'Enterprise License deal moved to Negotiation', false),
  ('task', 'Task Due Soon', 'Follow up with TechFlow on proposal is due tomorrow', false),
  ('lead', 'New Lead Assigned', 'Alice Freeman from Quantum Solutions assigned to you', true),
  ('ticket', 'Urgent Ticket', 'High priority ticket from Global Dynamics needs attention', false);
