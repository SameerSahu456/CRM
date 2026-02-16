-- Migration v2: Schema changes for 13 requirements
-- Run against Supabase PostgreSQL

-- Req 8: Account tag (Digital Account / Existing Account)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS tag VARCHAR(50);

-- Req 3: Contact document URLs (Supabase Storage)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS gst_certificate_url TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS msme_certificate_url TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS pan_card_url TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS aadhar_card_url TEXT;

-- Req 5: Sales entry enhancements for sales orders
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES deals(id);
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS product_ids JSONB DEFAULT '[]';

-- Req 9: Payment flag on deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS payment_flag BOOLEAN DEFAULT FALSE;
