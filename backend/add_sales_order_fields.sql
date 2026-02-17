-- Migration: Add sales order extended fields to sales_entries table
-- Run this against your Supabase database

ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS contact_no VARCHAR(50);
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS gstin VARCHAR(50);
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS pan_no VARCHAR(50);
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS dispatch_method VARCHAR(50);
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(255);
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS order_type VARCHAR(50);
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS serial_number VARCHAR(255);
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS boq TEXT;
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS price NUMERIC(15, 2);
