-- Add requirement and quoted_requirement columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS requirement TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS quoted_requirement TEXT;

-- Add requirement and quoted_requirement columns to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS requirement TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS quoted_requirement TEXT;
