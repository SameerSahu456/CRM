-- ============================================================
-- DASHBOARD ANALYTICS SAMPLE DATA
-- Populates data for all dashboard widgets
-- ============================================================

-- Clear existing test data (optional - uncomment if needed)
-- DELETE FROM sales_entries WHERE salesperson_id IN (SELECT id FROM users WHERE email LIKE '%@test.com');
-- DELETE FROM deals WHERE owner_id IN (SELECT id FROM users WHERE email LIKE '%@test.com');
-- DELETE FROM leads WHERE owner_id IN (SELECT id FROM users WHERE email LIKE '%@test.com');

-- ============================================================
-- 1. Add sample users (Sales Team)
-- ============================================================
INSERT INTO users (id, email, password_hash, name, role, department, is_active, view_access)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'salesperson1@test.com', '$2b$12$LKGtTdpVEjNuNvLXRZiMdOd7bVU.Jox6zvT0p/C4WQQjr/rJZqZ0a', 'John Smith', 'salesperson', 'Sales', true, 'presales'),
  ('10000000-0000-0000-0000-000000000002', 'salesperson2@test.com', '$2b$12$LKGtTdpVEjNuNvLXRZiMdOd7bVU.Jox6zvT0p/C4WQQjr/rJZqZ0a', 'Sarah Johnson', 'salesperson', 'Sales', true, 'postsales'),
  ('10000000-0000-0000-0000-000000000003', 'salesperson3@test.com', '$2b$12$LKGtTdpVEjNuNvLXRZiMdOd7bVU.Jox6zvT0p/C4WQQjr/rJZqZ0a', 'Mike Chen', 'salesperson', 'Sales', true, 'presales')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- 2. Add sample partners
-- ============================================================
INSERT INTO partners (id, company_name, contact_person, email, phone, city, state, partner_type, status, assigned_to)
VALUES
  ('20000000-0000-0000-0000-000000000001', 'Tech Solutions Inc', 'Robert Brown', 'contact@techsolutions.com', '+1-555-0101', 'San Francisco', 'California', 'Channel Partner', 'active', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'Global Distributors', 'Lisa Wang', 'sales@globaldist.com', '+1-555-0102', 'New York', 'New York', 'Distributor', 'active', '10000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000003', 'Enterprise Corp', 'David Lee', 'info@enterprise.com', '+1-555-0103', 'Chicago', 'Illinois', 'Channel Partner', 'pending', '10000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000004', 'StartupHub LLC', 'Emily Davis', 'hello@startuphub.com', '+1-555-0104', 'Austin', 'Texas', 'Reseller', 'active', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000005', 'MegaCorp Industries', 'James Wilson', 'contact@megacorp.com', '+1-555-0105', 'Boston', 'Massachusetts', 'Distributor', 'active', '10000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. Add sample products
-- ============================================================
INSERT INTO products (id, name, description, price, is_active)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'Enterprise Software License', 'Annual enterprise license', 50000.00, true),
  ('30000000-0000-0000-0000-000000000002', 'Cloud Hosting Package', 'Premium cloud hosting', 25000.00, true),
  ('30000000-0000-0000-0000-000000000003', 'Support & Maintenance', 'Annual support contract', 15000.00, true),
  ('30000000-0000-0000-0000-000000000004', 'Training Program', 'Employee training package', 10000.00, true),
  ('30000000-0000-0000-0000-000000000005', 'Hardware Bundle', 'Server hardware package', 75000.00, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Add sales entries (for revenue charts) - Last 6 months
-- ============================================================
DO $$
DECLARE
    i INT;
    month_offset INT;
    sale_date TIMESTAMP;
    salesperson_ids UUID[] := ARRAY[
        '10000000-0000-0000-0000-000000000001'::UUID,
        '10000000-0000-0000-0000-000000000002'::UUID,
        '10000000-0000-0000-0000-000000000003'::UUID
    ];
    partner_ids UUID[] := ARRAY[
        '20000000-0000-0000-0000-000000000001'::UUID,
        '20000000-0000-0000-0000-000000000002'::UUID,
        '20000000-0000-0000-0000-000000000003'::UUID,
        '20000000-0000-0000-0000-000000000004'::UUID,
        '20000000-0000-0000-0000-000000000005'::UUID
    ];
    product_ids UUID[] := ARRAY[
        '30000000-0000-0000-0000-000000000001'::UUID,
        '30000000-0000-0000-0000-000000000002'::UUID,
        '30000000-0000-0000-0000-000000000003'::UUID,
        '30000000-0000-0000-0000-000000000004'::UUID,
        '30000000-0000-0000-0000-000000000005'::UUID
    ];
BEGIN
    -- Generate 50 sales entries across last 6 months
    FOR i IN 1..50 LOOP
        month_offset := floor(random() * 6)::INT;
        sale_date := NOW() - (month_offset || ' months')::INTERVAL - (floor(random() * 30)::INT || ' days')::INTERVAL;

        INSERT INTO sales_entries (
            customer_name,
            amount,
            sale_date,
            payment_status,
            salesperson_id,
            partner_id,
            product_id
        ) VALUES (
            'Customer ' || i,
            (10000 + random() * 90000)::NUMERIC(15,2),
            sale_date,
            CASE (random() * 3)::INT
                WHEN 0 THEN 'paid'
                WHEN 1 THEN 'pending'
                ELSE 'partially_paid'
            END,
            salesperson_ids[1 + floor(random() * 3)::INT],
            partner_ids[1 + floor(random() * 5)::INT],
            product_ids[1 + floor(random() * 5)::INT]
        );
    END LOOP;
END $$;

-- ============================================================
-- 5. Add deals (for pipeline widget)
-- ============================================================
INSERT INTO deals (name, amount, stage, probability, expected_close_date, owner_id, partner_id)
VALUES
  ('Enterprise Deal - Tech Solutions', 150000, 'Qualification', 30, NOW() + interval '30 days', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'),
  ('Cloud Migration - Global Dist', 200000, 'Proposal', 50, NOW() + interval '45 days', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002'),
  ('Software License - Enterprise Corp', 75000, 'Negotiation', 70, NOW() + interval '15 days', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003'),
  ('Hardware Bundle - StartupHub', 100000, 'Discovery', 20, NOW() + interval '60 days', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004'),
  ('Support Contract - MegaCorp', 50000, 'Closed Won', 100, NOW() - interval '5 days', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005'),
  ('Training Program - Tech Solutions', 30000, 'Needs Analysis', 40, NOW() + interval '20 days', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'),
  ('Hosting Package - Global Dist', 45000, 'Qualification', 35, NOW() + interval '50 days', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002'),
  ('License Renewal - Enterprise Corp', 80000, 'Proposal', 60, NOW() + interval '25 days', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003');

-- ============================================================
-- 6. Add leads (for funnel widget)
-- ============================================================
INSERT INTO leads (company, contact_name, email, phone, status, source, estimated_value, owner_id)
VALUES
  ('Acme Corporation', 'John Doe', 'john@acme.com', '+1-555-1001', 'New', 'Website', 50000, '10000000-0000-0000-0000-000000000001'),
  ('Beta Industries', 'Jane Smith', 'jane@beta.com', '+1-555-1002', 'Contacted', 'Referral', 75000, '10000000-0000-0000-0000-000000000002'),
  ('Gamma Tech', 'Bob Johnson', 'bob@gamma.com', '+1-555-1003', 'Qualified', 'Cold Call', 100000, '10000000-0000-0000-0000-000000000003'),
  ('Delta Solutions', 'Alice Brown', 'alice@delta.com', '+1-555-1004', 'Proposal', 'LinkedIn', 60000, '10000000-0000-0000-0000-000000000001'),
  ('Epsilon Group', 'Charlie Wilson', 'charlie@epsilon.com', '+1-555-1005', 'Negotiation', 'Email Campaign', 80000, '10000000-0000-0000-0000-000000000002'),
  ('Zeta Corp', 'Diana Lee', 'diana@zeta.com', '+1-555-1006', 'Won', 'Partner', 120000, '10000000-0000-0000-0000-000000000003'),
  ('Eta Enterprises', 'Frank Miller', 'frank@eta.com', '+1-555-1007', 'New', 'Website', 40000, '10000000-0000-0000-0000-000000000001'),
  ('Theta Inc', 'Grace Chen', 'grace@theta.com', '+1-555-1008', 'Contacted', 'Trade Show', 90000, '10000000-0000-0000-0000-000000000002'),
  ('Iota Systems', 'Henry Davis', 'henry@iota.com', '+1-555-1009', 'Qualified', 'Referral', 65000, '10000000-0000-0000-0000-000000000003'),
  ('Kappa LLC', 'Ivy Martinez', 'ivy@kappa.com', '+1-555-1010', 'Lost', 'Cold Call', 55000, '10000000-0000-0000-0000-000000000001');

-- ============================================================
-- 7. Add tasks (for task widget)
-- ============================================================
INSERT INTO tasks (title, description, status, priority, due_date, assigned_to)
VALUES
  ('Follow up with Acme Corp', 'Send proposal document', 'pending', 'high', NOW() + interval '2 days', '10000000-0000-0000-0000-000000000001'),
  ('Prepare demo for Beta Industries', 'Technical demo preparation', 'in_progress', 'high', NOW() + interval '3 days', '10000000-0000-0000-0000-000000000002'),
  ('Contract review - Gamma Tech', 'Legal review of contract terms', 'pending', 'medium', NOW() + interval '5 days', '10000000-0000-0000-0000-000000000003'),
  ('Client meeting - Delta Solutions', 'Quarterly business review', 'completed', 'high', NOW() - interval '1 day', '10000000-0000-0000-0000-000000000001'),
  ('Send pricing to Epsilon', 'Updated pricing proposal', 'in_progress', 'medium', NOW() + interval '1 day', '10000000-0000-0000-0000-000000000002'),
  ('Training session setup', 'Prepare training materials', 'pending', 'low', NOW() + interval '7 days', '10000000-0000-0000-0000-000000000003'),
  ('Close Zeta Corp deal', 'Final contract signing', 'completed', 'high', NOW() - interval '2 days', '10000000-0000-0000-0000-000000000001'),
  ('Research Eta requirements', 'Gather technical requirements', 'pending', 'medium', NOW() + interval '4 days', '10000000-0000-0000-0000-000000000002');

-- ============================================================
-- Show results
-- ============================================================
SELECT
    'Sample Data Loaded Successfully!' as status,
    (SELECT COUNT(*) FROM users WHERE email LIKE '%@test.com') as test_users,
    (SELECT COUNT(*) FROM partners) as partners,
    (SELECT COUNT(*) FROM sales_entries) as sales_entries,
    (SELECT COUNT(*) FROM deals) as deals,
    (SELECT COUNT(*) FROM leads) as leads,
    (SELECT COUNT(*) FROM tasks) as tasks;
