-- ============================================================
-- DASHBOARD ANALYTICS SAMPLE DATA (Schema-Matched)
-- ============================================================

-- Add sample products
INSERT INTO products (id, name, category, base_price, commission_rate, is_active)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'Enterprise Software License', 'Software', 50000.00, 15.00, true),
  ('30000000-0000-0000-0000-000000000002', 'Cloud Hosting Package', 'Services', 25000.00, 20.00, true),
  ('30000000-0000-0000-0000-000000000003', 'Support & Maintenance', 'Services', 15000.00, 10.00, true),
  ('30000000-0000-0000-0000-000000000004', 'Training Program', 'Training', 10000.00, 12.00, true),
  ('30000000-0000-0000-0000-000000000005', 'Hardware Bundle', 'Hardware', 75000.00, 18.00, true)
ON CONFLICT (id) DO NOTHING;

-- Add sample users
INSERT INTO users (id, email, password_hash, name, role, department, is_active, view_access)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'john@test.com', '$2b$12$LKGtTdpVEjNuNvLXRZiMdOd7bVU.Jox6zvT0p/C4WQQjr/rJZqZ0a', 'John Smith', 'salesperson', 'Sales', true, 'presales'),
  ('10000000-0000-0000-0000-000000000002', 'sarah@test.com', '$2b$12$LKGtTdpVEjNuNvLXRZiMdOd7bVU.Jox6zvT0p/C4WQQjr/rJZqZ0a', 'Sarah Johnson', 'salesperson', 'Sales', true, 'postsales'),
  ('10000000-0000-0000-0000-000000000003', 'mike@test.com', '$2b$12$LKGtTdpVEjNuNvLXRZiMdOd7bVU.Jox6zvT0p/C4WQQjr/rJZqZ0a', 'Mike Chen', 'salesperson', 'Sales', true, 'presales')
ON CONFLICT (email) DO NOTHING;

-- Add sample partners
INSERT INTO partners (id, company_name, contact_person, email, phone, city, state, partner_type, status, assigned_to)
VALUES
  ('20000000-0000-0000-0000-000000000001', 'Tech Solutions Inc', 'Robert Brown', 'contact@techsolutions.com', '+1-555-0101', 'San Francisco', 'California', 'Channel Partner', 'active', (SELECT id FROM users WHERE email = 'admin@gmail.com')),
  ('20000000-0000-0000-0000-000000000002', 'Global Distributors', 'Lisa Wang', 'sales@globaldist.com', '+1-555-0102', 'New York', 'New York', 'Distributor', 'active', (SELECT id FROM users WHERE email = 'admin@gmail.com')),
  ('20000000-0000-0000-0000-000000000003', 'Enterprise Corp', 'David Lee', 'info@enterprise.com', '+1-555-0103', 'Chicago', 'Illinois', 'Channel Partner', 'pending', (SELECT id FROM users WHERE email = 'admin@gmail.com')),
  ('20000000-0000-0000-0000-000000000004', 'StartupHub LLC', 'Emily Davis', 'hello@startuphub.com', '+1-555-0104', 'Austin', 'Texas', 'Reseller', 'active', (SELECT id FROM users WHERE email = 'admin@gmail.com')),
  ('20000000-0000-0000-0000-000000000005', 'MegaCorp Industries', 'James Wilson', 'contact@megacorp.com', '+1-555-0105', 'Boston', 'Massachusetts', 'Distributor', 'active', (SELECT id FROM users WHERE email = 'admin@gmail.com'))
ON CONFLICT (id) DO NOTHING;

-- Generate 50 sales entries across last 6 months
DO $$
DECLARE
    i INT;
    month_offset INT;
    sale_date DATE;
    admin_id UUID;
    salesperson_ids UUID[];
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
    -- Get admin and test user IDs
    SELECT id INTO admin_id FROM users WHERE email = 'admin@gmail.com';
    SELECT ARRAY_AGG(id) INTO salesperson_ids FROM users WHERE email IN ('john@test.com', 'sarah@test.com', 'mike@test.com', 'admin@gmail.com');

    IF salesperson_ids IS NULL OR array_length(salesperson_ids, 1) = 0 THEN
        salesperson_ids := ARRAY[admin_id];
    END IF;

    FOR i IN 1..50 LOOP
        month_offset := floor(random() * 6)::INT;
        sale_date := (CURRENT_DATE - (month_offset || ' months')::INTERVAL - (floor(random() * 30)::INT || ' days')::INTERVAL)::DATE;

        INSERT INTO sales_entries (
            customer_name,
            amount,
            sale_date,
            payment_status,
            salesperson_id,
            partner_id,
            product_id,
            quantity
        ) VALUES (
            'Customer ' || i,
            (10000 + random() * 90000)::NUMERIC(15,2),
            sale_date,
            CASE (random() * 3)::INT
                WHEN 0 THEN 'paid'
                WHEN 1 THEN 'pending'
                ELSE 'partially_paid'
            END,
            salesperson_ids[1 + floor(random() * array_length(salesperson_ids, 1))::INT],
            partner_ids[1 + floor(random() * 5)::INT],
            product_ids[1 + floor(random() * 5)::INT],
            1 + floor(random() * 10)::INT
        );
    END LOOP;
END $$;

-- Add deals (using correct schema)
DO $$
DECLARE
    admin_id UUID;
    user_ids UUID[];
BEGIN
    SELECT id INTO admin_id FROM users WHERE email = 'admin@gmail.com';
    SELECT ARRAY_AGG(id) INTO user_ids FROM users WHERE email IN ('john@test.com', 'sarah@test.com', 'mike@test.com', 'admin@gmail.com');

    IF user_ids IS NULL THEN
        user_ids := ARRAY[admin_id];
    END IF;

    INSERT INTO deals (title, company, value, stage, probability, closing_date, owner_id, type)
    VALUES
        ('Enterprise License Deal', 'Tech Solutions Inc', 150000, 'Qualification', 30, CURRENT_DATE + 30, user_ids[1], 'New Business'),
        ('Cloud Migration Project', 'Global Distributors', 200000, 'Proposal', 50, CURRENT_DATE + 45, user_ids[2], 'Existing Customer'),
        ('Software Renewal', 'Enterprise Corp', 75000, 'Negotiation', 70, CURRENT_DATE + 15, user_ids[1], 'Renewal'),
        ('Hardware Bundle', 'StartupHub LLC', 100000, 'Discovery', 20, CURRENT_DATE + 60, user_ids[3], 'New Business'),
        ('Support Contract', 'MegaCorp Industries', 50000, 'Closed Won', 100, CURRENT_DATE - 5, user_ids[2], 'Upsell'),
        ('Training Program', 'Tech Solutions Inc', 30000, 'Needs Analysis', 40, CURRENT_DATE + 20, user_ids[1], 'Upsell'),
        ('Hosting Package', 'Global Distributors', 45000, 'Qualification', 35, CURRENT_DATE + 50, user_ids[3], 'New Business'),
        ('License Expansion', 'Enterprise Corp', 80000, 'Proposal', 60, CURRENT_DATE + 25, user_ids[2], 'Existing Customer');
END $$;

-- Add leads (using correct schema)
DO $$
DECLARE
    admin_id UUID;
    user_ids UUID[];
BEGIN
    SELECT id INTO admin_id FROM users WHERE email = 'admin@gmail.com';
    SELECT ARRAY_AGG(id) INTO user_ids FROM users WHERE email IN ('john@test.com', 'sarah@test.com', 'mike@test.com', 'admin@gmail.com');

    IF user_ids IS NULL THEN
        user_ids := ARRAY[admin_id];
    END IF;

    INSERT INTO leads (company_name, contact_person, email, phone, stage, source, estimated_value, assigned_to, priority)
    VALUES
        ('Acme Corporation', 'John Doe', 'john@acme.com', '+1-555-1001', 'New', 'Website', 50000, user_ids[1], 'high'),
        ('Beta Industries', 'Jane Smith', 'jane@beta.com', '+1-555-1002', 'Contacted', 'Referral', 75000, user_ids[2], 'high'),
        ('Gamma Tech', 'Bob Johnson', 'bob@gamma.com', '+1-555-1003', 'Qualified', 'Cold Call', 100000, user_ids[3], 'medium'),
        ('Delta Solutions', 'Alice Brown', 'alice@delta.com', '+1-555-1004', 'Proposal', 'LinkedIn', 60000, user_ids[1], 'high'),
        ('Epsilon Group', 'Charlie Wilson', 'charlie@epsilon.com', '+1-555-1005', 'Negotiation', 'Email Campaign', 80000, user_ids[2], 'medium'),
        ('Zeta Corp', 'Diana Lee', 'diana@zeta.com', '+1-555-1006', 'Won', 'Partner', 120000, user_ids[3], 'high'),
        ('Eta Enterprises', 'Frank Miller', 'frank@eta.com', '+1-555-1007', 'New', 'Website', 40000, user_ids[1], 'low'),
        ('Theta Inc', 'Grace Chen', 'grace@theta.com', '+1-555-1008', 'Contacted', 'Trade Show', 90000, user_ids[2], 'medium'),
        ('Iota Systems', 'Henry Davis', 'henry@iota.com', '+1-555-1009', 'Qualified', 'Referral', 65000, user_ids[3], 'medium'),
        ('Kappa LLC', 'Ivy Martinez', 'ivy@kappa.com', '+1-555-1010', 'Lost', 'Cold Call', 55000, user_ids[1], 'low');
END $$;

-- Add tasks
DO $$
DECLARE
    admin_id UUID;
    user_ids UUID[];
BEGIN
    SELECT id INTO admin_id FROM users WHERE email = 'admin@gmail.com';
    SELECT ARRAY_AGG(id) INTO user_ids FROM users WHERE email IN ('john@test.com', 'sarah@test.com', 'mike@test.com', 'admin@gmail.com');

    IF user_ids IS NULL THEN
        user_ids := ARRAY[admin_id];
    END IF;

    INSERT INTO tasks (title, description, status, priority, due_date, assigned_to, created_by, type)
    VALUES
        ('Follow up with Acme Corp', 'Send proposal document', 'pending', 'high', CURRENT_DATE + 2, user_ids[1], admin_id, 'call'),
        ('Prepare demo for Beta Industries', 'Technical demo preparation', 'in_progress', 'high', CURRENT_DATE + 3, user_ids[2], admin_id, 'meeting'),
        ('Contract review - Gamma Tech', 'Legal review of contract terms', 'pending', 'medium', CURRENT_DATE + 5, user_ids[3], admin_id, 'email'),
        ('Client meeting - Delta Solutions', 'Quarterly business review', 'completed', 'high', CURRENT_DATE - 1, user_ids[1], admin_id, 'meeting'),
        ('Send pricing to Epsilon', 'Updated pricing proposal', 'in_progress', 'medium', CURRENT_DATE + 1, user_ids[2], admin_id, 'email'),
        ('Training session setup', 'Prepare training materials', 'pending', 'low', CURRENT_DATE + 7, user_ids[3], admin_id, 'other'),
        ('Close Zeta Corp deal', 'Final contract signing', 'completed', 'high', CURRENT_DATE - 2, user_ids[1], admin_id, 'meeting'),
        ('Research Eta requirements', 'Gather technical requirements', 'pending', 'medium', CURRENT_DATE + 4, user_ids[2], admin_id, 'call');
END $$;

-- Show results
SELECT
    'Sample Data Loaded Successfully!' as status,
    (SELECT COUNT(*) FROM sales_entries) as sales_entries,
    (SELECT COUNT(*) FROM deals) as deals,
    (SELECT COUNT(*) FROM leads) as leads,
    (SELECT COUNT(*) FROM tasks) as tasks,
    (SELECT COUNT(*) FROM partners) as partners,
    (SELECT COUNT(*) FROM products) as products;
