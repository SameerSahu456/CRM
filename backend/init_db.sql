-- Comprint CRM Database Schema
-- Drop old tables and create new schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop old CRM tables
DROP TABLE IF EXISTS account_activities CASCADE;
DROP TABLE IF EXISTS account_documents CASCADE;
DROP TABLE IF EXISTS account_notes CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS emails CASCADE;
DROP TABLE IF EXISTS lead_activities CASCADE;
DROP TABLE IF EXISTS lead_calls CASCADE;
DROP TABLE IF EXISTS lead_notes CASCADE;
DROP TABLE IF EXISTS lead_tasks CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;

-- Drop new tables if they exist (for re-runs)
DROP TABLE IF EXISTS quote_line_items CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS sales_entries CASCADE;
DROP TABLE IF EXISTS lead_activities CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS carepacks CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS master_categories CASCADE;
DROP TABLE IF EXISTS master_oems CASCADE;
DROP TABLE IF EXISTS master_verticals CASCADE;
DROP TABLE IF EXISTS master_locations CASCADE;
DROP TABLE IF EXISTS master_partner_types CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(200) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'salesperson',
    department VARCHAR(100),
    phone VARCHAR(50),
    employee_id VARCHAR(50),
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    must_change_password BOOLEAN DEFAULT FALSE,
    monthly_target DECIMAL(15,2),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_manager ON users(manager_id);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    base_price DECIMAL(15,2),
    commission_rate DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- MASTER DATA
-- ============================================================
CREATE TABLE master_verticals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE master_oems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE master_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    oem_id UUID REFERENCES master_oems(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE master_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    region VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE master_partner_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- PARTNERS
-- ============================================================
CREATE TABLE partners (
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
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_partners_assigned_to ON partners(assigned_to);
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_partners_tier ON partners(tier);

-- ============================================================
-- SALES ENTRIES
-- ============================================================
CREATE TABLE sales_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    salesperson_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    customer_name VARCHAR(255),
    quantity INTEGER DEFAULT 1,
    amount DECIMAL(15,2) NOT NULL,
    po_number VARCHAR(100),
    invoice_no VARCHAR(100),
    payment_status VARCHAR(50) DEFAULT 'pending',
    commission_amount DECIMAL(15,2) DEFAULT 0,
    sale_date DATE NOT NULL,
    location_id UUID REFERENCES master_locations(id) ON DELETE SET NULL,
    vertical_id UUID REFERENCES master_verticals(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sales_entries_partner ON sales_entries(partner_id);
CREATE INDEX idx_sales_entries_salesperson ON sales_entries(salesperson_id);
CREATE INDEX idx_sales_entries_sale_date ON sales_entries(sale_date);
CREATE INDEX idx_sales_entries_product ON sales_entries(product_id);

-- ============================================================
-- LEADS (CRM)
-- ============================================================
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(100),
    stage VARCHAR(50) DEFAULT 'New',
    priority VARCHAR(20) DEFAULT 'Medium',
    estimated_value DECIMAL(15,2),
    product_interest VARCHAR(255),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
    notes TEXT,
    expected_close_date DATE,
    lost_reason TEXT,
    won_sale_id UUID REFERENCES sales_entries(id) ON DELETE SET NULL,
    next_follow_up DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_stage ON leads(stage);

-- ============================================================
-- LEAD ACTIVITIES
-- ============================================================
CREATE TABLE lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id);

-- ============================================================
-- QUOTES
-- ============================================================
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_number VARCHAR(50) UNIQUE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    valid_until DATE,
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 18,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft',
    terms TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- QUOTE LINE ITEMS
-- ============================================================
CREATE TABLE quote_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_pct DECIMAL(5,2) DEFAULT 0,
    line_total DECIMAL(15,2) NOT NULL,
    sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_quote_line_items_quote ON quote_line_items(quote_id);

-- ============================================================
-- CAREPACKS
-- ============================================================
CREATE TABLE carepacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
    product_type VARCHAR(100),
    serial_number VARCHAR(100),
    carepack_sku VARCHAR(100),
    customer_name VARCHAR(255),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    priority VARCHAR(20) DEFAULT 'normal',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- SETTINGS
-- ============================================================
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    category VARCHAR(50),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin user (password: 1, bcrypt hash)
INSERT INTO users (id, email, password_hash, name, role, department, is_active)
VALUES (
    '443e00d3-a301-441d-843a-84a898a0ac10',
    'admin@gmail.com',
    '$2b$12$5cNc72EtMCPajf4kvNARTOj/BY27uaYJkAnHgNG9t9W4uRigOFYhO',
    'Administrator',
    'admin',
    'Management',
    TRUE
);

-- Products (from deployed site)
INSERT INTO products (name, category, commission_rate, is_active) VALUES
('AMD Server', 'Server', 0, TRUE),
('Any STG', 'Storage', 0, TRUE),
('Any SVR', 'Server', 0, TRUE),
('Boxpack Spares', 'Spares', 0, TRUE),
('Carepack', 'Services', 0, TRUE),
('Commercial Display', 'Display', 0, TRUE),
('Component', 'Component', 0, TRUE),
('DELL SVR', 'Server', 0, TRUE),
('Desktop', 'Desktop', 0, TRUE),
('HPE NW', 'Network', 0, TRUE),
('HPE STG', 'Storage', 0, TRUE),
('HPE STORAGE', 'Storage', 0, TRUE),
('HPE SVR', 'Server', 0, TRUE),
('HPI', 'HPI', 0, TRUE),
('Laptop', 'Laptop', 0, TRUE),
('LENOVO', 'LENOVO', 0, TRUE),
('LG TV', 'Display', 0, TRUE),
('Maxhub TV', 'Display', 0, TRUE),
('Monitor', 'Display', 0, TRUE),
('N-1 Spares', 'Spares', 0, TRUE),
('Network', 'Network', 0, TRUE),
('Options', 'Options', 0, TRUE),
('Printer', 'Printer', 0, TRUE),
('Refurb Svr', 'Server', 0, TRUE),
('RENTAL', 'Rental', 0, TRUE),
('Security', 'Security', 0, TRUE),
('Server', 'Server', 0, TRUE),
('Services', 'Services', 0, TRUE),
('Spares', 'Spares', 0, TRUE),
('Storage', 'Storage', 0, TRUE),
('Tablets', 'Tablets', 0, TRUE),
('Workstation', 'Workstation', 0, TRUE);

-- Locations (Indian cities)
INSERT INTO master_locations (city, state, region, is_active) VALUES
('Pune', 'Maharashtra', 'West', TRUE),
('Mumbai', 'Maharashtra', 'West', TRUE),
('Bangalore', 'Karnataka', 'South', TRUE),
('Chennai', 'Tamil Nadu', 'South', TRUE),
('Delhi', 'Delhi', 'North', TRUE),
('Hyderabad', 'Telangana', 'South', TRUE),
('Kolkata', 'West Bengal', 'East', TRUE),
('Ahmedabad', 'Gujarat', 'West', TRUE),
('Jaipur', 'Rajasthan', 'North', TRUE),
('Lucknow', 'Uttar Pradesh', 'North', TRUE),
('Nagpur', 'Maharashtra', 'West', TRUE),
('Nashik', 'Maharashtra', 'West', TRUE),
('Surat', 'Gujarat', 'West', TRUE),
('Vadodara', 'Gujarat', 'West', TRUE),
('Indore', 'Madhya Pradesh', 'Central', TRUE),
('Goa', 'Goa', 'West', TRUE),
('Amravati', 'Maharashtra', 'West', TRUE),
('Ahmednagar', 'Maharashtra', 'West', TRUE),
('Ankleshwar', 'Gujarat', 'West', TRUE);

-- OEMs
INSERT INTO master_oems (name, is_active) VALUES
('HPE', TRUE),
('HP Inc', TRUE),
('Dell', TRUE),
('Lenovo', TRUE),
('AMD', TRUE),
('LG', TRUE),
('Maxhub', TRUE);

-- Partner Types
INSERT INTO master_partner_types (name, is_active) VALUES
('Dealer', TRUE),
('Reseller', TRUE),
('System Integrator', TRUE),
('Distributor', TRUE),
('End Customer', TRUE);

-- Verticals
INSERT INTO master_verticals (name, is_active) VALUES
('Education', TRUE),
('Government', TRUE),
('Enterprise', TRUE),
('SME', TRUE),
('Healthcare', TRUE),
('BFSI', TRUE),
('Manufacturing', TRUE),
('IT/ITES', TRUE),
('Retail', TRUE),
('Telecom', TRUE);
