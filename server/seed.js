import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'zenith.db'));

// Create tables
db.exec(`
  -- Leads table
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- Lead Information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    mobile TEXT,
    phone TEXT,
    mobile_alternate TEXT,
    phone_alternate TEXT,
    campaign_source TEXT,
    website TEXT,
    lead_owner TEXT,
    company TEXT,
    account_type TEXT,
    source TEXT DEFAULT 'Website',
    status TEXT DEFAULT 'New',
    lead_category TEXT,
    created_by TEXT,
    modified_by TEXT,
    score INTEGER DEFAULT 50,
    last_active TEXT,
    avatar TEXT,
    owner TEXT,
    created_at TEXT,
    modified_at TEXT,
    tags TEXT DEFAULT '[]',
    budget REAL,
    timeline TEXT,
    industry TEXT,
    job_title TEXT,
    -- Order Info (stored as JSON)
    order_info TEXT DEFAULT '{}',
    -- Forms Info (stored as JSON)
    forms_info TEXT DEFAULT '{}',
    -- Billing Address (stored as JSON)
    billing_address TEXT DEFAULT '{}',
    -- Description
    description TEXT,
    notes TEXT,
    -- Visit Summary (stored as JSON)
    visit_summary TEXT DEFAULT '{}'
  );

  -- Contacts table
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- Contact Information
    salutation TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT,
    email TEXT,
    secondary_email TEXT,
    phone TEXT,
    mobile TEXT,
    home_phone TEXT,
    other_phone TEXT,
    fax TEXT,
    assistant TEXT,
    assistant_phone TEXT,
    -- Professional Info
    job_title TEXT,
    department TEXT,
    reporting_to TEXT,
    reporting_to_id INTEGER,
    date_of_birth TEXT,
    skype_id TEXT,
    twitter TEXT,
    -- Account Relation
    account_id INTEGER,
    account_name TEXT,
    vendor_name TEXT,
    -- Classification
    type TEXT DEFAULT 'Prospect',
    status TEXT DEFAULT 'Active',
    lead_source TEXT,
    -- Address Information (stored as JSON)
    mailing_address TEXT DEFAULT '{}',
    other_address TEXT DEFAULT '{}',
    -- Description
    description TEXT,
    notes TEXT,
    -- System Fields
    avatar TEXT,
    last_contacted TEXT,
    created_at TEXT,
    modified_at TEXT,
    created_by TEXT,
    modified_by TEXT,
    owner TEXT,
    tags TEXT DEFAULT '[]',
    preferred_contact TEXT,
    do_not_contact INTEGER DEFAULT 0,
    email_opt_out INTEGER DEFAULT 0,
    -- Hierarchy (stored as JSON)
    hierarchy TEXT DEFAULT '{}'
  );

  -- Accounts table
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- Description Information
    description TEXT,
    group_name TEXT,
    -- Account Information
    name TEXT NOT NULL,
    phone TEXT,
    website TEXT,
    account_owner TEXT,
    industry TEXT,
    account_type TEXT,
    rating TEXT,
    account_number TEXT,
    account_site TEXT,
    parent_account TEXT,
    parent_account_id INTEGER,
    ticker TEXT,
    ownership TEXT,
    -- Other Info
    territory TEXT,
    deal_closing_date TEXT,
    support_start_date TEXT,
    support_expiry_date TEXT,
    product_details TEXT,
    purchase_order_no TEXT,
    locking_period_end_date TEXT,
    sic_code TEXT,
    no_of_retail_counters INTEGER,
    -- Contact Info
    contact_name TEXT,
    contact_email TEXT,
    contact_mobile TEXT,
    contact_phone TEXT,
    fax TEXT,
    -- Employees & Revenue
    employees INTEGER,
    revenue REAL,
    annual_revenue REAL,
    -- Address Information (stored as JSON)
    location TEXT,
    billing_address TEXT DEFAULT '{}',
    shipping_address TEXT DEFAULT '{}',
    -- System Fields
    health_score INTEGER DEFAULT 50,
    logo TEXT,
    type TEXT DEFAULT 'Prospect',
    status TEXT DEFAULT 'Active',
    owner TEXT,
    created_by TEXT,
    modified_by TEXT,
    created_at TEXT,
    modified_at TEXT
  );

  -- Deals table
  CREATE TABLE IF NOT EXISTS deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- Deal Information
    title TEXT NOT NULL,
    deal_name TEXT,
    account_id INTEGER,
    account_name TEXT,
    contact_id INTEGER,
    contact_name TEXT,
    type_of_order TEXT,
    created_by_rm TEXT,
    deal_owner TEXT,
    amount REAL,
    value REAL,
    closing_date TEXT,
    lead_source TEXT,
    stage TEXT DEFAULT 'Qualification',
    probability INTEGER DEFAULT 20,
    expected_revenue REAL,
    campaign_source TEXT,
    next_step TEXT,
    -- Product Information (stored as JSON)
    product_info TEXT DEFAULT '{}',
    products TEXT DEFAULT '[]',
    -- Forms Information (stored as JSON)
    forms_info TEXT DEFAULT '{}',
    -- Other Info
    territory TEXT,
    billing_delivery_date TEXT,
    po_date TEXT,
    po_number TEXT,
    payment_mode TEXT,
    payment_received INTEGER DEFAULT 0,
    payment_received_date TEXT,
    payment_bank_name TEXT,
    payment_cheque_no TEXT,
    payment_other_details TEXT,
    payment_ref_no TEXT,
    support_start_date TEXT,
    support_expiry_date TEXT,
    locking_period_end_date TEXT,
    -- Billing Address (stored as JSON)
    billing_address TEXT DEFAULT '{}',
    -- Description Information
    description TEXT,
    notes TEXT,
    -- System Fields
    company TEXT,
    owner TEXT,
    created_at TEXT,
    modified_at TEXT,
    created_by TEXT,
    modified_by TEXT,
    lost_reason TEXT,
    competitor_name TEXT,
    forecast TEXT DEFAULT 'Pipeline',
    type TEXT DEFAULT 'New Business'
  );

  -- Tasks table
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'Task',
    status TEXT DEFAULT 'Not Started',
    priority TEXT DEFAULT 'Normal',
    due_date TEXT,
    due_time TEXT,
    related_to_type TEXT,
    related_to_id INTEGER,
    related_to_name TEXT,
    assigned_to TEXT,
    created_by TEXT,
    created_at TEXT,
    completed_at TEXT
  );

  -- Tickets table
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_number TEXT UNIQUE,
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Open',
    priority TEXT DEFAULT 'Medium',
    type TEXT DEFAULT 'Question',
    category TEXT,
    contact_id INTEGER,
    contact_name TEXT,
    contact_email TEXT,
    account_id INTEGER,
    account_name TEXT,
    assigned_to TEXT,
    created_at TEXT,
    updated_at TEXT,
    resolved_at TEXT,
    closed_at TEXT
  );

  -- Campaigns table
  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Email',
    status TEXT DEFAULT 'Planning',
    start_date TEXT,
    end_date TEXT,
    budget REAL,
    actual_cost REAL,
    expected_revenue REAL,
    actual_revenue REAL,
    owner TEXT,
    created_at TEXT,
    target_audience TEXT,
    goals TEXT,
    metrics TEXT DEFAULT '{}'
  );

  -- Calendar Events table
  CREATE TABLE IF NOT EXISTS calendar_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'Meeting',
    start_time TEXT,
    end_time TEXT,
    all_day INTEGER DEFAULT 0,
    location TEXT,
    meeting_link TEXT,
    owner TEXT,
    color TEXT,
    related_to_type TEXT,
    related_to_id INTEGER,
    related_to_name TEXT,
    attendees TEXT DEFAULT '[]'
  );

  -- Emails table
  CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL,
    body TEXT,
    from_address TEXT,
    to_addresses TEXT,
    cc_addresses TEXT,
    status TEXT DEFAULT 'Draft',
    sent_at TEXT,
    scheduled_at TEXT,
    opened_at TEXT,
    clicked_at TEXT,
    track_opens INTEGER DEFAULT 1,
    track_clicks INTEGER DEFAULT 1,
    related_to_type TEXT,
    related_to_id INTEGER,
    related_to_name TEXT,
    created_at TEXT
  );

  -- Notifications table
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT,
    read INTEGER DEFAULT 0,
    created_at TEXT,
    related_to_type TEXT,
    related_to_id INTEGER
  );

  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    avatar TEXT,
    role TEXT DEFAULT 'Sales Rep',
    department TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT
  );
`);

// Clear existing data
db.exec(`
  DELETE FROM leads;
  DELETE FROM contacts;
  DELETE FROM accounts;
  DELETE FROM deals;
  DELETE FROM tasks;
  DELETE FROM tickets;
  DELETE FROM campaigns;
  DELETE FROM notifications;
  DELETE FROM users;
  DELETE FROM calendar_events;
  DELETE FROM emails;
`);

// Seed Users
const insertUser = db.prepare(`
  INSERT INTO users (first_name, last_name, email, avatar, role, department, is_active, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const users = [
  ['Sarah', 'Jenkins', 'sarah.jenkins@zenith.com', 'https://randomuser.me/api/portraits/women/1.jpg', 'Sales Manager', 'Sales', 1, '2024-01-15'],
  ['Michael', 'Chen', 'michael.chen@zenith.com', 'https://randomuser.me/api/portraits/men/2.jpg', 'Sales Rep', 'Sales', 1, '2024-02-01'],
  ['Emily', 'Rodriguez', 'emily.rodriguez@zenith.com', 'https://randomuser.me/api/portraits/women/3.jpg', 'Marketing', 'Marketing', 1, '2024-01-20'],
  ['David', 'Kim', 'david.kim@zenith.com', 'https://randomuser.me/api/portraits/men/4.jpg', 'Support', 'Customer Success', 1, '2024-03-10'],
  ['Alex', 'Thompson', 'alex.thompson@zenith.com', 'https://randomuser.me/api/portraits/men/5.jpg', 'Admin', 'IT', 1, '2024-01-01'],
];

for (const user of users) {
  insertUser.run(...user);
}

// Seed Leads
const insertLead = db.prepare(`
  INSERT INTO leads (first_name, last_name, company, email, phone, mobile, status, source, score, last_active, avatar, owner, lead_owner, created_at, created_by, industry, job_title, budget, tags, lead_category, account_type)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const leads = [
  ['Alice', 'Freeman', 'Quantum Solutions', 'alice@quantum.io', '+1 555-0101', '+1 555-0111', 'New', 'Website', 85, '2m ago', 'https://randomuser.me/api/portraits/women/10.jpg', 'Sarah Jenkins', 'Sarah Jenkins', '2024-12-01', 'Sarah Jenkins', 'Technology', 'VP of Engineering', 75000, '[]', 'Hot', 'Prospect'],
  ['Bob', 'Smith', 'Design Co.', 'bob@design.co', '+1 555-0102', '+1 555-0112', 'Contacted', 'Referral', 62, '1h ago', 'https://randomuser.me/api/portraits/men/11.jpg', 'Michael Chen', 'Michael Chen', '2024-11-28', 'Michael Chen', 'Creative', 'Creative Director', 25000, '[]', 'Warm', 'Prospect'],
  ['Charlie', 'Davis', 'FinTech Plus', 'c.davis@fintech.com', '+1 555-0103', '+1 555-0113', 'Qualified', 'LinkedIn', 92, '3h ago', 'https://randomuser.me/api/portraits/men/12.jpg', 'Sarah Jenkins', 'Sarah Jenkins', '2024-11-25', 'Sarah Jenkins', 'Finance', 'CTO', 150000, '["Enterprise", "Hot Lead"]', 'Hot', 'Customer'],
  ['Diana', 'Prince', 'Amazone Corp', 'diana@amazone.com', '+1 555-0104', '+1 555-0114', 'Lost', 'Trade Show', 24, '2d ago', 'https://randomuser.me/api/portraits/women/13.jpg', 'Michael Chen', 'Michael Chen', '2024-11-20', 'Michael Chen', 'Retail', 'Procurement Manager', null, '[]', 'Cold', 'Prospect'],
  ['Evan', 'Wright', 'Wright Logic', 'evan@wright.net', '+1 555-0105', '+1 555-0115', 'New', 'Website', 78, '5m ago', 'https://randomuser.me/api/portraits/men/14.jpg', 'Sarah Jenkins', 'Sarah Jenkins', '2024-12-05', 'Sarah Jenkins', 'Technology', 'Product Manager', 45000, '[]', 'Warm', 'Prospect'],
  ['Fiona', 'Garcia', 'Health First', 'fiona@healthfirst.org', '+1 555-0106', '+1 555-0116', 'Contacted', 'Cold Call', 71, '30m ago', 'https://randomuser.me/api/portraits/women/15.jpg', 'Michael Chen', 'Michael Chen', '2024-12-03', 'Michael Chen', 'Healthcare', 'Operations Director', 60000, '[]', 'Warm', 'Prospect'],
  ['George', 'Martinez', 'EduTech Inc', 'george@edutech.com', '+1 555-0107', '+1 555-0117', 'Qualified', 'Referral', 88, '1d ago', 'https://randomuser.me/api/portraits/men/16.jpg', 'Sarah Jenkins', 'Sarah Jenkins', '2024-11-30', 'Sarah Jenkins', 'Education', 'CEO', 120000, '["Enterprise"]', 'Hot', 'Customer'],
  ['Hannah', 'Lee', 'Green Energy Co', 'hannah@greenenergy.com', '+1 555-0108', '+1 555-0118', 'Proposal', 'Email Campaign', 55, '4h ago', 'https://randomuser.me/api/portraits/women/17.jpg', 'Michael Chen', 'Michael Chen', '2024-12-06', 'Michael Chen', 'Energy', 'Sustainability Manager', 35000, '[]', 'Warm', 'Prospect'],
];

for (const lead of leads) {
  insertLead.run(...lead);
}

// Seed Accounts
const insertAccount = db.prepare(`
  INSERT INTO accounts (name, industry, website, revenue, employees, location, health_score, logo, type, status, phone, owner, account_owner, created_at, created_by, rating, account_type, territory)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const accounts = [
  ['TechFlow Inc.', 'Software', 'techflow.io', 5000000, 120, 'San Francisco, CA', 92, 'https://ui-avatars.com/api/?name=TF&background=4f46e5&color=fff', 'Customer', 'Active', '+1 555-2001', 'Sarah Jenkins', 'Sarah Jenkins', '2024-01-15', 'Sarah Jenkins', 'Hot', 'Customer', 'West'],
  ['Global Dynamics', 'Manufacturing', 'globaldynamics.com', 12000000, 450, 'Chicago, IL', 78, 'https://ui-avatars.com/api/?name=GD&background=059669&color=fff', 'Customer', 'Active', '+1 555-2002', 'Michael Chen', 'Michael Chen', '2024-02-20', 'Michael Chen', 'Active', 'Customer', 'Midwest'],
  ['SecureNet', 'Cybersecurity', 'securenet.io', 2500000, 50, 'Austin, TX', 88, 'https://ui-avatars.com/api/?name=SN&background=dc2626&color=fff', 'Prospect', 'Active', '+1 555-2003', 'Sarah Jenkins', 'Sarah Jenkins', '2024-03-10', 'Sarah Jenkins', 'Warm', 'Prospect', 'South'],
  ['Alpha Wave', 'Consulting', 'alphawave.net', 800000, 15, 'New York, NY', 65, 'https://ui-avatars.com/api/?name=AW&background=7c3aed&color=fff', 'Customer', 'Active', '+1 555-2004', 'Michael Chen', 'Michael Chen', '2024-04-05', 'Michael Chen', 'Active', 'Customer', 'East'],
  ['NextGen Systems', 'Hardware', 'nextgen.tech', 7500000, 200, 'Boston, MA', 95, 'https://ui-avatars.com/api/?name=NG&background=0891b2&color=fff', 'Customer', 'Active', '+1 555-2005', 'Sarah Jenkins', 'Sarah Jenkins', '2024-01-25', 'Sarah Jenkins', 'Hot', 'Customer', 'East'],
  ['Innovate Labs', 'Research', 'innovate.io', 3200000, 80, 'Seattle, WA', 71, 'https://ui-avatars.com/api/?name=IL&background=ea580c&color=fff', 'Prospect', 'Active', '+1 555-2006', 'Michael Chen', 'Michael Chen', '2024-05-15', 'Michael Chen', 'Warm', 'Prospect', 'West'],
  ['CloudPeak', 'Cloud Services', 'cloudpeak.com', 9000000, 300, 'Denver, CO', 45, 'https://ui-avatars.com/api/?name=CP&background=0284c7&color=fff', 'Customer', 'Churned', '+1 555-2007', 'Sarah Jenkins', 'Sarah Jenkins', '2023-11-20', 'Sarah Jenkins', 'Market Failed', 'Customer', 'West'],
  ['DataVault', 'Data Storage', 'datavault.io', 4500000, 95, 'Portland, OR', 82, 'https://ui-avatars.com/api/?name=DV&background=4338ca&color=fff', 'Customer', 'Active', '+1 555-2008', 'Michael Chen', 'Michael Chen', '2024-06-01', 'Michael Chen', 'Active', 'Customer', 'West'],
];

for (const account of accounts) {
  insertAccount.run(...account);
}

// Seed Contacts
const insertContact = db.prepare(`
  INSERT INTO contacts (salutation, first_name, last_name, full_name, email, phone, mobile, job_title, department, account_id, account_name, type, status, avatar, owner, created_at, created_by, last_contacted, lead_source)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const contacts = [
  ['Mr.', 'John', 'Anderson', 'John Anderson', 'john.anderson@techflow.io', '+1 555-1001', '+1 555-1101', 'CEO', 'Executive', 1, 'TechFlow Inc.', 'Customer', 'Active', 'https://randomuser.me/api/portraits/men/20.jpg', 'Sarah Jenkins', '2024-06-15', 'Sarah Jenkins', '2024-12-05', 'Website'],
  ['Ms.', 'Maria', 'Santos', 'Maria Santos', 'maria.santos@techflow.io', '+1 555-1002', '+1 555-1102', 'VP of Sales', 'Sales', 1, 'TechFlow Inc.', 'Customer', 'Active', 'https://randomuser.me/api/portraits/women/21.jpg', 'Sarah Jenkins', '2024-06-20', 'Sarah Jenkins', '2024-12-08', 'Referral'],
  ['Mr.', 'Robert', 'Johnson', 'Robert Johnson', 'robert@globaldynamics.com', '+1 555-1003', '+1 555-1103', 'COO', 'Operations', 2, 'Global Dynamics', 'Customer', 'Active', 'https://randomuser.me/api/portraits/men/22.jpg', 'Michael Chen', '2024-05-10', 'Michael Chen', '2024-12-01', 'Trade Show'],
  ['Ms.', 'Jennifer', 'Williams', 'Jennifer Williams', 'jennifer@securenet.io', '+1 555-1004', '+1 555-1104', 'CTO', 'Technology', 3, 'SecureNet', 'Prospect', 'Active', 'https://randomuser.me/api/portraits/women/23.jpg', 'Sarah Jenkins', '2024-08-01', 'Sarah Jenkins', '2024-12-03', 'LinkedIn'],
  ['Mr.', 'James', 'Brown', 'James Brown', 'james@alphawave.net', '+1 555-1005', '+1 555-1105', 'Founder', 'Executive', 4, 'Alpha Wave', 'Customer', 'Active', 'https://randomuser.me/api/portraits/men/24.jpg', 'Michael Chen', '2024-07-15', 'Michael Chen', '2024-12-07', 'Referral'],
  ['Ms.', 'Lisa', 'Taylor', 'Lisa Taylor', 'lisa@nextgen.tech', '+1 555-1006', '+1 555-1106', 'VP of Engineering', 'Engineering', 5, 'NextGen Systems', 'Customer', 'Active', 'https://randomuser.me/api/portraits/women/25.jpg', 'Sarah Jenkins', '2024-04-20', 'Sarah Jenkins', '2024-12-09', 'Website'],
  ['Mr.', 'David', 'Miller', 'David Miller', 'david.miller@innovate.io', '+1 555-1007', '+1 555-1107', 'Product Director', 'Product', 6, 'Innovate Labs', 'Prospect', 'Active', 'https://randomuser.me/api/portraits/men/26.jpg', 'Michael Chen', '2024-09-05', 'Michael Chen', '2024-11-28', 'Cold Call'],
  ['Ms.', 'Sarah', 'Davis', 'Sarah Davis', 'sarah.davis@cloudpeak.com', '+1 555-1008', '+1 555-1108', 'Director of IT', 'IT', 7, 'CloudPeak', 'Customer', 'Inactive', 'https://randomuser.me/api/portraits/women/27.jpg', 'Sarah Jenkins', '2024-03-10', 'Sarah Jenkins', '2024-10-15', 'Email Campaign'],
];

for (const contact of contacts) {
  insertContact.run(...contact);
}

// Seed Deals
const insertDeal = db.prepare(`
  INSERT INTO deals (title, deal_name, company, account_id, account_name, contact_name, value, amount, stage, probability, owner, deal_owner, closing_date, created_at, created_by, forecast, type, type_of_order, lead_source, lost_reason, territory)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const deals = [
  ['Enterprise License', 'Enterprise License - TechFlow', 'TechFlow Inc.', 1, 'TechFlow Inc.', 'John Anderson', 45000, 45000, 'Qualification', 20, 'Sarah Jenkins', 'Sarah Jenkins', 'Dec 24, 2024', '2024-11-01', 'Sarah Jenkins', 'Pipeline', 'New Business', 'New', 'Website', null, 'West'],
  ['Q4 Marketing Audit', 'Q4 Marketing Audit - Global Dynamics', 'Global Dynamics', 2, 'Global Dynamics', 'Robert Johnson', 12000, 12000, 'Qualification', 30, 'Michael Chen', 'Michael Chen', 'Dec 28, 2024', '2024-11-15', 'Michael Chen', 'Pipeline', 'New Business', 'New', 'Referral', null, 'Midwest'],
  ['Security Suite Upgrade', 'Security Suite Upgrade - SecureNet', 'SecureNet', 3, 'SecureNet', 'Jennifer Williams', 85000, 85000, 'Proposal', 60, 'Sarah Jenkins', 'Sarah Jenkins', 'Jan 15, 2025', '2024-10-20', 'Sarah Jenkins', 'Best Case', 'Existing Business', 'Upgrade', 'LinkedIn', null, 'South'],
  ['Consulting Retainer', 'Consulting Retainer - Alpha Wave', 'Alpha Wave', 4, 'Alpha Wave', 'James Brown', 24000, 24000, 'Negotiation', 85, 'Michael Chen', 'Michael Chen', 'Dec 30, 2024', '2024-09-15', 'Michael Chen', 'Commit', 'Renewal', 'Renewal', 'Referral', null, 'East'],
  ['Cloud Migration Project', 'Cloud Migration - NextGen', 'NextGen Systems', 5, 'NextGen Systems', 'Lisa Taylor', 120000, 120000, 'Closed Won', 100, 'Sarah Jenkins', 'Sarah Jenkins', 'Dec 12, 2024', '2024-08-01', 'Sarah Jenkins', 'Commit', 'New Business', 'New', 'Trade Show', null, 'East'],
  ['Annual Support Contract', 'Support Contract - DataVault', 'DataVault', 8, 'DataVault', 'Sarah Davis', 36000, 36000, 'Discovery', 40, 'Michael Chen', 'Michael Chen', 'Jan 20, 2025', '2024-11-20', 'Michael Chen', 'Pipeline', 'Renewal', 'Renewal', 'Email Campaign', null, 'West'],
  ['Platform Integration', 'Platform Integration - Innovate Labs', 'Innovate Labs', 6, 'Innovate Labs', 'David Miller', 65000, 65000, 'Proposal', 55, 'Sarah Jenkins', 'Sarah Jenkins', 'Feb 01, 2025', '2024-10-10', 'Sarah Jenkins', 'Best Case', 'New Business', 'New', 'Cold Call', null, 'West'],
  ['Data Analytics Package', 'Analytics Package - TechFlow', 'TechFlow Inc.', 1, 'TechFlow Inc.', 'Maria Santos', 28000, 28000, 'Negotiation', 75, 'Sarah Jenkins', 'Sarah Jenkins', 'Dec 20, 2024', '2024-10-25', 'Sarah Jenkins', 'Commit', 'Existing Business', 'Upsell', 'Website', null, 'West'],
  ['Training Program', 'Training Program - Global Dynamics', 'Global Dynamics', 2, 'Global Dynamics', 'Robert Johnson', 8500, 8500, 'Closed Won', 100, 'Michael Chen', 'Michael Chen', 'Dec 05, 2024', '2024-10-01', 'Michael Chen', 'Commit', 'Existing Business', 'Cross-sell', 'Referral', null, 'Midwest'],
  ['Expansion Deal', 'Expansion Deal - CloudPeak', 'CloudPeak', 7, 'CloudPeak', 'Sarah Davis', 55000, 55000, 'Closed Lost', 0, 'Sarah Jenkins', 'Sarah Jenkins', 'Nov 30, 2024', '2024-09-01', 'Sarah Jenkins', 'Omitted', 'Existing Business', 'Upgrade', 'Partner', 'Lost to competitor', 'West'],
];

for (const deal of deals) {
  insertDeal.run(...deal);
}

// Seed Tasks
const insertTask = db.prepare(`
  INSERT INTO tasks (title, description, type, status, priority, due_date, due_time, related_to_type, related_to_id, related_to_name, assigned_to, created_by, created_at, completed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const today = new Date().toISOString().split('T')[0];
const tasks = [
  ['Follow up with TechFlow on proposal', null, 'Follow-up', 'Not Started', 'High', today, '10:00', 'Deal', 1, 'Enterprise License', 'Sarah Jenkins', 'Sarah Jenkins', '2024-12-08', null],
  ['Send contract to Alpha Wave', null, 'Email', 'In Progress', 'Urgent', today, '14:00', 'Deal', 4, 'Consulting Retainer', 'Michael Chen', 'Sarah Jenkins', '2024-12-07', null],
  ['Schedule demo with SecureNet', null, 'Demo', 'Not Started', 'Normal', '2024-12-15', null, 'Contact', 4, 'Jennifer Williams', 'Sarah Jenkins', 'Michael Chen', '2024-12-06', null],
  ['Review Q4 pipeline report', null, 'Task', 'Completed', 'Normal', '2024-12-05', null, null, null, null, 'Sarah Jenkins', 'Sarah Jenkins', '2024-12-01', '2024-12-05'],
  ['Call with new lead - Quantum Solutions', null, 'Call', 'Not Started', 'High', today, '11:00', 'Lead', 1, 'Alice Freeman', 'Sarah Jenkins', 'Sarah Jenkins', '2024-12-08', null],
  ['Prepare quarterly business review', null, 'Task', 'In Progress', 'High', '2024-12-18', null, null, null, null, 'Michael Chen', 'Sarah Jenkins', '2024-12-05', null],
  ['Update CRM with new contact info', null, 'Task', 'Not Started', 'Low', '2024-12-20', null, 'Account', 2, 'Global Dynamics', 'Michael Chen', 'Michael Chen', '2024-12-07', null],
  ['Send holiday greetings to top accounts', null, 'Email', 'Not Started', 'Normal', '2024-12-22', null, null, null, null, 'Sarah Jenkins', 'Sarah Jenkins', '2024-12-08', null],
];

for (const task of tasks) {
  insertTask.run(...task);
}

// Seed Tickets
const insertTicket = db.prepare(`
  INSERT INTO tickets (ticket_number, subject, description, status, priority, type, category, contact_id, contact_name, contact_email, account_id, account_name, assigned_to, created_at, updated_at, resolved_at, closed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const tickets = [
  ['TKT-001234', 'Unable to access dashboard', 'User reports that the dashboard is not loading after login.', 'In Progress', 'High', 'Problem', 'Technical', 1, 'John Anderson', 'john.anderson@techflow.io', 1, 'TechFlow Inc.', 'David Kim', '2024-12-08T09:30:00', '2024-12-08T14:20:00', null, null],
  ['TKT-001235', 'Feature request: Export to PDF', 'Would like to be able to export reports directly to PDF format.', 'Open', 'Low', 'Feature Request', 'Product', 2, 'Maria Santos', 'maria.santos@techflow.io', 1, 'TechFlow Inc.', 'David Kim', '2024-12-07T11:15:00', '2024-12-07T11:15:00', null, null],
  ['TKT-001236', 'Billing discrepancy', 'Invoice shows incorrect amount for November.', 'Pending', 'Medium', 'Question', 'Billing', 3, 'Robert Johnson', 'robert@globaldynamics.com', 2, 'Global Dynamics', 'David Kim', '2024-12-06T16:45:00', '2024-12-08T10:00:00', null, null],
  ['TKT-001237', 'Integration with Slack not working', 'Slack notifications stopped working after last update.', 'Resolved', 'High', 'Bug', 'Integration', 6, 'Lisa Taylor', 'lisa@nextgen.tech', 5, 'NextGen Systems', 'David Kim', '2024-12-04T08:20:00', '2024-12-06T15:30:00', '2024-12-06T15:30:00', null],
  ['TKT-001238', 'Need help with API setup', 'Requesting assistance with REST API configuration.', 'Open', 'Medium', 'Question', 'Technical', 4, 'Jennifer Williams', 'jennifer@securenet.io', 3, 'SecureNet', null, '2024-12-08T13:00:00', '2024-12-08T13:00:00', null, null],
  ['TKT-001239', 'Account upgrade request', 'Would like to upgrade from Standard to Professional plan.', 'Closed', 'Low', 'Task', 'Account', 5, 'James Brown', 'james@alphawave.net', 4, 'Alpha Wave', 'David Kim', '2024-12-02T10:00:00', '2024-12-03T09:30:00', '2024-12-03T09:00:00', '2024-12-03T09:30:00'],
];

for (const ticket of tickets) {
  insertTicket.run(...ticket);
}

// Seed Campaigns
const insertCampaign = db.prepare(`
  INSERT INTO campaigns (name, type, status, start_date, end_date, budget, actual_cost, expected_revenue, actual_revenue, owner, created_at, target_audience, goals, metrics)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const campaigns = [
  ['Q4 Product Launch', 'Email', 'Active', '2024-10-01', '2024-12-31', 25000, 18500, 150000, 95000, 'Emily Rodriguez', '2024-09-15', 'Enterprise IT Directors', 'Generate 500 MQLs', '{"sent": 5000, "delivered": 4850, "opened": 2180, "clicked": 890, "converted": 45, "leads": 320}'],
  ['Winter Webinar Series', 'Webinar', 'Active', '2024-11-15', '2025-01-31', 15000, 8200, 75000, null, 'Emily Rodriguez', '2024-10-20', 'SMB Decision Makers', '1000 registrations, 50% attendance', '{"sent": 8000, "delivered": 7800, "opened": 3900, "clicked": 1560, "converted": 78, "leads": 450}'],
  ['LinkedIn Lead Gen', 'Social Media', 'Active', '2024-09-01', '2024-12-31', 20000, 16800, 100000, 62000, 'Emily Rodriguez', '2024-08-15', 'C-Level Executives', 'Generate 200 SQLs', '{"sent": 15000, "delivered": 14500, "opened": 5800, "clicked": 2320, "converted": 116, "leads": 580}'],
  ['Trade Show - TechExpo 2024', 'Trade Show', 'Completed', '2024-09-15', '2024-09-18', 50000, 48500, 200000, 185000, 'Emily Rodriguez', '2024-06-01', 'Industry Professionals', '500 booth visits, 100 demos', '{"leads": 320, "converted": 28}'],
  ['Customer Referral Program', 'Referral Program', 'Active', '2024-01-01', '2024-12-31', 30000, 22000, 250000, 180000, 'Sarah Jenkins', '2023-12-01', 'Existing Customers', '50 referrals per quarter', '{"leads": 145, "converted": 42}'],
  ['Holiday Promotion', 'Email', 'Planning', '2024-12-15', '2024-12-31', 10000, null, null, null, 'Emily Rodriguez', '2024-11-20', 'All Prospects', '20% discount uptake', '{}'],
];

for (const campaign of campaigns) {
  insertCampaign.run(...campaign);
}

// Seed Notifications
const insertNotification = db.prepare(`
  INSERT INTO notifications (type, title, message, read, created_at, related_to_type, related_to_id)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const notifications = [
  ['success', 'Deal Won!', 'Cloud Migration Project with NextGen Systems has been closed.', 0, '2024-12-08T14:30:00', 'Deal', 5],
  ['task', 'Task Due Soon', 'Follow up with TechFlow on proposal is due in 2 hours.', 0, '2024-12-08T08:00:00', 'Task', 1],
  ['info', 'New Lead Assigned', 'Alice Freeman from Quantum Solutions has been assigned to you.', 1, '2024-12-07T16:45:00', 'Lead', 1],
  ['warning', 'SLA Warning', 'Ticket TKT-001234 response SLA due in 1 hour.', 0, '2024-12-08T10:30:00', 'Ticket', 1],
  ['mention', 'You were mentioned', 'Sarah Jenkins mentioned you in a comment on Deal: Consulting Retainer.', 1, '2024-12-07T11:20:00', 'Deal', 4],
  ['reminder', 'Meeting Reminder', 'TechFlow Enterprise Demo starts in 30 minutes.', 1, '2024-12-08T09:30:00', 'Event', 1],
];

for (const notification of notifications) {
  insertNotification.run(...notification);
}

// Seed Calendar Events
const insertCalendarEvent = db.prepare(`
  INSERT INTO calendar_events (title, description, type, start_time, end_time, all_day, location, meeting_link, owner, color, related_to_type, related_to_id, related_to_name, attendees)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const calendarEvents = [
  ['TechFlow Enterprise Demo', 'Product demonstration for TechFlow enterprise license', 'Demo', '2024-12-10T10:00:00', '2024-12-10T11:30:00', 0, 'Zoom Meeting', 'https://zoom.us/j/123456789', 'Sarah Jenkins', '#4f46e5', 'Deal', 1, 'Enterprise License', '[{"id":"1","name":"John Anderson","email":"john.anderson@techflow.io","status":"Accepted"},{"id":"2","name":"Sarah Jenkins","email":"sarah.jenkins@zenith.com","status":"Accepted"}]'],
  ['Team Standup', 'Daily sales team standup', 'Meeting', '2024-12-10T09:00:00', '2024-12-10T09:15:00', 0, 'Conference Room A', null, 'Sarah Jenkins', '#059669', null, null, null, '[]'],
  ['SecureNet Follow-up Call', 'Follow up on security suite proposal', 'Call', '2024-12-11T14:00:00', '2024-12-11T14:30:00', 0, null, 'https://meet.google.com/abc-defg-hij', 'Sarah Jenkins', '#0891b2', 'Deal', 3, 'Security Suite Upgrade', '[{"id":"4","name":"Jennifer Williams","email":"jennifer@securenet.io","status":"Pending"}]'],
  ['Q4 Pipeline Review', 'Quarterly pipeline review with management', 'Meeting', '2024-12-12T15:00:00', '2024-12-12T16:30:00', 0, 'Board Room', null, 'Sarah Jenkins', '#7c3aed', null, null, null, '[{"id":"1","name":"Sarah Jenkins","email":"sarah.jenkins@zenith.com","status":"Accepted"},{"id":"2","name":"Michael Chen","email":"michael.chen@zenith.com","status":"Accepted"}]'],
  ['Alpha Wave Contract Signing', 'Final contract signing for consulting retainer', 'Meeting', '2024-12-13T11:00:00', '2024-12-13T12:00:00', 0, 'Alpha Wave Office, NYC', null, 'Michael Chen', '#ea580c', 'Deal', 4, 'Consulting Retainer', '[{"id":"5","name":"James Brown","email":"james@alphawave.net","status":"Accepted"}]'],
  ['Holiday Party Planning', 'Team holiday party planning meeting', 'Meeting', '2024-12-16T16:00:00', '2024-12-16T17:00:00', 0, 'Lounge', null, 'Emily Rodriguez', '#dc2626', null, null, null, '[]'],
  ['Webinar: Winter Series Kickoff', 'First webinar of Winter Series', 'Webinar', '2024-12-18T13:00:00', '2024-12-18T14:00:00', 0, 'Online', 'https://webinar.zenith.com/winter-series', 'Emily Rodriguez', '#7c3aed', 'Campaign', 2, 'Winter Webinar Series', '[]'],
  ['Year-End Review', 'Annual performance review', 'Meeting', '2024-12-20T10:00:00', '2024-12-20T11:00:00', 0, 'HR Office', null, 'Sarah Jenkins', '#4f46e5', null, null, null, '[]'],
];

for (const event of calendarEvents) {
  insertCalendarEvent.run(...event);
}

// Seed Emails
const insertEmail = db.prepare(`
  INSERT INTO emails (subject, body, from_address, to_addresses, cc_addresses, status, sent_at, scheduled_at, opened_at, clicked_at, track_opens, track_clicks, related_to_type, related_to_id, related_to_name, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const emails = [
  ['Enterprise License Proposal - TechFlow Inc.', 'Dear John,\n\nThank you for your interest in our Enterprise License. I am pleased to present our proposal based on our recent discussions.\n\nThe package includes:\n- Unlimited user access\n- 24/7 premium support\n- Custom integrations\n- Dedicated success manager\n\nPlease find the detailed pricing in the attached document. I would be happy to schedule a call to discuss any questions.\n\nBest regards,\nSarah Jenkins', 'sarah.jenkins@zenith.com', '["john.anderson@techflow.io"]', '["maria.santos@techflow.io"]', 'Sent', '2024-12-05T10:30:00', null, '2024-12-05T14:22:00', '2024-12-05T14:25:00', 1, 1, 'Deal', 1, 'Enterprise License', '2024-12-05T10:00:00'],
  ['Follow-up: Security Suite Discussion', 'Hi Jennifer,\n\nIt was great speaking with you yesterday about your security infrastructure needs. As discussed, our Security Suite offers comprehensive protection with:\n\n- Real-time threat monitoring\n- Automated incident response\n- Compliance reporting\n- Integration with existing tools\n\nI have attached some case studies from similar implementations. Let me know when you would like to schedule the technical demo.\n\nBest,\nSarah', 'sarah.jenkins@zenith.com', '["jennifer@securenet.io"]', null, 'Sent', '2024-12-04T16:45:00', null, '2024-12-05T09:10:00', null, 1, 1, 'Deal', 3, 'Security Suite Upgrade', '2024-12-04T16:00:00'],
  ['Welcome to Zenith CRM!', 'Dear David,\n\nWelcome to Zenith CRM! We are excited to have Innovate Labs on board.\n\nHere are some resources to help you get started:\n- Quick Start Guide\n- Video Tutorials\n- Knowledge Base\n\nYour dedicated success manager, Michael Chen, will reach out shortly to schedule an onboarding call.\n\nBest regards,\nThe Zenith Team', 'support@zenith.com', '["david.miller@innovate.io"]', null, 'Sent', '2024-12-03T11:00:00', null, '2024-12-03T11:45:00', '2024-12-03T11:47:00', 1, 1, 'Contact', 7, 'David Miller', '2024-12-03T10:30:00'],
  ['Meeting Confirmation: Contract Review', 'Hi James,\n\nThis email confirms our meeting scheduled for December 13th at 11:00 AM at your office to finalize the consulting retainer agreement.\n\nPlease let me know if you need to reschedule.\n\nLooking forward to meeting you!\n\nBest,\nMichael Chen', 'michael.chen@zenith.com', '["james@alphawave.net"]', null, 'Sent', '2024-12-06T09:00:00', null, '2024-12-06T09:30:00', null, 1, 1, 'Deal', 4, 'Consulting Retainer', '2024-12-06T08:45:00'],
  ['Q4 Campaign Results Summary', 'Hi Team,\n\nHere is the summary of our Q4 Product Launch campaign results:\n\n- Emails Sent: 5,000\n- Open Rate: 44.9%\n- Click Rate: 18.4%\n- Conversions: 45\n- New Leads: 320\n\nGreat work everyone!\n\nEmily', 'emily.rodriguez@zenith.com', '["team@zenith.com"]', null, 'Sent', '2024-12-07T17:00:00', null, null, null, 0, 0, 'Campaign', 1, 'Q4 Product Launch', '2024-12-07T16:30:00'],
  ['Holiday Promotion Draft', 'Draft for upcoming holiday promotion email...', 'emily.rodriguez@zenith.com', '["prospects@zenith.com"]', null, 'Draft', null, null, null, null, 1, 1, 'Campaign', 6, 'Holiday Promotion', '2024-12-08T14:00:00'],
  ['Reminder: Webinar Registration Open', 'Dear Valued Customer,\n\nDon\'t miss our Winter Webinar Series starting December 18th!\n\nTopics include:\n- 2025 CRM Trends\n- AI-Powered Sales\n- Customer Success Strategies\n\nRegister now to secure your spot.\n\nBest,\nZenith Team', 'marketing@zenith.com', '["all-contacts@zenith.com"]', null, 'Scheduled', null, '2024-12-15T09:00:00', null, null, 1, 1, 'Campaign', 2, 'Winter Webinar Series', '2024-12-08T10:00:00'],
];

for (const email of emails) {
  insertEmail.run(...email);
}

console.log('Database seeded successfully!');
console.log(`Created:`);
console.log(`  - ${users.length} users`);
console.log(`  - ${leads.length} leads`);
console.log(`  - ${accounts.length} accounts`);
console.log(`  - ${contacts.length} contacts`);
console.log(`  - ${deals.length} deals`);
console.log(`  - ${tasks.length} tasks`);
console.log(`  - ${tickets.length} tickets`);
console.log(`  - ${campaigns.length} campaigns`);
console.log(`  - ${notifications.length} notifications`);
console.log(`  - ${calendarEvents.length} calendar events`);
console.log(`  - ${emails.length} emails`);

db.close();
