-- ============================================================
-- SAMPLE DATA FOR ALL TABLES
-- Comprehensive seed data including all extended fields
-- ============================================================

-- Clear existing sample data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE deal_line_items, deals, quotes, quote_line_items, leads,
--   contacts, accounts, tasks, calendar_events, emails CASCADE;

-- ============================================================
-- 1. USERS (Sales Reps)
-- ============================================================
INSERT INTO users (id, name, email, role, is_active, password_hash)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'John Smith', 'john.smith@comprint.com', 'salesperson', true, '$2b$12$LKGtTdpVEjNuNvLXRZiMdOd7bVU.Jox6zvT0p/C4WQQjr/rJZqZ0a'),
  ('22222222-2222-2222-2222-222222222222', 'Sarah Johnson', 'sarah.johnson@comprint.com', 'salesperson', true, '$2b$12$LKGtTdpVEjNuNvLXRZiMdOd7bVU.Jox6zvT0p/C4WQQjr/rJZqZ0a'),
  ('33333333-3333-3333-3333-333333333333', 'Michael Chen', 'michael.chen@comprint.com', 'salesmanager', true, '$2b$12$LKGtTdpVEjNuNvLXRZiMdOd7bVU.Jox6zvT0p/C4WQQjr/rJZqZ0a')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. PARTNERS
-- ============================================================
INSERT INTO partners (id, company_name, contact_person, email, phone, mobile, gst_number, pan_number, address, city, state, pincode, partner_type, vertical, status, tier, assigned_to)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'TechVendor Solutions', 'Mark Johnson', 'contact@techvendor.com', '+1-555-0101', '+1-555-0102', '29ABCTECH1234A1Z', 'ABCTECH1234', '123 Tech Park', 'San Francisco', 'California', '94102', 'Channel Partner', 'Technology', 'active', 'gold', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Global Distributors Inc', 'Lisa Chen', 'sales@globaldist.com', '+1-555-0103', '+1-555-0104', '29XYZGLOB5678B2Y', 'XYZGLOB5678', '456 Distribution Avenue', 'Chicago', 'Illinois', '60601', 'Distributor', 'General', 'active', 'silver', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. ACCOUNTS (with all extended fields)
-- ============================================================
INSERT INTO accounts (
  id, name, industry, website, revenue, employees, location, type, status,
  phone, email, health_score, description, owner_id,
  gstin_no, payment_terms, account_image, group_name, parent_account_id,
  endcustomer_category, products_selling_to_them, products_they_sell,
  pan_no, partner_id, lead_category, new_leads,
  references_doc, bank_statement_doc,
  contact_name, contact_email, contact_phone, contact_designation, contact_designation_other,
  billing_street, billing_city, billing_state, billing_code, billing_country,
  shipping_street, shipping_city, shipping_state, shipping_code, shipping_country
)
VALUES
  (
    'a1111111-1111-1111-1111-111111111111',
    'Acme Corporation',
    'Technology',
    'www.acmecorp.com',
    5000000.00,
    250,
    'San Francisco, CA',
    'Enterprise',
    'active',
    '+1-415-555-0001',
    'contact@acmecorp.com',
    85,
    'Leading enterprise software company specializing in cloud solutions',
    '11111111-1111-1111-1111-111111111111',
    '29ABCDE1234F1Z5',
    'Net 30',
    'https://via.placeholder.com/150',
    'Enterprise Tech Group',
    NULL,
    'Direct Customer',
    'Cloud Services, Security Solutions',
    'Enterprise Software, SaaS Platforms',
    'ABCDE1234F',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Hot',
    5,
    'ref_doc_acme.pdf',
    'bank_stmt_acme.pdf',
    'Robert Williams',
    'robert.williams@acmecorp.com',
    '+1-415-555-0002',
    'CTO',
    NULL,
    '123 Market Street, Suite 500',
    'San Francisco',
    'California',
    '94102',
    'USA',
    '123 Market Street, Suite 500',
    'San Francisco',
    'California',
    '94102',
    'USA'
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    'Global Manufacturing Ltd',
    'Manufacturing',
    'www.globalmanuf.com',
    12000000.00,
    500,
    'Chicago, IL',
    'Enterprise',
    'active',
    '+1-312-555-0001',
    'info@globalmanuf.com',
    92,
    'Industrial manufacturing company with focus on automation',
    '22222222-2222-2222-2222-222222222222',
    '29XYZAB5678G2H1',
    'Net 45',
    'https://via.placeholder.com/150',
    'Manufacturing Group',
    NULL,
    'Channel Partner',
    'IoT Devices, Networking Equipment',
    'Industrial Machinery, Automation Systems',
    'XYZAB5678G',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Warm',
    3,
    'ref_doc_global.pdf',
    'bank_stmt_global.pdf',
    'Jennifer Davis',
    'jennifer.davis@globalmanuf.com',
    '+1-312-555-0002',
    'VP Operations',
    NULL,
    '456 Industrial Parkway',
    'Chicago',
    'Illinois',
    '60601',
    'USA',
    '789 Warehouse District',
    'Chicago',
    'Illinois',
    '60602',
    'USA'
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    'Retail Innovations Inc',
    'Retail',
    'www.retailinnov.com',
    3500000.00,
    150,
    'Austin, TX',
    'Mid-Market',
    'active',
    '+1-512-555-0001',
    'sales@retailinnov.com',
    78,
    'Retail technology solutions provider',
    '33333333-3333-3333-3333-333333333333',
    '29PQRST9012K3L4',
    'Net 30',
    'https://via.placeholder.com/150',
    'Retail Tech Group',
    NULL,
    'Reseller',
    'POS Systems, Payment Gateways',
    'Retail Software, E-commerce Platforms',
    'PQRST9012K',
    NULL,
    'Cold',
    8,
    'ref_doc_retail.pdf',
    'bank_stmt_retail.pdf',
    'David Martinez',
    'david.martinez@retailinnov.com',
    '+1-512-555-0002',
    'Director of IT',
    NULL,
    '789 Tech Boulevard',
    'Austin',
    'Texas',
    '78701',
    'USA',
    '789 Tech Boulevard',
    'Austin',
    'Texas',
    '78701',
    'USA'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. CONTACTS (with all extended fields)
-- ============================================================
INSERT INTO contacts (
  id, first_name, last_name, email, phone, job_title, department, account_id, owner_id,
  image, description, contact_group, ctsipl_email, pan, gstin_no,
  product_interested, product_interested_text, lead_source, lead_category,
  designation, vendor_name, partner_id, new_leads,
  bandwidth_required, product_configuration, product_details, rental_duration,
  product_name_part_number, specifications,
  mailing_street, mailing_city, mailing_state, mailing_zip, mailing_country,
  other_street, other_city, other_state, other_zip, other_country
)
VALUES
  (
    'c1111111-1111-1111-1111-111111111111',
    'Robert',
    'Williams',
    'robert.williams@acmecorp.com',
    '+1-415-555-0002',
    'Chief Technology Officer',
    'Technology',
    'a1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'https://via.placeholder.com/100',
    'Senior decision maker for technology purchases',
    'C-Suite',
    'robert.w@ctsipl.com',
    'ABCDE1234F',
    '29ABCDE1234F1Z5',
    'Cloud Infrastructure',
    'Looking for scalable cloud solutions with 99.99% uptime',
    'Website',
    'Hot',
    'CTO',
    NULL,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    false,
    '1 Gbps',
    'High Availability, Multi-Region',
    'Enterprise cloud setup with redundancy',
    '36 months',
    'Cloud Server XE-2000',
    'CPU: 32 cores, RAM: 128GB, Storage: 2TB NVMe',
    '123 Market Street, Suite 500',
    'San Francisco',
    'California',
    '94102',
    'USA',
    '456 Home Avenue',
    'San Francisco',
    'California',
    '94103',
    'USA'
  ),
  (
    'c2222222-2222-2222-2222-222222222222',
    'Jennifer',
    'Davis',
    'jennifer.davis@globalmanuf.com',
    '+1-312-555-0002',
    'VP Operations',
    'Operations',
    'a2222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'https://via.placeholder.com/100',
    'Operations leader managing facility automation',
    'Management',
    'jennifer.d@ctsipl.com',
    'XYZAB5678G',
    '29XYZAB5678G2H1',
    'IoT Sensors',
    'Need industrial IoT sensors for manufacturing floor',
    'Referral',
    'Warm',
    'VP Operations',
    'TechVendor Solutions',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    true,
    '500 Mbps',
    'Industrial IoT Gateway with edge computing',
    'Sensor network across 5 manufacturing zones',
    '12 months',
    'IoT Gateway IG-5000, Sensors IS-200',
    '100 sensors, 5 gateways, cloud connectivity',
    '456 Industrial Parkway',
    'Chicago',
    'Illinois',
    '60601',
    'USA',
    '789 Lake Shore Drive',
    'Chicago',
    'Illinois',
    '60611',
    'USA'
  ),
  (
    'c3333333-3333-3333-3333-333333333333',
    'David',
    'Martinez',
    'david.martinez@retailinnov.com',
    '+1-512-555-0002',
    'Director of IT',
    'Information Technology',
    'a3333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'https://via.placeholder.com/100',
    'IT director handling retail technology integration',
    'Technical',
    'david.m@ctsipl.com',
    'PQRST9012K',
    '29PQRST9012K3L4',
    'POS Systems',
    'Upgrading point of sale systems across 50 retail locations',
    'Trade Show',
    'Cold',
    'Director IT',
    NULL,
    NULL,
    false,
    '200 Mbps',
    'Cloud POS with local backup',
    'POS terminals with inventory integration',
    'Purchase',
    'POS Terminal PT-300',
    '50 units, touchscreen, receipt printer, barcode scanner',
    '789 Tech Boulevard',
    'Austin',
    'Texas',
    '78701',
    'USA',
    '123 River Road',
    'Austin',
    'Texas',
    '78702',
    'USA'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. LEADS (with all extended fields)
-- ============================================================
INSERT INTO leads (
  id, company_name, contact_person, email, phone, source, stage, priority,
  estimated_value, product_interest, assigned_to, partner_id, notes,
  expected_close_date, next_follow_up,
  first_name, last_name, mobile, mobile_alternate, phone_alternate,
  campaign_source, website, account_type, lead_category,
  product_list, type_of_order, billing_delivery_date, order_product_details,
  payment, po_number_or_mail_confirmation, brand, orc_amount, product_warranty,
  ship_by, special_instruction, third_party_delivery_address, billing_company,
  enter_product_details, rental_duration, product_configuration, bandwidth_required,
  product_name_and_part_number, specifications, form_name,
  billing_street, billing_city, billing_state, billing_country, billing_zip_code,
  description, lead_time, product_name, receiver_mobile_number, subject,
  sender_landline_no, sender_landline_no_alt, call_duration, lead_type,
  query_id, mcat_name, lead_image
)
VALUES
  (
    '71111111-1111-1111-1111-111111111111',
    'Future Tech Systems',
    'Alice Cooper',
    'alice.cooper@futuretech.com',
    '+1-408-555-0001',
    'Website',
    'Qualified',
    'High',
    150000.00,
    'Network Infrastructure',
    '11111111-1111-1111-1111-111111111111',
    NULL,
    'Hot lead - ready to purchase in Q1',
    '2026-03-15',
    '2026-02-15',
    'Alice',
    'Cooper',
    '+1-408-555-0002',
    '+1-408-555-0003',
    '+1-408-555-0004',
    'Google Ads Campaign',
    'www.futuretech.com',
    'Enterprise',
    'Hot',
    'Network Switches, Routers, Firewalls',
    'New Installation',
    '2026-03-20',
    '24-port managed switches (10), enterprise routers (5), next-gen firewall (2)',
    'Wire Transfer',
    'PO-2026-FT-001',
    'Cisco',
    25000.00,
    '5 years comprehensive',
    'FedEx Priority',
    'Install during weekend to minimize disruption',
    NULL,
    'Future Tech Systems - Finance Dept',
    'Complete network refresh for headquarters',
    'Purchase',
    'L3 switching with redundancy',
    '10 Gbps backbone',
    'Cisco Catalyst 9300, ASR 1001-X, Firepower 2100',
    '24 ports, 10G uplinks, stackable, PoE+',
    'Network Infrastructure Quote',
    '100 Silicon Valley Blvd',
    'San Jose',
    'California',
    'USA',
    '95110',
    'Complete network infrastructure upgrade for growing tech company',
    '4-6 weeks',
    'Network Infrastructure Bundle',
    '+1-408-555-0005',
    'Network Infrastructure Upgrade - Quote Request',
    '+1-408-555-0001',
    '+1-408-555-0006',
    '45 minutes',
    'Inbound',
    'QID-2026-001',
    'Networking Equipment',
    'https://via.placeholder.com/200'
  ),
  (
    '72222222-2222-2222-2222-222222222222',
    'Smart Retail Solutions',
    'Bob Taylor',
    'bob.taylor@smartretail.com',
    '+1-214-555-0001',
    'Referral',
    'New',
    'Medium',
    75000.00,
    'Cloud Services',
    '22222222-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Referral from existing customer - needs cloud hosting',
    '2026-04-30',
    '2026-02-20',
    'Bob',
    'Taylor',
    '+1-214-555-0002',
    '+1-214-555-0003',
    NULL,
    'Partner Referral Program',
    'www.smartretail.com',
    'Mid-Market',
    'Warm',
    'Cloud Servers, Storage, CDN',
    'Cloud Migration',
    '2026-04-15',
    'Migrate existing infrastructure to cloud with 10TB storage',
    'Monthly Subscription',
    'Email confirmation received',
    'AWS/Azure Hybrid',
    15000.00,
    '99.9% SLA',
    'Digital Delivery',
    'Migration should be phased over 3 weekends',
    NULL,
    'Smart Retail Solutions',
    'Cloud hosting with content delivery network',
    '24 months rental',
    'Multi-region deployment',
    '1 Gbps dedicated',
    'Cloud VMs, Object Storage, CDN endpoints',
    '8 vCPU, 32GB RAM, 10TB storage, global CDN',
    'Cloud Migration Proposal',
    '500 Retail Plaza',
    'Dallas',
    'Texas',
    'USA',
    '75201',
    'Moving from on-premise to cloud infrastructure',
    '8-10 weeks',
    'Cloud Infrastructure Package',
    '+1-214-555-0004',
    'Cloud Migration Discussion',
    '+1-214-555-0001',
    NULL,
    '30 minutes',
    'Outbound',
    'QID-2026-002',
    'Cloud Services',
    'https://via.placeholder.com/200'
  ),
  (
    '73333333-3333-3333-3333-333333333333',
    'Healthcare Innovations',
    'Carol White',
    'carol.white@healthinnov.com',
    '+1-617-555-0001',
    'Trade Show',
    'Contacted',
    'Low',
    45000.00,
    'Security Systems',
    '33333333-3333-3333-3333-333333333333',
    NULL,
    'Met at healthcare IT conference - interested in security',
    '2026-05-30',
    '2026-03-01',
    'Carol',
    'White',
    '+1-617-555-0002',
    NULL,
    '+1-617-555-0003',
    'HealthTech Expo 2026',
    'www.healthinnov.com',
    'SMB',
    'Cold',
    'Firewalls, VPN, Endpoint Security',
    'Security Upgrade',
    '2026-05-20',
    'Enterprise firewall and endpoint protection for 200 users',
    'Credit Terms Net 60',
    NULL,
    'Fortinet',
    5000.00,
    '3 years hardware replacement',
    'Ground Shipping',
    'HIPAA compliance required for all equipment',
    NULL,
    'Healthcare Innovations',
    'HIPAA-compliant security infrastructure',
    'Purchase',
    'Zero-trust architecture',
    '500 Mbps',
    'Fortinet FortiGate 100F, FortiClient EMS',
    'Throughput 10 Gbps, 200 VPN users, IPS/IDS',
    'Healthcare Security Quote',
    '25 Medical Center Drive',
    'Boston',
    'Massachusetts',
    'USA',
    '02115',
    'Healthcare facility needs HIPAA-compliant security upgrade',
    '6-8 weeks',
    'Healthcare Security Bundle',
    '+1-617-555-0004',
    'Healthcare Security Consultation',
    '+1-617-555-0001',
    '+1-617-555-0005',
    '20 minutes',
    'Trade Show',
    'QID-2026-003',
    'Security Systems',
    'https://via.placeholder.com/200'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. DEALS (with all new extended fields)
-- ============================================================
INSERT INTO deals (
  id, title, description, value, stage, probability, closing_date,
  account_id, contact_id, owner_id, lead_source,
  sdp_no, sales_created_by_rm, lead_category, product_manager, expected_revenue,
  bandwidth_required, product_configuration, rental_duration, enter_product_details,
  product_name_and_part_number, specifications,
  show_subform, billing_delivery_date, description_of_product, payment, payment_terms,
  po_number_or_mail_confirmation, integration_requirement, brand, orc_amount,
  product_warranty, ship_by, special_instruction, third_party_delivery_address,
  billing_company, email_subject, additional_information, da, delivery_address,
  billing_street, billing_state, billing_country, billing_city, billing_zip_code
)
VALUES
  (
    'd1111111-1111-1111-1111-111111111111',
    'Acme Corp - Enterprise Cloud Infrastructure',
    'Complete cloud infrastructure setup for Acme Corporation including servers, storage, and networking',
    250000.00,
    'Proposal',
    75,
    '2026-03-31',
    'a1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Website',
    'SDP-2026-001',
    '11111111-1111-1111-1111-111111111111',
    'Hot',
    'Michael Chen',
    275000.00,
    '10 Gbps dedicated fiber',
    'Multi-region active-active configuration with auto-failover',
    '36 months',
    'Enterprise cloud infrastructure with 99.99% uptime SLA',
    'Cloud Servers: CS-ENT-2000, Storage: ST-10TB-NVMe, Network: NW-10G-SW',
    'Server: 32 vCPU, 128GB RAM per instance. Storage: All-flash NVMe 10TB. Network: 10GbE switching',
    true,
    '2026-04-15',
    'Enterprise-grade cloud infrastructure with redundant power, networking, and storage',
    'Wire Transfer',
    'Net 30 from installation',
    'PO-ACME-2026-ENT-001',
    'Integration with existing Active Directory and monitoring systems',
    'Dell EMC / VMware',
    50000.00,
    '5 years comprehensive NBD replacement',
    'White Glove Installation',
    'Installation window: March 25-29, 2026. Require on-site engineer supervision.',
    NULL,
    'Acme Corporation - Finance Department',
    'RE: Enterprise Cloud Infrastructure Proposal - Q1 2026',
    'Customer has budget approved. Decision makers include CTO and CFO. Timeline critical for Q1 deployment.',
    'San Francisco - HQ',
    '123 Market Street, Suite 500, San Francisco, CA 94102',
    '123 Market Street, Suite 500',
    'California',
    'USA',
    'San Francisco',
    '94102'
  ),
  (
    'd2222222-2222-2222-2222-222222222222',
    'Global Manufacturing - IoT Sensor Network',
    'Industrial IoT sensor deployment across 5 manufacturing facilities',
    180000.00,
    'Negotiation',
    85,
    '2026-02-28',
    'a2222222-2222-2222-2222-222222222222',
    'c2222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'Referral',
    'SDP-2026-002',
    '22222222-2222-2222-2222-222222222222',
    'Warm',
    'Sarah Johnson',
    195000.00,
    '1 Gbps fiber backbone',
    'Industrial IoT gateway with edge computing and cloud sync',
    '12 months rental with option to purchase',
    'Complete IoT sensor network for predictive maintenance and production monitoring',
    'IoT Gateway: IG-5000, Temperature Sensors: TS-200, Vibration Sensors: VS-300, Pressure Sensors: PS-400',
    '500 sensors total (200 temp, 200 vibration, 100 pressure), 5 gateways, cloud analytics platform',
    true,
    '2026-03-10',
    'Industrial-grade IoT sensors with gateway devices for real-time monitoring',
    'Monthly rental with buyout option',
    'Monthly rental: $15,000. Buyout after 12 months: $100,000',
    'Email confirmation - pending formal PO',
    'Integration with existing SCADA and ERP systems',
    'Siemens / Schneider Electric',
    30000.00,
    '3 years parts and labor, 24/7 support',
    'Factory Direct Installation',
    'Phased rollout: Zone 1-2 (Week 1), Zone 3-4 (Week 2), Zone 5 (Week 3). No production downtime.',
    NULL,
    'Global Manufacturing Ltd',
    'RE: IoT Sensor Network - Predictive Maintenance Project',
    'VP Operations very interested. Rental option preferred for cash flow. Need integration support.',
    'Chicago - All Facilities',
    '456 Industrial Parkway, Chicago, IL 60601 + 4 satellite facilities',
    '456 Industrial Parkway',
    'Illinois',
    'USA',
    'Chicago',
    '60601'
  ),
  (
    'd3333333-3333-3333-3333-333333333333',
    'Retail Innovations - Point of Sale System Upgrade',
    'POS system upgrade for 50 retail locations with cloud integration',
    125000.00,
    'Qualification',
    60,
    '2026-04-15',
    'a3333333-3333-3333-3333-333333333333',
    'c3333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'Trade Show',
    'SDP-2026-003',
    '33333333-3333-3333-3333-333333333333',
    'Cold',
    'John Smith',
    140000.00,
    '500 Mbps per location',
    'Cloud-based POS with local backup and offline mode',
    'Purchase with 3-year support contract',
    'Modern touchscreen POS terminals with inventory management and payment integration',
    'POS Terminal: PT-300, Receipt Printer: RP-80, Barcode Scanner: BS-2D, Cash Drawer: CD-410',
    'All-in-one touchscreen (15" capacitive), thermal printer (80mm), 2D imager scanner, heavy-duty cash drawer',
    false,
    '2026-04-20',
    'Complete POS solution with hardware, software licenses, and installation services',
    'Credit Card / Financing',
    '50% deposit, 50% on completion. 36-month financing available.',
    'Awaiting budget approval',
    'Integration with existing inventory system and payment gateway',
    'Square / Shopify POS',
    15000.00,
    '2 years hardware replacement, lifetime software updates',
    'Scheduled Deployment',
    'Rolling deployment: 10 stores per week. Training provided on-site. Go-live support included.',
    NULL,
    'Retail Innovations Inc',
    'RE: POS System Upgrade Proposal - 50 Locations',
    'Decision pending budget committee approval (March 15). Strong interest from IT Director and CFO.',
    'Austin HQ - Distribution to 50 stores',
    '789 Tech Boulevard, Austin, TX 78701',
    '789 Tech Boulevard',
    'Texas',
    'USA',
    'Austin',
    '78701'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. DEAL LINE ITEMS (Product Info for each deal)
-- ============================================================
INSERT INTO deal_line_items (
  id, deal_id, product_category, product_sub_category, part_number, description,
  quantity, pricing, total_price, warehouse, total_rental, rental_per_unit, sort_order
)
VALUES
  -- Deal 1: Acme Corp - Cloud Infrastructure
  ('d1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111',
   'Servers', 'Cloud Compute', 'CS-ENT-2000',
   'Enterprise Cloud Server - 32 vCPU, 128GB RAM, 2TB NVMe',
   10, 15000.00, 150000.00, 'US-West-1', NULL, NULL, 1),

  ('d1111112-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111',
   'Storage', 'NVMe Storage', 'ST-10TB-NVMe',
   'All-Flash NVMe Storage Array - 10TB',
   5, 8000.00, 40000.00, 'US-West-1', NULL, NULL, 2),

  ('d1111113-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111',
   'Networking', 'Switches', 'NW-10G-SW',
   '10GbE Network Switch - 48 port managed',
   4, 5000.00, 20000.00, 'US-West-1', NULL, NULL, 3),

  ('d1111114-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111',
   'Services', 'Installation', 'SVC-INSTALL-ENT',
   'Enterprise Installation and Configuration Service',
   1, 40000.00, 40000.00, 'Professional Services', NULL, NULL, 4),

  -- Deal 2: Global Manufacturing - IoT Sensors
  ('d2222221-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222',
   'IoT Devices', 'Gateways', 'IG-5000',
   'Industrial IoT Gateway - Edge Computing Enabled',
   5, 8000.00, 40000.00, 'US-Central', 60000.00, 1000.00, 1),

  ('d2222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222',
   'IoT Devices', 'Temperature Sensors', 'TS-200',
   'Industrial Temperature Sensor - Range -40°C to 125°C',
   200, 150.00, 30000.00, 'US-Central', 24000.00, 10.00, 2),

  ('d2222223-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222',
   'IoT Devices', 'Vibration Sensors', 'VS-300',
   'Vibration Sensor - Predictive Maintenance Grade',
   200, 250.00, 50000.00, 'US-Central', 30000.00, 12.50, 3),

  ('d2222224-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222',
   'IoT Devices', 'Pressure Sensors', 'PS-400',
   'Industrial Pressure Sensor - 0-1000 PSI',
   100, 300.00, 30000.00, 'US-Central', 18000.00, 15.00, 4),

  ('d2222225-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222',
   'Software', 'Analytics Platform', 'SW-IOT-CLOUD',
   'IoT Cloud Analytics Platform - 12 month subscription',
   1, 30000.00, 30000.00, 'Cloud Service', NULL, NULL, 5),

  -- Deal 3: Retail Innovations - POS Systems
  ('d3333331-3333-3333-3333-333333333333', 'd3333333-3333-3333-3333-333333333333',
   'POS Hardware', 'Terminals', 'PT-300',
   'POS Terminal - 15" Touchscreen All-in-One',
   50, 1200.00, 60000.00, 'US-South', NULL, NULL, 1),

  ('d3333332-3333-3333-3333-333333333333', 'd3333333-3333-3333-3333-333333333333',
   'POS Hardware', 'Printers', 'RP-80',
   'Receipt Printer - 80mm Thermal',
   50, 200.00, 10000.00, 'US-South', NULL, NULL, 2),

  ('d3333333-3333-3333-3333-333333333333', 'd3333333-3333-3333-3333-333333333333',
   'POS Hardware', 'Scanners', 'BS-2D',
   'Barcode Scanner - 2D Imager',
   50, 150.00, 7500.00, 'US-South', NULL, NULL, 3),

  ('d3333334-3333-3333-3333-333333333333', 'd3333333-3333-3333-3333-333333333333',
   'POS Hardware', 'Cash Drawers', 'CD-410',
   'Cash Drawer - 4 Bill / 10 Coin',
   50, 100.00, 5000.00, 'US-South', NULL, NULL, 4),

  ('d3333335-3333-3333-3333-333333333333', 'd3333333-3333-3333-3333-333333333333',
   'Software', 'POS License', 'SW-POS-CLOUD',
   'Cloud POS Software License - 3 year',
   50, 300.00, 15000.00, 'Cloud Service', NULL, NULL, 5),

  ('d3333336-3333-3333-3333-333333333333', 'd3333333-3333-3333-3333-333333333333',
   'Services', 'Installation', 'SVC-INSTALL-POS',
   'POS Installation and Training - Per Location',
   50, 300.00, 15000.00, 'Professional Services', NULL, NULL, 6),

  ('d3333337-3333-3333-3333-333333333333', 'd3333333-3333-3333-3333-333333333333',
   'Services', 'Support', 'SVC-SUPPORT-3YR',
   'POS Support Contract - 3 Year',
   50, 250.00, 12500.00, 'Professional Services', NULL, NULL, 7)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. TASKS
-- ============================================================
INSERT INTO tasks (
  id, title, description, due_date, priority, status, assigned_to, related_to_type, related_to_id
)
VALUES
  ('a4111111-1111-1111-1111-111111111111', 'Follow up on Acme Corp proposal',
   'Send proposal follow-up email and schedule demo', '2026-02-15', 'High', 'pending',
   '11111111-1111-1111-1111-111111111111', 'deal', 'd1111111-1111-1111-1111-111111111111'),

  ('a4222222-2222-2222-2222-222222222222', 'Schedule IoT Gateway demo',
   'Arrange on-site demonstration of IoT gateway at customer facility', '2026-02-12', 'High', 'in_progress',
   '22222222-2222-2222-2222-222222222222', 'deal', 'd2222222-2222-2222-2222-222222222222'),

  ('a4333333-3333-3333-3333-333333333333', 'Prepare POS system proposal',
   'Create detailed proposal with ROI analysis for retail client', '2026-02-20', 'Medium', 'pending',
   '33333333-3333-3333-3333-333333333333', 'deal', 'd3333333-3333-3333-3333-333333333333'),

  ('a4444444-4444-4444-4444-444444444444', 'Qualify Future Tech Systems lead',
   'Discovery call to understand requirements and budget', '2026-02-16', 'High', 'pending',
   '11111111-1111-1111-1111-111111111111', 'lead', '71111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. CALENDAR EVENTS
-- ============================================================
INSERT INTO calendar_events (
  id, title, description, start_time, end_time, location, type, owner_id, related_to_type, related_to_id
)
VALUES
  ('e1111111-1111-1111-1111-111111111111', 'Acme Corp - Technical Demo',
   'Product demonstration of cloud infrastructure solution',
   '2026-02-18 14:00:00', '2026-02-18 16:00:00', 'Acme Corp HQ - San Francisco',
   'meeting', '11111111-1111-1111-1111-111111111111', 'deal', 'd1111111-1111-1111-1111-111111111111'),

  ('e2222222-2222-2222-2222-222222222222', 'Global Manufacturing - Site Visit',
   'On-site assessment of IoT sensor deployment locations',
   '2026-02-14 09:00:00', '2026-02-14 17:00:00', 'Global Manufacturing - Chicago Plant',
   'meeting', '22222222-2222-2222-2222-222222222222', 'deal', 'd2222222-2222-2222-2222-222222222222'),

  ('e3333333-3333-3333-3333-333333333333', 'Retail Innovations - Budget Review Meeting',
   'Meeting with CFO and IT Director to review POS proposal',
   '2026-03-15 10:00:00', '2026-03-15 11:30:00', 'Virtual - Zoom',
   'meeting', '33333333-3333-3333-3333-333333333333', 'deal', 'd3333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. EMAILS
-- ============================================================
INSERT INTO emails (
  id, subject, body, from_address, to_address, cc, bcc, sent_at, status, related_to_type, related_to_id
)
VALUES
  ('e0111111-1111-1111-1111-111111111111',
   'RE: Enterprise Cloud Infrastructure Proposal',
   'Hi Robert, Thank you for the opportunity to present our enterprise cloud solution. Attached is the comprehensive proposal including technical specifications, pricing, and implementation timeline. Looking forward to discussing this further in our upcoming demo.',
   'john.smith@comprint.com', 'robert.williams@acmecorp.com', NULL, NULL,
   '2026-02-10 09:30:00', 'sent', 'deal', 'd1111111-1111-1111-1111-111111111111'),

  ('e0222222-2222-2222-2222-222222222222',
   'IoT Sensor Network - Site Survey Confirmation',
   'Hi Jennifer, Confirming our site visit on February 14th for the IoT sensor deployment assessment. We will evaluate all 5 manufacturing zones and provide recommendations. Please arrange access to facilities.',
   'sarah.johnson@comprint.com', 'jennifer.davis@globalmanuf.com', NULL, NULL,
   '2026-02-11 14:00:00', 'sent', 'deal', 'd2222222-2222-2222-2222-222222222222'),

  ('e0333333-3333-3333-3333-333333333333',
   'POS System Upgrade - ROI Analysis',
   'Hi David, As requested, I have prepared a detailed ROI analysis for the POS system upgrade across your 50 locations. The analysis shows a 24-month payback period with significant operational efficiency gains. Let me know if you need any clarification.',
   'michael.chen@comprint.com', 'david.martinez@retailinnov.com', NULL, NULL,
   '2026-02-12 11:00:00', 'sent', 'deal', 'd3333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 11. ADDITIONAL ACCOUNTS FOR ANALYTICS
-- ============================================================
INSERT INTO accounts (
  id, name, industry, website, revenue, employees, location, type, status,
  phone, email, health_score, description, owner_id
)
VALUES
  ('a4444444-4444-4444-4444-444444444444', 'TechStartup Inc', 'Technology', 'www.techstartup.com',
   1200000.00, 50, 'Seattle, WA', 'SMB', 'active', '+1-206-555-0001', 'info@techstartup.com',
   70, 'Fast-growing startup in AI/ML space', '11111111-1111-1111-1111-111111111111'),

  ('a5555555-5555-5555-5555-555555555555', 'Finance Solutions Corp', 'Finance', 'www.finsolutions.com',
   8000000.00, 300, 'New York, NY', 'Enterprise', 'active', '+1-212-555-0001', 'contact@finsolutions.com',
   88, 'Leading fintech company', '22222222-2222-2222-2222-222222222222'),

  ('a6666666-6666-6666-6666-666666666666', 'Healthcare Plus', 'Healthcare', 'www.healthcareplus.com',
   6000000.00, 200, 'Boston, MA', 'Mid-Market', 'active', '+1-617-555-0101', 'info@healthcareplus.com',
   65, 'Regional healthcare provider', '33333333-3333-3333-3333-333333333333'),

  ('a7777777-7777-7777-7777-777777777777', 'Retail Giant', 'Retail', 'www.retailgiant.com',
   15000000.00, 800, 'Los Angeles, CA', 'Enterprise', 'active', '+1-213-555-0001', 'sales@retailgiant.com',
   95, 'Major retail chain', '11111111-1111-1111-1111-111111111111'),

  ('a8888888-8888-8888-8888-888888888888', 'EduTech Solutions', 'Education', 'www.edutech.com',
   2500000.00, 75, 'Denver, CO', 'SMB', 'active', '+1-303-555-0001', 'contact@edutech.com',
   72, 'Educational technology platform', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 12. ADDITIONAL DEALS FOR PIPELINE ANALYTICS
-- ============================================================
INSERT INTO deals (
  id, title, description, value, stage, probability, closing_date,
  account_id, contact_id, owner_id, lead_source
)
VALUES
  -- Qualification stage deals
  ('d4444444-4444-4444-4444-444444444444', 'TechStartup - Cloud Migration',
   'Cloud migration project for AI workloads', 85000.00, 'Qualification', 40, '2026-04-30',
   'a4444444-4444-4444-4444-444444444444', NULL, '11111111-1111-1111-1111-111111111111', 'Referral'),

  ('d5555555-5555-5555-5555-555555555555', 'Finance Solutions - Security Upgrade',
   'Enterprise security infrastructure upgrade', 320000.00, 'Qualification', 50, '2026-05-15',
   'a5555555-5555-5555-5555-555555555555', NULL, '22222222-2222-2222-2222-222222222222', 'Website'),

  -- Needs Analysis stage
  ('d6666666-6666-6666-6666-666666666666', 'Healthcare Plus - EMR System',
   'Electronic medical records system implementation', 450000.00, 'Needs Analysis', 60, '2026-03-20',
   'a6666666-6666-6666-6666-666666666666', NULL, '33333333-3333-3333-3333-333333333333', 'Trade Show'),

  ('d7777777-7777-7777-7777-777777777777', 'Retail Giant - Omnichannel Platform',
   'Omnichannel retail platform implementation', 890000.00, 'Needs Analysis', 65, '2026-04-10',
   'a7777777-7777-7777-7777-777777777777', NULL, '11111111-1111-1111-1111-111111111111', 'Website'),

  -- Proposal stage
  ('d8888888-8888-8888-8888-888888888888', 'EduTech - Learning Management System',
   'LMS platform with AI-powered analytics', 175000.00, 'Proposal', 70, '2026-03-25',
   'a8888888-8888-8888-8888-888888888888', NULL, '22222222-2222-2222-2222-222222222222', 'Referral'),

  -- Closed Won deals (for revenue analysis)
  ('d9999999-9999-9999-9999-999999999999', 'Previous Deal - Infrastructure',
   'Infrastructure upgrade completed last month', 150000.00, 'Closed Won', 100, '2026-01-15',
   'a1111111-1111-1111-1111-111111111111', NULL, '11111111-1111-1111-1111-111111111111', 'Website'),

  ('da111111-1111-1111-1111-111111111111', 'Previous Deal - Software Licenses',
   'Enterprise software licenses closed', 95000.00, 'Closed Won', 100, '2026-01-20',
   'a5555555-5555-5555-5555-555555555555', NULL, '22222222-2222-2222-2222-222222222222', 'Referral'),

  -- Closed Lost deals (for loss analysis)
  ('db111111-1111-1111-1111-111111111111', 'Lost Deal - Price Issue',
   'Lost to competitor on pricing', 75000.00, 'Closed Lost', 0, '2026-01-10',
   'a6666666-6666-6666-6666-666666666666', NULL, '33333333-3333-3333-3333-333333333333', 'Cold Call'),

  ('dc111111-1111-1111-1111-111111111111', 'Lost Deal - Timeline Mismatch',
   'Customer needed faster implementation', 125000.00, 'Closed Lost', 0, '2025-12-28',
   'a8888888-8888-8888-8888-888888888888', NULL, '22222222-2222-2222-2222-222222222222', 'Website')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 13. ADDITIONAL LEADS FOR FUNNEL ANALYTICS
-- ============================================================
INSERT INTO leads (
  id, company_name, contact_person, email, phone, source, stage, priority,
  estimated_value, product_interest, assigned_to, expected_close_date
)
VALUES
  -- New leads
  ('74444444-4444-4444-4444-444444444444', 'Logistics Pro', 'Tom Anderson', 'tom@logisticspro.com',
   '+1-555-1001', 'Website', 'New', 'Medium', 95000.00, 'Supply Chain Software',
   '11111111-1111-1111-1111-111111111111', '2026-05-30'),

  ('75555555-5555-5555-5555-555555555555', 'Marketing Masters', 'Lisa Wong', 'lisa@marketingmasters.com',
   '+1-555-1002', 'LinkedIn', 'New', 'High', 120000.00, 'Marketing Automation',
   '22222222-2222-2222-2222-222222222222', '2026-06-15'),

  -- Contacted leads
  ('76666666-6666-6666-6666-666666666666', 'Construction Plus', 'Mike Builder', 'mike@constructionplus.com',
   '+1-555-1003', 'Referral', 'Contacted', 'High', 180000.00, 'Project Management Tools',
   '11111111-1111-1111-1111-111111111111', '2026-04-20'),

  ('77777777-7777-7777-7777-777777777777', 'Legal Associates', 'Sarah Justice', 'sarah@legalassoc.com',
   '+1-555-1004', 'Cold Call', 'Contacted', 'Low', 65000.00, 'Document Management',
   '33333333-3333-3333-3333-333333333333', '2026-07-10'),

  -- Qualified leads
  ('78888888-8888-8888-8888-888888888888', 'Insurance Corp', 'David Shield', 'david@insurancecorp.com',
   '+1-555-1005', 'Website', 'Qualified', 'High', 250000.00, 'CRM System',
   '22222222-2222-2222-2222-222222222222', '2026-04-05'),

  -- Converted leads (should have corresponding deals)
  ('79999999-9999-9999-9999-999999999999', 'TechStartup Inc', 'Alex Code', 'alex@techstartup.com',
   '+1-555-1006', 'Referral', 'Converted', 'High', 85000.00, 'Cloud Services',
   '11111111-1111-1111-1111-111111111111', '2026-04-30'),

  -- Lost leads
  ('7a111111-1111-1111-1111-111111111111', 'Budget Retail', 'Sam Cheap', 'sam@budgetretail.com',
   '+1-555-1007', 'Cold Call', 'Lost', 'Low', 35000.00, 'POS System',
   '33333333-3333-3333-3333-333333333333', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 14. ADDITIONAL TASKS FOR ACTIVITY TRACKING
-- ============================================================
INSERT INTO tasks (
  id, title, description, due_date, priority, status, assigned_to, related_to_type, related_to_id
)
VALUES
  ('a5111111-1111-1111-1111-111111111111', 'Call TechStartup CEO',
   'Initial discovery call', '2026-02-11', 'High', 'pending',
   '11111111-1111-1111-1111-111111111111', 'deal', 'd4444444-4444-4444-4444-444444444444'),

  ('a5222222-2222-2222-2222-222222222222', 'Prepare Finance Solutions proposal',
   'Draft security upgrade proposal', '2026-02-13', 'High', 'in_progress',
   '22222222-2222-2222-2222-222222222222', 'deal', 'd5555555-5555-5555-5555-555555555555'),

  ('a5333333-3333-3333-3333-333333333333', 'Follow up Marketing Masters',
   'Send product demo video', '2026-02-10', 'Medium', 'completed',
   '22222222-2222-2222-2222-222222222222', 'lead', '75555555-5555-5555-5555-555555555555'),

  ('a5444444-4444-4444-4444-444444444444', 'Review Retail Giant requirements',
   'Analyze technical requirements document', '2026-02-14', 'High', 'pending',
   '11111111-1111-1111-1111-111111111111', 'deal', 'd7777777-7777-7777-7777-777777777777'),

  ('a5555555-5555-5555-5555-555555555555', 'Schedule demo for Insurance Corp',
   'Coordinate product demonstration', '2026-02-12', 'High', 'pending',
   '22222222-2222-2222-2222-222222222222', 'lead', '78888888-8888-8888-8888-888888888888'),

  ('a5666666-6666-6666-6666-666666666666', 'Send contract to EduTech',
   'Email final contract for review', '2026-02-17', 'High', 'pending',
   '22222222-2222-2222-2222-222222222222', 'deal', 'd8888888-8888-8888-8888-888888888888'),

  ('a5777777-7777-7777-7777-777777777777', 'Call Construction Plus',
   'Weekly check-in call', '2026-02-11', 'Medium', 'completed',
   '11111111-1111-1111-1111-111111111111', 'lead', '76666666-6666-6666-6666-666666666666'),

  ('a5888888-8888-8888-8888-888888888888', 'Update Healthcare Plus proposal',
   'Incorporate client feedback', '2026-02-18', 'High', 'in_progress',
   '33333333-3333-3333-3333-333333333333', 'deal', 'd6666666-6666-6666-6666-666666666666')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 15. ADDITIONAL CALENDAR EVENTS
-- ============================================================
INSERT INTO calendar_events (
  id, title, description, start_time, end_time, location, type, owner_id, related_to_type, related_to_id
)
VALUES
  ('e4444444-4444-4444-4444-444444444444', 'TechStartup Discovery Call',
   'Initial needs assessment call', '2026-02-11 10:00:00', '2026-02-11 11:00:00',
   'Virtual - Teams', 'call', '11111111-1111-1111-1111-111111111111', 'deal', 'd4444444-4444-4444-4444-444444444444'),

  ('e5555555-5555-5555-5555-555555555555', 'Finance Solutions Security Review',
   'Technical architecture review meeting', '2026-02-13 14:00:00', '2026-02-13 16:00:00',
   'Finance Solutions HQ - NYC', 'meeting', '22222222-2222-2222-2222-222222222222', 'deal', 'd5555555-5555-5555-5555-555555555555'),

  ('e6666666-6666-6666-6666-666666666666', 'Healthcare Plus Presentation',
   'Executive presentation of EMR solution', '2026-02-19 13:00:00', '2026-02-19 15:00:00',
   'Healthcare Plus - Boston', 'meeting', '33333333-3333-3333-3333-333333333333', 'deal', 'd6666666-6666-6666-6666-666666666666'),

  ('e7777777-7777-7777-7777-777777777777', 'Retail Giant Stakeholder Meeting',
   'Meet with all key stakeholders', '2026-02-16 11:00:00', '2026-02-16 13:00:00',
   'Retail Giant HQ - LA', 'meeting', '11111111-1111-1111-1111-111111111111', 'deal', 'd7777777-7777-7777-7777-777777777777'),

  ('e8888888-8888-8888-8888-888888888888', 'Insurance Corp Demo',
   'Live product demonstration', '2026-02-12 15:00:00', '2026-02-12 16:30:00',
   'Virtual - Zoom', 'demo', '22222222-2222-2222-2222-222222222222', 'lead', '78888888-8888-8888-8888-888888888888'),

  ('e9999999-9999-9999-9999-999999999999', 'EduTech Contract Review',
   'Review and sign contract', '2026-02-20 10:00:00', '2026-02-20 11:00:00',
   'Virtual - Teams', 'meeting', '22222222-2222-2222-2222-222222222222', 'deal', 'd8888888-8888-8888-8888-888888888888'),

  ('ea111111-1111-1111-1111-111111111111', 'Weekly Sales Team Meeting',
   'Weekly pipeline review and planning', '2026-02-10 09:00:00', '2026-02-10 10:00:00',
   'Office Conference Room', 'meeting', '33333333-3333-3333-3333-333333333333', NULL, NULL),

  ('eb111111-1111-1111-1111-111111111111', 'Construction Plus Follow-up',
   'Follow-up call to discuss requirements', '2026-02-11 14:00:00', '2026-02-11 14:30:00',
   'Virtual - Phone', 'call', '11111111-1111-1111-1111-111111111111', 'lead', '76666666-6666-6666-6666-666666666666')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 16. ADDITIONAL EMAILS FOR ACTIVITY ANALYTICS
-- ============================================================
INSERT INTO emails (
  id, subject, body, from_address, to_address, sent_at, status, related_to_type, related_to_id
)
VALUES
  ('e0444444-4444-4444-4444-444444444444', 'TechStartup - Cloud Migration Proposal',
   'Hi Alex, Please find attached our proposal for your cloud migration project. Looking forward to discussing this with you.',
   'john.smith@comprint.com', 'alex@techstartup.com', '2026-02-09 10:00:00', 'sent', 'deal', 'd4444444-4444-4444-4444-444444444444'),

  ('e0555555-5555-5555-5555-555555555555', 'Insurance Corp - Product Demo Confirmation',
   'Hi David, Confirming our product demo scheduled for Feb 12 at 3 PM. Meeting link will be sent separately.',
   'sarah.johnson@comprint.com', 'david@insurancecorp.com', '2026-02-09 14:30:00', 'sent', 'lead', '78888888-8888-8888-8888-888888888888'),

  ('e0666666-6666-6666-6666-666666666666', 'Retail Giant - Technical Requirements',
   'Hi team, Thank you for sharing your technical requirements. We have reviewed them and have some clarification questions.',
   'john.smith@comprint.com', 'sales@retailgiant.com', '2026-02-08 16:00:00', 'sent', 'deal', 'd7777777-7777-7777-7777-777777777777'),

  ('e0777777-7777-7777-7777-777777777777', 'Marketing Masters - Welcome',
   'Hi Lisa, Thank you for your interest in our marketing automation solution. Let me share some resources to get started.',
   'sarah.johnson@comprint.com', 'lisa@marketingmasters.com', '2026-02-07 11:00:00', 'sent', 'lead', '75555555-5555-5555-5555-555555555555'),

  ('e0888888-8888-8888-8888-888888888888', 'EduTech - Contract Ready',
   'Hi team, Your contract is ready for review. Please let me know if you have any questions before signing.',
   'sarah.johnson@comprint.com', 'contact@edutech.com', '2026-02-10 09:00:00', 'sent', 'deal', 'd8888888-8888-8888-8888-888888888888'),

  ('e0999999-9999-9999-9999-999999999999', 'Healthcare Plus - Proposal Update',
   'Hi team, I have updated the proposal based on your feedback. Please review the attached revised version.',
   'michael.chen@comprint.com', 'info@healthcareplus.com', '2026-02-09 13:00:00', 'sent', 'deal', 'd6666666-6666-6666-6666-666666666666')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 17. PRODUCTS (Product Catalog)
-- ============================================================
INSERT INTO products (id, name, category, base_price, commission_rate, is_active)
VALUES
  ('f1111111-1111-1111-1111-111111111111', 'Enterprise Cloud Server', 'Cloud Services', 15000.00, 10.00, true),
  ('f2222222-2222-2222-2222-222222222222', 'NVMe Storage Array 10TB', 'Storage', 8000.00, 8.00, true),
  ('f3333333-3333-3333-3333-333333333333', '10GbE Network Switch', 'Networking', 5000.00, 12.00, true),
  ('f4444444-4444-4444-4444-444444444444', 'IoT Gateway Industrial', 'IoT Devices', 8000.00, 15.00, true),
  ('f5555555-5555-5555-5555-555555555555', 'Temperature Sensor IS-200', 'IoT Devices', 150.00, 20.00, true),
  ('f6666666-6666-6666-6666-666666666666', 'POS Terminal PT-300', 'POS Hardware', 1200.00, 10.00, true),
  ('f7777777-7777-7777-7777-777777777777', 'Receipt Printer RP-80', 'POS Hardware', 200.00, 15.00, true),
  ('f8888888-8888-8888-8888-888888888888', 'Firewall FortiGate 100F', 'Security', 3500.00, 12.00, true),
  ('f9999999-9999-9999-9999-999999999999', 'Cloud POS Software License', 'Software', 300.00, 25.00, true),
  ('fa111111-1111-1111-1111-111111111111', 'Professional Services - Installation', 'Services', 5000.00, 5.00, true),
  ('fb111111-1111-1111-1111-111111111111', 'Support Contract - 3 Year', 'Services', 2500.00, 8.00, true),
  ('fc111111-1111-1111-1111-111111111111', 'Backup Solution Enterprise', 'Software', 4500.00, 10.00, true),
  ('fd111111-1111-1111-1111-111111111111', 'Network Security Bundle', 'Security', 12000.00, 15.00, true),
  ('fe111111-1111-1111-1111-111111111111', 'Server Rack 42U', 'Hardware', 1800.00, 8.00, true),
  ('ff111111-1111-1111-1111-111111111111', 'UPS 10KVA', 'Hardware', 3200.00, 10.00, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 18. QUOTES (Sales Quotations)
-- ============================================================
INSERT INTO quotes (
  id, quote_number, lead_id, partner_id, customer_name, valid_until,
  subtotal, tax_rate, tax_amount, discount_amount, total_amount,
  status, terms, notes, created_by
)
VALUES
  -- Active Quotes
  ('e1111111-1111-1111-1111-111111111111', 'QT-2026-001', '71111111-1111-1111-1111-111111111111',
   NULL, 'Future Tech Systems', '2026-03-15',
   150000.00, 18.00, 27000.00, 5000.00, 172000.00,
   'sent', 'Net 30 days. Installation included.', 'Network infrastructure upgrade project',
   '11111111-1111-1111-1111-111111111111'),

  ('e2222222-2222-2222-2222-222222222222', 'QT-2026-002', '72222222-2222-2222-2222-222222222222',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Smart Retail Solutions', '2026-04-20',
   75000.00, 18.00, 13500.00, 2000.00, 86500.00,
   'draft', 'Payment terms: 50% upfront, 50% on delivery', 'Cloud migration quote',
   '22222222-2222-2222-2222-222222222222'),

  ('e3333333-3333-3333-3333-333333333333', 'QT-2026-003', '73333333-3333-3333-3333-333333333333',
   NULL, 'Healthcare Innovations', '2026-05-25',
   45000.00, 18.00, 8100.00, 1000.00, 52100.00,
   'sent', 'HIPAA compliant deployment. Training included.', 'Security infrastructure quote',
   '33333333-3333-3333-3333-333333333333'),

  ('e4444444-4444-4444-4444-444444444444', 'QT-2026-004', '76666666-6666-6666-6666-666666666666',
   NULL, 'Construction Plus', '2026-04-15',
   95000.00, 18.00, 17100.00, 3000.00, 109100.00,
   'sent', 'Project management software with on-site training', 'Construction management solution',
   '11111111-1111-1111-1111-111111111111'),

  -- Accepted Quote
  ('e5555555-5555-5555-5555-555555555555', 'QT-2026-005', '79999999-9999-9999-9999-999999999999',
   NULL, 'TechStartup Inc', '2026-03-30',
   85000.00, 18.00, 15300.00, 4000.00, 96300.00,
   'accepted', 'Cloud services agreement', 'Quote accepted, converted to deal',
   '11111111-1111-1111-1111-111111111111'),

  -- Rejected Quote
  ('e6666666-6666-6666-6666-666666666666', 'QT-2026-006', '7a111111-1111-1111-1111-111111111111',
   NULL, 'Budget Retail', '2026-02-28',
   35000.00, 18.00, 6300.00, 0.00, 41300.00,
   'rejected', 'Standard POS terms', 'Price too high for customer',
   '33333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 19. QUOTE LINE ITEMS
-- ============================================================
INSERT INTO quote_line_items (
  id, quote_id, product_id, description, quantity, unit_price, discount_pct, line_total, sort_order
)
VALUES
  -- Quote 1: Future Tech Systems - Network Infrastructure
  ('ea111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111',
   'f3333333-3333-3333-3333-333333333333', 'Cisco Catalyst 9300 24-port managed switches',
   10, 5000.00, 5.00, 47500.00, 1),

  ('ea111112-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111',
   'f8888888-8888-8888-8888-888888888888', 'Fortinet FortiGate 100F Next-Gen Firewall',
   2, 3500.00, 0.00, 7000.00, 2),

  ('ea111113-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111',
   'fa111111-1111-1111-1111-111111111111', 'Professional installation and configuration',
   1, 15000.00, 0.00, 15000.00, 3),

  ('ea111114-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111',
   'fb111111-1111-1111-1111-111111111111', '3-year support and maintenance',
   10, 250.00, 0.00, 2500.00, 4),

  -- Quote 2: Smart Retail - Cloud Migration
  ('ea222221-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222',
   'f1111111-1111-1111-1111-111111111111', 'Cloud server instances (12 months)',
   5, 12000.00, 10.00, 54000.00, 1),

  ('ea222222-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222',
   'f2222222-2222-2222-2222-222222222222', 'Storage array 10TB',
   2, 8000.00, 5.00, 15200.00, 2),

  ('ea222223-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222',
   'fa111111-1111-1111-1111-111111111111', 'Migration services',
   1, 5000.00, 0.00, 5000.00, 3),

  -- Quote 3: Healthcare - Security
  ('ea333331-1111-1111-1111-111111111111', 'e3333333-3333-3333-3333-333333333333',
   'f8888888-8888-8888-8888-888888888888', 'Fortinet firewall for HIPAA compliance',
   3, 3500.00, 0.00, 10500.00, 1),

  ('ea333332-1111-1111-1111-111111111111', 'e3333333-3333-3333-3333-333333333333',
   'fd111111-1111-1111-1111-111111111111', 'Network security bundle',
   2, 12000.00, 10.00, 21600.00, 2),

  ('ea333333-1111-1111-1111-111111111111', 'e3333333-3333-3333-3333-333333333333',
   'fa111111-1111-1111-1111-111111111111', 'Installation and HIPAA configuration',
   1, 8000.00, 0.00, 8000.00, 3),

  -- Quote 4: Construction Plus
  ('ea444441-1111-1111-1111-111111111111', 'e4444444-4444-4444-4444-444444444444',
   'f9999999-9999-9999-9999-999999999999', 'Project management software licenses',
   50, 1500.00, 5.00, 71250.00, 1),

  ('ea444442-1111-1111-1111-111111111111', 'e4444444-4444-4444-4444-444444444444',
   'fa111111-1111-1111-1111-111111111111', 'Implementation and training',
   1, 15000.00, 0.00, 15000.00, 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 20. EMAIL TEMPLATES
-- ============================================================
INSERT INTO email_templates (id, name, subject, body, category, owner_id)
VALUES
  ('0e111111-1111-1111-1111-111111111111', 'Lead Follow-up',
   'Following up on your inquiry - {{company_name}}',
   'Hi {{contact_name}},\n\nThank you for your interest in our solutions. I wanted to follow up on your recent inquiry about {{product_interest}}.\n\nWould you be available for a brief call this week to discuss your requirements?\n\nBest regards,\n{{sales_rep_name}}',
   'Lead Management', '11111111-1111-1111-1111-111111111111'),

  ('0e222222-2222-2222-2222-222222222222', 'Quote Sent',
   'Your Quote - {{quote_number}}',
   'Dear {{customer_name}},\n\nPlease find attached quote {{quote_number}} for {{product_description}}.\n\nThis quote is valid until {{valid_until}}. The total amount is {{total_amount}}.\n\nPlease let me know if you have any questions.\n\nBest regards,\n{{sales_rep_name}}',
   'Sales', '22222222-2222-2222-2222-222222222222'),

  ('0e333333-3333-3333-3333-333333333333', 'Deal Closed Won',
   'Welcome aboard! - {{company_name}}',
   'Dear {{contact_name}},\n\nWelcome to our family of customers! We are excited to begin working with {{company_name}}.\n\nOur team will reach out shortly to schedule the implementation kickoff.\n\nThank you for choosing us!\n\nBest regards,\n{{sales_rep_name}}',
   'Sales', '11111111-1111-1111-1111-111111111111'),

  ('0e444444-4444-4444-4444-444444444444', 'Demo Invitation',
   'Product Demo - {{product_name}}',
   'Hi {{contact_name}},\n\nI would like to schedule a personalized demo of {{product_name}} for you.\n\nAre you available on {{proposed_date}} at {{proposed_time}}?\n\nThe demo will cover:\n- Key features\n- Implementation process\n- Pricing options\n- Q&A\n\nLooking forward to showing you how we can help!\n\nBest regards,\n{{sales_rep_name}}',
   'Lead Management', '22222222-2222-2222-2222-222222222222'),

  ('0e555555-5555-5555-5555-555555555555', 'Meeting Reminder',
   'Reminder: Meeting Tomorrow',
   'Hi {{contact_name}},\n\nThis is a friendly reminder about our meeting tomorrow:\n\nDate: {{meeting_date}}\nTime: {{meeting_time}}\nLocation: {{meeting_location}}\n\nPlease let me know if you need to reschedule.\n\nSee you tomorrow!\n\nBest regards,\n{{sales_rep_name}}',
   'General', '33333333-3333-3333-3333-333333333333'),

  ('0e666666-6666-6666-6666-666666666666', 'Contract Renewal',
   'Contract Renewal - {{company_name}}',
   'Dear {{contact_name}},\n\nYour contract with us is due for renewal on {{renewal_date}}.\n\nWe value your partnership and would like to discuss renewal terms at your convenience.\n\nPlease let me know when you are available for a call.\n\nBest regards,\n{{sales_rep_name}}',
   'Account Management', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 21. LEAD ACTIVITIES
-- ============================================================
INSERT INTO lead_activities (id, lead_id, activity_type, title, description, created_by)
VALUES
  ('ba111111-1111-1111-1111-111111111111', '71111111-1111-1111-1111-111111111111',
   'call', 'Initial discovery call', 'Discussed network infrastructure requirements and timeline',
   '11111111-1111-1111-1111-111111111111'),

  ('ba222222-2222-2222-2222-222222222222', '71111111-1111-1111-1111-111111111111',
   'email', 'Sent quote QT-2026-001', 'Emailed detailed quote for network upgrade',
   '11111111-1111-1111-1111-111111111111'),

  ('ba333333-3333-3333-3333-333333333333', '72222222-2222-2222-2222-222222222222',
   'meeting', 'Technical requirements meeting', 'Met with IT team to review cloud migration requirements',
   '22222222-2222-2222-2222-222222222222'),

  ('ba444444-4444-4444-4444-444444444444', '73333333-3333-3333-3333-333333333333',
   'email', 'Sent HIPAA compliance documentation', 'Shared our HIPAA compliance certifications and case studies',
   '33333333-3333-3333-3333-333333333333'),

  ('ba555555-5555-5555-5555-555555555555', '74444444-4444-4444-4444-444444444444',
   'call', 'Follow-up call', 'Left voicemail regarding supply chain software demo',
   '11111111-1111-1111-1111-111111111111'),

  ('ba666666-6666-6666-6666-666666666666', '75555555-5555-5555-5555-555555555555',
   'email', 'Sent demo video', 'Shared marketing automation platform demo video',
   '22222222-2222-2222-2222-222222222222'),

  ('ba777777-7777-7777-7777-777777777777', '76666666-6666-6666-6666-666666666666',
   'meeting', 'On-site visit', 'Visited construction site to understand project management needs',
   '11111111-1111-1111-1111-111111111111'),

  ('ba888888-8888-8888-8888-888888888888', '78888888-8888-8888-8888-888888888888',
   'demo', 'Product demonstration', 'Live demo of CRM system features and customization options',
   '22222222-2222-2222-2222-222222222222'),

  ('ba999999-9999-9999-9999-999999999999', '79999999-9999-9999-9999-999999999999',
   'note', 'Lead converted to deal', 'Successfully converted lead to deal D4444444',
   '11111111-1111-1111-1111-111111111111'),

  ('baa11111-1111-1111-1111-111111111111', '7a111111-1111-1111-1111-111111111111',
   'note', 'Lead marked as lost', 'Customer chose competitor due to pricing',
   '33333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 22. NOTIFICATIONS
-- ============================================================
INSERT INTO notifications (id, user_id, type, title, message, link, is_read)
VALUES
  ('01111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'task', 'Task Due Tomorrow', 'Task "Follow up on Acme Corp proposal" is due tomorrow',
   '/tasks/a4111111-1111-1111-1111-111111111111', false),

  ('02222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
   'meeting', 'Upcoming Meeting', 'Meeting "Finance Solutions Security Review" starts in 1 hour',
   '/calendar/e5555555-5555-5555-5555-555555555555', false),

  ('03333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
   'deal', 'Deal Stage Updated', 'Deal "TechStartup - Cloud Migration" moved to Qualification',
   '/deals/d4444444-4444-4444-4444-444444444444', true),

  ('04444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222',
   'lead', 'New Lead Assigned', 'New lead "Insurance Corp" has been assigned to you',
   '/leads/78888888-8888-8888-8888-888888888888', true),

  ('05555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333',
   'quote', 'Quote Accepted', 'Quote QT-2026-005 has been accepted by TechStartup Inc',
   '/quotes/e5555555-5555-5555-5555-555555555555', false),

  ('06666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111',
   'task', 'Overdue Task', 'Task "Call TechStartup CEO" is overdue',
   '/tasks/a5111111-1111-1111-1111-111111111111', false),

  ('07777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222',
   'deal', 'Deal Won!', 'Congratulations! Deal "Previous Deal - Software Licenses" has been won',
   '/deals/da111111-1111-1111-1111-111111111111', true),

  ('08888888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333',
   'account', 'Account Health Alert', 'Account "Healthcare Plus" health score dropped below 70',
   '/accounts/a6666666-6666-6666-6666-666666666666', false),

  ('09999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111',
   'email', 'Email Sent', 'Email sent to Future Tech Systems regarding proposal',
   '/emails/e0444444-4444-4444-4444-444444444444', true),

  ('0a111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'system', 'Weekly Summary', 'Your weekly sales summary is ready to view',
   '/dashboard', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 23. CAREPACKS (Service/Warranty Contracts)
-- ============================================================
INSERT INTO carepacks (
  id, partner_id, product_type, serial_number, carepack_sku, customer_name,
  start_date, end_date, status, notes, created_by
)
VALUES
  ('cc111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Server', 'SRV-2024-001-XE2000', 'CP-SRV-3YR-NBD', 'Acme Corporation',
   '2024-01-15', '2027-01-15', 'active',
   '3-year Next Business Day hardware replacement', '11111111-1111-1111-1111-111111111111'),

  ('cc222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Storage', 'STG-2024-002-NV10TB', 'CP-STG-5YR-4H', 'Global Manufacturing Ltd',
   '2024-02-01', '2029-02-01', 'active',
   '5-year 4-hour response storage support', '22222222-2222-2222-2222-222222222222'),

  ('cc333333-3333-3333-3333-333333333333', NULL,
   'Network', 'NW-2024-003-SW10G', 'CP-NET-3YR-STD', 'Future Tech Systems',
   '2024-03-10', '2027-03-10', 'active',
   'Standard 3-year network equipment support', '11111111-1111-1111-1111-111111111111'),

  ('cc444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Firewall', 'FW-2023-004-FG100', 'CP-SEC-3YR-PRE', 'Healthcare Plus',
   '2023-06-01', '2026-06-01', 'active',
   'Premium security appliance support with firmware updates', '33333333-3333-3333-3333-333333333333'),

  ('cc555555-5555-5555-5555-555555555555', NULL,
   'POS Terminal', 'POS-2025-005-PT300', 'CP-POS-2YR-STD', 'Retail Innovations Inc',
   '2025-01-01', '2027-01-01', 'active',
   '2-year POS hardware replacement warranty', '22222222-2222-2222-2222-222222222222'),

  ('cc666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'IoT Gateway', 'IOT-2024-006-IG5K', 'CP-IOT-3YR-24x7', 'Global Manufacturing Ltd',
   '2024-04-15', '2027-04-15', 'active',
   '24x7 IoT gateway support with remote monitoring', '22222222-2222-2222-2222-222222222222'),

  ('cc777777-7777-7777-7777-777777777777', NULL,
   'Server', 'SRV-2022-007-XE1000', 'CP-SRV-3YR-NBD', 'Finance Solutions Corp',
   '2022-08-01', '2025-08-01', 'expiring_soon',
   'Warranty expiring in 6 months - renewal needed', '11111111-1111-1111-1111-111111111111'),

  ('cc888888-8888-8888-8888-888888888888', NULL,
   'UPS', 'UPS-2021-008-10KVA', 'CP-PWR-5YR-STD', 'Acme Corporation',
   '2021-09-01', '2026-09-01', 'active',
   'UPS maintenance and battery replacement', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 24. SALES ENTRIES (Sales Transactions)
-- ============================================================
INSERT INTO sales_entries (
  id, partner_id, product_id, salesperson_id, customer_name, quantity, amount,
  po_number, invoice_no, payment_status, commission_amount, sale_date, notes
)
VALUES
  ('ce111111-1111-1111-1111-111111111111',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f1111111-1111-1111-1111-111111111111',
   '11111111-1111-1111-1111-111111111111', 'Acme Corporation',
   10, 150000.00, 'PO-ACME-2026-001', 'INV-2026-0001', 'paid', 15000.00, '2026-01-15',
   'Enterprise cloud servers - completed installation'),

  ('ce222222-2222-2222-2222-222222222222',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'f4444444-4444-4444-4444-444444444444',
   '22222222-2222-2222-2222-222222222222', 'Global Manufacturing Ltd',
   5, 40000.00, 'PO-GLOBAL-2026-002', 'INV-2026-0002', 'paid', 6000.00, '2026-01-20',
   'IoT gateways for manufacturing zones'),

  ('ce333333-3333-3333-3333-333333333333',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f6666666-6666-6666-6666-666666666666',
   '33333333-3333-3333-3333-333333333333', 'Retail Innovations Inc',
   50, 60000.00, 'PO-RETAIL-2026-003', 'INV-2026-0003', 'partial', 6000.00, '2026-01-25',
   'POS terminals - 50% payment received'),

  ('ce444444-4444-4444-4444-444444444444',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f8888888-8888-8888-8888-888888888888',
   '11111111-1111-1111-1111-111111111111', 'Finance Solutions Corp',
   8, 28000.00, 'PO-FIN-2026-004', 'INV-2026-0004', 'paid', 3360.00, '2026-02-01',
   'Fortinet firewalls for security upgrade'),

  ('ce555555-5555-5555-5555-555555555555',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'f9999999-9999-9999-9999-999999999999',
   '22222222-2222-2222-2222-222222222222', 'EduTech Solutions',
   75, 22500.00, 'PO-EDU-2026-005', 'INV-2026-0005', 'pending', 5625.00, '2026-02-05',
   'Cloud POS software licenses - awaiting payment'),

  ('ce666666-6666-6666-6666-666666666666',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'f2222222-2222-2222-2222-222222222222',
   '11111111-1111-1111-1111-111111111111', 'TechStartup Inc',
   3, 24000.00, 'PO-TECH-2026-006', 'INV-2026-0006', 'paid', 1920.00, '2026-02-08',
   'NVMe storage arrays'),

  ('ce777777-7777-7777-7777-777777777777',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'fa111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222222', 'Healthcare Plus',
   1, 8000.00, 'PO-HEALTH-2026-007', 'INV-2026-0007', 'paid', 400.00, '2026-02-10',
   'Professional installation services'),

  ('ce888888-8888-8888-8888-888888888888',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f3333333-3333-3333-3333-333333333333',
   '11111111-1111-1111-1111-111111111111', 'Retail Giant',
   15, 75000.00, 'PO-RG-2026-008', 'INV-2026-0008', 'partial', 9000.00, '2026-02-12',
   'Network switches for retail locations - 50% paid'),

  ('ce999999-9999-9999-9999-999999999999',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'fb111111-1111-1111-1111-111111111111',
   '33333333-3333-3333-3333-333333333333', 'Acme Corporation',
   20, 50000.00, 'PO-ACME-2026-009', 'INV-2026-0009', 'paid', 4000.00, '2026-01-30',
   '3-year support contracts renewal'),

  ('cea11111-1111-1111-1111-111111111111',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'f5555555-5555-5555-5555-555555555555',
   '22222222-2222-2222-2222-222222222222', 'Global Manufacturing Ltd',
   200, 30000.00, 'PO-GLOBAL-2026-010', 'INV-2026-0010', 'paid', 6000.00, '2026-02-15',
   'Temperature sensors for IoT deployment')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'COMPLETE SAMPLE DATA INSERTED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'CORE ENTITIES:';
  RAISE NOTICE '  ✓ 3 Users (Sales Reps)';
  RAISE NOTICE '  ✓ 2 Partners';
  RAISE NOTICE '  ✓ 8 Accounts';
  RAISE NOTICE '  ✓ 3 Contacts';
  RAISE NOTICE '  ✓ 10 Leads (all stages)';
  RAISE NOTICE '  ✓ 12 Deals (all stages)';
  RAISE NOTICE '  ✓ 15 Products';
  RAISE NOTICE '  ✓ 6 Quotes (draft/sent/accepted/rejected)';
  RAISE NOTICE '';
  RAISE NOTICE 'SUB-ENTITIES:';
  RAISE NOTICE '  ✓ 18 Deal Line Items';
  RAISE NOTICE '  ✓ 12 Quote Line Items';
  RAISE NOTICE '  ✓ 12 Tasks';
  RAISE NOTICE '  ✓ 11 Calendar Events';
  RAISE NOTICE '  ✓ 9 Emails';
  RAISE NOTICE '  ✓ 6 Email Templates';
  RAISE NOTICE '  ✓ 10 Lead Activities';
  RAISE NOTICE '  ✓ 10 Notifications';
  RAISE NOTICE '  ✓ 8 Carepacks (Service Contracts)';
  RAISE NOTICE '  ✓ 10 Sales Entries';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ANALYTICS DATA DISTRIBUTION:';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'DEALS BY STAGE:';
  RAISE NOTICE '  • Qualification: 3 deals (490K)';
  RAISE NOTICE '  • Needs Analysis: 2 deals (1.34M)';
  RAISE NOTICE '  • Proposal: 2 deals (300K)';
  RAISE NOTICE '  • Negotiation: 1 deal (180K)';
  RAISE NOTICE '  • Closed Won: 2 deals (245K)';
  RAISE NOTICE '  • Closed Lost: 2 deals (200K)';
  RAISE NOTICE '';
  RAISE NOTICE 'LEADS BY STAGE:';
  RAISE NOTICE '  • New: 2 leads';
  RAISE NOTICE '  • Contacted: 3 leads';
  RAISE NOTICE '  • Qualified: 4 leads';
  RAISE NOTICE '  • Converted: 1 lead';
  RAISE NOTICE '  • Lost: 1 lead';
  RAISE NOTICE '';
  RAISE NOTICE 'QUOTES BY STATUS:';
  RAISE NOTICE '  • Draft: 1 quote';
  RAISE NOTICE '  • Sent: 3 quotes';
  RAISE NOTICE '  • Accepted: 1 quote';
  RAISE NOTICE '  • Rejected: 1 quote';
  RAISE NOTICE '';
  RAISE NOTICE 'SALES METRICS:';
  RAISE NOTICE '  • Total Pipeline Value: 2,990,000';
  RAISE NOTICE '  • Total Closed Revenue: 245,000';
  RAISE NOTICE '  • Win Rate: 50 percent (2 won / 4 closed)';
  RAISE NOTICE '  • Total Sales Entries: 487,500';
  RAISE NOTICE '  • Active Carepacks: 8 contracts';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ALL TABLES POPULATED - READY FOR ANALYTICS!';
  RAISE NOTICE '========================================';
END $$;
