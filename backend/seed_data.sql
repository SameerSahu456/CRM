-- =============================================================================
-- Comprint CRM - Comprehensive Sample Seed Data
-- Inserts realistic data into ALL tables: users, partners, products,
-- accounts, contacts, deals, leads, sales_entries, tasks, calendar_events,
-- email_templates, emails, quotes, quote_line_items, carepacks,
-- notifications, lead_activities
-- =============================================================================

BEGIN;

DO $$
DECLARE
    v_admin_id UUID;

    -- Additional user IDs
    v_user_rahul   UUID := uuid_generate_v4();
    v_user_snehal  UUID := uuid_generate_v4();
    v_user_vikram  UUID := uuid_generate_v4();
    v_user_priyanka UUID := uuid_generate_v4();
    v_user_anil    UUID := uuid_generate_v4();

    -- Account IDs
    v_acc_tcs     UUID := uuid_generate_v4();
    v_acc_infosys UUID := uuid_generate_v4();
    v_acc_wipro   UUID := uuid_generate_v4();
    v_acc_hcl     UUID := uuid_generate_v4();
    v_acc_techm   UUID := uuid_generate_v4();
    v_acc_ltim    UUID := uuid_generate_v4();
    v_acc_persis  UUID := uuid_generate_v4();
    v_acc_zensar  UUID := uuid_generate_v4();
    v_acc_mphasis UUID := uuid_generate_v4();
    v_acc_coforge UUID := uuid_generate_v4();

    -- Contact IDs
    v_ct_rajesh   UUID := uuid_generate_v4();
    v_ct_priya    UUID := uuid_generate_v4();
    v_ct_amit     UUID := uuid_generate_v4();
    v_ct_sneha    UUID := uuid_generate_v4();
    v_ct_vikram   UUID := uuid_generate_v4();
    v_ct_anita    UUID := uuid_generate_v4();
    v_ct_suresh   UUID := uuid_generate_v4();
    v_ct_kavita   UUID := uuid_generate_v4();
    v_ct_manoj    UUID := uuid_generate_v4();
    v_ct_deepa    UUID := uuid_generate_v4();
    v_ct_rahul    UUID := uuid_generate_v4();
    v_ct_pooja    UUID := uuid_generate_v4();
    v_ct_sanjay   UUID := uuid_generate_v4();
    v_ct_nisha    UUID := uuid_generate_v4();

    -- Deal IDs
    v_deal1  UUID := uuid_generate_v4();
    v_deal2  UUID := uuid_generate_v4();
    v_deal3  UUID := uuid_generate_v4();
    v_deal4  UUID := uuid_generate_v4();
    v_deal5  UUID := uuid_generate_v4();
    v_deal6  UUID := uuid_generate_v4();
    v_deal7  UUID := uuid_generate_v4();
    v_deal8  UUID := uuid_generate_v4();
    v_deal9  UUID := uuid_generate_v4();
    v_deal10 UUID := uuid_generate_v4();
    v_deal11 UUID := uuid_generate_v4();
    v_deal12 UUID := uuid_generate_v4();

    -- Partner IDs
    v_partner1 UUID := uuid_generate_v4();
    v_partner2 UUID := uuid_generate_v4();
    v_partner3 UUID := uuid_generate_v4();
    v_partner4 UUID := uuid_generate_v4();
    v_partner5 UUID := uuid_generate_v4();
    v_partner6 UUID := uuid_generate_v4();
    v_partner7 UUID := uuid_generate_v4();
    v_partner8 UUID := uuid_generate_v4();
    v_partner9 UUID := uuid_generate_v4();
    v_partner10 UUID := uuid_generate_v4();
    v_partner11 UUID := uuid_generate_v4();
    v_partner12 UUID := uuid_generate_v4();

    -- Product IDs (we'll fetch from existing)
    v_prod_hpe_svr  UUID;
    v_prod_hpe_stg  UUID;
    v_prod_laptop   UUID;
    v_prod_desktop  UUID;
    v_prod_network  UUID;
    v_prod_carepack UUID;
    v_prod_dell_svr UUID;
    v_prod_printer  UUID;
    v_prod_workstation UUID;
    v_prod_monitor  UUID;

    -- Location IDs
    v_loc_pune     UUID;
    v_loc_mumbai   UUID;
    v_loc_bangalore UUID;
    v_loc_delhi    UUID;
    v_loc_hyderabad UUID;
    v_loc_chennai  UUID;

    -- Vertical IDs
    v_vert_enterprise UUID;
    v_vert_sme     UUID;
    v_vert_govt    UUID;
    v_vert_edu     UUID;
    v_vert_bfsi    UUID;
    v_vert_it      UUID;

    -- Lead IDs
    v_lead1  UUID := uuid_generate_v4();
    v_lead2  UUID := uuid_generate_v4();
    v_lead3  UUID := uuid_generate_v4();
    v_lead4  UUID := uuid_generate_v4();
    v_lead5  UUID := uuid_generate_v4();
    v_lead6  UUID := uuid_generate_v4();
    v_lead7  UUID := uuid_generate_v4();
    v_lead8  UUID := uuid_generate_v4();
    v_lead9  UUID := uuid_generate_v4();
    v_lead10 UUID := uuid_generate_v4();
    v_lead11 UUID := uuid_generate_v4();
    v_lead12 UUID := uuid_generate_v4();
    v_lead13 UUID := uuid_generate_v4();
    v_lead14 UUID := uuid_generate_v4();
    v_lead15 UUID := uuid_generate_v4();

    -- Quote IDs
    v_quote1 UUID := uuid_generate_v4();
    v_quote2 UUID := uuid_generate_v4();
    v_quote3 UUID := uuid_generate_v4();
    v_quote4 UUID := uuid_generate_v4();
    v_quote5 UUID := uuid_generate_v4();

    -- Email template IDs
    v_tmpl_followup UUID := uuid_generate_v4();
    v_tmpl_welcome  UUID := uuid_generate_v4();
    v_tmpl_proposal UUID := uuid_generate_v4();
    v_tmpl_meeting  UUID := uuid_generate_v4();
    v_tmpl_thankyou UUID := uuid_generate_v4();

BEGIN
    -- Get the admin user ID
    SELECT id INTO v_admin_id FROM users WHERE email = 'admin@gmail.com';

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Admin user (admin@gmail.com) not found. Please run init_db.sql first.';
    END IF;

    -- Fetch product IDs
    SELECT id INTO v_prod_hpe_svr FROM products WHERE name = 'HPE SVR' LIMIT 1;
    SELECT id INTO v_prod_hpe_stg FROM products WHERE name = 'HPE STG' LIMIT 1;
    SELECT id INTO v_prod_laptop FROM products WHERE name = 'Laptop' LIMIT 1;
    SELECT id INTO v_prod_desktop FROM products WHERE name = 'Desktop' LIMIT 1;
    SELECT id INTO v_prod_network FROM products WHERE name = 'Network' LIMIT 1;
    SELECT id INTO v_prod_carepack FROM products WHERE name = 'Carepack' LIMIT 1;
    SELECT id INTO v_prod_dell_svr FROM products WHERE name = 'DELL SVR' LIMIT 1;
    SELECT id INTO v_prod_printer FROM products WHERE name = 'Printer' LIMIT 1;
    SELECT id INTO v_prod_workstation FROM products WHERE name = 'Workstation' LIMIT 1;
    SELECT id INTO v_prod_monitor FROM products WHERE name = 'Monitor' LIMIT 1;

    -- Fetch location IDs
    SELECT id INTO v_loc_pune FROM master_locations WHERE city = 'Pune' LIMIT 1;
    SELECT id INTO v_loc_mumbai FROM master_locations WHERE city = 'Mumbai' LIMIT 1;
    SELECT id INTO v_loc_bangalore FROM master_locations WHERE city = 'Bangalore' LIMIT 1;
    SELECT id INTO v_loc_delhi FROM master_locations WHERE city = 'Delhi' LIMIT 1;
    SELECT id INTO v_loc_hyderabad FROM master_locations WHERE city = 'Hyderabad' LIMIT 1;
    SELECT id INTO v_loc_chennai FROM master_locations WHERE city = 'Chennai' LIMIT 1;

    -- Fetch vertical IDs
    SELECT id INTO v_vert_enterprise FROM master_verticals WHERE name = 'Enterprise' LIMIT 1;
    SELECT id INTO v_vert_sme FROM master_verticals WHERE name = 'SME' LIMIT 1;
    SELECT id INTO v_vert_govt FROM master_verticals WHERE name = 'Government' LIMIT 1;
    SELECT id INTO v_vert_edu FROM master_verticals WHERE name = 'Education' LIMIT 1;
    SELECT id INTO v_vert_bfsi FROM master_verticals WHERE name = 'BFSI' LIMIT 1;
    SELECT id INTO v_vert_it FROM master_verticals WHERE name = 'IT/ITES' LIMIT 1;

    -- ============================================================
    -- Clean existing seed data (idempotent re-runs)
    -- ============================================================
    DELETE FROM notifications;
    DELETE FROM lead_activities;
    DELETE FROM quote_line_items;
    DELETE FROM quotes;
    DELETE FROM emails;
    DELETE FROM email_templates;
    DELETE FROM calendar_events;
    DELETE FROM tasks;
    DELETE FROM carepacks;
    DELETE FROM sales_entries;
    DELETE FROM leads;
    DELETE FROM deals;
    DELETE FROM contacts;
    DELETE FROM accounts;
    DELETE FROM partners;
    DELETE FROM users WHERE email != 'admin@gmail.com';

    -- ============================================================
    -- ADDITIONAL USERS (5 more users with various roles)
    -- ============================================================
    INSERT INTO users (id, email, password_hash, name, role, department, phone, employee_id, manager_id, is_active, monthly_target) VALUES
    (v_user_rahul,    'rahul.m@comprint.in',    '$2b$12$5cNc72EtMCPajf4kvNARTOj/BY27uaYJkAnHgNG9t9W4uRigOFYhO', 'Rahul Mehta',      'salesperson',   'Sales',       '+91-98230-11111', 'EMP001', v_admin_id, TRUE, 5000000.00),
    (v_user_snehal,   'snehal.p@comprint.in',   '$2b$12$5cNc72EtMCPajf4kvNARTOj/BY27uaYJkAnHgNG9t9W4uRigOFYhO', 'Snehal Patil',     'salesperson',   'Sales',       '+91-98230-22222', 'EMP002', v_admin_id, TRUE, 4500000.00),
    (v_user_vikram,   'vikram.d@comprint.in',   '$2b$12$5cNc72EtMCPajf4kvNARTOj/BY27uaYJkAnHgNG9t9W4uRigOFYhO', 'Vikram Desai',     'branchhead',    'Operations',  '+91-98230-33333', 'EMP003', v_admin_id, TRUE, 10000000.00),
    (v_user_priyanka, 'priyanka.s@comprint.in', '$2b$12$5cNc72EtMCPajf4kvNARTOj/BY27uaYJkAnHgNG9t9W4uRigOFYhO', 'Priyanka Sharma',  'salesmanager',  'Sales',       '+91-98230-44444', 'EMP004', v_admin_id, TRUE, 8000000.00),
    (v_user_anil,     'anil.k@comprint.in',     '$2b$12$5cNc72EtMCPajf4kvNARTOj/BY27uaYJkAnHgNG9t9W4uRigOFYhO', 'Anil Kumar',       'producthead',   'Product',     '+91-98230-55555', 'EMP005', v_admin_id, TRUE, 7000000.00);

    -- ============================================================
    -- PARTNERS (12 rows) - various types, tiers, statuses
    -- ============================================================
    INSERT INTO partners (id, company_name, contact_person, email, phone, mobile, gst_number, pan_number, address, city, state, pincode, partner_type, vertical, status, tier, assigned_to, approved_by, approved_at, notes, is_active) VALUES
    (v_partner1,  'Datacomp Solutions Pvt Ltd',    'Sunil Joshi',       'sunil@datacomp.in',       '+91-20-2546-7890', '+91-98220-12345', '27AABCD1234E1ZV', 'AABCD1234E', '301 Shivaji Nagar, FC Road',               'Pune',      'Maharashtra',  '411005', 'Reseller',           'IT/ITES',      'approved',  'elite',  v_user_rahul,   v_admin_id, '2025-06-15 10:00:00+05:30', 'Top-performing Pune partner. HPE Platinum.',     TRUE),
    (v_partner2,  'NetEdge Computing Solutions',    'Ramesh Iyer',       'ramesh@netedge.co.in',    '+91-22-2678-5432', '+91-98200-23456', '27AABCN5678F1ZW', 'AABCN5678F', '505 Nariman Point, Marine Drive',          'Mumbai',    'Maharashtra',  '400021', 'System Integrator',  'Enterprise',   'approved',  'elite',  v_user_snehal,  v_admin_id, '2025-04-20 11:00:00+05:30', 'Large enterprise SI with HPE GreenLake certified.', TRUE),
    (v_partner3,  'CloudBridge Technologies',       'Meera Nambiar',     'meera@cloudbridge.in',    '+91-80-4125-6789', '+91-99025-34567', '29AABCC9012G1ZX', 'AABCC9012G', '12 Koramangala 4th Block',                 'Bangalore', 'Karnataka',    '560034', 'System Integrator',  'IT/ITES',      'approved',  'growth', v_admin_id,     v_admin_id, '2025-08-10 09:30:00+05:30', 'Cloud-focused partner. Growing HPE portfolio.',  TRUE),
    (v_partner4,  'TechVista Infra Pvt Ltd',        'Ajay Kapoor',       'ajay@techvista.co.in',    '+91-11-4567-8901', '+91-98110-45678', '07AABCT3456H1ZY', 'AABCT3456H', '45 Nehru Place, Ring Road',                'Delhi',     'Delhi',        '110019', 'Reseller',           'Government',   'approved',  'growth', v_user_vikram,  v_admin_id, '2025-09-01 14:00:00+05:30', 'Govt sector specialist. GeM registered.',        TRUE),
    (v_partner5,  'Southern IT Systems',            'Karthik Rajan',     'karthik@southernit.in',   '+91-44-2890-1234', '+91-98400-56789', '33AABCS7890I1ZZ', 'AABCS7890I', '22 Anna Salai, Teynampet',                 'Chennai',   'Tamil Nadu',   '600018', 'Reseller',           'Enterprise',   'approved',  'growth', v_user_snehal,  v_admin_id, '2025-07-15 10:30:00+05:30', 'Strong South India coverage. Dell+HPE partner.', TRUE),
    (v_partner6,  'Nexus IT Solutions',             'Prakash Hegde',     'prakash@nexusit.in',      '+91-40-6789-0123', '+91-99000-67890', '36AABCN1234J1ZA', 'AABCN1234J', '18 HITEC City, Madhapur',                  'Hyderabad', 'Telangana',    '500081', 'Reseller',           'BFSI',         'approved',  'new',    v_user_rahul,   v_admin_id, '2025-11-20 15:00:00+05:30', 'New partner. Banking sector connections.',        TRUE),
    (v_partner7,  'Greenfield Computers',           'Dinesh Agarwal',    'dinesh@greenfield.co.in', '+91-79-2345-6789', '+91-98790-78901', '24AABCG5678K1ZB', 'AABCG5678K', '9 CG Road, Navrangpura',                   'Ahmedabad', 'Gujarat',      '380009', 'Dealer',             'SME',          'approved',  'new',    v_user_vikram,  v_admin_id, '2025-10-05 11:00:00+05:30', 'SME focused Gujarat dealer. HP Inc specialist.', TRUE),
    (v_partner8,  'EduTech Solutions India',        'Smita Pawar',       'smita@edutech.co.in',     '+91-20-6890-1234', '+91-98220-89012', '27AABCE9012L1ZC', 'AABCE9012L', '201 Baner Road, Baner',                    'Pune',      'Maharashtra',  '411045', 'Reseller',           'Education',    'approved',  'growth', v_admin_id,     v_admin_id, '2025-05-18 09:00:00+05:30', 'Education vertical specialist. Laptop deals.',   TRUE),
    (v_partner9,  'Cyber Systems Pvt Ltd',          'Nikhil Rao',        'nikhil@cybersys.in',      '+91-80-4567-8901', '+91-99025-90123', '29AABCC3456M1ZD', 'AABCC3456M', '56 Whitefield Main Road',                  'Bangalore', 'Karnataka',    '560066', 'System Integrator',  'Enterprise',   'pending',   'new',    v_user_snehal,  NULL,       NULL,                                       'Awaiting review. Large SI from Bangalore.',      TRUE),
    (v_partner10, 'InfraOne Technologies',          'Vivek Pandey',      'vivek@infraone.in',       '+91-22-5678-9012', '+91-98200-01234', '27AABCI7890N1ZE', 'AABCI7890N', '1001 BKC, Bandra Kurla Complex',           'Mumbai',    'Maharashtra',  '400051', 'System Integrator',  'BFSI',         'pending',   'new',    v_user_rahul,   NULL,       NULL,                                       'BFSI SI seeking HPE partnership.',               TRUE),
    (v_partner11, 'Horizon IT Services',            'Siddharth Jain',    'siddharth@horizonit.in',  '+91-141-456-7890', '+91-98290-12345', '08AABCH1234O1ZF', 'AABCH1234O', '12 MI Road, Near Ajmer Gate',              'Jaipur',    'Rajasthan',    '302001', 'Dealer',             'SME',          'pending',   'new',    v_user_vikram,  NULL,       NULL,                                       'Jaipur-based dealer. New applicant.',            TRUE),
    (v_partner12, 'NorthStar Computers',            'Ashish Garg',       'ashish@northstar.co.in',  '+91-522-456-7890', '+91-94150-23456', '09AABCN5678P1ZG', 'AABCN5678P', '45 Hazratganj, Sapru Marg',                'Lucknow',   'Uttar Pradesh','226001', 'Dealer',             'Government',   'rejected',  'new',    v_user_vikram,  v_admin_id, '2026-01-10 10:00:00+05:30', 'Rejected - incomplete documentation submitted.', FALSE);

    -- ============================================================
    -- ACCOUNTS (10 rows) - Indian IT / Enterprise companies
    -- ============================================================
    INSERT INTO accounts (id, name, industry, website, revenue, employees, location, type, status, phone, email, health_score, description, owner_id, gstin_no, payment_terms) VALUES
    (v_acc_tcs,     'Tata Consultancy Services',   'Technology',  'https://www.tcs.com',       2500000000.00, 614000, 'Mumbai, Maharashtra',     'Customer',  'Active',   '+91-22-6778-9999', 'procurement@tcs.com',      92, 'India''s largest IT services company. Long-standing partnership for HPE server infrastructure.',                v_admin_id, '27AAACT2727Q1ZV', 'Net 30'),
    (v_acc_infosys, 'Infosys Limited',             'Technology',  'https://www.infosys.com',   1800000000.00, 343000, 'Bangalore, Karnataka',    'Customer',  'Active',   '+91-80-2852-0261', 'vendor.mgmt@infosys.com',  88, 'Global IT services leader. Major buyer of HPE ProLiant servers and Aruba networking.',                          v_admin_id, '29AABCI5765A1ZO', 'Net 45'),
    (v_acc_wipro,   'Wipro Limited',               'Technology',  'https://www.wipro.com',     1100000000.00, 250000, 'Bangalore, Karnataka',    'Customer',  'Active',   '+91-80-2844-0011', 'it.procurement@wipro.com', 75, 'Leading IT company with strong server and storage requirements across data centers.',                           v_admin_id, '29AABCW8854Q1Z3', 'Net 30'),
    (v_acc_hcl,     'HCL Technologies',            'Technology',  'https://www.hcltech.com',   1300000000.00, 227000, 'Noida, Uttar Pradesh',    'Customer',  'Active',   '+91-120-431-3000', 'infra@hcltech.com',        80, 'Major IT services firm. Expanding hybrid cloud with HPE GreenLake.',                                            v_admin_id, '09AABCH8398R1ZE', 'Net 30'),
    (v_acc_techm,   'Tech Mahindra',               'Technology',  'https://www.techmahindra.com', 650000000.00, 157000, 'Pune, Maharashtra',    'Customer',  'Active',   '+91-20-6601-8100', 'procurement@techmahindra.com', 70, 'Telecom-focused IT company. Growing requirement for 5G infrastructure servers.',                            v_admin_id, '27AABCT2736Q1ZL', 'Net 30'),
    (v_acc_ltim,    'LTIMindtree',                 'Technology',  'https://www.ltimindtree.com', 500000000.00, 82000,  'Mumbai, Maharashtra',    'Customer',  'Active',   '+91-22-6776-6776', 'vendor@ltimindtree.com',   82, 'Recently merged entity with aggressive infrastructure modernization plans.',                                     v_admin_id, '27AAACL3826Q1ZE', 'Net 45'),
    (v_acc_persis,  'Persistent Systems',          'Technology',  'https://www.persistent.com',  280000000.00, 23000,  'Pune, Maharashtra',      'Customer',  'Active',   '+91-20-6703-0000', 'infra@persistent.com',     85, 'Pune-based product engineering company. Strong buyer of Dell and HPE workstations.',                              v_admin_id, '27AABCP2309Q1ZN', 'Net 30'),
    (v_acc_zensar,  'Zensar Technologies',         'Technology',  'https://www.zensar.com',      58000000.00,  10000,  'Pune, Maharashtra',      'Prospect',  'Active',   '+91-20-6607-1000', 'it@zensar.com',            65, 'RPG Group IT company. Moderate infrastructure requirements.',                                                    v_admin_id, '27AABCZ1234Q1ZM', 'Net 15'),
    (v_acc_mphasis, 'Mphasis',                     'Technology',  'https://www.mphasis.com',     180000000.00, 36000,  'Bangalore, Karnataka',   'Prospect',  'Inactive', '+91-80-4184-5184', 'procurement@mphasis.com',  45, 'Blackstone-backed IT company. Currently paused procurement due to restructuring.',                                v_admin_id, '29AABCM7865Q1ZR', 'Net 30'),
    (v_acc_coforge, 'Coforge Limited',             'Technology',  'https://www.coforge.com',     120000000.00, 22000,  'Noida, Uttar Pradesh',   'Prospect',  'Active',   '+91-120-477-9000', 'vendor.mgmt@coforge.com',  72, 'Previously NIIT Technologies. Growing cloud infrastructure needs with HPE.',                                     v_admin_id, '09AABCN1234Q1ZK', 'Net 30');

    -- ============================================================
    -- CONTACTS (14 rows) - linked to accounts
    -- ============================================================
    INSERT INTO contacts (id, first_name, last_name, email, phone, mobile, job_title, department, account_id, type, status, notes, preferred_contact, owner_id) VALUES
    (v_ct_rajesh, 'Rajesh',  'Sharma',     'rajesh.sharma@tcs.com',           '+91-22-6778-9101', '+91-98201-45678', 'VP - IT Infrastructure',      'IT',          v_acc_tcs,     'Customer',  'Active', 'Primary contact for all server deals. Prefers email communication.',       'Email',  v_admin_id),
    (v_ct_priya,  'Priya',   'Nair',       'priya.nair@tcs.com',             '+91-22-6778-9102', '+91-98201-56789', 'Senior Procurement Manager',  'Procurement', v_acc_tcs,     'Customer',  'Active', 'Handles all vendor negotiations and PO processing.',                       'Phone',  v_admin_id),
    (v_ct_amit,   'Amit',    'Patel',      'amit.patel@infosys.com',         '+91-80-2852-0301', '+91-99025-12345', 'CTO',                         'Technology',  v_acc_infosys, 'Customer',  'Active', 'Technical decision maker. Very interested in HPE GreenLake.',              'Email',  v_admin_id),
    (v_ct_sneha,  'Sneha',   'Kulkarni',   'sneha.kulkarni@infosys.com',     '+91-80-2852-0302', '+91-99025-23456', 'IT Manager - Data Center',    'IT',          v_acc_infosys, 'Customer',  'Active', 'Manages all data center infrastructure purchases.',                        'Email',  v_admin_id),
    (v_ct_vikram, 'Vikram',  'Singh',      'vikram.singh@wipro.com',         '+91-80-2844-0111', '+91-98450-34567', 'Director - Cloud Infra',      'Cloud',       v_acc_wipro,   'Customer',  'Active', 'Leading Wipro''s hybrid cloud initiative.',                                'Phone',  v_admin_id),
    (v_ct_anita,  'Anita',   'Deshmukh',   'anita.deshmukh@hcltech.com',     '+91-120-431-3101', '+91-98765-45678', 'Head of Procurement',         'Procurement', v_acc_hcl,     'Customer',  'Active', 'All purchases above 50L need her approval.',                               'Email',  v_admin_id),
    (v_ct_suresh, 'Suresh',  'Reddy',      'suresh.reddy@techmahindra.com',  '+91-20-6601-8201', '+91-99880-56789', 'Infrastructure Lead',         'IT',          v_acc_techm,   'Customer',  'Active', 'Evaluates all server and network proposals.',                              'Email',  v_admin_id),
    (v_ct_kavita, 'Kavita',  'Joshi',      'kavita.joshi@ltimindtree.com',   '+91-22-6776-6801', '+91-98200-67890', 'GM - IT Operations',          'IT',          v_acc_ltim,    'Customer',  'Active', 'Budget holder for infrastructure modernization project.',                  'Phone',  v_admin_id),
    (v_ct_manoj,  'Manoj',   'Gupta',      'manoj.gupta@persistent.com',     '+91-20-6703-0101', '+91-98220-78901', 'Engineering Director',        'Engineering', v_acc_persis,  'Customer',  'Active', 'Needs high-performance workstations for engineering teams.',               'Email',  v_admin_id),
    (v_ct_deepa,  'Deepa',   'Menon',      'deepa.menon@persistent.com',     '+91-20-6703-0102', '+91-98220-89012', 'Procurement Lead',            'Procurement', v_acc_persis,  'Customer',  'Active', 'Processes all hardware POs. Quick turnaround.',                            'Email',  v_admin_id),
    (v_ct_rahul,  'Rahul',   'Verma',      'rahul.verma@zensar.com',         '+91-20-6607-1101', '+91-99700-90123', 'IT Manager',                  'IT',          v_acc_zensar,  'Prospect',  'Active', 'Single point of contact for all IT procurement.',                          'Phone',  v_admin_id),
    (v_ct_pooja,  'Pooja',   'Bhatt',      'pooja.bhatt@mphasis.com',        '+91-80-4184-5201', '+91-98865-01234', 'VP Technology',               'Technology',  v_acc_mphasis, 'Prospect',  'Inactive', 'On hold due to organizational restructuring. Follow up in Q2.',          'Email',  v_admin_id),
    (v_ct_sanjay, 'Sanjay',  'Tiwari',     'sanjay.tiwari@coforge.com',      '+91-120-477-9101', '+91-98115-12345', 'Head of Infrastructure',      'IT',          v_acc_coforge, 'Prospect',  'Active', 'Driving cloud-first strategy. Interested in HPE GreenLake.',               'Email',  v_admin_id),
    (v_ct_nisha,  'Nisha',   'Agarwal',    'nisha.agarwal@coforge.com',      '+91-120-477-9102', '+91-98115-23456', 'Senior Procurement Officer',  'Procurement', v_acc_coforge, 'Prospect',  'Active', 'Handles vendor onboarding and rate negotiations.',                         'Phone',  v_admin_id);

    -- ============================================================
    -- DEALS (12 rows) - various stages
    -- ============================================================
    INSERT INTO deals (id, title, company, account_id, value, stage, probability, owner_id, closing_date, description, contact_id, next_step, forecast, type, lead_source) VALUES
    (v_deal1,  'TCS HPE ProLiant DL380 Gen11 - 50 Units',    'Tata Consultancy Services',   v_acc_tcs,     3750000.00,  'Negotiation',    75, v_admin_id, '2026-02-28', 'Bulk server procurement for new data center wing in Pune.',                  v_ct_rajesh, 'Send revised quote with volume discount',       'Commit',     'New Business', 'Referral'),
    (v_deal2,  'TCS Aruba Network Refresh - Campus',          'Tata Consultancy Services',   v_acc_tcs,     1200000.00,  'Proposal',       50, v_admin_id, '2026-03-15', 'Aruba CX 6300 switches and AP-635 access points for campus upgrade.',       v_ct_priya,  'Schedule technical presentation',                'Best Case',  'New Business', 'Direct'),
    (v_deal3,  'Infosys GreenLake Private Cloud',             'Infosys Limited',             v_acc_infosys, 8500000.00,  'Discovery',      30, v_admin_id, '2026-04-30', 'HPE GreenLake private cloud deployment across 3 data centers.',             v_ct_amit,   'Arrange HPE GreenLake workshop',                'Pipeline',   'New Business', 'Event'),
    (v_deal4,  'Infosys HPE Storage - Alletra 9000',          'Infosys Limited',             v_acc_infosys, 4200000.00,  'Qualification',  20, v_admin_id, '2026-05-31', 'Enterprise storage solution for BPO operations.',                           v_ct_sneha,  'Send product comparison sheet',                 'Pipeline',   'New Business', 'Website'),
    (v_deal5,  'Wipro Hybrid Cloud Infrastructure',           'Wipro Limited',               v_acc_wipro,   5500000.00,  'Proposal',       60, v_admin_id, '2026-03-20', 'Hybrid cloud with HPE Synergy composable compute.',                         v_ct_vikram, 'Present TCO analysis',                          'Best Case',  'New Business', 'Partner'),
    (v_deal6,  'HCL HPE Server Expansion - Phase 2',          'HCL Technologies',            v_acc_hcl,     2800000.00,  'Negotiation',    80, v_admin_id, '2026-02-20', 'Phase 2: 30 HPE ProLiant DL360 Gen11 servers.',                             v_ct_anita,  'Finalize commercial terms',                     'Commit',     'Expansion',    'Existing Customer'),
    (v_deal7,  'Tech Mahindra 5G Lab Servers',                'Tech Mahindra',               v_acc_techm,   1800000.00,  'Discovery',      25, v_user_rahul, '2026-04-15', 'High-performance servers for 5G testing lab with GPUs.',                   v_ct_suresh, 'Share HPE edgeline solution brief',             'Pipeline',   'New Business', 'Event'),
    (v_deal8,  'LTIMindtree Infra Modernization',             'LTIMindtree',                 v_acc_ltim,    6200000.00,  'Closed Won',     100, v_admin_id, '2026-01-15', 'Won: complete infrastructure modernization. HPE servers + Aruba + storage.',v_ct_kavita, NULL,                                            'Closed',     'New Business', 'Direct'),
    (v_deal9,  'Persistent Workstation Fleet - 200 Units',    'Persistent Systems',          v_acc_persis,  2400000.00,  'Closed Won',     100, v_user_snehal, '2026-01-30', 'HP ZBook Fury 16 G10 workstations for engineering teams.',               v_ct_manoj,  NULL,                                            'Closed',     'New Business', 'Referral'),
    (v_deal10, 'Zensar Datacenter Upgrade',                   'Zensar Technologies',         v_acc_zensar,  950000.00,   'Proposal',       40, v_user_rahul, '2026-03-31', 'Small datacenter upgrade with HPE ProLiant ML350.',                       v_ct_rahul,  'Follow up on proposal feedback',                'Best Case',  'New Business', 'Cold Call'),
    (v_deal11, 'Mphasis Cloud Migration Servers',             'Mphasis',                     v_acc_mphasis, 3100000.00,  'Closed Lost',    0,  v_admin_id, '2026-01-10', 'Lost to Dell. Mphasis went with PowerEdge.',                                v_ct_pooja,  NULL,                                            'Omitted',    'New Business', 'Website'),
    (v_deal12, 'Coforge HPE GreenLake Pilot',                 'Coforge Limited',             v_acc_coforge, 1500000.00,  'Qualification',  15, v_user_snehal, '2026-06-30', 'Initial GreenLake pilot for Coforge internal IT.',                       v_ct_sanjay, 'Schedule GreenLake demo with HPE team',         'Pipeline',   'New Business', 'Event');

    -- ============================================================
    -- LEADS (15 rows) - distributed across all stages
    -- ============================================================
    INSERT INTO leads (id, company_name, contact_person, email, phone, source, stage, priority, estimated_value, product_interest, assigned_to, partner_id, notes, expected_close_date, lost_reason, next_follow_up) VALUES
    (v_lead1,  'Bajaj Finserv',            'Ashok Bajaj',     'ashok.bajaj@bajajfinserv.in',   '+91-20-3456-7890', 'referral',  'New',         'High',   4500000.00, 'HPE ProLiant DL380 Gen11',     v_admin_id,    v_partner1,  'Referred by Datacomp. Large BFSI account, needs 40 servers for new DC.',           '2026-04-30', NULL, '2026-02-10'),
    (v_lead2,  'Reliance Jio Infocomm',    'Deepak Gupta',    'deepak.gupta@jio.com',          '+91-22-4567-8901', 'event',     'Contacted',   'High',   12000000.00, 'HPE GreenLake + Aruba',       v_admin_id,    NULL,        'Met at HPE Discover 2025. Massive 5G infra requirement.',                          '2026-06-30', NULL, '2026-02-12'),
    (v_lead3,  'HDFC Bank',                'Pradeep Rana',    'pradeep.rana@hdfcbank.com',      '+91-22-6161-6161', 'cold-call', 'Qualified',   'High',   6800000.00, 'HPE Alletra 9000 Storage',     v_user_rahul,  v_partner2,  'Bank expanding storage. Compliance requires on-prem solution.',                     '2026-05-15', NULL, '2026-02-15'),
    (v_lead4,  'Mahindra & Mahindra',       'Vijay Bhosle',    'vijay.bhosle@mahindra.com',     '+91-22-2490-1441', 'website',   'Proposal',    'Medium', 3200000.00, 'Dell PowerEdge + HPE Network', v_user_snehal, v_partner5,  'Manufacturing sector. Mixed vendor preference.',                                   '2026-03-31', NULL, '2026-02-08'),
    (v_lead5,  'ICICI Prudential',          'Sunita Menon',    'sunita.menon@icicipru.com',     '+91-22-2656-8000', 'referral',  'Negotiation', 'High',   5500000.00, 'HPE ProLiant + Carepack',      v_admin_id,    v_partner6,  'Insurance co. expanding server farm. Needs 3-year carepack.',                      '2026-02-28', NULL, '2026-02-09'),
    (v_lead6,  'Pune Municipal Corp',       'Dr. Nitin Patil', 'nitin.patil@pmc.gov.in',        '+91-20-2550-1000', 'partner',   'New',         'Medium', 2100000.00, 'HPE SVR + Desktop',            v_user_vikram, v_partner4,  'Government project for smart city infrastructure.',                                '2026-07-31', NULL, '2026-02-20'),
    (v_lead7,  'Tata Motors Finance',       'Anurag Sharma',   'anurag.sharma@tmf.co.in',       '+91-22-6268-7500', 'cold-call', 'Contacted',   'Medium', 1800000.00, 'Laptop fleet + Monitor',       v_user_rahul,  NULL,        'Fleet refresh of 150 laptops for branch offices.',                                 '2026-04-15', NULL, '2026-02-14'),
    (v_lead8,  'IIT Bombay',               'Prof. Anand Kumar','anand.kumar@iitb.ac.in',        '+91-22-2576-7001', 'website',   'Qualified',   'Low',    950000.00,  'Workstation + HPE SVR',        v_user_snehal, v_partner8,  'Research lab computing needs. Academic pricing applicable.',                        '2026-05-31', NULL, '2026-02-18'),
    (v_lead9,  'Airtel Business',           'Rohit Kapoor',    'rohit.kapoor@airtel.com',       '+91-11-4666-6100', 'event',     'New',         'High',   8500000.00, 'HPE Edgeline + 5G Servers',    v_admin_id,    NULL,        'Telecom infra for 5G rollout. Met at Mobile World Congress.',                      '2026-08-31', NULL, '2026-02-25'),
    (v_lead10, 'Serum Institute India',     'Dr. Meera Joshi', 'meera.joshi@seruminstitute.com','+91-20-2699-9999', 'referral',  'Proposal',    'Medium', 2800000.00, 'HPE SVR + HPE STG',            v_user_rahul,  v_partner1,  'Pharma company. Cold storage monitoring servers needed.',                           '2026-03-15', NULL, '2026-02-11'),
    (v_lead11, 'Larsen & Toubro Infotech',  'Sachin Dixit',    'sachin.dixit@ltimindtree.com',  '+91-22-6776-6777', 'partner',   'Won',         'High',   6200000.00, 'HPE Full Stack Infra',         v_admin_id,    v_partner2,  'Converted to deal - LTIMindtree Infra Modernization.',                             '2026-01-15', NULL, NULL),
    (v_lead12, 'Adani Green Energy',        'Manish Patel',    'manish.patel@adani.com',        '+91-79-2656-5555', 'cold-call', 'Lost',        'High',   7500000.00, 'HPE GreenLake',                v_user_snehal, NULL,        'Lost to competitor - went with Azure Stack HCI.',                                  '2026-01-31', 'Competitor won - Microsoft Azure Stack HCI preferred.', NULL),
    (v_lead13, 'Flipkart Internet',         'Neha Srivastava', 'neha.s@flipkart.com',           '+91-80-4688-9900', 'website',   'Contacted',   'Medium', 3400000.00, 'HPE SVR + HPE NW',             v_user_rahul,  v_partner3,  'E-commerce warehouse server and network needs.',                                   '2026-05-30', NULL, '2026-02-16'),
    (v_lead14, 'Cipla Limited',             'Dr. Rajiv Shah',  'rajiv.shah@cipla.com',           '+91-22-2482-6000', 'partner',   'Qualified',   'Medium', 1600000.00, 'Desktop + Printer',            v_user_vikram, v_partner7,  'Pharma company refreshing office IT. 200 desktops + 50 printers.',                 '2026-04-30', NULL, '2026-02-19'),
    (v_lead15, 'Mindtree Limited',          'Kiran Desai',     'kiran.desai@mindtree.com',      '+91-80-6706-4000', 'referral',  'New',         'Low',    750000.00,  'Carepack Renewal',             v_user_snehal, v_partner3,  'Existing carepack renewal. Low effort, steady revenue.',                            '2026-03-31', NULL, '2026-02-22');

    -- ============================================================
    -- LEAD ACTIVITIES (20 rows) - activity trail for leads
    -- ============================================================
    INSERT INTO lead_activities (id, lead_id, activity_type, title, description, created_by, created_at) VALUES
    (uuid_generate_v4(), v_lead1,  'note',    'Initial lead captured',         'Lead from Datacomp referral. Ashok Bajaj is CTO of Bajaj Finserv, looking for 40 servers.',                      v_admin_id, '2026-01-25 10:00:00+05:30'),
    (uuid_generate_v4(), v_lead1,  'email',   'Sent product catalog',          'Emailed HPE ProLiant DL380 Gen11 catalog and pricing matrix.',                                                    v_admin_id, '2026-01-27 14:30:00+05:30'),
    (uuid_generate_v4(), v_lead2,  'meeting', 'HPE Discover booth meeting',    'Met Deepak Gupta at HPE Discover event. Discussed 5G infra requirements and GreenLake.',                          v_admin_id, '2026-01-20 11:00:00+05:30'),
    (uuid_generate_v4(), v_lead2,  'call',    'Follow-up call',                'Called to discuss timeline. Jio plans phased rollout starting Q2 2026.',                                            v_admin_id, '2026-02-01 15:00:00+05:30'),
    (uuid_generate_v4(), v_lead3,  'call',    'Cold call - initial contact',   'Reached Pradeep Rana. HDFC expanding storage. Currently evaluating HPE Alletra vs NetApp.',                        v_user_rahul, '2026-01-15 10:30:00+05:30'),
    (uuid_generate_v4(), v_lead3,  'email',   'Sent HPE Alletra 9000 brief',   'Shared product overview, case studies from banking sector, and competitive comparison.',                           v_user_rahul, '2026-01-18 11:00:00+05:30'),
    (uuid_generate_v4(), v_lead3,  'meeting', 'Technical discussion at HDFC',  'Presented Alletra 9000 solution to HDFC infra team. Positive response on cloud-native features.',                  v_user_rahul, '2026-01-28 14:00:00+05:30'),
    (uuid_generate_v4(), v_lead4,  'note',    'Website inquiry captured',      'Mahindra IT team submitted inquiry via website for mixed Dell+HPE solution.',                                      v_user_snehal, '2026-01-10 09:00:00+05:30'),
    (uuid_generate_v4(), v_lead4,  'call',    'Requirements discussion',       'Spoke with Vijay about manufacturing floor server needs. Prefers Dell for compute, HPE for network.',              v_user_snehal, '2026-01-12 16:00:00+05:30'),
    (uuid_generate_v4(), v_lead4,  'email',   'Sent proposal',                 'Shared combined Dell PowerEdge + HPE Aruba networking proposal.',                                                   v_user_snehal, '2026-01-22 10:00:00+05:30'),
    (uuid_generate_v4(), v_lead5,  'call',    'Referral follow-up',            'Nexus IT referred ICICI Pru. Sunita needs server farm expansion with 3-year carepack.',                             v_admin_id, '2026-01-08 11:30:00+05:30'),
    (uuid_generate_v4(), v_lead5,  'meeting', 'Site visit at ICICI Pru',       'Visited ICICI Prudential DC in Mumbai. Assessed current infra and expansion requirements.',                        v_admin_id, '2026-01-15 14:00:00+05:30'),
    (uuid_generate_v4(), v_lead5,  'email',   'Sent commercial proposal',      'Shared detailed commercial proposal with 3-year carepack pricing and SLA terms.',                                  v_admin_id, '2026-01-25 10:00:00+05:30'),
    (uuid_generate_v4(), v_lead5,  'call',    'Negotiation discussion',        'Price negotiation call. ICICI asking for 8% additional discount. Escalating to HPE for special pricing.',           v_admin_id, '2026-02-03 15:30:00+05:30'),
    (uuid_generate_v4(), v_lead9,  'meeting', 'MWC booth interaction',         'Met Rohit at Mobile World Congress. Airtel has massive 5G server requirement across India.',                        v_admin_id, '2026-01-28 12:00:00+05:30'),
    (uuid_generate_v4(), v_lead11, 'note',    'Lead converted to deal',        'Successfully converted to deal. LTIMindtree signed for full infrastructure modernization.',                         v_admin_id, '2026-01-15 16:00:00+05:30'),
    (uuid_generate_v4(), v_lead12, 'call',    'Initial outreach',              'Cold called Adani Green Energy. They are evaluating GreenLake for their operations.',                               v_user_snehal, '2025-12-10 10:00:00+05:30'),
    (uuid_generate_v4(), v_lead12, 'meeting', 'Presentation at Adani',         'Presented HPE GreenLake vs Azure Stack. They leaned towards Azure ecosystem.',                                     v_user_snehal, '2026-01-05 11:00:00+05:30'),
    (uuid_generate_v4(), v_lead12, 'note',    'Lead lost to competitor',       'Adani chose Microsoft Azure Stack HCI. Key factor: existing Microsoft EA agreement.',                               v_user_snehal, '2026-01-31 09:00:00+05:30'),
    (uuid_generate_v4(), v_lead13, 'email',   'Product inquiry response',      'Responded to Flipkart''s website inquiry. Shared HPE server and Aruba networking catalogs.',                       v_user_rahul, '2026-02-01 10:00:00+05:30');

    -- ============================================================
    -- SALES ENTRIES (15 rows) - completed sales transactions
    -- ============================================================
    INSERT INTO sales_entries (id, partner_id, product_id, salesperson_id, customer_name, quantity, amount, po_number, invoice_no, payment_status, commission_amount, sale_date, location_id, vertical_id, notes) VALUES
    (uuid_generate_v4(), v_partner1, v_prod_hpe_svr,    v_admin_id,    'LTIMindtree',                  20,  3100000.00, 'PO-LTI-2026-001',  'INV-2026-001', 'paid',      93000.00,  '2026-01-15', v_loc_mumbai,    v_vert_it,         'Phase 1 of infra modernization. 20 HPE ProLiant DL380.'),
    (uuid_generate_v4(), v_partner1, v_prod_network,    v_admin_id,    'LTIMindtree',                  1,   1500000.00, 'PO-LTI-2026-002',  'INV-2026-002', 'paid',      45000.00,  '2026-01-16', v_loc_mumbai,    v_vert_it,         'Aruba networking for infra modernization.'),
    (uuid_generate_v4(), v_partner1, v_prod_hpe_stg,    v_admin_id,    'LTIMindtree',                  1,   1600000.00, 'PO-LTI-2026-003',  'INV-2026-003', 'paid',      48000.00,  '2026-01-17', v_loc_mumbai,    v_vert_it,         'HPE storage for infra modernization project.'),
    (uuid_generate_v4(), v_partner3, v_prod_workstation,v_user_snehal, 'Persistent Systems',           200, 2400000.00, 'PO-PERS-2026-001', 'INV-2026-004', 'paid',      72000.00,  '2026-01-30', v_loc_pune,      v_vert_it,         '200 HP ZBook Fury 16 workstations.'),
    (uuid_generate_v4(), v_partner2, v_prod_hpe_svr,    v_user_rahul,  'HDFC Bank - Data Center',      10,  1800000.00, 'PO-HDFC-2026-001', 'INV-2026-005', 'paid',      54000.00,  '2026-01-20', v_loc_mumbai,    v_vert_bfsi,       'HDFC Bank server refresh - Phase 1.'),
    (uuid_generate_v4(), v_partner5, v_prod_dell_svr,   v_user_snehal, 'Mahindra & Mahindra',          5,   850000.00,  'PO-MAH-2026-001',  'INV-2026-006', 'paid',      25500.00,  '2026-01-25', v_loc_pune,      v_vert_enterprise, 'Dell servers for manufacturing floor.'),
    (uuid_generate_v4(), v_partner4, v_prod_laptop,     v_user_vikram, 'Delhi Police HQ',              100, 750000.00,  'PO-DLPOL-2026-001','INV-2026-007', 'pending',   22500.00,  '2026-02-01', v_loc_delhi,     v_vert_govt,       'Laptop procurement for Delhi Police. GeM order.'),
    (uuid_generate_v4(), v_partner8, v_prod_laptop,     v_admin_id,    'Symbiosis International Univ', 250, 1875000.00, 'PO-SIU-2026-001',  'INV-2026-008', 'pending',   56250.00,  '2026-02-03', v_loc_pune,      v_vert_edu,        'Student laptop program. HP 250 G9 series.'),
    (uuid_generate_v4(), v_partner7, v_prod_desktop,    v_user_vikram, 'Gujarat Cooperative Bank',     50,  375000.00,  'PO-GCB-2026-001',  'INV-2026-009', 'paid',      11250.00,  '2026-01-28', NULL,            v_vert_bfsi,       'Desktop refresh for 50 branch offices.'),
    (uuid_generate_v4(), v_partner6, v_prod_hpe_svr,    v_user_rahul,  'SBI General Insurance',        8,   1440000.00, 'PO-SBIG-2026-001', 'INV-2026-010', 'pending',   43200.00,  '2026-02-05', v_loc_mumbai,    v_vert_bfsi,       'HPE ProLiant servers for disaster recovery.'),
    (uuid_generate_v4(), v_partner1, v_prod_carepack,   v_admin_id,    'TCS - Data Center',            50,  500000.00,  'PO-TCS-2026-001',  'INV-2026-011', 'paid',      15000.00,  '2026-01-10', v_loc_pune,      v_vert_it,         'Carepack renewal for existing HPE server fleet.'),
    (uuid_generate_v4(), v_partner3, v_prod_hpe_svr,    v_user_snehal, 'Wipro - Cloud Ops Center',     15,  2700000.00, 'PO-WIP-2026-001',  'INV-2026-012', 'overdue',   81000.00,  '2026-01-05', v_loc_bangalore, v_vert_it,         'HPE servers for Wipro managed services. Payment overdue.'),
    (uuid_generate_v4(), v_partner2, v_prod_printer,    v_user_rahul,  'ICICI Bank - Branch Office',   30,  450000.00,  'PO-ICICI-2026-001','INV-2026-013', 'paid',      13500.00,  '2026-01-22', v_loc_mumbai,    v_vert_bfsi,       'HP LaserJet Enterprise printers for branch offices.'),
    (uuid_generate_v4(), v_partner5, v_prod_monitor,    v_user_snehal, 'Infosys - Pune Campus',        100, 600000.00,  'PO-INFY-2026-001', 'INV-2026-014', 'paid',      18000.00,  '2026-01-18', v_loc_pune,      v_vert_it,         'HP M27h monitors for Infosys Hinjawadi campus.'),
    (uuid_generate_v4(), v_partner4, v_prod_hpe_svr,    v_user_vikram, 'Indian Railways IRCTC',        12,  2160000.00, 'PO-IRCTC-2026-001','INV-2026-015', 'pending',   64800.00,  '2026-02-04', v_loc_delhi,     v_vert_govt,       'HPE servers for IRCTC ticketing infrastructure upgrade.');

    -- ============================================================
    -- TASKS (12 rows) - mix of types and statuses
    -- ============================================================
    INSERT INTO tasks (id, title, description, type, status, priority, due_date, due_time, assigned_to, created_by, completed_at, related_to_type, related_to_id) VALUES
    (uuid_generate_v4(), 'Follow up with Rajesh on TCS server quote',       'Call Rajesh Sharma to discuss the revised pricing for the 50-unit HPE ProLiant order.',                         'Call',    'Pending',     'High',   '2026-02-03', '10:00:00', v_admin_id,    v_admin_id, NULL, 'deal', v_deal1),
    (uuid_generate_v4(), 'Send Wipro TCO comparison document',               'Prepare and email the total cost of ownership analysis comparing HPE Synergy vs. competitors.',              'Email',   'Pending',     'High',   '2026-02-05', '14:00:00', v_admin_id,    v_admin_id, NULL, 'deal', v_deal5),
    (uuid_generate_v4(), 'Schedule GreenLake demo for Infosys',              'Coordinate with HPE team to schedule a GreenLake workshop at Infosys Bangalore campus.',                     'Meeting', 'In Progress', 'High',   '2026-02-10', '11:00:00', v_admin_id,    v_admin_id, NULL, 'deal', v_deal3),
    (uuid_generate_v4(), 'Prepare HCL Phase 2 commercial proposal',         'Finalize pricing with 12% volume discount and prepare commercial proposal document.',                        'Email',   'In Progress', 'High',   '2026-02-12', '16:00:00', v_admin_id,    v_admin_id, NULL, 'deal', v_deal6),
    (uuid_generate_v4(), 'Call Suresh for Tech Mahindra 5G requirements',    'Discuss detailed requirements for 5G lab servers including GPU configurations.',                              'Call',    'Pending',     'Medium', '2026-02-14', '10:30:00', v_user_rahul,  v_admin_id, NULL, 'deal', v_deal7),
    (uuid_generate_v4(), 'Demo HPE Alletra 9000 to Infosys team',           'Set up a virtual demo of HPE Alletra 9000 storage for the Infosys BPO team.',                                'Demo',    'Pending',     'Medium', '2026-02-18', '15:00:00', v_admin_id,    v_admin_id, NULL, 'deal', v_deal4),
    (uuid_generate_v4(), 'Follow up on Zensar proposal',                     'Check with Rahul Verma if Zensar has reviewed the datacenter upgrade proposal.',                             'Call',    'Pending',     'Medium', '2026-02-20', '11:00:00', v_user_rahul,  v_admin_id, NULL, 'deal', v_deal10),
    (uuid_generate_v4(), 'Send Coforge GreenLake pilot proposal',           'Prepare and send the initial GreenLake pilot proposal with 5-node configuration and pricing.',                'Email',   'Pending',     'Low',    '2026-02-25', '14:00:00', v_user_snehal, v_admin_id, NULL, 'deal', v_deal12),
    (uuid_generate_v4(), 'Quarterly review meeting with TCS',               'Prepare agenda and schedule QBR with TCS procurement and IT teams.',                                          'Meeting', 'Pending',     'High',   '2026-02-28', '10:00:00', v_admin_id,    v_admin_id, NULL, 'account', v_acc_tcs),
    (uuid_generate_v4(), 'Review pending partner applications',              'Review and approve/reject 3 pending partner applications: Cyber Systems, InfraOne, Horizon IT.',              'Email',   'Pending',     'Medium', '2026-02-15', '09:00:00', v_admin_id,    v_admin_id, NULL, NULL, NULL),
    (uuid_generate_v4(), 'Send LTIMindtree delivery schedule',              'Shared the delivery schedule for the infra modernization project equipment.',                                  'Email',   'Completed',   'High',   '2026-01-20', '10:00:00', v_admin_id,    v_admin_id, '2026-01-19 16:30:00+05:30', 'deal', v_deal8),
    (uuid_generate_v4(), 'Persistent workstation PO confirmation call',     'Confirmed the PO details and delivery timeline for 200 ZBook workstations.',                                   'Call',    'Completed',   'High',   '2026-01-28', '11:00:00', v_user_snehal, v_admin_id, '2026-01-27 14:00:00+05:30', 'deal', v_deal9);

    -- ============================================================
    -- CALENDAR EVENTS (10 rows) - spread across Feb 2026
    -- ============================================================
    INSERT INTO calendar_events (id, title, description, type, start_time, end_time, all_day, location, meeting_link, owner_id, color, related_to_type, related_to_id) VALUES
    (uuid_generate_v4(), 'TCS Server Deal - Negotiation Call',        'Discuss revised pricing and volume discounts for the 50-unit HPE ProLiant order.',     'Call',    '2026-02-10 10:00:00+05:30', '2026-02-10 10:45:00+05:30', FALSE, NULL,                                      'https://meet.google.com/abc-defg-hij', v_admin_id, '#3B82F6', 'deal',    v_deal1),
    (uuid_generate_v4(), 'Infosys GreenLake Workshop',                'HPE GreenLake workshop and demo at Infosys Bangalore campus.',                         'Meeting', '2026-02-12 09:30:00+05:30', '2026-02-12 16:30:00+05:30', FALSE, 'Infosys Campus, Electronic City, Bangalore', NULL,                              v_admin_id, '#10B981', 'deal',    v_deal3),
    (uuid_generate_v4(), 'HCL Phase 2 - Commercial Review',          'Review final commercial terms for Phase 2 server expansion.',                           'Meeting', '2026-02-13 14:00:00+05:30', '2026-02-13 15:30:00+05:30', FALSE, 'HCL Office, Noida Sector 126',               NULL,                              v_admin_id, '#10B981', 'deal',    v_deal6),
    (uuid_generate_v4(), 'Tech Mahindra 5G Lab Requirements Call',    'Technical discussion on 5G lab server requirements with GPU configurations.',          'Call',    '2026-02-14 11:00:00+05:30', '2026-02-14 12:00:00+05:30', FALSE, NULL,                                      'https://teams.microsoft.com/l/meetup/xyz', v_user_rahul, '#3B82F6', 'deal', v_deal7),
    (uuid_generate_v4(), 'Wipro Hybrid Cloud - TCO Presentation',     'Present TCO analysis for HPE Synergy composable infrastructure.',                      'Demo',    '2026-02-17 10:00:00+05:30', '2026-02-17 11:30:00+05:30', FALSE, 'Wipro, Sarjapur Road, Bangalore',            'https://meet.google.com/klm-nopq-rst', v_admin_id, '#8B5CF6', 'deal',    v_deal5),
    (uuid_generate_v4(), 'HPE Alletra 9000 Demo - Infosys',          'Virtual demo of HPE Alletra 9000 storage for Infosys BPO team.',                        'Demo',    '2026-02-19 15:00:00+05:30', '2026-02-19 16:30:00+05:30', FALSE, NULL,                                      'https://zoom.us/j/1234567890',          v_admin_id, '#8B5CF6', 'deal',    v_deal4),
    (uuid_generate_v4(), 'Zensar Proposal Review Follow-up',          'Follow up with Rahul Verma on the datacenter upgrade proposal feedback.',              'Call',    '2026-02-20 11:00:00+05:30', '2026-02-20 11:30:00+05:30', FALSE, NULL,                                      NULL,                                    v_user_rahul, '#3B82F6', 'deal',    v_deal10),
    (uuid_generate_v4(), 'Monthly Sales Review - February',           'Monthly sales pipeline review and forecasting meeting.',                                'Meeting', '2026-02-21 10:00:00+05:30', '2026-02-21 12:00:00+05:30', FALSE, 'Comprint Office, Baner, Pune',               NULL,                              v_admin_id, '#F59E0B', NULL,      NULL),
    (uuid_generate_v4(), 'Coforge GreenLake Pilot Discussion',        'Discuss GreenLake pilot scope and configuration with Sanjay Tiwari.',                  'Meeting', '2026-02-24 14:00:00+05:30', '2026-02-24 15:00:00+05:30', FALSE, 'Coforge Office, Noida',                      'https://meet.google.com/uvw-xyza-bcd', v_user_snehal, '#EC4899', 'deal',    v_deal12),
    (uuid_generate_v4(), 'TCS Quarterly Business Review',             'Quarterly business review with TCS procurement and IT teams.',                          'Meeting', '2026-02-28 10:00:00+05:30', '2026-02-28 12:00:00+05:30', FALSE, 'TCS Sahyadri Park, Pune',                    NULL,                              v_admin_id, '#10B981', 'account', v_acc_tcs);

    -- ============================================================
    -- QUOTES (5 rows) - various statuses
    -- ============================================================
    INSERT INTO quotes (id, quote_number, lead_id, partner_id, customer_name, valid_until, subtotal, tax_rate, tax_amount, discount_amount, total_amount, status, terms, notes, created_by) VALUES
    (v_quote1, 'QT-2026-001', v_lead1,  v_partner1, 'Bajaj Finserv',            '2026-03-15', 4237288.14, 18.00, 762711.86, 500000.00, 4500000.00, 'sent',     'Payment: Net 30 from invoice date. Delivery: 4-6 weeks from PO.', 'HPE ProLiant DL380 Gen11 servers for new data center.', v_admin_id),
    (v_quote2, 'QT-2026-002', v_lead3,  v_partner2, 'HDFC Bank',                '2026-03-28', 6440677.97, 18.00, 1159322.03, 800000.00, 6800000.00, 'sent',    'Payment: Net 45. Installation support included.', 'HPE Alletra 9000 storage solution for HDFC data center.', v_user_rahul),
    (v_quote3, 'QT-2026-003', v_lead4,  v_partner5, 'Mahindra & Mahindra',      '2026-02-28', 3050847.46, 18.00, 549152.54, 400000.00, 3200000.00, 'accepted', 'Payment: Net 30. GeM compliant pricing.', 'Dell PowerEdge servers + HPE Aruba networking.', v_user_snehal),
    (v_quote4, 'QT-2026-004', v_lead5,  v_partner6, 'ICICI Prudential',         '2026-03-10', 5084745.76, 18.00, 915254.24, 500000.00, 5500000.00, 'draft',   'Payment: Net 30. 3-year carepack included.', 'HPE ProLiant servers with extended warranty.', v_admin_id),
    (v_quote5, 'QT-2026-005', v_lead10, v_partner1, 'Serum Institute of India', '2026-03-20', 2542372.88, 18.00, 457627.12, 200000.00, 2800000.00, 'sent',    'Payment: Advance 50%, balance on delivery.', 'HPE servers + storage for cold storage monitoring.', v_user_rahul);

    -- ============================================================
    -- QUOTE LINE ITEMS (12 rows)
    -- ============================================================
    INSERT INTO quote_line_items (id, quote_id, product_id, description, quantity, unit_price, discount_pct, line_total, sort_order) VALUES
    (uuid_generate_v4(), v_quote1, v_prod_hpe_svr,  'HPE ProLiant DL380 Gen11 - 5th Gen Intel Xeon',    40, 95000.00,  10, 3420000.00, 1),
    (uuid_generate_v4(), v_quote1, v_prod_carepack, 'HPE 3-Year Foundation Care 24x7',                   40, 22000.00,  5,  836000.00,  2),
    (uuid_generate_v4(), v_quote2, v_prod_hpe_stg,  'HPE Alletra 9060 - 100TB Raw',                      2,  2800000.00, 8, 5152000.00, 1),
    (uuid_generate_v4(), v_quote2, v_prod_carepack, 'HPE 3-Year Proactive Care 24x7 - Storage',          2,  650000.00,  5, 1235000.00, 2),
    (uuid_generate_v4(), v_quote3, v_prod_dell_svr, 'Dell PowerEdge R750xs',                              5,  185000.00,  5, 878750.00,  1),
    (uuid_generate_v4(), v_quote3, v_prod_network,  'HPE Aruba CX 6300M 48G Switch',                      10, 125000.00,  8, 1150000.00, 2),
    (uuid_generate_v4(), v_quote3, v_prod_carepack, 'HPE Aruba 3-Year Foundation Care',                   10, 35000.00,   0, 350000.00,  3),
    (uuid_generate_v4(), v_quote4, v_prod_hpe_svr,  'HPE ProLiant DL360 Gen11',                           25, 165000.00,  10, 3712500.00, 1),
    (uuid_generate_v4(), v_quote4, v_prod_carepack, 'HPE 3-Year Foundation Care 24x7',                    25, 28000.00,   5,  665000.00,  2),
    (uuid_generate_v4(), v_quote5, v_prod_hpe_svr,  'HPE ProLiant DL380 Gen11 - Cold Storage Optimized',  8,  175000.00,  5, 1330000.00, 1),
    (uuid_generate_v4(), v_quote5, v_prod_hpe_stg,  'HPE MSA 2062 - 24TB SAS',                            2,  450000.00,  5, 855000.00,  2),
    (uuid_generate_v4(), v_quote5, v_prod_carepack, 'HPE 3-Year Proactive Care',                           10, 18000.00,   0, 180000.00,  3);

    -- ============================================================
    -- CAREPACKS (10 rows) - mix of active, expiring, expired
    -- ============================================================
    INSERT INTO carepacks (id, partner_id, product_type, serial_number, carepack_sku, customer_name, start_date, end_date, status, notes, created_by) VALUES
    (uuid_generate_v4(), v_partner1, 'HPE ProLiant DL380 Gen10', 'SGH825XY01', 'U9RN1E',  'Tata Consultancy Services',   '2024-03-15', '2027-03-14', 'active',    '3-year Foundation Care 24x7. 20 servers covered.',        v_admin_id),
    (uuid_generate_v4(), v_partner1, 'HPE ProLiant DL360 Gen10', 'SGH926AB02', 'U9RN2E',  'Tata Consultancy Services',   '2024-06-01', '2027-05-31', 'active',    '3-year Foundation Care NBD. 15 servers.',                  v_admin_id),
    (uuid_generate_v4(), v_partner2, 'HPE Alletra 6000',         'SGH730CD03', 'R4Q24A',  'HDFC Bank',                   '2025-01-10', '2028-01-09', 'active',    '3-year Proactive Care 24x7 for storage.',                  v_user_rahul),
    (uuid_generate_v4(), v_partner3, 'HPE ProLiant DL380 Gen11', 'SGH440EF04', 'U9RN3E',  'Wipro Limited',               '2025-08-20', '2028-08-19', 'active',    '3-year Foundation Care 24x7. 15 servers.',                 v_user_snehal),
    (uuid_generate_v4(), v_partner5, 'HPE Aruba CX 6300',        'SGH550GH05', 'R4Q30A',  'Infosys Limited',             '2025-04-01', '2026-03-31', 'active',    '1-year Foundation Care NBD. Expiring soon - renewal needed.',  v_user_snehal),
    (uuid_generate_v4(), v_partner1, 'HPE ProLiant DL380 Gen10', 'SGH660IJ06', 'U9RN1E',  'LTIMindtree',                 '2023-07-01', '2026-06-30', 'active',    '3-year FC 24x7. Renewal discussion due in Q1.',           v_admin_id),
    (uuid_generate_v4(), v_partner4, 'HP LaserJet Enterprise',   'SGH770KL07', 'U9HP1E',  'Delhi Police HQ',             '2025-10-01', '2026-09-30', 'active',    '1-year NBD warranty for 50 printers.',                     v_user_vikram),
    (uuid_generate_v4(), v_partner7, 'HP ProDesk 400 G7',        'SGH880MN08', 'U9HP2E',  'Gujarat Cooperative Bank',    '2024-12-01', '2025-11-30', 'expired',   'Expired. Follow up for renewal.',                          v_user_vikram),
    (uuid_generate_v4(), v_partner2, 'HPE StoreEasy 1660',       'SGH990OP09', 'R4Q25A',  'Mphasis',                     '2023-11-15', '2025-11-14', 'expired',   'Expired. Account on hold - do not pursue.',                v_admin_id),
    (uuid_generate_v4(), v_partner8, 'HP ZBook Fury 16 G10',     'SGH100QR10', 'U9HP3E',  'Persistent Systems',          '2026-01-30', '2029-01-29', 'active',    '3-year ADP warranty for 200 workstations.',                v_user_snehal);

    -- ============================================================
    -- EMAIL TEMPLATES (5 rows)
    -- ============================================================
    INSERT INTO email_templates (id, name, subject, body, category, owner_id) VALUES
    (v_tmpl_followup, 'Follow-Up After Meeting',    'Follow-up: {{meeting_topic}} - Comprint Technologies',
     'Dear {{contact_name}},

Thank you for taking the time to meet with us regarding {{meeting_topic}}.

As discussed, I am sharing the following:
{{discussion_points}}

Please let me know if you need any additional information or clarification.

Looking forward to our continued partnership.

Best regards,
{{sender_name}}
Comprint Technologies Pvt. Ltd.
Pune | Mumbai | Bangalore',
     'Follow-up', v_admin_id),

    (v_tmpl_welcome, 'Welcome - New Account',       'Welcome to Comprint Technologies - Your Trusted IT Partner',
     'Dear {{contact_name}},

We are delighted to welcome {{company_name}} as a valued partner of Comprint Technologies.

As one of India''s leading IT distribution and solutions companies, we offer:
- HPE Servers, Storage & Networking
- HP Inc Laptops, Desktops & Workstations
- Dell, Lenovo & other OEM products
- Managed Services & Carepack Solutions

Your dedicated account manager is {{sender_name}}.

We look forward to a successful partnership.

Warm regards,
{{sender_name}}
Comprint Technologies Pvt. Ltd.',
     'Welcome', v_admin_id),

    (v_tmpl_proposal, 'Proposal Submission',         'Commercial Proposal: {{deal_name}} | Comprint Technologies',
     'Dear {{contact_name}},

Please find attached the commercial proposal for {{deal_name}}.

Proposal Highlights:
- Solution: {{solution_summary}}
- Total Value: INR {{total_value}}
- Validity: 30 days from date of proposal

Key benefits of choosing Comprint:
1. Authorized HPE Platinum Partner
2. Pan-India delivery and support
3. Dedicated post-sales support team
4. Competitive pricing with flexible payment terms

Best regards,
{{sender_name}}
Comprint Technologies Pvt. Ltd.',
     'Sales', v_admin_id),

    (v_tmpl_meeting, 'Meeting Request',             'Meeting Request: {{meeting_topic}} | Comprint Technologies',
     'Dear {{contact_name}},

I would like to request a meeting to discuss {{meeting_topic}}.

Agenda:
{{agenda_points}}

Could you please share your availability for the following slots:
- {{slot_1}}
- {{slot_2}}

Best regards,
{{sender_name}}
Comprint Technologies Pvt. Ltd.',
     'Meeting', v_admin_id),

    (v_tmpl_thankyou, 'Thank You - Deal Closed',    'Thank You for Choosing Comprint Technologies',
     'Dear {{contact_name}},

Thank you for placing your trust in Comprint Technologies for {{deal_name}}.

Next steps:
1. Order confirmation within 24 hours
2. Dedicated implementation coordinator assignment
3. Post-delivery support activation

Warm regards,
{{sender_name}}
Comprint Technologies Pvt. Ltd.',
     'Post-Sale', v_admin_id);

    -- ============================================================
    -- EMAILS (10 rows) - mix of draft, sent, scheduled
    -- ============================================================
    INSERT INTO emails (id, subject, body, from_address, to_address, cc, bcc, status, sent_at, scheduled_at, related_to_type, related_to_id, template_id, owner_id) VALUES
    (uuid_generate_v4(), 'Follow-up: HPE ProLiant DL380 Discussion',
     'Dear Rajesh,

Thank you for meeting with us regarding the HPE ProLiant DL380 Gen11 procurement. Revised pricing for 50 units with 15% volume discount is attached.

Best regards,
Admin
Comprint Technologies',
     'admin@comprint.in', 'rajesh.sharma@tcs.com', 'priya.nair@tcs.com', NULL,
     'sent', '2026-02-01 10:30:00+05:30', NULL, 'deal', v_deal1, v_tmpl_followup, v_admin_id),

    (uuid_generate_v4(), 'Welcome to Comprint Technologies',
     'Dear Sanjay,

We are delighted to welcome Coforge Limited as a valued partner. Your dedicated account manager will be in touch.

Warm regards,
Admin
Comprint Technologies',
     'admin@comprint.in', 'sanjay.tiwari@coforge.com', 'nisha.agarwal@coforge.com', NULL,
     'sent', '2026-01-25 09:00:00+05:30', NULL, 'account', v_acc_coforge, v_tmpl_welcome, v_admin_id),

    (uuid_generate_v4(), 'Commercial Proposal: Wipro Hybrid Cloud',
     'Dear Vikram,

Please find the commercial proposal for the Wipro Hybrid Cloud Infrastructure project.
Solution: HPE Synergy composable compute with OneView management
Total Value: INR 55,00,000

Best regards,
Admin
Comprint Technologies',
     'admin@comprint.in', 'vikram.singh@wipro.com', NULL, NULL,
     'sent', '2026-02-03 14:00:00+05:30', NULL, 'deal', v_deal5, v_tmpl_proposal, v_admin_id),

    (uuid_generate_v4(), 'Thank You - LTIMindtree Infra Modernization',
     'Dear Kavita,

Thank you for choosing Comprint Technologies for the LTIMindtree Infrastructure Modernization project. Order confirmation and delivery timeline within 24 hours.

Warm regards,
Admin',
     'admin@comprint.in', 'kavita.joshi@ltimindtree.com', NULL, NULL,
     'sent', '2026-01-16 11:00:00+05:30', NULL, 'deal', v_deal8, v_tmpl_thankyou, v_admin_id),

    (uuid_generate_v4(), 'HPE Alletra 9000 - Product Overview',
     'Dear Sneha,

Sharing the HPE Alletra 9000 overview and initial pricing for your evaluation. Key features: cloud-native data infrastructure, 99.9999% availability, AI-driven ops with HPE InfoSight.

Best regards,
Admin',
     'admin@comprint.in', 'sneha.kulkarni@infosys.com', 'amit.patel@infosys.com', NULL,
     'sent', '2026-02-04 16:00:00+05:30', NULL, 'deal', v_deal4, NULL, v_admin_id),

    (uuid_generate_v4(), 'Meeting Request: HPE GreenLake Workshop',
     'Dear Amit,

Requesting a meeting to discuss HPE GreenLake deployment for Infosys.

Agenda:
1. GreenLake service overview
2. Deployment architecture for 3 data centers
3. SLA and support framework

Could you confirm availability for Feb 12?

Best regards,
Admin',
     'admin@comprint.in', 'amit.patel@infosys.com', NULL, NULL,
     'scheduled', NULL, '2026-02-08 09:00:00+05:30', 'deal', v_deal3, v_tmpl_meeting, v_admin_id),

    (uuid_generate_v4(), 'Reminder: Zensar Datacenter Upgrade Proposal',
     'Dear Rahul,

Following up on the datacenter upgrade proposal shared last week. Happy to address any questions.

Best regards,
Admin',
     'admin@comprint.in', 'rahul.verma@zensar.com', NULL, NULL,
     'scheduled', NULL, '2026-02-15 10:00:00+05:30', 'deal', v_deal10, v_tmpl_followup, v_admin_id),

    (uuid_generate_v4(), 'Coforge GreenLake Pilot - Initial Proposal',
     'Dear Sanjay,

[DRAFT - Complete pricing section]

Configuration: 5x HPE ProLiant DL380 Gen11 nodes, GreenLake Cloud Platform, 24x7 support.

Best regards,
Admin',
     'admin@comprint.in', 'sanjay.tiwari@coforge.com', 'nisha.agarwal@coforge.com', NULL,
     'draft', NULL, NULL, 'deal', v_deal12, v_tmpl_proposal, v_admin_id),

    (uuid_generate_v4(), 'Tech Mahindra 5G Lab - HPE Edgeline Solutions',
     'Dear Suresh,

[DRAFT - Needs GPU config details]

HPE Edgeline EL8000: Supports up to 4 NVIDIA A100/H100 GPUs, edge-optimized for telecom.

Best regards,
Admin',
     'admin@comprint.in', 'suresh.reddy@techmahindra.com', NULL, NULL,
     'draft', NULL, NULL, 'deal', v_deal7, NULL, v_admin_id),

    (uuid_generate_v4(), 'HCL Phase 2 - Final Commercial Terms',
     'Dear Anita,

[DRAFT - Pending final discount approval from HPE]

30x HPE ProLiant DL360 Gen11, 12% volume discount, Net 30, 4-6 weeks delivery.

Best regards,
Admin',
     'admin@comprint.in', 'anita.deshmukh@hcltech.com', NULL, NULL,
     'draft', NULL, NULL, 'deal', v_deal6, NULL, v_admin_id);

    -- ============================================================
    -- NOTIFICATIONS (15 rows) - various types
    -- ============================================================
    INSERT INTO notifications (id, user_id, type, title, message, link, is_read, metadata, created_at) VALUES
    (uuid_generate_v4(), v_admin_id,    'deal',     'Deal Won: LTIMindtree Infra Modernization',     'LTIMindtree deal worth INR 62,00,000 has been closed successfully!',           '/deals',     TRUE,  ('{"dealId": "' || v_deal8 || '", "value": 6200000}')::jsonb,   '2026-01-15 16:00:00+05:30'),
    (uuid_generate_v4(), v_admin_id,    'deal',     'Deal Won: Persistent Workstations',              'Persistent Systems workstation fleet deal worth INR 24,00,000 closed!',        '/deals',     TRUE,  ('{"dealId": "' || v_deal9 || '", "value": 2400000}')::jsonb,   '2026-01-30 14:30:00+05:30'),
    (uuid_generate_v4(), v_admin_id,    'deal',     'Deal Lost: Mphasis Cloud Migration',             'Mphasis deal worth INR 31,00,000 lost to Dell PowerEdge.',                     '/deals',     TRUE,  ('{"dealId": "' || v_deal11 || '", "value": 3100000}')::jsonb,  '2026-01-10 11:00:00+05:30'),
    (uuid_generate_v4(), v_admin_id,    'partner',  'New Partner Application: Cyber Systems',          'Cyber Systems Pvt Ltd has submitted a partnership application.',               '/partners',  FALSE, ('{"partnerId": "' || v_partner9 || '"}')::jsonb,               '2026-02-01 09:30:00+05:30'),
    (uuid_generate_v4(), v_admin_id,    'partner',  'New Partner Application: InfraOne Technologies', 'InfraOne Technologies has submitted a partnership application.',                '/partners',  FALSE, ('{"partnerId": "' || v_partner10 || '"}')::jsonb,              '2026-02-02 10:00:00+05:30'),
    (uuid_generate_v4(), v_admin_id,    'partner',  'New Partner Application: Horizon IT Services',   'Horizon IT Services from Jaipur has submitted a partnership application.',      '/partners',  FALSE, ('{"partnerId": "' || v_partner11 || '"}')::jsonb,              '2026-02-03 11:15:00+05:30'),
    (uuid_generate_v4(), v_admin_id,    'task',     'Task Overdue: Follow up on TCS server quote',    'The task "Follow up with Rajesh on TCS server quote" is overdue.',             '/tasks',     FALSE, NULL,                                                   '2026-02-04 08:00:00+05:30'),
    (uuid_generate_v4(), v_admin_id,    'task',     'Task Overdue: Send Wipro TCO document',          'The task "Send Wipro TCO comparison document" is overdue.',                    '/tasks',     FALSE, NULL,                                                   '2026-02-06 08:00:00+05:30'),
    (uuid_generate_v4(), v_user_rahul,  'lead',     'New Lead Assigned: Bajaj Finserv',                'You have been assigned a new lead: Bajaj Finserv (Est. INR 45,00,000).',      '/leads',     TRUE,  ('{"leadId": "' || v_lead1 || '"}')::jsonb,                     '2026-01-25 10:30:00+05:30'),
    (uuid_generate_v4(), v_user_rahul,  'lead',     'New Lead Assigned: HDFC Bank',                    'You have been assigned a new lead: HDFC Bank (Est. INR 68,00,000).',          '/leads',     TRUE,  ('{"leadId": "' || v_lead3 || '"}')::jsonb,                     '2026-01-15 11:00:00+05:30'),
    (uuid_generate_v4(), v_user_snehal, 'deal',     'Deal Assigned: Persistent Workstations',          'You have been assigned to the Persistent Workstation Fleet deal.',             '/deals',     TRUE,  ('{"dealId": "' || v_deal9 || '"}')::jsonb,                     '2026-01-20 09:00:00+05:30'),
    (uuid_generate_v4(), v_user_snehal, 'lead',     'Lead Lost: Adani Green Energy',                   'Lead Adani Green Energy has been marked as Lost.',                             '/leads',     TRUE,  ('{"leadId": "' || v_lead12 || '"}')::jsonb,                    '2026-01-31 09:30:00+05:30'),
    (uuid_generate_v4(), v_admin_id,    'sale',     'New Sale Recorded: LTIMindtree Servers',          'Sale of INR 31,00,000 recorded for LTIMindtree HPE servers.',                 '/sales',     TRUE,  NULL,                                                   '2026-01-15 17:00:00+05:30'),
    (uuid_generate_v4(), v_admin_id,    'sale',     'Payment Overdue: Wipro Cloud Ops',                'Payment of INR 27,00,000 from Wipro Cloud Ops Center is overdue.',            '/sales',     FALSE, NULL,                                                   '2026-02-05 08:00:00+05:30'),
    (uuid_generate_v4(), v_admin_id,    'system',   'Monthly Sales Target: January Report',            'January sales: INR 1.96 Cr. Target achievement: 78%. Keep pushing!',          '/analytics', FALSE, '{"month": "January", "achievement": 78}'::jsonb,             '2026-02-01 08:00:00+05:30');

    RAISE NOTICE 'Comprehensive seed data inserted successfully!';
    RAISE NOTICE 'Users: 6, Partners: 12, Accounts: 10, Contacts: 14, Deals: 12, Leads: 15';
    RAISE NOTICE 'Sales Entries: 15, Tasks: 12, Calendar Events: 10, Email Templates: 5, Emails: 10';
    RAISE NOTICE 'Quotes: 5, Quote Line Items: 12, Carepacks: 10, Notifications: 15, Lead Activities: 20';
END $$;

COMMIT;
