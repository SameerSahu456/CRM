-- Migration V3: Quote Builder Enhancements
-- 1. Normalize discount_pct (keep column, default to 0)
-- 2. Create quote_terms and quote_selected_terms tables
-- 3. Add pdf_url column to quotes
-- Run against Supabase PostgreSQL

-- ===========================================================================
-- Phase 1: Normalize discount_pct to 0 for all existing line items
-- ===========================================================================

ALTER TABLE quote_line_items ALTER COLUMN discount_pct SET DEFAULT 0;
UPDATE quote_line_items SET discount_pct = 0 WHERE discount_pct != 0;

-- Recalculate line_total without discount
UPDATE quote_line_items SET line_total = quantity * unit_price;

-- Recalculate quote subtotals and totals
UPDATE quotes q SET
  subtotal = COALESCE((SELECT SUM(li.line_total) FROM quote_line_items li WHERE li.quote_id = q.id), 0),
  tax_amount = (COALESCE((SELECT SUM(li.line_total) FROM quote_line_items li WHERE li.quote_id = q.id), 0) - q.discount_amount) * (q.tax_rate / 100),
  total_amount = (COALESCE((SELECT SUM(li.line_total) FROM quote_line_items li WHERE li.quote_id = q.id), 0) - q.discount_amount) + ((COALESCE((SELECT SUM(li.line_total) FROM quote_line_items li WHERE li.quote_id = q.id), 0) - q.discount_amount) * (q.tax_rate / 100));

-- ===========================================================================
-- Phase 2: Quote Terms tables
-- ===========================================================================

CREATE TABLE IF NOT EXISTS quote_terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    is_predefined BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quote_selected_terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES quote_terms(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE(quote_id, term_id)
);

-- Seed predefined T&Cs
INSERT INTO quote_terms (content, is_predefined, sort_order) VALUES
('Payment is due within 30 days of invoice date.', true, 1),
('All prices are exclusive of applicable taxes unless stated otherwise.', true, 2),
('Delivery timelines are subject to product availability.', true, 3),
('Warranty terms are as per manufacturer''s policy.', true, 4),
('This quotation is valid for the period specified above.', true, 5),
('Cancellation after order confirmation may attract cancellation charges.', true, 6);

-- ===========================================================================
-- Phase 3: Add pdf_url column to quotes
-- ===========================================================================

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS pdf_url TEXT;
