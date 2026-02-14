-- Add stock column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- Set some sample stock values for existing products
UPDATE products SET stock = floor(random() * 100 + 1)::int WHERE stock = 0 OR stock IS NULL;
