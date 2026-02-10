-- ============================================================
-- Zenith CRM — Full Schema Migration for Supabase PostgreSQL
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DROP existing tables (reverse dependency order)
-- ============================================================
DROP TABLE IF EXISTS quote_line_items CASCADE;
DROP TABLE IF EXISTS lead_activities CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS carepacks CASCADE;
DROP TABLE IF EXISTS emails CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS sales_entries CASCADE;
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(200) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'salesperson',
    department VARCHAR(100),
    phone VARCHAR(50),
    employee_id VARCHAR(50),
    manager_id UUID,
    is_active BOOLEAN DEFAULT true,
    must_change_password BOOLEAN DEFAULT false,
    monthly_target NUMERIC(15,2),
    last_login TIMESTAMPTZ,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================
-- 2. ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    website VARCHAR(500),
    revenue NUMERIC(15,2),
    employees INTEGER,
    location VARCHAR(255),
    type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    phone VARCHAR(50),
    email VARCHAR(255),
    health_score INTEGER,
    description TEXT,
    owner_id UUID,
    gstin_no VARCHAR(50),
    payment_terms VARCHAR(100),

    -- Additional fields
    account_image VARCHAR(500),
    group_name VARCHAR(255),
    parent_account_id UUID,
    endcustomer_category VARCHAR(100),
    products_selling_to_them TEXT,
    products_they_sell TEXT,
    pan_no VARCHAR(50),
    partner_id UUID,
    lead_category VARCHAR(100),
    new_leads INTEGER DEFAULT 0,
    references_doc VARCHAR(500),
    bank_statement_doc VARCHAR(500),

    -- Contact Information
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_designation VARCHAR(100),
    contact_designation_other VARCHAR(100),

    -- Billing Address
    billing_street TEXT,
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_code VARCHAR(20),
    billing_country VARCHAR(100),

    -- Shipping Address
    shipping_street TEXT,
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_code VARCHAR(20),
    shipping_country VARCHAR(100),

    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================
-- 3. CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    job_title VARCHAR(100),
    department VARCHAR(100),
    account_id UUID,
    type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    preferred_contact VARCHAR(50),
    owner_id UUID,

    -- Contact Image
    image VARCHAR(500),

    -- Description Information
    description TEXT,
    contact_group VARCHAR(100),

    -- Extended Contact Information
    ctsipl_email VARCHAR(255),
    pan VARCHAR(50),
    gstin_no VARCHAR(50),
    product_interested VARCHAR(255),
    product_interested_text TEXT,
    lead_source VARCHAR(100),
    lead_category VARCHAR(100),
    designation VARCHAR(100),
    vendor_name VARCHAR(255),
    partner_id UUID,
    new_leads BOOLEAN DEFAULT false,

    -- Forms Info
    bandwidth_required VARCHAR(255),
    product_configuration TEXT,
    product_details TEXT,
    rental_duration VARCHAR(100),
    product_name_part_number TEXT,
    specifications TEXT,

    -- Mailing Address
    mailing_street TEXT,
    mailing_city VARCHAR(100),
    mailing_state VARCHAR(100),
    mailing_zip VARCHAR(20),
    mailing_country VARCHAR(100),

    -- Other Address
    other_street TEXT,
    other_city VARCHAR(100),
    other_state VARCHAR(100),
    other_zip VARCHAR(20),
    other_country VARCHAR(100),

    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================
-- 4. PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    base_price NUMERIC(15,2),
    commission_rate NUMERIC(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================
-- 5. PARTNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    gst_number VARCHAR(50),
    pan_number VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    partner_type VARCHAR(50),
    vertical VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    tier VARCHAR(50) DEFAULT 'new',
    assigned_to UUID,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================
-- 6. LEADS
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(100),
    stage VARCHAR(50) DEFAULT 'New',
    priority VARCHAR(20) DEFAULT 'Medium',
    estimated_value NUMERIC(15,2),
    product_interest VARCHAR(255),
    assigned_to UUID,
    partner_id UUID,
    notes TEXT,
    expected_close_date DATE,
    lost_reason TEXT,
    won_sale_id UUID,
    next_follow_up DATE,

    -- Lead Information (Extended)
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    mobile VARCHAR(50),
    mobile_alternate VARCHAR(50),
    phone_alternate VARCHAR(50),
    campaign_source VARCHAR(100),
    website VARCHAR(500),
    account_type VARCHAR(50),
    lead_category VARCHAR(50),

    -- Order Info
    product_list VARCHAR(255),
    type_of_order VARCHAR(100),
    billing_delivery_date DATE,
    order_product_details TEXT,
    payment VARCHAR(100),
    po_number_or_mail_confirmation VARCHAR(100),
    brand VARCHAR(100),
    orc_amount NUMERIC(15,2),
    product_warranty VARCHAR(100),
    ship_by VARCHAR(100),
    special_instruction TEXT,
    third_party_delivery_address TEXT,
    billing_company VARCHAR(255),

    -- Forms Info
    enter_product_details TEXT,
    rental_duration VARCHAR(100),
    product_configuration TEXT,
    bandwidth_required VARCHAR(100),
    product_name_and_part_number VARCHAR(255),
    specifications TEXT,
    form_name VARCHAR(100),

    -- Billing Address
    billing_street VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_country VARCHAR(100),
    billing_zip_code VARCHAR(20),

    -- Description Info
    description TEXT,
    lead_time VARCHAR(100),
    product_name VARCHAR(255),
    receiver_mobile_number VARCHAR(50),
    subject VARCHAR(500),
    sender_landline_no VARCHAR(50),
    sender_landline_no_alt VARCHAR(50),
    call_duration VARCHAR(50),
    lead_type VARCHAR(50),
    query_id VARCHAR(100),
    mcat_name VARCHAR(100),

    -- Lead Image
    lead_image TEXT,

    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================
-- 7. DEALS
-- ============================================================
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    account_id UUID,
    value NUMERIC(15,2),
    stage VARCHAR(50) DEFAULT 'Qualification',
    probability INTEGER,
    owner_id UUID,
    closing_date DATE,
    description TEXT,
    contact_id UUID,
    next_step VARCHAR(500),
    forecast VARCHAR(50),
    type VARCHAR(50),
    lead_source VARCHAR(100),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================
-- Add comprehensive fields to deals table
-- ============================================================

-- Deal Information (5 new fields)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS sdp_no VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS sales_created_by_rm UUID;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS lead_category VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS product_manager VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS expected_revenue NUMERIC(15,2);

-- Forms Info (6 fields)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS bandwidth_required VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS product_configuration TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS rental_duration VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS enter_product_details TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS product_name_and_part_number VARCHAR(500);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS specifications TEXT;

-- Other Info (16 fields)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS show_subform BOOLEAN DEFAULT false;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS billing_delivery_date DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS description_of_product TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS payment VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS po_number_or_mail_confirmation VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS integration_requirement VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS brand VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS orc_amount NUMERIC(15,2);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS product_warranty VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ship_by VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS special_instruction TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS third_party_delivery_address TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS billing_company VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS email_subject VARCHAR(500);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS additional_information TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS da VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- Billing Address (5 fields)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS billing_street TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS billing_state VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS billing_country VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS billing_city VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS billing_zip_code VARCHAR(20);

-- ============================================================
-- Create deal_line_items table for Product Info
-- ============================================================

CREATE TABLE IF NOT EXISTS deal_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

    -- Product Info Fields
    product_category VARCHAR(100),
    product_sub_category VARCHAR(100),
    part_number VARCHAR(255),
    description TEXT,
    quantity INTEGER DEFAULT 1,
    pricing NUMERIC(15,2),
    total_price NUMERIC(15,2),
    warehouse VARCHAR(100),
    total_rental NUMERIC(15,2),
    rental_per_unit NUMERIC(15,2),
    sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_deal_line_items_deal_id ON deal_line_items(deal_id);

-- ============================================================
-- 8. SALES ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS sales_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES partners(id),
    product_id UUID NOT NULL REFERENCES products(id),
    salesperson_id UUID NOT NULL REFERENCES users(id),
    customer_name VARCHAR(255),
    quantity INTEGER DEFAULT 1,
    amount NUMERIC(15,2) NOT NULL,
    po_number VARCHAR(100),
    invoice_no VARCHAR(100),
    payment_status VARCHAR(50) DEFAULT 'pending',
    commission_amount NUMERIC(15,2) DEFAULT 0,
    sale_date DATE NOT NULL,
    location_id UUID,
    vertical_id UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================
-- 9. LEAD ACTIVITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id),
    activity_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 10. QUOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_number VARCHAR(50) UNIQUE,
    lead_id UUID REFERENCES leads(id),
    partner_id UUID REFERENCES partners(id),
    customer_name VARCHAR(255) NOT NULL,
    valid_until DATE,
    subtotal NUMERIC(15,2) DEFAULT 0,
    tax_rate NUMERIC(5,2) DEFAULT 18,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft',
    terms TEXT,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================
-- 11. QUOTE LINE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS quote_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id),
    product_id UUID REFERENCES products(id),
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC(15,2) NOT NULL,
    discount_pct NUMERIC(5,2) DEFAULT 0,
    line_total NUMERIC(15,2) NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- ============================================================
-- 12. TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'Medium',
    due_date DATE,
    due_time TIME,
    assigned_to UUID,
    created_by UUID,
    completed_at TIMESTAMPTZ,
    related_to_type VARCHAR(50),
    related_to_id UUID,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================
-- 13. CALENDAR EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    all_day BOOLEAN DEFAULT false,
    location VARCHAR(500),
    meeting_link VARCHAR(500),
    owner_id UUID,
    color VARCHAR(20),
    related_to_type VARCHAR(50),
    related_to_id UUID,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================
-- 14. EMAIL TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    body TEXT,
    category VARCHAR(100),
    owner_id UUID,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================
-- 15. EMAILS
-- ============================================================
CREATE TABLE IF NOT EXISTS emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject VARCHAR(500) NOT NULL,
    body TEXT,
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    cc TEXT,
    bcc TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    sent_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    related_to_type VARCHAR(50),
    related_to_id UUID,
    template_id UUID REFERENCES email_templates(id),
    owner_id UUID,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================
-- 16. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 17. CAREPACKS
-- ============================================================
CREATE TABLE IF NOT EXISTS carepacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID,
    product_type VARCHAR(100),
    serial_number VARCHAR(100),
    carepack_sku VARCHAR(100),
    customer_name VARCHAR(255),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DISABLE ROW LEVEL SECURITY (app handles auth via JWT)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE carepacks ENABLE ROW LEVEL SECURITY;

-- Allow full access for authenticated and service_role
-- (Our backend connects as postgres which bypasses RLS,
--  but we add permissive policies just in case)
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT unnest(ARRAY[
            'users','accounts','contacts','products','partners',
            'leads','deals','sales_entries','lead_activities',
            'quotes','quote_line_items','tasks','calendar_events',
            'email_templates','emails','notifications','carepacks'
        ])
    LOOP
        EXECUTE format(
            'CREATE POLICY "Allow all for postgres" ON %I FOR ALL USING (true) WITH CHECK (true)',
            tbl
        );
    END LOOP;
END $$;

-- ============================================================
-- SEED: Default Admin User
-- Email: admin@gmail.com
-- Password: 1 (bcrypt hash)
-- ============================================================
INSERT INTO users (email, password_hash, name, role, is_active)
VALUES (
    'admin@gmail.com',
    '$2b$12$vxrgRbxfyQLyzpaJUOFnsOwnuiljqpapsBgHMRLavN0bqsxo4Pwiq',
    'Admin',
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- Add dashboard_preferences column for customizable dashboards
-- ============================================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS dashboard_preferences JSONB DEFAULT '{
  "widgets": [],
  "lastModified": null
}'::jsonb;

-- Add index for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_users_dashboard_preferences
ON users USING gin(dashboard_preferences);

COMMENT ON COLUMN users.dashboard_preferences IS
'Stores user dashboard layout: widget IDs, order, visibility, and grid positions';

-- ============================================================
-- Add view_access column (if not already added from previous migrations)
-- ============================================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS view_access VARCHAR(50) NOT NULL DEFAULT 'presales';

ALTER TABLE users DROP CONSTRAINT IF EXISTS check_view_access;

ALTER TABLE users
ADD CONSTRAINT check_view_access
CHECK (view_access IN ('presales', 'postsales', 'both'));

COMMENT ON COLUMN users.view_access IS
'Determines which view the user has access to: presales, postsales, or both';

-- ============================================================
-- DONE! All 17 tables created + admin user seeded + dashboard customization.
-- ============================================================
