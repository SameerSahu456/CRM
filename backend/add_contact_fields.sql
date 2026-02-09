-- ============================================================
-- Add Extended Fields to Contacts Table
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE contacts
-- Contact Image
ADD COLUMN IF NOT EXISTS image VARCHAR(500),

-- Description Information
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS contact_group VARCHAR(100),

-- Extended Contact Information
ADD COLUMN IF NOT EXISTS ctsipl_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS pan VARCHAR(50),
ADD COLUMN IF NOT EXISTS gstin_no VARCHAR(50),
ADD COLUMN IF NOT EXISTS product_interested VARCHAR(255),
ADD COLUMN IF NOT EXISTS product_interested_text TEXT,
ADD COLUMN IF NOT EXISTS lead_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS lead_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS designation VARCHAR(100),
ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id),
ADD COLUMN IF NOT EXISTS new_leads BOOLEAN DEFAULT false,

-- Forms Info
ADD COLUMN IF NOT EXISTS bandwidth_required VARCHAR(255),
ADD COLUMN IF NOT EXISTS product_configuration TEXT,
ADD COLUMN IF NOT EXISTS product_details TEXT,
ADD COLUMN IF NOT EXISTS rental_duration VARCHAR(100),
ADD COLUMN IF NOT EXISTS product_name_part_number TEXT,
ADD COLUMN IF NOT EXISTS specifications TEXT,

-- Mailing Address
ADD COLUMN IF NOT EXISTS mailing_street TEXT,
ADD COLUMN IF NOT EXISTS mailing_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS mailing_state VARCHAR(100),
ADD COLUMN IF NOT EXISTS mailing_zip VARCHAR(20),
ADD COLUMN IF NOT EXISTS mailing_country VARCHAR(100),

-- Other Address
ADD COLUMN IF NOT EXISTS other_street TEXT,
ADD COLUMN IF NOT EXISTS other_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS other_state VARCHAR(100),
ADD COLUMN IF NOT EXISTS other_zip VARCHAR(20),
ADD COLUMN IF NOT EXISTS other_country VARCHAR(100);

-- ============================================================
-- Update the main migration file as well
-- Add these fields to the contacts table creation (line 84-102)
-- ============================================================
