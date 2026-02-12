-- Migration: Add tag column to users table
-- This defines which data (channel / end customer / both) is visible to each user
-- Run this against your Supabase database

ALTER TABLE users ADD COLUMN IF NOT EXISTS tag VARCHAR(50);
-- Values: 'channel', 'endcustomer', 'both', or NULL
