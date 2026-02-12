-- ============================================================
-- INCREMENTAL MIGRATION - Add Missing Columns
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================================

-- Add missing columns to accounts table
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_image VARCHAR(500);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS group_name VARCHAR(255);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS parent_account_id UUID;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS endcustomer_category VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS products_selling_to_them TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS products_they_sell TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS pan_no VARCHAR(50);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS partner_id UUID;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS lead_category VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS new_leads INTEGER DEFAULT 0;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS references_doc VARCHAR(500);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS bank_statement_doc VARCHAR(500);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS contact_designation VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS contact_designation_other VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS billing_street TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS billing_city VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS billing_state VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS billing_code VARCHAR(20);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS billing_country VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS shipping_street TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS shipping_code VARCHAR(20);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(100);

-- Add missing columns to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS image VARCHAR(500);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_group VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS ctsipl_email VARCHAR(255);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS pan VARCHAR(50);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS gstin_no VARCHAR(50);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS product_interested VARCHAR(255);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS product_interested_text TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_source VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_category VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS partner_id UUID;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS new_leads BOOLEAN DEFAULT false;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS bandwidth_required VARCHAR(255);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS product_configuration TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS product_details TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS rental_duration VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS product_name_part_number TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS specifications TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mailing_street TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mailing_city VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mailing_state VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mailing_zip VARCHAR(20);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mailing_country VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS other_street TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS other_city VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS other_state VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS other_zip VARCHAR(20);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS other_country VARCHAR(100);

-- Add 35 new columns to deals table (your new implementation)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS sdp_no VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS sales_created_by_rm UUID;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS lead_category VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS product_manager VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS expected_revenue NUMERIC(15,2);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS bandwidth_required VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS product_configuration TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS rental_duration VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS enter_product_details TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS product_name_and_part_number VARCHAR(500);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS specifications TEXT;
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
ALTER TABLE deals ADD COLUMN IF NOT EXISTS billing_street TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS billing_state VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS billing_country VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS billing_city VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS billing_zip_code VARCHAR(20);

-- Create deal_line_items table
CREATE TABLE IF NOT EXISTS deal_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
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

-- Enable RLS on new table
ALTER TABLE deal_line_items ENABLE ROW LEVEL SECURITY;

-- Create policy for deal_line_items
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'deal_line_items' 
        AND policyname = 'Allow all for postgres'
    ) THEN
        EXECUTE 'CREATE POLICY "Allow all for postgres" ON deal_line_items FOR ALL USING (true) WITH CHECK (true)';
    END IF;
END $$;
