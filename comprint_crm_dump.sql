--
-- PostgreSQL database dump
--

\restrict PoBZbPYkYcEhUzrlEWugKloHaXppZqPr3SaW1ehXAakhNJ38yavUnvLTacACZXo

-- Dumped from database version 16.11 (Homebrew)
-- Dumped by pg_dump version 16.11 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    industry character varying(100),
    website character varying(500),
    revenue numeric(15,2),
    employees integer,
    location character varying(255),
    type character varying(50),
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    phone character varying(50),
    email character varying(255),
    health_score integer,
    description text,
    owner_id uuid,
    gstin_no character varying(50),
    payment_terms character varying(100),
    account_image character varying(500),
    group_name character varying(255),
    parent_account_id uuid,
    endcustomer_category character varying(100),
    products_selling_to_them text,
    products_they_sell text,
    pan_no character varying(50),
    partner_id uuid,
    lead_category character varying(100),
    new_leads integer DEFAULT 0,
    references_doc character varying(500),
    bank_statement_doc character varying(500),
    tag character varying(50),
    account_type character varying(50),
    contact_name character varying(255),
    contact_email character varying(255),
    contact_phone character varying(50),
    contact_designation character varying(100),
    contact_designation_other character varying(100),
    billing_street text,
    billing_city character varying(100),
    billing_state character varying(100),
    billing_code character varying(20),
    billing_country character varying(100),
    shipping_street text,
    shipping_city character varying(100),
    shipping_state character varying(100),
    shipping_code character varying(20),
    shipping_country character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id uuid NOT NULL,
    user_id uuid,
    user_name character varying(200),
    action character varying(20) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id character varying(100),
    entity_name character varying(255),
    changes jsonb,
    ip_address character varying(50),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


--
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    type character varying(50),
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone,
    all_day boolean DEFAULT false,
    location character varying(500),
    meeting_link character varying(500),
    owner_id uuid,
    color character varying(20),
    related_to_type character varying(50),
    related_to_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: carepacks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carepacks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    partner_id uuid,
    product_type character varying(100),
    serial_number character varying(100),
    carepack_sku character varying(100),
    customer_name character varying(255),
    start_date date,
    end_date date,
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100),
    email character varying(255),
    phone character varying(50),
    mobile character varying(50),
    job_title character varying(100),
    department character varying(100),
    account_id uuid,
    type character varying(50),
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    notes text,
    preferred_contact character varying(50),
    owner_id uuid,
    image character varying(500),
    description text,
    contact_group character varying(100),
    ctsipl_email character varying(255),
    pan character varying(50),
    gstin_no character varying(50),
    product_interested character varying(255),
    product_interested_text text,
    lead_source character varying(100),
    lead_category character varying(100),
    designation character varying(100),
    vendor_name character varying(255),
    partner_id uuid,
    new_leads boolean DEFAULT false,
    gst_certificate_url text,
    msme_certificate_url text,
    pan_card_url text,
    aadhar_card_url text,
    bandwidth_required character varying(255),
    product_configuration text,
    product_details text,
    rental_duration character varying(100),
    product_name_part_number text,
    specifications text,
    mailing_street text,
    mailing_city character varying(100),
    mailing_state character varying(100),
    mailing_zip character varying(20),
    mailing_country character varying(100),
    other_street text,
    other_city character varying(100),
    other_state character varying(100),
    other_zip character varying(20),
    other_country character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: deal_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deal_activities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    deal_id uuid NOT NULL,
    activity_type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: deal_line_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deal_line_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    deal_id uuid NOT NULL,
    product_category character varying(100),
    product_sub_category character varying(100),
    part_number character varying(255),
    description text,
    quantity integer DEFAULT 1 NOT NULL,
    pricing numeric(15,2),
    total_price numeric(15,2),
    warehouse character varying(100),
    total_rental numeric(15,2),
    rental_per_unit numeric(15,2),
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: deals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    company character varying(255),
    account_id uuid,
    value numeric(15,2),
    stage character varying(50) DEFAULT 'New'::character varying NOT NULL,
    probability integer,
    owner_id uuid,
    closing_date date,
    description text,
    contact_id uuid,
    next_step character varying(500),
    forecast character varying(50),
    type character varying(50),
    lead_source character varying(100),
    sdp_no character varying(100),
    sales_created_by_rm uuid,
    lead_category character varying(100),
    product_manager character varying(255),
    expected_revenue numeric(15,2),
    bandwidth_required character varying(255),
    product_configuration text,
    rental_duration character varying(100),
    enter_product_details text,
    product_name_and_part_number character varying(500),
    specifications text,
    show_subform boolean DEFAULT false,
    billing_delivery_date date,
    description_of_product text,
    payment character varying(255),
    payment_terms character varying(100),
    po_number_or_mail_confirmation character varying(255),
    integration_requirement character varying(100),
    brand character varying(255),
    orc_amount numeric(15,2),
    product_warranty character varying(255),
    ship_by character varying(100),
    special_instruction text,
    third_party_delivery_address text,
    billing_company character varying(255),
    email_subject character varying(500),
    additional_information text,
    da character varying(100),
    delivery_address text,
    tag character varying(50),
    payment_flag boolean DEFAULT false,
    contact_no character varying(50),
    designation character varying(200),
    email character varying(255),
    location character varying(255),
    next_follow_up date,
    requirement text,
    quoted_requirement text,
    billing_street text,
    billing_state character varying(100),
    billing_country character varying(100),
    billing_city character varying(100),
    billing_zip_code character varying(20),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    type_of_order character varying(100)
);


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_templates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    subject character varying(500),
    body text,
    category character varying(100),
    owner_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: emails; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emails (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    subject character varying(500) NOT NULL,
    body text,
    from_address character varying(255),
    to_address character varying(255),
    cc text,
    bcc text,
    status character varying(50) DEFAULT 'draft'::character varying NOT NULL,
    sent_at timestamp with time zone,
    scheduled_at timestamp with time zone,
    related_to_type character varying(50),
    related_to_id uuid,
    template_id uuid,
    owner_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: lead_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_activities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    lead_id uuid NOT NULL,
    activity_type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_name character varying(255) NOT NULL,
    contact_person character varying(200),
    email character varying(255),
    phone character varying(50),
    source character varying(100),
    stage character varying(50) DEFAULT 'New'::character varying NOT NULL,
    priority character varying(20) DEFAULT 'Medium'::character varying NOT NULL,
    estimated_value numeric(15,2),
    product_interest character varying(255),
    assigned_to uuid,
    partner_id uuid,
    notes text,
    expected_close_date date,
    lost_reason text,
    won_sale_id uuid,
    next_follow_up date,
    first_name character varying(100),
    last_name character varying(100),
    mobile character varying(50),
    mobile_alternate character varying(50),
    phone_alternate character varying(50),
    campaign_source character varying(100),
    website character varying(500),
    account_type character varying(50),
    lead_category character varying(50),
    product_list character varying(255),
    type_of_order character varying(100),
    billing_delivery_date date,
    order_product_details text,
    payment character varying(100),
    po_number_or_mail_confirmation character varying(100),
    brand character varying(100),
    orc_amount numeric(15,2),
    product_warranty character varying(100),
    ship_by character varying(100),
    special_instruction text,
    third_party_delivery_address text,
    billing_company character varying(255),
    enter_product_details text,
    rental_duration character varying(100),
    product_configuration text,
    bandwidth_required character varying(100),
    product_name_and_part_number character varying(255),
    specifications text,
    form_name character varying(100),
    billing_street character varying(255),
    billing_city character varying(100),
    billing_state character varying(100),
    billing_country character varying(100),
    billing_zip_code character varying(20),
    description text,
    lead_time character varying(100),
    product_name character varying(255),
    receiver_mobile_number character varying(50),
    subject character varying(500),
    sender_landline_no character varying(50),
    sender_landline_no_alt character varying(50),
    call_duration character varying(50),
    lead_type character varying(50),
    query_id character varying(100),
    mcat_name character varying(100),
    tag character varying(50),
    designation character varying(200),
    location character varying(255),
    requirement text,
    quoted_requirement text,
    lead_image text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: master_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.master_categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: master_dropdowns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.master_dropdowns (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    entity character varying(255) NOT NULL,
    value character varying(255) NOT NULL,
    label character varying(255) NOT NULL,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: master_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.master_locations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    city character varying(255) NOT NULL,
    state character varying(255),
    region character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: master_oems; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.master_oems (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    oem_id uuid,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    product_manager_id uuid,
    product_manager_ids text DEFAULT '[]'::text
);


--
-- Name: master_partner_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.master_partner_types (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: master_verticals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.master_verticals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    type character varying(50),
    title character varying(255),
    message text,
    link character varying(500),
    is_read boolean DEFAULT false NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: partners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partners (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_name character varying(255) NOT NULL,
    contact_person character varying(200),
    email character varying(255),
    phone character varying(50),
    mobile character varying(50),
    gst_number character varying(50),
    pan_number character varying(50),
    address text,
    city character varying(100),
    state character varying(100),
    pincode character varying(20),
    partner_type character varying(50),
    vertical character varying(100),
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    tier character varying(50) DEFAULT 'new'::character varying NOT NULL,
    assigned_to uuid,
    approved_by uuid,
    approved_at timestamp with time zone,
    rejection_reason text,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(100),
    base_price numeric(15,2),
    commission_rate numeric(5,2) DEFAULT '0'::numeric,
    stock integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: quote_line_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quote_line_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    quote_id uuid NOT NULL,
    product_id uuid,
    description text,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(15,2) NOT NULL,
    discount_pct numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    line_total numeric(15,2) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: quote_selected_terms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quote_selected_terms (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    quote_id uuid NOT NULL,
    term_id uuid NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: quote_terms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quote_terms (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    content text NOT NULL,
    is_predefined boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: quotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    quote_number character varying(50),
    lead_id uuid,
    partner_id uuid,
    customer_name character varying(255) NOT NULL,
    valid_until date,
    subtotal numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    tax_rate numeric(5,2) DEFAULT '18'::numeric NOT NULL,
    tax_amount numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    discount_amount numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    total_amount numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    status character varying(50) DEFAULT 'draft'::character varying NOT NULL,
    terms text,
    notes text,
    pdf_url text,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    role_id uuid NOT NULL,
    entity character varying(50) NOT NULL,
    can_view boolean DEFAULT false NOT NULL,
    can_create boolean DEFAULT false NOT NULL,
    can_edit boolean DEFAULT false NOT NULL,
    can_delete boolean DEFAULT false NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    label character varying(100) NOT NULL,
    description text,
    is_system boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: sales_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_entries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    partner_id uuid,
    product_id uuid,
    salesperson_id uuid NOT NULL,
    customer_name character varying(255),
    quantity integer DEFAULT 1 NOT NULL,
    amount numeric(15,2) NOT NULL,
    po_number character varying(100),
    invoice_no character varying(100),
    payment_status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    commission_amount numeric(15,2) DEFAULT '0'::numeric,
    sale_date date NOT NULL,
    location_id uuid,
    vertical_id uuid,
    notes text,
    description text,
    deal_id uuid,
    product_ids jsonb DEFAULT '[]'::jsonb,
    contact_name character varying(255),
    contact_no character varying(50),
    email character varying(255),
    gstin character varying(50),
    pan_no character varying(50),
    dispatch_method character varying(50),
    payment_terms character varying(255),
    order_type character varying(50),
    serial_number character varying(255),
    boq text,
    price numeric(15,2),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    key character varying(100) NOT NULL,
    value text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    type character varying(50),
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    priority character varying(20) DEFAULT 'Medium'::character varying NOT NULL,
    due_date date,
    due_time time without time zone,
    assigned_to uuid,
    created_by uuid,
    completed_at timestamp with time zone,
    related_to_type character varying(50),
    related_to_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    name character varying(200) NOT NULL,
    role character varying(50) DEFAULT 'sales'::character varying NOT NULL,
    department character varying(100),
    phone character varying(50),
    employee_id character varying(50),
    manager_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    must_change_password boolean DEFAULT false NOT NULL,
    monthly_target numeric(15,2),
    last_login timestamp with time zone,
    view_access character varying(50) DEFAULT 'presales'::character varying NOT NULL,
    tag character varying(50),
    dashboard_preferences jsonb DEFAULT '{"widgets": [], "lastModified": null}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts (id, name, industry, website, revenue, employees, location, type, status, phone, email, health_score, description, owner_id, gstin_no, payment_terms, account_image, group_name, parent_account_id, endcustomer_category, products_selling_to_them, products_they_sell, pan_no, partner_id, lead_category, new_leads, references_doc, bank_statement_doc, tag, account_type, contact_name, contact_email, contact_phone, contact_designation, contact_designation_other, billing_street, billing_city, billing_state, billing_code, billing_country, shipping_street, shipping_city, shipping_state, shipping_code, shipping_country, created_at, updated_at) FROM stdin;
25ed42dd-d150-4845-84c0-c8a9edfbc79d	TechCorp Solutions 1	Technology	www.techcorpsolutions0.com	\N	\N	\N	\N	active	+91 8284327914	isha@techcorpsolutio.com	\N	Leading technology company with 2276 employees	11f1c307-f3cc-4904-90cb-b97f89fc9d43	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	994 Main Road	Pune	Karnataka	245688	India	103 Tech Park	Pune	Karnataka	289834	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
087f8339-a50a-48bf-bec2-e01245ff894a	Shopping Systems 2	Retail	www.shoppingsystems1.com	\N	\N	\N	\N	inactive	+91 8386127524	kavya@shoppingsystems.com	\N	Leading retail company with 2216 employees	21173b45-5320-4943-ba5a-be5a3d586cb1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	12 Main Road	Ahmedabad	Rajasthan	238969	India	370 Industrial Area	Ahmedabad	Rajasthan	955368	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
cbafeffe-ecbc-47d1-8704-d0db67cf3614	Education Innovations 3	Education	www.educationinnovations2.com	\N	\N	\N	\N	inactive	+91 8778191381	neha@educationinnova.com	\N	Leading education company with 2653 employees	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	460 Park Street	Bangalore	Rajasthan	569349	India	186 Tech Park	Bangalore	Rajasthan	201062	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d9957ed9-c587-48a1-a683-e310fefcb6c7	Retail Tech Inc 4	Retail	www.retailtechinc3.com	\N	\N	\N	\N	inactive	+91 9708243873	sneha@retailtechinc.com	\N	Leading retail company with 3135 employees	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	\N	\N	\N	\N	\N	\N	\N	\N	\N	5aaa5db7-6043-4cd7-ad7c-e56569b45886	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	679 Main Road	Indore	Delhi	292281	India	499 Business District	Indore	Delhi	530727	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
62b1dad2-cfdd-46ab-ba22-093ddb8bf26a	AI Dynamics 5	Technology	www.aidynamics4.com	\N	\N	\N	\N	inactive	+91 8925947229	divya@aidynamics.com	\N	Leading technology company with 2854 employees	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	607 MG Road	Lucknow	Telangana	901257	India	487 Business District	Lucknow	Telangana	293821	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
6c3cf2ac-dae5-4b55-8e6e-488d58985d4d	Precision Manufacturing Ltd 6	Manufacturing	www.precisionmanufacturingltd5.com	\N	\N	\N	\N	active	+91 7871673801	anjali@precisionmanufa.com	\N	Leading manufacturing company with 896 employees	09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	\N	\N	\N	\N	\N	\N	\N	\N	\N	6786bf47-38e0-4276-b435-010e156e9cda	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	106 MG Road	Chennai	West Bengal	232072	India	109 Business District	Chennai	West Bengal	155826	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
b48a0164-d69b-49ed-b1c8-645c95bbeee3	Capital Advisors 7	Finance	www.capitaladvisors6.com	\N	\N	\N	\N	active	+91 8168797185	pooja@capitaladvisors.com	\N	Leading finance company with 2535 employees	1d3255e6-5d5b-4f5b-b3d6-73f01eebf427	\N	\N	\N	\N	\N	\N	\N	\N	\N	5aaa5db7-6043-4cd7-ad7c-e56569b45886	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	964 Park Street	Lucknow	Gujarat	551142	India	35 Industrial Area	Lucknow	Gujarat	920556	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
6b479315-e98a-447c-9d64-75a8cfeea515	Investment Partners 8	Finance	www.investmentpartners7.com	\N	\N	\N	\N	active	+91 7768456144	rahul@investmentpartn.com	\N	Leading finance company with 3747 employees	21173b45-5320-4943-ba5a-be5a3d586cb1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	213 Park Street	Ahmedabad	Rajasthan	965329	India	975 Business District	Ahmedabad	Rajasthan	978958	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
66da423e-9e3b-4364-8894-8ce01f36207c	EduTech Solutions 9	Education	www.edutechsolutions8.com	\N	\N	\N	\N	active	+91 8134057253	arjun@edutechsolution.com	\N	Leading education company with 4790 employees	1d3255e6-5d5b-4f5b-b3d6-73f01eebf427	\N	\N	\N	\N	\N	\N	\N	\N	\N	93199341-d622-4a36-9aaf-4d6131c10c6d	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	750 Main Road	Hyderabad	Tamil Nadu	446647	India	154 Industrial Area	Hyderabad	Tamil Nadu	487371	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d660978f-d8b7-48b0-b4c4-3b9ef8e0526d	Industrial Solutions Corp 10	Manufacturing	www.industrialsolutionscorp9.com	\N	\N	\N	\N	inactive	+91 8301229267	amit@industrialsolut.com	\N	Leading manufacturing company with 4404 employees	09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	\N	\N	\N	\N	\N	\N	\N	\N	\N	8135a9f2-bd4a-4290-8bef-738fd99a243e	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	966 Main Road	Lucknow	Karnataka	257519	India	597 Industrial Area	Lucknow	Karnataka	373329	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
6a8be5f7-6ac2-431d-ace1-aff631f6f559	Steel Works Inc 11	Manufacturing	www.steelworksinc10.com	\N	\N	\N	\N	inactive	+91 8501677580	isha@steelworksinc.com	\N	Leading manufacturing company with 829 employees	09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	\N	\N	\N	\N	\N	\N	\N	\N	\N	8135a9f2-bd4a-4290-8bef-738fd99a243e	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	587 MG Road	Mumbai	Delhi	759928	India	64 Tech Park	Mumbai	Delhi	364270	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
b0c69eb2-0566-4cf2-83b2-268d08cddf2f	Precision Manufacturing Ltd 12	Manufacturing	www.precisionmanufacturingltd11.com	\N	\N	\N	\N	active	+91 9369918725	pooja@precisionmanufa.com	\N	Leading manufacturing company with 570 employees	1d3255e6-5d5b-4f5b-b3d6-73f01eebf427	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	973 MG Road	Hyderabad	Karnataka	301503	India	629 Tech Park	Hyderabad	Karnataka	677767	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
b10734ee-1b6f-41f1-997a-957aa880c789	Capital Advisors 13	Finance	www.capitaladvisors12.com	\N	\N	\N	\N	inactive	+91 9814547603	karan@capitaladvisors.com	\N	Leading finance company with 936 employees	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	\N	\N	\N	\N	\N	\N	\N	\N	\N	f33ac0c3-3d1d-4117-9e0b-df5515a83727	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	541 Park Street	Delhi	Maharashtra	170599	India	502 Industrial Area	Delhi	Maharashtra	417903	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e573e8fc-7824-4b10-b3d6-0e70cbde8a52	Industrial Solutions Corp 14	Manufacturing	www.industrialsolutionscorp13.com	\N	\N	\N	\N	inactive	+91 9011757112	karan@industrialsolut.com	\N	Leading manufacturing company with 2025 employees	f9701eca-09f1-48b3-95b8-9d61684cac10	\N	\N	\N	\N	\N	\N	\N	\N	\N	d59f4209-9ed3-4bed-8231-f974138b2e65	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	26 Park Street	Jaipur	Tamil Nadu	277690	India	737 Tech Park	Jaipur	Tamil Nadu	677161	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
24e65943-7963-4ef5-a189-a1c5aa19e291	Education Innovations 15	Education	www.educationinnovations14.com	\N	\N	\N	\N	inactive	+91 7963490782	isha@educationinnova.com	\N	Leading education company with 4656 employees	f9701eca-09f1-48b3-95b8-9d61684cac10	\N	\N	\N	\N	\N	\N	\N	\N	\N	d0ba6c45-3eb6-4408-9a52-00c1c0c8dff8	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	811 Main Road	Hyderabad	Delhi	381105	India	575 Business District	Hyderabad	Delhi	154383	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
0b0e094b-d026-4305-8e92-d2814731cf25	Industrial Solutions Corp 16	Manufacturing	www.industrialsolutionscorp15.com	\N	\N	\N	\N	inactive	+91 7610059309	sanjay@industrialsolut.com	\N	Leading manufacturing company with 246 employees	35417c40-2a83-4e3d-bca2-447f4304f7b3	\N	\N	\N	\N	\N	\N	\N	\N	\N	6093f9de-4eb0-4041-ae04-a4797c471ba9	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	139 Main Road	Surat	Uttar Pradesh	522519	India	422 Tech Park	Surat	Uttar Pradesh	397379	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
ea2ffeae-62c5-4c89-994a-a12a76fada53	Precision Manufacturing Ltd 17	Manufacturing	www.precisionmanufacturingltd16.com	\N	\N	\N	\N	inactive	+91 8349952876	arjun@precisionmanufa.com	\N	Leading manufacturing company with 159 employees	d8699681-b89d-4914-a9e1-4cb5f15feeb2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	537 Main Road	Ahmedabad	Rajasthan	708253	India	342 Business District	Ahmedabad	Rajasthan	593805	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d1e0828d-fe9d-4831-8aea-bf9f164cbd0b	Consumer Goods Corp 18	Retail	www.consumergoodscorp17.com	\N	\N	\N	\N	active	+91 9560574732	sanjay@consumergoodsco.com	\N	Leading retail company with 3133 employees	e03c5d7b-6be1-43da-a72b-c2f60ae9863f	\N	\N	\N	\N	\N	\N	\N	\N	\N	d43ca79b-07de-4ceb-8e3e-6898c30c85dd	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	180 Park Street	Hyderabad	Delhi	391148	India	937 Business District	Hyderabad	Delhi	523488	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
5881482c-3abb-48b6-8daa-5dbedfd835a8	TechCorp Solutions 19	Technology	www.techcorpsolutions18.com	\N	\N	\N	\N	inactive	+91 8211728701	arjun@techcorpsolutio.com	\N	Leading technology company with 3375 employees	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	\N	\N	\N	\N	\N	\N	\N	\N	\N	d43ca79b-07de-4ceb-8e3e-6898c30c85dd	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	765 Park Street	Pune	Telangana	478847	India	824 Business District	Pune	Telangana	316272	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
c0bebce4-e3a7-46da-9c74-b1efde053de2	EduTech Solutions 20	Education	www.edutechsolutions19.com	\N	\N	\N	\N	inactive	+91 9808011777	sanjay@edutechsolution.com	\N	Leading education company with 4927 employees	11f1c307-f3cc-4904-90cb-b97f89fc9d43	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	910 MG Road	Lucknow	Maharashtra	160461	India	361 Industrial Area	Lucknow	Maharashtra	921150	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
9cc6d8b3-e9c8-445b-b1da-f6ca60a0e005	AutoParts Manufacturing 21	Manufacturing	www.autopartsmanufacturing20.com	\N	\N	\N	\N	active	+91 7509822411	arjun@autopartsmanufa.com	\N	Leading manufacturing company with 4949 employees	11f1c307-f3cc-4904-90cb-b97f89fc9d43	\N	\N	\N	\N	\N	\N	\N	\N	\N	6093f9de-4eb0-4041-ae04-a4797c471ba9	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	368 MG Road	Ahmedabad	Telangana	184118	India	78 Industrial Area	Ahmedabad	Telangana	949464	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
dca02841-1964-401d-ac5d-1a3cbb273605	CyberSafe Solutions 22	Technology	www.cybersafesolutions21.com	\N	\N	\N	\N	active	+91 9009036624	divya@cybersafesoluti.com	\N	Leading technology company with 2896 employees	1b45ba6b-98f7-407b-826c-5ce61d112a0f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	75 MG Road	Pune	Uttar Pradesh	376120	India	794 Industrial Area	Pune	Uttar Pradesh	389065	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
07cc70c1-de89-4316-8153-db2daf126b0d	HealthFirst Systems 23	Healthcare	www.healthfirstsystems22.com	\N	\N	\N	\N	inactive	+91 9337288011	rohan@healthfirstsyst.com	\N	Leading healthcare company with 3419 employees	09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	729 MG Road	Surat	Madhya Pradesh	507416	India	870 Business District	Surat	Madhya Pradesh	124893	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
db2b6912-34e9-4ae6-977b-49e819e05648	MediCare Solutions 24	Healthcare	www.medicaresolutions23.com	\N	\N	\N	\N	active	+91 8231211637	divya@medicaresolutio.com	\N	Leading healthcare company with 2595 employees	1d3255e6-5d5b-4f5b-b3d6-73f01eebf427	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	636 MG Road	Surat	Delhi	779364	India	424 Tech Park	Surat	Delhi	750072	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e77a65c5-e9c8-4a06-a95f-f671000570f7	Consumer Goods Corp 25	Retail	www.consumergoodscorp24.com	\N	\N	\N	\N	active	+91 8566221724	sneha@consumergoodsco.com	\N	Leading retail company with 4237 employees	512f9954-6c97-4118-b7fe-890710702f92	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	700 Main Road	Lucknow	Delhi	214921	India	22 Business District	Lucknow	Delhi	505585	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
87149a52-d474-43c1-9cc9-32d77bdd25e5	DataFlow Technologies 26	Technology	www.dataflowtechnologies25.com	\N	\N	\N	\N	inactive	+91 7974459390	priya@dataflowtechnol.com	\N	Leading technology company with 2144 employees	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	\N	\N	\N	\N	\N	\N	\N	\N	\N	8135a9f2-bd4a-4290-8bef-738fd99a243e	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	821 Main Road	Lucknow	Delhi	370015	India	326 Tech Park	Lucknow	Delhi	921285	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
1c23b5ca-0f1a-47aa-b5cb-8f59942bdf8b	FinTech Solutions 27	Finance	www.fintechsolutions26.com	\N	\N	\N	\N	active	+91 7626469393	vikram@fintechsolution.com	\N	Leading finance company with 1321 employees	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	585 MG Road	Kolkata	Uttar Pradesh	841922	India	832 Industrial Area	Kolkata	Uttar Pradesh	149819	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
028dddc1-d19a-44e5-a97f-74e23ada58d4	Financial Services Corp 28	Finance	www.financialservicescorp27.com	\N	\N	\N	\N	inactive	+91 7126316085	arjun@financialservic.com	\N	Leading finance company with 4844 employees	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	\N	\N	\N	\N	\N	\N	\N	\N	\N	a28a5b90-ae38-4587-bdd8-b63e55454de5	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	353 Park Street	Chennai	Telangana	603055	India	670 Tech Park	Chennai	Telangana	531282	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
6fb026e6-f09c-49d3-a67e-aa287ea22e1c	Investment Partners 29	Finance	www.investmentpartners28.com	\N	\N	\N	\N	inactive	+91 9625189970	karan@investmentpartn.com	\N	Leading finance company with 3286 employees	11f1c307-f3cc-4904-90cb-b97f89fc9d43	\N	\N	\N	\N	\N	\N	\N	\N	\N	d8ee5a99-f12a-4470-8211-8c55aee8090f	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	414 Main Road	Indore	Uttar Pradesh	427554	India	232 Tech Park	Indore	Uttar Pradesh	596465	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
6f5a8a04-0700-4e63-bdaa-19f3e393bc7d	E-Commerce Dynamics 30	Retail	www.e-commercedynamics29.com	\N	\N	\N	\N	active	+91 9768911697	kavya@e-commercedynam.com	\N	Leading retail company with 2315 employees	f9701eca-09f1-48b3-95b8-9d61684cac10	\N	\N	\N	\N	\N	\N	\N	\N	\N	d8ee5a99-f12a-4470-8211-8c55aee8090f	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	895 Main Road	Kanpur	Tamil Nadu	753521	India	892 Business District	Kanpur	Tamil Nadu	992727	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
b86cbebb-2363-4d3c-88a5-6712adb78053	Training Solutions Inc 31	Education	www.trainingsolutionsinc30.com	\N	\N	\N	\N	active	+91 7328486328	rajesh@trainingsolutio.com	\N	Leading education company with 3230 employees	6190aefe-9845-4000-ab34-5423f0982d38	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	238 MG Road	Bangalore	Tamil Nadu	704581	India	61 Industrial Area	Bangalore	Tamil Nadu	745953	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
0e3764a9-5d1a-430b-b296-b9c105355a01	Digital Innovations Inc 32	Technology	www.digitalinnovationsinc31.com	\N	\N	\N	\N	active	+91 9007259611	kavya@digitalinnovati.com	\N	Leading technology company with 1503 employees	5b5738bf-2222-4ca7-90bc-bd05b58cded4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	696 Main Road	Delhi	Telangana	523879	India	693 Business District	Delhi	Telangana	830223	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
6b492088-0f0c-4b5b-860d-cff6854201d7	Training Solutions Inc 33	Education	www.trainingsolutionsinc32.com	\N	\N	\N	\N	inactive	+91 7272132284	anjali@trainingsolutio.com	\N	Leading education company with 418 employees	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	\N	\N	\N	\N	\N	\N	\N	\N	\N	d59f4209-9ed3-4bed-8231-f974138b2e65	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	391 MG Road	Lucknow	Telangana	429638	India	517 Business District	Lucknow	Telangana	250132	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
c919bd4a-8f2e-42d7-83fd-e7dff14a716b	Financial Services Corp 34	Finance	www.financialservicescorp33.com	\N	\N	\N	\N	inactive	+91 7728265051	rahul@financialservic.com	\N	Leading finance company with 2440 employees	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	427 Main Road	Chennai	Uttar Pradesh	815022	India	365 Tech Park	Chennai	Uttar Pradesh	101265	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e118cc01-a48c-4cb0-bfd5-9db549ee460c	Academic Software 35	Education	www.academicsoftware34.com	\N	\N	\N	\N	active	+91 8512714718	sneha@academicsoftwar.com	\N	Leading education company with 2741 employees	11f1c307-f3cc-4904-90cb-b97f89fc9d43	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	123 MG Road	Hyderabad	West Bengal	616476	India	365 Tech Park	Hyderabad	West Bengal	991136	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
820d1b19-d1cc-4a20-aff5-660047806b61	CyberSafe Solutions 36	Technology	www.cybersafesolutions35.com	\N	\N	\N	\N	active	+91 8158566398	amit@cybersafesoluti.com	\N	Leading technology company with 1462 employees	35417c40-2a83-4e3d-bca2-447f4304f7b3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	471 Main Road	Chennai	Tamil Nadu	997956	India	128 Business District	Chennai	Tamil Nadu	398400	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
26864fc0-f8ce-4aef-8056-0ad5acc18b26	Training Solutions Inc 37	Education	www.trainingsolutionsinc36.com	\N	\N	\N	\N	active	+91 7901514570	neha@trainingsolutio.com	\N	Leading education company with 48 employees	35417c40-2a83-4e3d-bca2-447f4304f7b3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	22 Main Road	Bangalore	Delhi	160565	India	516 Tech Park	Bangalore	Delhi	201864	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d5423dac-26a9-49f6-8239-7445746d3cbd	Banking Systems Inc 38	Finance	www.bankingsystemsinc37.com	\N	\N	\N	\N	inactive	+91 7311036518	pooja@bankingsystemsi.com	\N	Leading finance company with 1976 employees	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	426 Park Street	Lucknow	Gujarat	257142	India	4 Business District	Lucknow	Gujarat	161557	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d13ca4f4-e713-4141-9fce-f2b49b01cbee	Assembly Line Systems 39	Manufacturing	www.assemblylinesystems38.com	\N	\N	\N	\N	inactive	+91 7046536150	rajesh@assemblylinesys.com	\N	Leading manufacturing company with 888 employees	14a3756a-5a80-460a-90b2-96f572cffd76	\N	\N	\N	\N	\N	\N	\N	\N	\N	24ec9695-6282-4b99-80db-fd20becbf39d	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	545 Main Road	Hyderabad	Tamil Nadu	362399	India	303 Industrial Area	Hyderabad	Tamil Nadu	385494	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
edd6d10d-2bfe-4774-87f8-f0194d1b9d14	FinTech Solutions 40	Finance	www.fintechsolutions39.com	\N	\N	\N	\N	active	+91 7682288885	neha@fintechsolution.com	\N	Leading finance company with 4432 employees	09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	\N	\N	\N	\N	\N	\N	\N	\N	\N	a28a5b90-ae38-4587-bdd8-b63e55454de5	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	541 Park Street	Surat	Uttar Pradesh	429387	India	15 Tech Park	Surat	Uttar Pradesh	357259	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
f7a08d86-d0f4-454a-a3f9-c6f35559e781	Precision Manufacturing Ltd 41	Manufacturing	www.precisionmanufacturingltd40.com	\N	\N	\N	\N	active	+91 7550317894	neha@precisionmanufa.com	\N	Leading manufacturing company with 4541 employees	1b45ba6b-98f7-407b-826c-5ce61d112a0f	\N	\N	\N	\N	\N	\N	\N	\N	\N	d43ca79b-07de-4ceb-8e3e-6898c30c85dd	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	478 MG Road	Bangalore	Karnataka	664629	India	258 Business District	Bangalore	Karnataka	410290	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
12bbedd6-0c71-4c99-b500-a8b4a5b1ac18	Learning Management Systems 42	Education	www.learningmanagementsystems41.com	\N	\N	\N	\N	active	+91 8294630097	sneha@learningmanagem.com	\N	Leading education company with 4627 employees	09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	431 MG Road	Bangalore	Gujarat	131479	India	767 Tech Park	Bangalore	Gujarat	959024	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
37e0d540-33f6-44b6-a39e-a7686dc832cb	Retail Chain Solutions 43	Retail	www.retailchainsolutions42.com	\N	\N	\N	\N	active	+91 9295938516	divya@retailchainsolu.com	\N	Leading retail company with 2378 employees	6190aefe-9845-4000-ab34-5423f0982d38	\N	\N	\N	\N	\N	\N	\N	\N	\N	d8ee5a99-f12a-4470-8211-8c55aee8090f	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	303 Main Road	Delhi	Uttar Pradesh	167348	India	262 Industrial Area	Delhi	Uttar Pradesh	368950	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
3f38f5fe-dd5e-4077-986a-ac53128d7f31	Retail Tech Inc 44	Retail	www.retailtechinc43.com	\N	\N	\N	\N	active	+91 7817890833	rahul@retailtechinc.com	\N	Leading retail company with 2952 employees	14a3756a-5a80-460a-90b2-96f572cffd76	\N	\N	\N	\N	\N	\N	\N	\N	\N	24f066f8-baaf-4b93-a030-66950ae1aa53	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	771 Main Road	Indore	West Bengal	384824	India	826 Business District	Indore	West Bengal	643337	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
112c7960-d87c-4fae-a92c-f6c772242255	Training Solutions Inc 45	Education	www.trainingsolutionsinc44.com	\N	\N	\N	\N	inactive	+91 8514765466	amit@trainingsolutio.com	\N	Leading education company with 2926 employees	11f1c307-f3cc-4904-90cb-b97f89fc9d43	\N	\N	\N	\N	\N	\N	\N	\N	\N	24f066f8-baaf-4b93-a030-66950ae1aa53	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	29 Main Road	Kolkata	Karnataka	555152	India	257 Business District	Kolkata	Karnataka	913599	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
a21003d8-4d62-490b-bcf6-553482584a3a	Consumer Goods Corp 46	Retail	www.consumergoodscorp45.com	\N	\N	\N	\N	inactive	+91 8383762156	rahul@consumergoodsco.com	\N	Leading retail company with 512 employees	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	214 MG Road	Kanpur	West Bengal	984235	India	494 Industrial Area	Kanpur	West Bengal	671058	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
245b2ba7-c3b8-46b5-a250-2f192e60d3ce	EduTech Solutions 47	Education	www.edutechsolutions46.com	\N	\N	\N	\N	active	+91 7914746626	arjun@edutechsolution.com	\N	Leading education company with 4906 employees	5b5738bf-2222-4ca7-90bc-bd05b58cded4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	858 Park Street	Nagpur	Rajasthan	953024	India	853 Business District	Nagpur	Rajasthan	722823	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
3ed4bac3-9849-403f-ab84-c16485f42c9e	Medical Equipment Corp 48	Healthcare	www.medicalequipmentcorp47.com	\N	\N	\N	\N	active	+91 9412960261	rajesh@medicalequipmen.com	\N	Leading healthcare company with 2665 employees	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	\N	\N	\N	\N	\N	\N	\N	\N	\N	6093f9de-4eb0-4041-ae04-a4797c471ba9	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	562 Main Road	Pune	Maharashtra	242214	India	25 Business District	Pune	Maharashtra	344714	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
4cd8f069-d35b-47cf-bb89-a676cc2a45aa	AutoParts Manufacturing 49	Manufacturing	www.autopartsmanufacturing48.com	\N	\N	\N	\N	active	+91 9951332304	kavya@autopartsmanufa.com	\N	Leading manufacturing company with 1859 employees	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	707 Park Street	Delhi	Gujarat	168984	India	173 Industrial Area	Delhi	Gujarat	731406	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d3300632-c2a6-4ba8-877d-14292dc6b1d1	Industrial Solutions Corp 50	Manufacturing	www.industrialsolutionscorp49.com	\N	\N	\N	\N	inactive	+91 9030755905	neha@industrialsolut.com	\N	Leading manufacturing company with 2150 employees	5b5738bf-2222-4ca7-90bc-bd05b58cded4	\N	\N	\N	\N	\N	\N	\N	\N	\N	d0ba6c45-3eb6-4408-9a52-00c1c0c8dff8	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	492 Main Road	Lucknow	Maharashtra	695312	India	274 Industrial Area	Lucknow	Maharashtra	392151	India	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
\.


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_logs (id, user_id, user_name, action, entity_type, entity_id, entity_name, changes, ip_address, created_at) FROM stdin;
60f441d6-6402-4f98-94b4-7e066213ec76	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	create	deal	287f90a9-ab40-495e-aee4-cd662ab6a60e	Healthcare Plus	null	\N	2026-02-11 16:06:00.376635+05:30
2438ca5e-b531-47e9-8f90-fd67b2441741	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	create	deal	b353c5d6-2637-46d6-b4b1-a9e3d027086d	Finance Solutions Corp	null	\N	2026-02-11 16:06:27.666909+05:30
25e44bc5-1a8b-4a0f-af1e-b284a99d0a42	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	user	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	[{"new": "False", "old": "True", "field": "is_active"}]	\N	2026-02-12 11:08:59.89711+05:30
e7e29b58-2088-4dfa-977c-e7593884cf5d	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	create	partner	3ad2f413-eeab-44da-bb5c-a407c1172ee4	sameer infotech	null	\N	2026-02-12 11:19:48.654751+05:30
98c6c221-168a-4628-bc5f-363703bd27f8	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	approve	partner	3ad2f413-eeab-44da-bb5c-a407c1172ee4	sameer infotech	[{"new": "2026-02-12T09:29:02.364005+00:00", "old": null, "field": "approved_at"}, {"new": "2625f4f9-3c07-4ccf-a5b8-d199950d7c2e", "old": null, "field": "approved_by"}, {"new": "approved", "old": "pending", "field": "status"}]	\N	2026-02-12 14:59:01.662854+05:30
184b28e7-9cd3-4f79-8197-0abf8d3f241b	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	partner	c1483d9b-58db-40dd-90b4-d1b99e361cc5	addy	[{"new": "22222222-2222-2222-2222-222222222222", "old": "2625f4f9-3c07-4ccf-a5b8-d199950d7c2e", "field": "assigned_to"}]	\N	2026-02-12 14:59:43.631234+05:30
32f6145f-bee7-4287-bc68-a912cca2b585	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	deal	d7777777-7777-7777-7777-777777777777	Retail Giant	[{"new": "Pipeline", "old": null, "field": "forecast"}, {"new": "", "old": null, "field": "next_step"}, {"new": "50", "old": "65", "field": "probability"}, {"new": "Proposal", "old": "Needs Analysis", "field": "stage"}, {"new": "", "old": null, "field": "tag"}, {"new": "Retail Giant", "old": "Retail Giant - Omnichannel Platform", "field": "title"}, {"new": "New Business", "old": null, "field": "type"}]	\N	2026-02-12 19:38:47.337158+05:30
621ef6f4-d21d-492e-9328-75da08659f2f	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	delete	deal	d6666666-6666-6666-6666-666666666666	Healthcare Plus - EMR System	null	\N	2026-02-12 19:39:18.921241+05:30
2e42cd3d-cf2c-4bb3-a650-7e04a2b758f8	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	lead	77777777-7777-7777-7777-777777777777	Legal Associates	[{"new": "Negotiation", "old": "Proposal", "field": "stage"}]	\N	2026-02-12 20:19:55.389944+05:30
55c8e6ec-fe87-4b8f-872b-27f0fcbdda65	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	lead	77777777-7777-7777-7777-777777777777	Legal Associates	[{"new": "Closed Won", "old": "Negotiation", "field": "stage"}]	\N	2026-02-12 20:20:29.41705+05:30
760da81b-501c-488a-b9d7-dad35e2c67ed	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	account	a5555555-5555-5555-5555-555555555555	Finance Solutions Corp	[{"new": "Recurring", "old": "Enterprise", "field": "type"}]	\N	2026-02-13 11:50:52.27989+05:30
94362693-00b4-428f-a98e-d5655852105d	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	account	a7777777-7777-7777-7777-777777777777	Retail Giant	[{"new": "Recurring", "old": "Enterprise", "field": "type"}]	\N	2026-02-13 11:50:55.075729+05:30
601e4641-225f-46df-a61a-87d9f7228b72	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	account	a1111111-1111-1111-1111-111111111111	Acme Corporation	[{"new": "Recurring", "old": "Enterprise", "field": "type"}]	\N	2026-02-13 11:50:57.889614+05:30
6f4c2087-02a4-4dd1-9c01-b0a488c88faf	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	account	a2222222-2222-2222-2222-222222222222	Global Manufacturing Ltd	[{"new": "Recurring", "old": "Enterprise", "field": "type"}]	\N	2026-02-13 11:51:00.661975+05:30
c3a42073-dc97-44b8-be9a-4f146005f379	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	account	a8888888-8888-8888-8888-888888888888	EduTech Solutions	[{"new": "Hunting", "old": "SMB", "field": "type"}]	\N	2026-02-13 11:51:03.512895+05:30
420b3866-4ad0-4727-b7cc-e01294ead8ce	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	account	a4444444-4444-4444-4444-444444444444	TechStartup Inc	[{"new": "Hunting", "old": "SMB", "field": "type"}]	\N	2026-02-13 11:51:06.306814+05:30
12d97dd3-e0a9-4b7e-8f96-0129c6c556a3	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	account	a6666666-6666-6666-6666-666666666666	Healthcare Plus	[{"new": "Cold", "old": "Mid-Market", "field": "type"}]	\N	2026-02-13 11:51:09.098193+05:30
74cebbce-eda6-4701-88fa-5782cf484a29	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	create	contact	3aea6ae9-c2ea-40a5-8abb-64e35b58e110	Priya Sharma	null	\N	2026-02-14 12:21:56.669994+05:30
a0110612-cd1b-42f0-a081-67e56e425777	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	create	contact	b2465f5b-b12e-42eb-9115-5903b685fd08	Amit Patel	null	\N	2026-02-14 12:21:59.306777+05:30
bf8ec135-35e6-41aa-a4d4-15ebc7e166b4	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	create	contact	0695d30b-50cb-47bc-aab1-b548540298cf	Neha Gupta	null	\N	2026-02-14 12:22:01.725107+05:30
d29608bc-9238-4943-b7eb-1476d61a01fb	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	create	contact	c70da2ad-c6f6-43ba-a4ac-b4ab75ea14d9	Vikram Singh	null	\N	2026-02-14 12:22:04.162991+05:30
b361e349-c51f-4e95-a9cd-40f9c88d602a	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	create	contact	a92e69e6-177d-4a5c-a651-52df9b89eea1	Ananya Reddy	null	\N	2026-02-14 12:22:06.720293+05:30
a4fd2e85-c6f7-4ffe-b394-e126c5888c12	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	deal	b353c5d6-2637-46d6-b4b1-a9e3d027086d	Finance Solutions Corp	[{"new": "3aea6ae9-c2ea-40a5-8abb-64e35b58e110", "old": null, "field": "contact_id"}, {"new": "+91-98765-43210", "old": null, "field": "contact_no"}, {"new": "Finance Director", "old": null, "field": "designation"}, {"new": "priya.sharma@financesolutions.com", "old": null, "field": "email"}, {"new": "Mumbai, Maharashtra", "old": null, "field": "location"}, {"new": "Channel", "old": null, "field": "tag"}]	\N	2026-02-14 12:22:44.838629+05:30
91ccaa96-d53b-4d30-8ddb-71dc8a8ff244	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	deal	d5555555-5555-5555-5555-555555555555	Finance Solutions - Security Upgrade	[{"new": "3aea6ae9-c2ea-40a5-8abb-64e35b58e110", "old": null, "field": "contact_id"}, {"new": "+91-98765-43210", "old": null, "field": "contact_no"}, {"new": "Finance Director", "old": null, "field": "designation"}, {"new": "priya.sharma@financesolutions.com", "old": null, "field": "email"}, {"new": "Mumbai, Maharashtra", "old": null, "field": "location"}, {"new": "Channel", "old": null, "field": "tag"}]	\N	2026-02-14 12:22:48.517078+05:30
c72d1f66-972e-4225-b9c7-083e79b1e580	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	deal	da111111-1111-1111-1111-111111111111	Previous Deal - Software Licenses	[{"new": "3aea6ae9-c2ea-40a5-8abb-64e35b58e110", "old": null, "field": "contact_id"}, {"new": "+91-98765-43210", "old": null, "field": "contact_no"}, {"new": "Finance Director", "old": null, "field": "designation"}, {"new": "priya.sharma@financesolutions.com", "old": null, "field": "email"}, {"new": "Mumbai, Maharashtra", "old": null, "field": "location"}, {"new": "Channel", "old": null, "field": "tag"}]	\N	2026-02-14 12:22:52.396989+05:30
1e63a48c-4fd3-49fe-98dd-fd31cce7e0c2	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	deal	287f90a9-ab40-495e-aee4-cd662ab6a60e	Healthcare Plus	[{"new": "b2465f5b-b12e-42eb-9115-5903b685fd08", "old": null, "field": "contact_id"}, {"new": "+91-98765-54321", "old": null, "field": "contact_no"}, {"new": "IT Manager", "old": null, "field": "designation"}, {"new": "amit.patel@healthcareplus.in", "old": null, "field": "email"}, {"new": "Pune, Maharashtra", "old": null, "field": "location"}, {"new": "Channel", "old": null, "field": "tag"}]	\N	2026-02-14 12:22:55.792089+05:30
01e8728a-9741-4c80-86d9-5b5e87ec8e52	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	deal	db111111-1111-1111-1111-111111111111	Lost Deal - Price Issue	[{"new": "b2465f5b-b12e-42eb-9115-5903b685fd08", "old": null, "field": "contact_id"}, {"new": "+91-98765-54321", "old": null, "field": "contact_no"}, {"new": "IT Manager", "old": null, "field": "designation"}, {"new": "amit.patel@healthcareplus.in", "old": null, "field": "email"}, {"new": "Pune, Maharashtra", "old": null, "field": "location"}, {"new": "Channel", "old": null, "field": "tag"}]	\N	2026-02-14 12:22:59.156017+05:30
96c63608-6096-4947-bbf7-1113db041d8f	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	deal	b8a954e3-633a-4785-a9af-3a9255d92230	sam	[{"new": "0695d30b-50cb-47bc-aab1-b548540298cf", "old": null, "field": "contact_id"}, {"new": "+91-87654-32109", "old": null, "field": "contact_no"}, {"new": "CTO", "old": null, "field": "designation"}, {"new": "neha.gupta@techstartup.io", "old": null, "field": "email"}, {"new": "Bangalore, Karnataka", "old": null, "field": "location"}, {"new": "End Customer", "old": null, "field": "tag"}]	\N	2026-02-14 12:23:02.768484+05:30
3873090e-4499-4549-a4fe-73201692d09d	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	deal	d4444444-4444-4444-4444-444444444444	TechStartup - Cloud Migration	[{"new": "0695d30b-50cb-47bc-aab1-b548540298cf", "old": null, "field": "contact_id"}, {"new": "+91-87654-32109", "old": null, "field": "contact_no"}, {"new": "CTO", "old": null, "field": "designation"}, {"new": "neha.gupta@techstartup.io", "old": null, "field": "email"}, {"new": "Bangalore, Karnataka", "old": null, "field": "location"}, {"new": "End Customer", "old": null, "field": "tag"}]	\N	2026-02-14 12:23:06.679532+05:30
d6d7d20e-184d-43a8-acc1-536c19bf6aca	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	deal	d7777777-7777-7777-7777-777777777777	Retail Giant	[{"new": "c70da2ad-c6f6-43ba-a4ac-b4ab75ea14d9", "old": null, "field": "contact_id"}, {"new": "+91-76543-21098", "old": null, "field": "contact_no"}, {"new": "Procurement Head", "old": null, "field": "designation"}, {"new": "vikram.singh@retailgiant.com", "old": null, "field": "email"}, {"new": "Delhi, NCR", "old": null, "field": "location"}, {"new": "Channel", "old": "", "field": "tag"}]	\N	2026-02-14 12:23:10.072061+05:30
78c6dc22-d094-424c-929c-ea136df5a276	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	deal	dc111111-1111-1111-1111-111111111111	Lost Deal - Timeline Mismatch	[{"new": "a92e69e6-177d-4a5c-a651-52df9b89eea1", "old": null, "field": "contact_id"}, {"new": "+91-65432-10987", "old": null, "field": "contact_no"}, {"new": "Operations Manager", "old": null, "field": "designation"}, {"new": "ananya.reddy@edutech.co.in", "old": null, "field": "email"}, {"new": "Hyderabad, Telangana", "old": null, "field": "location"}, {"new": "End Customer", "old": null, "field": "tag"}]	\N	2026-02-14 12:23:13.911071+05:30
8a1adf29-7d72-4a91-abb6-ccd977e1753e	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	deal	d8888888-8888-8888-8888-888888888888	EduTech - Learning Management System	[{"new": "a92e69e6-177d-4a5c-a651-52df9b89eea1", "old": null, "field": "contact_id"}, {"new": "+91-65432-10987", "old": null, "field": "contact_no"}, {"new": "Operations Manager", "old": null, "field": "designation"}, {"new": "ananya.reddy@edutech.co.in", "old": null, "field": "email"}, {"new": "Hyderabad, Telangana", "old": null, "field": "location"}, {"new": "End Customer", "old": null, "field": "tag"}]	\N	2026-02-14 12:23:18.08131+05:30
8c985701-35b3-4801-a94b-38e1eb33a174	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	deal	d9999999-9999-9999-9999-999999999999	Previous Deal - Infrastructure	[{"new": "c1111111-1111-1111-1111-111111111111", "old": null, "field": "contact_id"}, {"new": "+1-415-555-0002", "old": null, "field": "contact_no"}, {"new": "Chief Technology Officer", "old": null, "field": "designation"}, {"new": "robert.williams@acmecorp.com", "old": null, "field": "email"}, {"new": "San Francisco, CA", "old": null, "field": "location"}, {"new": "Channel", "old": null, "field": "tag"}]	\N	2026-02-14 12:23:27.449071+05:30
0000d2dc-8820-4ee3-8f3b-5b98590021af	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	deal	d1111111-1111-1111-1111-111111111111	Acme Corp - Enterprise Cloud Infrastructure	[{"new": "+1-415-555-0002", "old": null, "field": "contact_no"}, {"new": "Chief Technology Officer", "old": null, "field": "designation"}, {"new": "robert.williams@acmecorp.com", "old": null, "field": "email"}, {"new": "San Francisco, CA", "old": null, "field": "location"}, {"new": "Channel", "old": null, "field": "tag"}]	\N	2026-02-14 12:23:30.880187+05:30
9dc1daeb-39c3-48a6-8d59-b8ef5b36d85c	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	deal	d2222222-2222-2222-2222-222222222222	Global Manufacturing - IoT Sensor Network	[{"new": "+1-312-555-0002", "old": null, "field": "contact_no"}, {"new": "VP Operations", "old": null, "field": "designation"}, {"new": "jennifer.davis@globalmanuf.com", "old": null, "field": "email"}, {"new": "Chicago, IL", "old": null, "field": "location"}, {"new": "Channel", "old": null, "field": "tag"}]	\N	2026-02-14 12:23:34.283214+05:30
0eaa202c-d7c5-472b-9308-4f6f0798e107	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	deal	d3333333-3333-3333-3333-333333333333	Retail Innovations - Point of Sale System Upgrade	[{"new": "+1-512-555-0002", "old": null, "field": "contact_no"}, {"new": "Director of IT", "old": null, "field": "designation"}, {"new": "david.martinez@retailinnov.com", "old": null, "field": "email"}, {"new": "Austin, TX", "old": null, "field": "location"}, {"new": "End Customer", "old": null, "field": "tag"}]	\N	2026-02-14 12:23:37.741188+05:30
717b6094-5e3c-4dbd-884e-c3bffa6ce007	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	product	f1111111-1111-1111-1111-111111111111	Enterprise Cloud Server	[{"new": "25", "old": "0", "field": "stock"}]	\N	2026-02-14 15:47:58.463374+05:30
9cc06b52-6350-4cb9-8f79-76d26803bd5a	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	product	f2222222-2222-2222-2222-222222222222	NVMe Storage Array 10TB	[{"new": "18", "old": "0", "field": "stock"}]	\N	2026-02-14 15:48:01.255063+05:30
38c74239-f982-48c2-bca6-f21f5d451ac6	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	product	f3333333-3333-3333-3333-333333333333	10GbE Network Switch	[{"new": "42", "old": "0", "field": "stock"}]	\N	2026-02-14 15:48:04.261462+05:30
f591a188-3de7-4540-94c6-955d7d29c9a8	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	product	f4444444-4444-4444-4444-444444444444	IoT Gateway Industrial	[{"new": "8", "old": "0", "field": "stock"}]	\N	2026-02-14 15:48:07.377527+05:30
6dc214ca-b947-4ebf-9735-7ed34e8b905b	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	product	f5555555-5555-5555-5555-555555555555	Temperature Sensor IS-200	[{"new": "150", "old": "0", "field": "stock"}]	\N	2026-02-14 15:48:10.138171+05:30
51dd64fa-4ccb-4bf8-b456-7e3018fa803a	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	product	f6666666-6666-6666-6666-666666666666	POS Terminal PT-300	[{"new": "35", "old": "0", "field": "stock"}]	\N	2026-02-14 15:48:12.906615+05:30
940afd4a-e936-416f-bb01-c9704fde0ce7	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	product	f7777777-7777-7777-7777-777777777777	Receipt Printer RP-80	[{"new": "60", "old": "0", "field": "stock"}]	\N	2026-02-14 15:48:15.665243+05:30
92bb567e-bf8a-4172-9f55-4ea47065ce6a	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	product	f8888888-8888-8888-8888-888888888888	Firewall FortiGate 100F	[{"new": "5", "old": "0", "field": "stock"}]	\N	2026-02-14 15:48:18.453387+05:30
60d98b82-3bb2-4b66-8f14-815365117597	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	product	f9999999-9999-9999-9999-999999999999	Cloud POS Software License	[{"new": "200", "old": "0", "field": "stock"}]	\N	2026-02-14 15:48:21.277618+05:30
b61dd6a1-50a1-4773-9686-7fe452d67aa1	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	product	fe111111-1111-1111-1111-111111111111	Server Rack 42U	[{"new": "12", "old": "0", "field": "stock"}]	\N	2026-02-14 15:48:24.018649+05:30
473671b8-6000-4f12-98fc-5e30a02e798e	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	product	ff111111-1111-1111-1111-111111111111	UPS 10KVA	[{"new": "20", "old": "0", "field": "stock"}]	\N	2026-02-14 15:48:26.997109+05:30
7f8be560-53de-4110-aaf7-909e4aba87be	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	product	fd111111-1111-1111-1111-111111111111	Network Security Bundle	[{"new": "3", "old": "0", "field": "stock"}]	\N	2026-02-14 15:48:30.423023+05:30
c9a5018c-0ec6-4de3-82c8-c59c73d4d15a	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	user	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	[{"new": "1e547d91-a813-452b-a700-9213d699e810", "old": null, "field": "manager_id"}]	\N	2026-02-14 15:58:27.027088+05:30
f2809e94-5e9d-47cf-9376-5325e3b30370	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	user	33333333-3333-3333-3333-333333333333	Michael Chen	[{"new": "1e547d91-a813-452b-a700-9213d699e810", "old": null, "field": "manager_id"}]	\N	2026-02-14 15:58:40.063652+05:30
05bbce02-e397-4583-bd03-c26611459d3e	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	user	11111111-1111-1111-1111-111111111111	John Smith	[{"new": "33333333-3333-3333-3333-333333333333", "old": null, "field": "manager_id"}]	\N	2026-02-14 15:58:42.970749+05:30
dbe9f1e0-5185-4cf9-b5ef-075ac794ccff	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	user	22222222-2222-2222-2222-222222222222	Sarah Johnson	[{"new": "33333333-3333-3333-3333-333333333333", "old": null, "field": "manager_id"}]	\N	2026-02-14 15:58:45.784154+05:30
3890c229-951a-4db5-91b3-2060b503bc64	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	lead	73333333-3333-3333-3333-333333333333	Healthcare Innovations	[{"new": "Proposal", "old": "Cold", "field": "stage"}]	\N	2026-02-14 17:34:15.726526+05:30
5a069f3f-9fb4-4aa2-839a-dbb89e6f4177	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	lead	73333333-3333-3333-3333-333333333333	Healthcare Innovations	[]	\N	2026-02-14 17:34:18.112842+05:30
63316559-fdfa-4f35-97dc-1993aaeaf69a	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	lead	73333333-3333-3333-3333-333333333333	Healthcare Innovations	[{"new": "Cold", "old": "Proposal", "field": "stage"}]	\N	2026-02-14 17:38:56.99915+05:30
eab71cfe-aab5-44cf-8311-9654b3b65220	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	lead	75555555-5555-5555-5555-555555555555	Marketing Masters	[{"new": "Proposal", "old": "Cold", "field": "stage"}]	\N	2026-02-14 17:39:19.37661+05:30
051a6482-7c1e-44a6-a5df-18dbf72dce76	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	user	22222222-2222-2222-2222-222222222222	Sarah Johnson	[{"new": "11111111-1111-1111-1111-111111111111", "old": "33333333-3333-3333-3333-333333333333", "field": "manager_id"}]	\N	2026-02-14 18:04:15.906125+05:30
a1dd7420-3507-410b-a0be-57288296b864	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	user	22222222-2222-2222-2222-222222222222	Sarah Johnson	[{"new": "33333333-3333-3333-3333-333333333333", "old": "11111111-1111-1111-1111-111111111111", "field": "manager_id"}]	\N	2026-02-16 13:42:23.500548+05:30
f002cd23-d8e7-4cf9-9ef9-f6f1da2a5c05	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	lead	74444444-4444-4444-4444-444444444444	Logistics Pro	[{"new": "Proposal", "old": "Cold", "field": "stage"}]	\N	2026-02-16 16:37:00.098181+05:30
6c7594b2-9903-40f7-b883-8c9f2d5d49d8	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	Admin	update	lead	74444444-4444-4444-4444-444444444444	Logistics Pro	[{"new": "Cold", "old": "Proposal", "field": "stage"}]	\N	2026-02-16 16:37:02.01852+05:30
55f3dd38-97b6-4d4d-a8b5-0c67178caf38	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	deal	d2222222-2222-2222-2222-222222222222	Global Manufacturing Ltd	[{"new": "Closed Won", "old": "Negotiation", "field": "stage"}, {"new": "Global Manufacturing Ltd", "old": "Global Manufacturing - IoT Sensor Network", "field": "title"}]	\N	2026-02-16 18:39:30.227683+05:30
14d91646-4253-4c55-8379-5eb769dd709a	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	deal	d1111111-1111-1111-1111-111111111111	Acme Corp - Enterprise Cloud Infrastructure	[{"new": "Negotiation", "old": "Proposal", "field": "stage"}]	\N	2026-02-17 12:15:11.633472+05:30
efca096b-6646-4b62-b395-d0a3dc88417f	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	create	sales_entry	d21cc0ed-db73-4b78-bfa2-78f2e055166b	\N	null	\N	2026-02-17 15:39:44.31307+05:30
a0f6a84e-a637-4918-834f-449a8502657b	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	create	sales_entry	8e2078b2-dab6-41ba-8414-b078a01c4d56	\N	null	\N	2026-02-17 15:42:50.771942+05:30
7e12071e-9d56-4e36-97aa-284a759d3c3c	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	create	account	25622251-23f4-4987-94e7-47530b1e981c	Budget Retail	null	\N	2026-02-20 12:29:35.190876+05:30
a2839125-e437-439e-b6de-cfb7e7721b42	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	create	contact	21b918ec-4e1b-4844-b6a9-c9d3ef3c1489	Sam Cheap	null	\N	2026-02-20 12:29:35.261078+05:30
aef9a633-5d9a-43e3-99ed-5fe8824cde7c	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	create	account	3b27b35f-6321-4db9-9316-206ae225f8f7	Budget Retail	null	\N	2026-02-20 12:33:06.505988+05:30
9ec9078a-9db7-4a8f-af8b-dd1516a89476	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	create	contact	2ade1e77-5d1d-44eb-9c0d-a78ad96c7768	Sam Cheap	null	\N	2026-02-20 12:33:06.529057+05:30
d63b43ec-d577-4da6-8681-d4b7887d9cb3	1e547d91-a813-452b-a700-9213d699e810	Super Administrator	update	lead	7a111111-1111-1111-1111-111111111111	Budget Retail	[{"new": "Closed Won", "old": "Negotiation", "field": "stage"}]	\N	2026-02-20 12:33:06.549304+05:30
65ce8c17-3279-4640-8278-e50a6d10fc6b	43935cf9-b3be-4493-8927-06a5a6c04275	Admin User	create	lead	dde540ef-83d0-4c49-9ce1-1afb83f2a434	Test Company ABC	null	\N	2026-02-20 16:28:49.517897+05:30
145f487a-e93d-4376-a7ff-e099c0442bd3	43935cf9-b3be-4493-8927-06a5a6c04275	Admin User	create	deal	6efb7e3a-4492-4863-a57b-ef91d170e554	Test Deal XYZ	null	\N	2026-02-20 16:29:26.615055+05:30
8243fc2a-771a-4fe4-8c7f-3daae671d0ac	43935cf9-b3be-4493-8927-06a5a6c04275	Admin User	delete	deal	6efb7e3a-4492-4863-a57b-ef91d170e554	Test Deal XYZ	null	\N	2026-02-20 16:30:01.639377+05:30
eab1f381-1e62-4cd3-a2f4-2b914a985774	43935cf9-b3be-4493-8927-06a5a6c04275	Admin User	create	lead	40f64685-a9c2-46f1-841e-3f05d007c3c1	Delete Test Lead	null	\N	2026-02-20 16:31:11.54773+05:30
8b16aced-7db3-41d6-a4c5-851277485d1f	43935cf9-b3be-4493-8927-06a5a6c04275	Admin User	delete	lead	40f64685-a9c2-46f1-841e-3f05d007c3c1	Delete Test Lead	null	\N	2026-02-20 16:31:11.619129+05:30
98b45393-ff06-4b0b-90e1-4a2b77e4709d	43935cf9-b3be-4493-8927-06a5a6c04275	Admin User	create	deal	5efee471-62e9-4cc0-a249-43d77ca2fdff	Delete Test Deal	null	\N	2026-02-20 16:31:11.6421+05:30
ca6a6f6d-5cad-438d-b679-2c111e5d6f78	43935cf9-b3be-4493-8927-06a5a6c04275	Admin User	create	deal	37441cb5-a694-414b-901f-5962d4141efd	Update Test Deal	null	\N	2026-02-20 16:31:33.332339+05:30
86671014-de57-442b-9d51-01f5f7d00f87	43935cf9-b3be-4493-8927-06a5a6c04275	Admin User	create	deal	c0742777-1edc-4049-a4a0-03ecbd2b1732	Final Test Deal	null	\N	2026-02-20 16:32:22.009866+05:30
114599a0-72b0-4945-b927-872031571bc6	43935cf9-b3be-4493-8927-06a5a6c04275	Admin User	update	deal	c0742777-1edc-4049-a4a0-03ecbd2b1732	Final Test Deal	[{"new": "Proposal", "old": "New", "field": "stage"}, {"new": "75000.00", "old": "50000.00", "field": "value"}]	\N	2026-02-20 16:32:22.086238+05:30
bef95a7d-59c1-4c86-b0c5-f27884fc0cbd	43935cf9-b3be-4493-8927-06a5a6c04275	Admin User	delete	deal	c0742777-1edc-4049-a4a0-03ecbd2b1732	Final Test Deal	null	\N	2026-02-20 16:32:22.121165+05:30
b7aba8df-11b4-449e-8554-f5c3ecea09c9	43935cf9-b3be-4493-8927-06a5a6c04275	Admin User	delete	deal	37441cb5-a694-414b-901f-5962d4141efd	Update Test Deal	null	\N	2026-02-20 16:32:29.697952+05:30
62d977c3-0f0f-4fd9-ac69-d8b908e7e44c	43935cf9-b3be-4493-8927-06a5a6c04275	Admin User	delete	deal	5efee471-62e9-4cc0-a249-43d77ca2fdff	Delete Test Deal	null	\N	2026-02-20 16:32:29.712019+05:30
\.


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alembic_version (version_num) FROM stdin;
add_type_of_order_deals
\.


--
-- Data for Name: calendar_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.calendar_events (id, title, description, type, start_time, end_time, all_day, location, meeting_link, owner_id, color, related_to_type, related_to_id, created_at, updated_at) FROM stdin;
7d73c601-a70e-4602-8d35-6f11a3f0af6d	Meeting - Partner	Meeting scheduled for discussion	Meeting	2026-03-24 09:00:00+05:30	2026-03-24 09:30:00+05:30	f	Client Office	\N	1b45ba6b-98f7-407b-826c-5ce61d112a0f	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
dbf73b87-041e-4b5a-aac5-14e98ad11468	Training - Client	Training scheduled for discussion	Training	2026-03-28 13:00:00+05:30	2026-03-28 13:30:00+05:30	f	Conference Room A	\N	14a3756a-5a80-460a-90b2-96f572cffd76	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e0c0b21e-db51-42a6-b99c-b70c941a02b7	Review - Prospect	Review scheduled for discussion	Review	2026-04-01 17:00:00+05:30	2026-04-01 18:00:00+05:30	f	Client Office	\N	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
f19173e6-8a89-4cbe-85cd-c334f7cd87ba	Call - Team	Call scheduled for discussion	Call	2026-04-16 14:00:00+05:30	2026-04-16 14:30:00+05:30	f	Online	\N	f9701eca-09f1-48b3-95b8-9d61684cac10	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
a7d95ccc-28b5-40fd-8d25-0a1521125094	Call - Partner	Call scheduled for discussion	Call	2026-04-07 15:00:00+05:30	2026-04-07 16:00:00+05:30	f	Online	\N	d8699681-b89d-4914-a9e1-4cb5f15feeb2	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d35b1ee8-5d5f-4085-b063-4e96291bae36	Demo - Prospect	Demo scheduled for discussion	Demo	2026-03-25 17:00:00+05:30	2026-03-25 19:00:00+05:30	f	Conference Room A	\N	43935cf9-b3be-4493-8927-06a5a6c04275	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
ef7ea722-fb56-4188-a4bb-86c7ad200d97	Planning - Team	Planning scheduled for discussion	Planning	2026-03-24 15:00:00+05:30	2026-03-24 17:00:00+05:30	f	Client Office	\N	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
bd475a75-7183-4f60-be03-4200ff98ac40	Meeting - Team	Meeting scheduled for discussion	Meeting	2026-03-28 13:00:00+05:30	2026-03-28 14:30:00+05:30	f	Conference Room A	\N	09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e827dca7-a31e-48ce-94c5-6cf7df939962	Review - Client	Review scheduled for discussion	Review	2026-04-08 17:00:00+05:30	2026-04-08 18:30:00+05:30	f	Online	\N	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
ae449930-6e0b-4b80-b177-053c31c881c8	Meeting - Team	Meeting scheduled for discussion	Meeting	2026-04-19 15:00:00+05:30	2026-04-19 16:00:00+05:30	f	Client Office	\N	f9701eca-09f1-48b3-95b8-9d61684cac10	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
fd172fe5-81e2-4b97-9103-bd27503520d3	Planning - Prospect	Planning scheduled for discussion	Planning	2026-04-13 11:00:00+05:30	2026-04-13 12:30:00+05:30	f	Client Office	\N	1b45ba6b-98f7-407b-826c-5ce61d112a0f	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
ab25c74e-ad44-4747-b05f-87d7b35afff2	Demo - Client	Demo scheduled for discussion	Demo	2026-04-06 15:00:00+05:30	2026-04-06 16:30:00+05:30	f	Online	\N	6fe86a87-d903-4f41-93fc-e63196c3af1a	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
c52f84e7-0b03-470c-9c03-f499dcea645e	Training - Partner	Training scheduled for discussion	Training	2026-04-10 14:00:00+05:30	2026-04-10 15:30:00+05:30	f	Client Office	\N	14a3756a-5a80-460a-90b2-96f572cffd76	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
7338adcb-e024-411f-861e-774647d45c1c	Training - Client	Training scheduled for discussion	Training	2026-04-01 16:00:00+05:30	2026-04-01 17:30:00+05:30	f	Online	\N	1b45ba6b-98f7-407b-826c-5ce61d112a0f	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
9ae35e72-db9f-414b-811d-91d521cd58e3	Demo - Team	Demo scheduled for discussion	Demo	2026-04-21 13:00:00+05:30	2026-04-21 14:00:00+05:30	f	Conference Room A	\N	1d3255e6-5d5b-4f5b-b3d6-73f01eebf427	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
906b5c59-3d6b-4536-a44a-5cdcf273876b	Demo - Prospect	Demo scheduled for discussion	Demo	2026-04-06 10:00:00+05:30	2026-04-06 11:00:00+05:30	f	Client Office	\N	20a1bad5-7a19-47b2-afeb-55d630ee5f13	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
8be1e6dd-f879-4c6a-af2d-7a201e3e934f	Training - Partner	Training scheduled for discussion	Training	2026-03-31 11:00:00+05:30	2026-03-31 12:30:00+05:30	f	HQ Meeting Room	\N	11f1c307-f3cc-4904-90cb-b97f89fc9d43	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
507943fd-719c-4366-9ed2-f612b22fb0b5	Meeting - Team	Meeting scheduled for discussion	Meeting	2026-03-30 13:00:00+05:30	2026-03-30 14:30:00+05:30	f	HQ Meeting Room	\N	20a1bad5-7a19-47b2-afeb-55d630ee5f13	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
8e421fb8-293c-47ab-bdd3-eda4f98a4896	Call - Partner	Call scheduled for discussion	Call	2026-03-28 16:00:00+05:30	2026-03-28 17:00:00+05:30	f	HQ Meeting Room	\N	20a1bad5-7a19-47b2-afeb-55d630ee5f13	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
14a13ab0-8b0b-4acc-b113-e14c27afc198	Call - Team	Call scheduled for discussion	Call	2026-04-01 09:00:00+05:30	2026-04-01 10:00:00+05:30	f	Client Office	\N	d8699681-b89d-4914-a9e1-4cb5f15feeb2	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
32aaecde-7358-4de2-ac7b-917a0abaf288	Call - Partner	Call scheduled for discussion	Call	2026-03-30 12:00:00+05:30	2026-03-30 14:00:00+05:30	f	Client Office	\N	f9701eca-09f1-48b3-95b8-9d61684cac10	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
fe6ae7c9-7a08-4e37-810e-ceb5dac955f6	Planning - Team	Planning scheduled for discussion	Planning	2026-04-05 16:00:00+05:30	2026-04-05 17:30:00+05:30	f	Client Office	\N	14a3756a-5a80-460a-90b2-96f572cffd76	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
c72f36d5-7dda-4a02-9b28-307f404b78f5	Demo - Team	Demo scheduled for discussion	Demo	2026-04-05 16:00:00+05:30	2026-04-05 17:00:00+05:30	f	Online	\N	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d5c44187-9214-476d-9061-58e5eae74d2b	Meeting - Prospect	Meeting scheduled for discussion	Meeting	2026-03-25 09:00:00+05:30	2026-03-25 10:00:00+05:30	f	Client Office	\N	e03c5d7b-6be1-43da-a72b-c2f60ae9863f	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
da6caabd-9bae-4465-a711-b3287a6da678	Demo - Partner	Demo scheduled for discussion	Demo	2026-04-11 11:00:00+05:30	2026-04-11 11:30:00+05:30	f	HQ Meeting Room	\N	14a3756a-5a80-460a-90b2-96f572cffd76	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
b30e0672-f92f-47da-8759-b6e874419215	Review - Prospect	Review scheduled for discussion	Review	2026-04-11 15:00:00+05:30	2026-04-11 16:30:00+05:30	f	Conference Room A	\N	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
b4d13910-cd7c-4d27-a1e4-0e1992be6121	Demo - Partner	Demo scheduled for discussion	Demo	2026-04-14 17:00:00+05:30	2026-04-14 19:00:00+05:30	f	Conference Room A	\N	f9701eca-09f1-48b3-95b8-9d61684cac10	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
bfec9e25-1ddf-4fb9-987a-2ebb174ac9ce	Training - Partner	Training scheduled for discussion	Training	2026-04-14 17:00:00+05:30	2026-04-14 19:00:00+05:30	f	Conference Room A	\N	1d3255e6-5d5b-4f5b-b3d6-73f01eebf427	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
863bc3a0-9a28-4b57-be52-a18ab4ce742a	Call - Prospect	Call scheduled for discussion	Call	2026-03-22 11:00:00+05:30	2026-03-22 13:00:00+05:30	f	Conference Room A	\N	1b45ba6b-98f7-407b-826c-5ce61d112a0f	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
ebe4f924-f95d-46e3-aa27-2c364a0e8553	Call - Partner	Call scheduled for discussion	Call	2026-04-09 13:00:00+05:30	2026-04-09 13:30:00+05:30	f	Client Office	\N	f9701eca-09f1-48b3-95b8-9d61684cac10	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
14f49171-e239-4136-9650-ad78ea83f828	Training - Prospect	Training scheduled for discussion	Training	2026-04-09 13:00:00+05:30	2026-04-09 15:00:00+05:30	f	HQ Meeting Room	\N	1b45ba6b-98f7-407b-826c-5ce61d112a0f	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
7ed6ab9b-302b-45f4-9d77-2ea4edc02d0d	Meeting - Partner	Meeting scheduled for discussion	Meeting	2026-04-08 11:00:00+05:30	2026-04-08 11:30:00+05:30	f	HQ Meeting Room	\N	1d3255e6-5d5b-4f5b-b3d6-73f01eebf427	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
5f7c8ae8-4018-4cc0-8c9e-ee97655f5cdc	Meeting - Prospect	Meeting scheduled for discussion	Meeting	2026-03-25 16:00:00+05:30	2026-03-25 17:30:00+05:30	f	Client Office	\N	512f9954-6c97-4118-b7fe-890710702f92	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e698ce16-011b-4222-9fad-5543ae9d871b	Planning - Prospect	Planning scheduled for discussion	Planning	2026-03-23 14:00:00+05:30	2026-03-23 15:30:00+05:30	f	Online	\N	35417c40-2a83-4e3d-bca2-447f4304f7b3	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
8b2e48cd-cf43-4455-bf96-f16881ab4c33	Training - Prospect	Training scheduled for discussion	Training	2026-03-30 09:00:00+05:30	2026-03-30 10:30:00+05:30	f	Online	\N	512f9954-6c97-4118-b7fe-890710702f92	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d251f6c8-bba5-4b3d-a35a-f8fb2bb4db40	Demo - Partner	Demo scheduled for discussion	Demo	2026-03-28 16:00:00+05:30	2026-03-28 17:00:00+05:30	f	Client Office	\N	43935cf9-b3be-4493-8927-06a5a6c04275	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
dd1a07ae-574f-438d-9cf8-40289e34735f	Review - Prospect	Review scheduled for discussion	Review	2026-03-30 14:00:00+05:30	2026-03-30 15:00:00+05:30	f	Conference Room A	\N	20a1bad5-7a19-47b2-afeb-55d630ee5f13	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d71bf2d1-b8a7-4696-9491-ebca0a5cbbc2	Call - Team	Call scheduled for discussion	Call	2026-04-14 16:00:00+05:30	2026-04-14 16:30:00+05:30	f	HQ Meeting Room	\N	43935cf9-b3be-4493-8927-06a5a6c04275	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
8526abdd-2ae9-4ffd-ab5b-37ad234c0c18	Meeting - Team	Meeting scheduled for discussion	Meeting	2026-04-15 10:00:00+05:30	2026-04-15 11:30:00+05:30	f	Online	\N	1d3255e6-5d5b-4f5b-b3d6-73f01eebf427	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
89e272c9-62fd-4e29-9805-daa2aab30deb	Planning - Prospect	Planning scheduled for discussion	Planning	2026-03-28 09:00:00+05:30	2026-03-28 11:00:00+05:30	f	HQ Meeting Room	\N	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
\.


--
-- Data for Name: carepacks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.carepacks (id, partner_id, product_type, serial_number, carepack_sku, customer_name, start_date, end_date, status, notes, created_by, created_at, updated_at) FROM stdin;
cc111111-1111-1111-1111-111111111111	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	Server	SRV-2024-001-XE2000	CP-SRV-3YR-NBD	Acme Corporation	2024-01-15	2027-01-15	active	3-year Next Business Day hardware replacement	11111111-1111-1111-1111-111111111111	2026-02-09 13:54:13.659938+05:30	2026-02-09 13:54:13.659938+05:30
cc222222-2222-2222-2222-222222222222	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	Storage	STG-2024-002-NV10TB	CP-STG-5YR-4H	Global Manufacturing Ltd	2024-02-01	2029-02-01	active	5-year 4-hour response storage support	22222222-2222-2222-2222-222222222222	2026-02-09 13:54:13.659938+05:30	2026-02-09 13:54:13.659938+05:30
cc333333-3333-3333-3333-333333333333	\N	Network	NW-2024-003-SW10G	CP-NET-3YR-STD	Future Tech Systems	2024-03-10	2027-03-10	active	Standard 3-year network equipment support	11111111-1111-1111-1111-111111111111	2026-02-09 13:54:13.659938+05:30	2026-02-09 13:54:13.659938+05:30
cc444444-4444-4444-4444-444444444444	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	Firewall	FW-2023-004-FG100	CP-SEC-3YR-PRE	Healthcare Plus	2023-06-01	2026-06-01	active	Premium security appliance support with firmware updates	33333333-3333-3333-3333-333333333333	2026-02-09 13:54:13.659938+05:30	2026-02-09 13:54:13.659938+05:30
cc555555-5555-5555-5555-555555555555	\N	POS Terminal	POS-2025-005-PT300	CP-POS-2YR-STD	Retail Innovations Inc	2025-01-01	2027-01-01	active	2-year POS hardware replacement warranty	22222222-2222-2222-2222-222222222222	2026-02-09 13:54:13.659938+05:30	2026-02-09 13:54:13.659938+05:30
cc666666-6666-6666-6666-666666666666	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	IoT Gateway	IOT-2024-006-IG5K	CP-IOT-3YR-24x7	Global Manufacturing Ltd	2024-04-15	2027-04-15	active	24x7 IoT gateway support with remote monitoring	22222222-2222-2222-2222-222222222222	2026-02-09 13:54:13.659938+05:30	2026-02-09 13:54:13.659938+05:30
cc777777-7777-7777-7777-777777777777	\N	Server	SRV-2022-007-XE1000	CP-SRV-3YR-NBD	Finance Solutions Corp	2022-08-01	2025-08-01	expiring_soon	Warranty expiring in 6 months - renewal needed	11111111-1111-1111-1111-111111111111	2026-02-09 13:54:13.659938+05:30	2026-02-09 13:54:13.659938+05:30
cc888888-8888-8888-8888-888888888888	\N	UPS	UPS-2021-008-10KVA	CP-PWR-5YR-STD	Acme Corporation	2021-09-01	2026-09-01	active	UPS maintenance and battery replacement	11111111-1111-1111-1111-111111111111	2026-02-09 13:54:13.659938+05:30	2026-02-09 13:54:13.659938+05:30
2341af71-20c0-49a4-98ef-ee954d723153	c1483d9b-58db-40dd-90b4-d1b99e361cc5	HP Server	csa		Adi	2026-02-02	2026-02-10	active		2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	2026-02-10 11:40:37.650203+05:30	2026-02-10 11:40:37.650203+05:30
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contacts (id, first_name, last_name, email, phone, mobile, job_title, department, account_id, type, status, notes, preferred_contact, owner_id, image, description, contact_group, ctsipl_email, pan, gstin_no, product_interested, product_interested_text, lead_source, lead_category, designation, vendor_name, partner_id, new_leads, gst_certificate_url, msme_certificate_url, pan_card_url, aadhar_card_url, bandwidth_required, product_configuration, product_details, rental_duration, product_name_part_number, specifications, mailing_street, mailing_city, mailing_state, mailing_zip, mailing_country, other_street, other_city, other_state, other_zip, other_country, created_at, updated_at) FROM stdin;
f7c098b1-3184-4abe-8e39-f043ece07495	Rahul	Singh	rahul@aidynamics5.com	+91 8291510094	+91 8824846564	Director	HR	62b1dad2-cfdd-46ab-ba22-093ddb8bf26a	\N	active	Contact for AI Dynamics 5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
83b6cd1f-b9ff-45f1-afa4-e49e0292ae7c	Priya	Nair	priya@precisionmanufa.com	+91 8727849927	+91 7706129513	VP	Operations	f7a08d86-d0f4-454a-a3f9-c6f35559e781	\N	active	Contact for Precision Manufacturing Ltd 41	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
535b28cb-28f9-46b8-b4bb-9c5fd4782565	Karan	Nair	karan@retailtechinc4.com	+91 9083677125	+91 7851538762	Manager	IT	d9957ed9-c587-48a1-a683-e310fefcb6c7	\N	active	Contact for Retail Tech Inc 4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e7d4d351-2bb4-4ce1-9f07-ab2a2ea03b9d	Neha	Kumar	neha@medicaresolutio.com	+91 7371124479	+91 8763543034	Coordinator	IT	db2b6912-34e9-4ae6-977b-49e819e05648	\N	active	Contact for MediCare Solutions 24	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
81d18d25-ed75-4c48-b45a-8472df11a685	Arjun	Reddy	arjun@capitaladvisors.com	+91 7771616540	+91 9365381690	Specialist	Finance	b10734ee-1b6f-41f1-997a-957aa880c789	\N	active	Contact for Capital Advisors 13	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e884795b-e9ec-44b6-a406-be874d1c117c	Rahul	Reddy	rahul@financialservic.com	+91 7727722129	+91 8985441994	Director	HR	c919bd4a-8f2e-42d7-83fd-e7dff14a716b	\N	active	Contact for Financial Services Corp 34	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d7cdeb3a-7d51-4dc2-a6ae-dbb98c71e19e	Arjun	Desai	arjun@steelworksinc11.com	+91 8529275065	+91 8699351739	Executive	Finance	6a8be5f7-6ac2-431d-ace1-aff631f6f559	\N	active	Contact for Steel Works Inc 11	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
3d946dd6-77b9-4cd2-a03c-81a10ecd5939	Divya	Kumar	divya@edutechsolution.com	+91 7385127655	+91 7768221443	Manager	IT	245b2ba7-c3b8-46b5-a250-2f192e60d3ce	\N	active	Contact for EduTech Solutions 47	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
2a02d5b9-5d5f-499c-a919-ae78e6a64f4e	Isha	Rao	isha@academicsoftwar.com	+91 7392652598	+91 8185937288	Executive	Finance	e118cc01-a48c-4cb0-bfd5-9db549ee460c	\N	active	Contact for Academic Software 35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
15834d16-91c4-4af6-88f0-1abb00af06f4	Isha	Sharma	isha@trainingsolutio.com	+91 8003961744	+91 8117285943	Executive	Sales	b86cbebb-2363-4d3c-88a5-6712adb78053	\N	active	Contact for Training Solutions Inc 31	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
4105f9e5-d051-4b8c-b705-e90797a959d8	Neha	Mehta	neha@fintechsolution.com	+91 9855183716	+91 9561735041	VP	Sales	edd6d10d-2bfe-4774-87f8-f0194d1b9d14	\N	active	Contact for FinTech Solutions 40	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
4983096d-214a-4970-99e0-243250a2fef7	Isha	Kumar	isha@edutechsolution.com	+91 7966276114	+91 8817618658	Director	IT	66da423e-9e3b-4364-8894-8ce01f36207c	\N	active	Contact for EduTech Solutions 9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
607f2c2f-46cd-43f1-a150-4e7cd55e2636	Arjun	Desai	arjun@healthfirstsyst.com	+91 9765856858	+91 7889426317	Coordinator	IT	07cc70c1-de89-4316-8153-db2daf126b0d	\N	active	Contact for HealthFirst Systems 23	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
6ab4f5bd-1660-4723-9853-abf018be667e	Neha	Shah	neha@educationinnova.com	+91 8045035440	+91 7236823260	Specialist	Finance	cbafeffe-ecbc-47d1-8704-d0db67cf3614	\N	active	Contact for Education Innovations 3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
b24aa708-4053-4cb9-80b7-0e8ac7407546	Vikram	Reddy	vikram@industrialsolut.com	+91 9622120355	+91 7351087179	Executive	HR	0b0e094b-d026-4305-8e92-d2814731cf25	\N	active	Contact for Industrial Solutions Corp 16	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
7477736c-8cdf-4327-8f73-c0fdbfec1ea6	Kavya	Iyer	kavya@bankingsystemsi.com	+91 8290637157	+91 9548239758	Executive	IT	d5423dac-26a9-49f6-8239-7445746d3cbd	\N	active	Contact for Banking Systems Inc 38	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
0c002420-851e-4e81-9c63-e0e5a5a20fc8	Priya	Kumar	priya@precisionmanufa.com	+91 7586693624	+91 8632972645	Manager	IT	ea2ffeae-62c5-4c89-994a-a12a76fada53	\N	active	Contact for Precision Manufacturing Ltd 17	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
ee526c24-af56-4be1-a7c0-54815cc17d83	Karan	Sharma	karan@consumergoodsco.com	+91 9941968251	+91 7004443052	Specialist	Sales	d1e0828d-fe9d-4831-8aea-bf9f164cbd0b	\N	active	Contact for Consumer Goods Corp 18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
dbbd95e0-40e6-4365-a985-1cf4b2f3ae54	Karan	Iyer	karan@edutechsolution.com	+91 9877726409	+91 8817873088	Director	Sales	66da423e-9e3b-4364-8894-8ce01f36207c	\N	active	Contact for EduTech Solutions 9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
a131e83f-ea93-416b-8184-85ae9567cb38	Vikram	Desai	vikram@autopartsmanufa.com	+91 9876253682	+91 8706097619	Specialist	HR	9cc6d8b3-e9c8-445b-b1da-f6ca60a0e005	\N	active	Contact for AutoParts Manufacturing 21	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
9e2084a4-6f39-4aaf-8efa-0695fd682c87	Vikram	Nair	vikram@bankingsystemsi.com	+91 7108695211	+91 9157441495	Specialist	IT	d5423dac-26a9-49f6-8239-7445746d3cbd	\N	active	Contact for Banking Systems Inc 38	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
5769cabd-3f4b-42c8-a80d-41690e1c00e1	Vikram	Pillai	vikram@industrialsolut.com	+91 8400715655	+91 7432271942	Coordinator	Sales	0b0e094b-d026-4305-8e92-d2814731cf25	\N	active	Contact for Industrial Solutions Corp 16	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
2ed3d5d1-e07d-460a-90fa-f90d07ed37cd	Rohan	Joshi	rohan@consumergoodsco.com	+91 8188255360	+91 7751077165	VP	Finance	e77a65c5-e9c8-4a06-a95f-f671000570f7	\N	active	Contact for Consumer Goods Corp 25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
bc6fc3ee-1f0d-4080-a418-da04ab7739bb	Divya	Menon	divya@medicalequipmen.com	+91 7034716146	+91 9839581803	Specialist	IT	3ed4bac3-9849-403f-ab84-c16485f42c9e	\N	active	Contact for Medical Equipment Corp 48	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
353b341f-fad0-4428-a1e3-06fc6d05bcd5	Kavya	Mehta	kavya@learningmanagem.com	+91 9309579031	+91 7518719276	Manager	Finance	12bbedd6-0c71-4c99-b500-a8b4a5b1ac18	\N	active	Contact for Learning Management Systems 42	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
3fa10384-bd97-45b0-bd73-40a4a550decf	Divya	Nair	divya@retailtechinc4.com	+91 7744540444	+91 7854270739	Specialist	Finance	d9957ed9-c587-48a1-a683-e310fefcb6c7	\N	active	Contact for Retail Tech Inc 4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
a6e17e0c-a5fd-40d9-a491-0f0c39cb8f8d	Kavya	Kumar	kavya@medicaresolutio.com	+91 7889726445	+91 8620661627	Manager	Operations	db2b6912-34e9-4ae6-977b-49e819e05648	\N	active	Contact for MediCare Solutions 24	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
18202706-d006-46d6-833d-4b43e82cf139	Karan	Joshi	karan@academicsoftwar.com	+91 8198829770	+91 7971315619	Manager	Operations	e118cc01-a48c-4cb0-bfd5-9db549ee460c	\N	active	Contact for Academic Software 35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
4d5f942d-1adb-4fea-9435-4a77e81b41ef	Neha	Reddy	neha@educationinnova.com	+91 8029766570	+91 7362571199	VP	Operations	24e65943-7963-4ef5-a189-a1c5aa19e291	\N	active	Contact for Education Innovations 15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
f3e3b385-e48a-46cd-81ac-75e420113079	Amit	Pillai	amit@trainingsolutio.com	+91 9037854327	+91 7793658245	VP	IT	b86cbebb-2363-4d3c-88a5-6712adb78053	\N	active	Contact for Training Solutions Inc 31	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
87217dcc-4bfc-4126-9235-b11b1a0d770d	Priya	Verma	priya@techcorpsolutio.com	+91 8590687612	+91 7577362752	Coordinator	HR	25ed42dd-d150-4845-84c0-c8a9edfbc79d	\N	active	Contact for TechCorp Solutions 1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
f0aba57c-6407-42df-965e-a4a19310f559	Karan	Verma	karan@edutechsolution.com	+91 8576696171	+91 7140910729	Manager	HR	66da423e-9e3b-4364-8894-8ce01f36207c	\N	active	Contact for EduTech Solutions 9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
1ad13379-7ffe-4211-b632-ba20f4c1ab4c	Sneha	Kumar	sneha@academicsoftwar.com	+91 7513250119	+91 7780698337	Coordinator	IT	e118cc01-a48c-4cb0-bfd5-9db549ee460c	\N	active	Contact for Academic Software 35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
50d2db5c-271f-4493-80fb-8a85db25fbfe	Vikram	Singh	vikram@industrialsolut.com	+91 9276649145	+91 7517450084	Specialist	Sales	e573e8fc-7824-4b10-b3d6-0e70cbde8a52	\N	active	Contact for Industrial Solutions Corp 14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d3734bc8-d304-4dfa-92b8-8b082543d2e1	Pooja	Menon	pooja@edutechsolution.com	+91 7064937962	+91 9286276132	Executive	HR	66da423e-9e3b-4364-8894-8ce01f36207c	\N	active	Contact for EduTech Solutions 9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
31aaf110-8e52-4726-bffd-5e9878dec78b	Rahul	Sharma	rahul@investmentpartn.com	+91 8783932747	+91 7605240902	Executive	Sales	6b479315-e98a-447c-9d64-75a8cfeea515	\N	active	Contact for Investment Partners 8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
5c5bfddb-2082-421b-afa3-a3724b8ebc86	Arjun	Joshi	arjun@trainingsolutio.com	+91 9143069716	+91 9175726236	Manager	Sales	6b492088-0f0c-4b5b-860d-cff6854201d7	\N	active	Contact for Training Solutions Inc 33	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e90709b9-bb63-4502-b63d-c7aed2670ce4	Arjun	Rao	arjun@financialservic.com	+91 7082562425	+91 7913316213	Director	IT	c919bd4a-8f2e-42d7-83fd-e7dff14a716b	\N	active	Contact for Financial Services Corp 34	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
5bfd1868-6491-49e1-90a7-0e2f68645975	Isha	Pillai	isha@medicaresolutio.com	+91 7251885076	+91 9763475985	Manager	IT	db2b6912-34e9-4ae6-977b-49e819e05648	\N	active	Contact for MediCare Solutions 24	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
34e4b12c-12f1-48bd-b40b-abefc9b90b18	Pooja	Reddy	pooja@shoppingsystems.com	+91 9153263560	+91 8206753612	Manager	HR	087f8339-a50a-48bf-bec2-e01245ff894a	\N	active	Contact for Shopping Systems 2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
115d4d40-845b-4012-aee2-6f5278d45023	Priya	Sharma	priya@industrialsolut.com	+91 9222665698	+91 8968813610	Executive	Operations	d660978f-d8b7-48b0-b4c4-3b9ef8e0526d	\N	active	Contact for Industrial Solutions Corp 10	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
85b37870-e579-4e50-914e-d7396fc59b3e	Divya	Verma	divya@autopartsmanufa.com	+91 8713283504	+91 8399189274	Coordinator	HR	9cc6d8b3-e9c8-445b-b1da-f6ca60a0e005	\N	active	Contact for AutoParts Manufacturing 21	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
5ff85a82-0dd0-4fac-96b1-2611217de8b0	Karan	Sharma	karan@steelworksinc11.com	+91 8560316569	+91 8502410738	Executive	HR	6a8be5f7-6ac2-431d-ace1-aff631f6f559	\N	active	Contact for Steel Works Inc 11	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
911e53ff-cb70-4e60-ba52-14d759668ead	Rajesh	Sharma	rajesh@retailtechinc44.com	+91 8796911577	+91 7294648229	Specialist	Sales	3f38f5fe-dd5e-4077-986a-ac53128d7f31	\N	active	Contact for Retail Tech Inc 44	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
15337ff4-d3c9-4bfc-96aa-8402108c8770	Pooja	Menon	pooja@edutechsolution.com	+91 9473481489	+91 7841667960	Specialist	IT	c0bebce4-e3a7-46da-9c74-b1efde053de2	\N	active	Contact for EduTech Solutions 20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
083171b1-f136-4d78-871e-b25fe7ee6fbe	Karan	Verma	karan@retailtechinc44.com	+91 7179140981	+91 7878417186	Executive	HR	3f38f5fe-dd5e-4077-986a-ac53128d7f31	\N	active	Contact for Retail Tech Inc 44	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
0d167f07-fc22-4206-bf2e-b22f9a6b11b3	Priya	Verma	priya@assemblylinesys.com	+91 8253192005	+91 9060183063	Director	Finance	d13ca4f4-e713-4141-9fce-f2b49b01cbee	\N	active	Contact for Assembly Line Systems 39	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
43ad767a-e3a6-4ad8-bd9f-b989b0995ea6	Divya	Kumar	divya@precisionmanufa.com	+91 9848719026	+91 8242858811	VP	Finance	ea2ffeae-62c5-4c89-994a-a12a76fada53	\N	active	Contact for Precision Manufacturing Ltd 17	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
b16af130-87f5-47a7-a5f2-c2154a656424	Isha	Gupta	isha@industrialsolut.com	+91 8996964192	+91 9935499641	Director	HR	0b0e094b-d026-4305-8e92-d2814731cf25	\N	active	Contact for Industrial Solutions Corp 16	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d2eb16f8-bcc0-457a-9422-dc26dd0625be	Sneha	Shah	sneha@autopartsmanufa.com	+91 8640616512	+91 9784422304	Coordinator	IT	9cc6d8b3-e9c8-445b-b1da-f6ca60a0e005	\N	active	Contact for AutoParts Manufacturing 21	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
8c2c96cb-6ccf-414c-91d8-834328a31eeb	Rajesh	Menon	rajesh@autopartsmanufa.com	+91 8265156232	+91 9657236004	Coordinator	HR	4cd8f069-d35b-47cf-bb89-a676cc2a45aa	\N	active	Contact for AutoParts Manufacturing 49	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
a3bd042e-bee8-4bc9-9eae-8f099cce06a4	Amit	Verma	amit@educationinnova.com	+91 8331048233	+91 9220736084	Coordinator	Sales	24e65943-7963-4ef5-a189-a1c5aa19e291	\N	active	Contact for Education Innovations 15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
0f5e49e0-ee5f-42dc-8435-c32af0cca924	Rohan	Pillai	rohan@edutechsolution.com	+91 9755134479	+91 7069325679	Specialist	Operations	245b2ba7-c3b8-46b5-a250-2f192e60d3ce	\N	active	Contact for EduTech Solutions 47	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
7d376c05-6d16-4e72-9771-f59824cb6cb1	Sneha	Kumar	sneha@edutechsolution.com	+91 8145898916	+91 9713099835	Executive	IT	66da423e-9e3b-4364-8894-8ce01f36207c	\N	active	Contact for EduTech Solutions 9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
66c7ba52-b9a4-4ba6-8b7d-96ab28a80901	Neha	Iyer	neha@medicaresolutio.com	+91 9773981027	+91 7305381201	VP	IT	db2b6912-34e9-4ae6-977b-49e819e05648	\N	active	Contact for MediCare Solutions 24	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
fc80870d-179b-4e32-b250-72160832403b	Arjun	Patel	arjun@precisionmanufa.com	+91 8521274387	+91 8595999130	Specialist	IT	f7a08d86-d0f4-454a-a3f9-c6f35559e781	\N	active	Contact for Precision Manufacturing Ltd 41	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
6631d4a5-a5a9-49bd-9e12-353c52511fec	Vikram	Gupta	vikram@retailchainsolu.com	+91 7094534625	+91 7204023191	Specialist	Finance	37e0d540-33f6-44b6-a39e-a7686dc832cb	\N	active	Contact for Retail Chain Solutions 43	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
9e03fe89-b484-4e58-8b62-10429361d6e7	Amit	Desai	amit@industrialsolut.com	+91 7118565989	+91 8405587802	Specialist	Sales	0b0e094b-d026-4305-8e92-d2814731cf25	\N	active	Contact for Industrial Solutions Corp 16	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
0861f937-13bf-4463-987f-89d056e89310	Rajesh	Sharma	rajesh@consumergoodsco.com	+91 9349012658	+91 9883435671	Executive	IT	d1e0828d-fe9d-4831-8aea-bf9f164cbd0b	\N	active	Contact for Consumer Goods Corp 18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
7292a0c2-fe3b-4145-a900-42df432bd198	Vikram	Nair	vikram@digitalinnovati.com	+91 9761873188	+91 8389874744	Manager	IT	0e3764a9-5d1a-430b-b296-b9c105355a01	\N	active	Contact for Digital Innovations Inc 32	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
4b1958bf-97e4-4356-9d0a-206b8271c839	Divya	Iyer	divya@digitalinnovati.com	+91 9813992030	+91 7310712840	Director	IT	0e3764a9-5d1a-430b-b296-b9c105355a01	\N	active	Contact for Digital Innovations Inc 32	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
b89aca79-77eb-4526-b024-e4ebb34c2cee	Rohan	Shah	rohan@consumergoodsco.com	+91 8844517882	+91 8719955098	Director	Finance	d1e0828d-fe9d-4831-8aea-bf9f164cbd0b	\N	active	Contact for Consumer Goods Corp 18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
adb8fad3-9d93-48b0-8204-5ea1e5541be9	Sneha	Nair	sneha@medicalequipmen.com	+91 8360858691	+91 8643053831	Director	Operations	3ed4bac3-9849-403f-ab84-c16485f42c9e	\N	active	Contact for Medical Equipment Corp 48	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
52dbef23-2e29-41fd-ab47-560327cd4169	Rahul	Shah	rahul@fintechsolution.com	+91 9653050045	+91 9052436211	VP	Finance	1c23b5ca-0f1a-47aa-b5cb-8f59942bdf8b	\N	active	Contact for FinTech Solutions 27	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
03ebd47a-f845-40d2-8ec3-12b0bba1efa8	Isha	Kumar	isha@medicaresolutio.com	+91 8555618137	+91 7604946612	Executive	Operations	db2b6912-34e9-4ae6-977b-49e819e05648	\N	active	Contact for MediCare Solutions 24	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
bf2f25fa-12d4-41cb-8b2a-16496068dc0c	Karan	Desai	karan@techcorpsolutio.com	+91 8961314625	+91 8470893255	Coordinator	IT	5881482c-3abb-48b6-8daa-5dbedfd835a8	\N	active	Contact for TechCorp Solutions 19	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
8cfaaafe-7617-427f-a024-ecd199d32dcd	Karan	Nair	karan@edutechsolution.com	+91 7302436733	+91 8808548641	Director	IT	245b2ba7-c3b8-46b5-a250-2f192e60d3ce	\N	active	Contact for EduTech Solutions 47	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
51f86d16-5c61-48b8-be3b-82c6980e99d4	Rohan	Gupta	rohan@trainingsolutio.com	+91 7576725509	+91 9725795470	Specialist	Sales	b86cbebb-2363-4d3c-88a5-6712adb78053	\N	active	Contact for Training Solutions Inc 31	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
b193e751-def8-4202-a138-05fccd1201c0	Kavya	Pillai	kavya@shoppingsystems.com	+91 7355534096	+91 8211852955	Executive	Operations	087f8339-a50a-48bf-bec2-e01245ff894a	\N	active	Contact for Shopping Systems 2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
c2706a6c-0e1e-48e3-b1e9-6640b999fce1	Kavya	Menon	kavya@e-commercedynam.com	+91 7010614490	+91 7231998759	Specialist	HR	6f5a8a04-0700-4e63-bdaa-19f3e393bc7d	\N	active	Contact for E-Commerce Dynamics 30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e6f5cf6e-0d02-40db-8e7a-76614ae48e76	Kavya	Iyer	kavya@financialservic.com	+91 7298937450	+91 9454443539	Coordinator	IT	c919bd4a-8f2e-42d7-83fd-e7dff14a716b	\N	active	Contact for Financial Services Corp 34	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
2b0c3b3d-bef2-4f53-8520-424ee0a498da	Isha	Pillai	isha@precisionmanufa.com	+91 7959373488	+91 7120088214	VP	IT	f7a08d86-d0f4-454a-a3f9-c6f35559e781	\N	active	Contact for Precision Manufacturing Ltd 41	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
6cfc5378-96b1-4797-bdc5-63ac230cd05e	Amit	Verma	amit@retailtechinc44.com	+91 8809271906	+91 8052145037	Coordinator	Finance	3f38f5fe-dd5e-4077-986a-ac53128d7f31	\N	active	Contact for Retail Tech Inc 44	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
fc7bb8fb-c951-49df-a6f9-7f2278f553fd	Karan	Rao	karan@autopartsmanufa.com	+91 8017537492	+91 7283756507	Manager	IT	4cd8f069-d35b-47cf-bb89-a676cc2a45aa	\N	active	Contact for AutoParts Manufacturing 49	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
c8371403-429f-4196-8c5d-bacab08ac0b8	Arjun	Patel	arjun@aidynamics5.com	+91 8173323420	+91 9237196954	VP	Operations	62b1dad2-cfdd-46ab-ba22-093ddb8bf26a	\N	active	Contact for AI Dynamics 5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
afd17f54-3b33-4eeb-9858-f570b7228731	Divya	Gupta	divya@precisionmanufa.com	+91 7962247625	+91 8311190392	Executive	HR	b0c69eb2-0566-4cf2-83b2-268d08cddf2f	\N	active	Contact for Precision Manufacturing Ltd 12	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
9a16da5b-f3f8-4a07-bc0d-5390b54a04ab	Amit	Sharma	amit@autopartsmanufa.com	+91 9023153003	+91 9234711330	Specialist	Finance	4cd8f069-d35b-47cf-bb89-a676cc2a45aa	\N	active	Contact for AutoParts Manufacturing 49	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
4f684b39-b7f8-49e7-930c-40113cfc4fcc	Rahul	Mehta	rahul@healthfirstsyst.com	+91 8122065590	+91 8395335911	Manager	Finance	07cc70c1-de89-4316-8153-db2daf126b0d	\N	active	Contact for HealthFirst Systems 23	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
c6d11441-5b29-4e86-a2cc-517c387fae3e	Anjali	Gupta	anjali@autopartsmanufa.com	+91 8287331691	+91 9610885568	Executive	Sales	4cd8f069-d35b-47cf-bb89-a676cc2a45aa	\N	active	Contact for AutoParts Manufacturing 49	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
41ffac0e-62a2-42f0-8867-90072038934c	Divya	Singh	divya@learningmanagem.com	+91 7454786887	+91 9924472287	Coordinator	HR	12bbedd6-0c71-4c99-b500-a8b4a5b1ac18	\N	active	Contact for Learning Management Systems 42	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
4af4ea88-c99b-4ce6-9962-b5b7f3856f2b	Kavya	Desai	kavya@e-commercedynam.com	+91 7532710267	+91 8186991890	Manager	HR	6f5a8a04-0700-4e63-bdaa-19f3e393bc7d	\N	active	Contact for E-Commerce Dynamics 30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
625206d8-c139-4545-a715-98fe4c6d2c3b	Isha	Reddy	isha@cybersafesoluti.com	+91 8157645348	+91 9593497906	Coordinator	IT	dca02841-1964-401d-ac5d-1a3cbb273605	\N	active	Contact for CyberSafe Solutions 22	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d0ad5cf5-547b-46c1-b7af-45448b0d4f3f	Sanjay	Singh	sanjay@investmentpartn.com	+91 8990995368	+91 8839950462	Specialist	Operations	6b479315-e98a-447c-9d64-75a8cfeea515	\N	active	Contact for Investment Partners 8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
2f022e73-b586-4492-bc78-95f0e5ec0819	Priya	Pillai	priya@edutechsolution.com	+91 8995864457	+91 8574848554	Specialist	Operations	66da423e-9e3b-4364-8894-8ce01f36207c	\N	active	Contact for EduTech Solutions 9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
8c017d88-be37-4e84-be27-a47c493a856a	Rahul	Mehta	rahul@edutechsolution.com	+91 7430530598	+91 8547911419	Director	HR	c0bebce4-e3a7-46da-9c74-b1efde053de2	\N	active	Contact for EduTech Solutions 20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
cab4dd88-4236-4380-8000-6e44758c31d5	Isha	Rao	isha@aidynamics5.com	+91 9197510295	+91 7538384164	VP	Operations	62b1dad2-cfdd-46ab-ba22-093ddb8bf26a	\N	active	Contact for AI Dynamics 5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
655fdc8f-4b4b-4bac-a311-a460f53f8631	Pooja	Patel	pooja@trainingsolutio.com	+91 9764537431	+91 7103946707	Executive	HR	26864fc0-f8ce-4aef-8056-0ad5acc18b26	\N	active	Contact for Training Solutions Inc 37	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
abf8e651-ff6c-4f3d-b981-eeed9cb4cabc	Rohan	Mehta	rohan@shoppingsystems.com	+91 9634369297	+91 9992872307	Executive	Sales	087f8339-a50a-48bf-bec2-e01245ff894a	\N	active	Contact for Shopping Systems 2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
66afa638-3795-43c0-9980-101aef2788cf	Rajesh	Kumar	rajesh@industrialsolut.com	+91 8296167261	+91 9559423310	VP	Finance	d3300632-c2a6-4ba8-877d-14292dc6b1d1	\N	active	Contact for Industrial Solutions Corp 50	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e51fd5b2-13d5-4798-bc6a-0f766b9ae465	Amit	Rao	amit@trainingsolutio.com	+91 9275155065	+91 8681627936	Coordinator	Operations	b86cbebb-2363-4d3c-88a5-6712adb78053	\N	active	Contact for Training Solutions Inc 31	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e3129d8f-251d-4e9e-81b1-90dcc974f4e2	Neha	Kumar	neha@financialservic.com	+91 7452748085	+91 7024588802	Director	Sales	c919bd4a-8f2e-42d7-83fd-e7dff14a716b	\N	active	Contact for Financial Services Corp 34	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
b74d9082-c825-4c1d-a0c2-d05837482a99	Anjali	Pillai	anjali@consumergoodsco.com	+91 8484545193	+91 8307349458	Executive	Sales	a21003d8-4d62-490b-bcf6-553482584a3a	\N	active	Contact for Consumer Goods Corp 46	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
22bd6e7e-f221-4fe5-8d6b-79d78f9f9225	Divya	Patel	divya@autopartsmanufa.com	+91 8237210116	+91 9571763763	Manager	Sales	4cd8f069-d35b-47cf-bb89-a676cc2a45aa	\N	active	Contact for AutoParts Manufacturing 49	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
7407bae5-3dc1-438b-871f-7421a3b5df8b	Neha	Gupta	neha@autopartsmanufa.com	+91 8186246855	+91 8186189501	Manager	Operations	4cd8f069-d35b-47cf-bb89-a676cc2a45aa	\N	active	Contact for AutoParts Manufacturing 49	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
edde58f6-7b36-423c-8edc-0ab5633a1097	Rohan	Shah	rohan@retailchainsolu.com	+91 8138564449	+91 7219028993	Executive	Sales	37e0d540-33f6-44b6-a39e-a7686dc832cb	\N	active	Contact for Retail Chain Solutions 43	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
1a22f2ff-4daf-43b2-a7fb-bc9db98e7aad	Pooja	Joshi	pooja@digitalinnovati.com	+91 9986199656	+91 9882175977	VP	HR	0e3764a9-5d1a-430b-b296-b9c105355a01	\N	active	Contact for Digital Innovations Inc 32	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
8299a808-72cc-4238-82ba-69f08be4c66e	Arjun	Kumar	arjun@fintechsolution.com	+91 7810316214	+91 7486825796	VP	Sales	1c23b5ca-0f1a-47aa-b5cb-8f59942bdf8b	\N	active	Contact for FinTech Solutions 27	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
f4063398-e9fb-4656-9921-27a29deb6f51	Karan	Shah	karan@educationinnova.com	+91 8451142553	+91 8174646308	Specialist	IT	cbafeffe-ecbc-47d1-8704-d0db67cf3614	\N	active	Contact for Education Innovations 3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
52d5a20c-4294-4b4f-89a1-4718c44551bd	Priya	Joshi	priya@capitaladvisors.com	+91 7902449329	+91 9090435892	Coordinator	Sales	b10734ee-1b6f-41f1-997a-957aa880c789	\N	active	Contact for Capital Advisors 13	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
ce9a28c1-a470-4874-80e9-420069c901ed	Arjun	Verma	arjun@techcorpsolutio.com	+91 8776218167	+91 7912785380	Specialist	Operations	25ed42dd-d150-4845-84c0-c8a9edfbc79d	\N	active	Contact for TechCorp Solutions 1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
\.


--
-- Data for Name: deal_activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deal_activities (id, deal_id, activity_type, title, description, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: deal_line_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deal_line_items (id, deal_id, product_category, product_sub_category, part_number, description, quantity, pricing, total_price, warehouse, total_rental, rental_per_unit, sort_order) FROM stdin;
d1111111-1111-1111-1111-111111111111	d1111111-1111-1111-1111-111111111111	Servers	Cloud Compute	CS-ENT-2000	Enterprise Cloud Server - 32 vCPU, 128GB RAM, 2TB NVMe	10	15000.00	150000.00	US-West-1	\N	\N	1
d1111112-1111-1111-1111-111111111111	d1111111-1111-1111-1111-111111111111	Storage	NVMe Storage	ST-10TB-NVMe	All-Flash NVMe Storage Array - 10TB	5	8000.00	40000.00	US-West-1	\N	\N	2
d1111113-1111-1111-1111-111111111111	d1111111-1111-1111-1111-111111111111	Networking	Switches	NW-10G-SW	10GbE Network Switch - 48 port managed	4	5000.00	20000.00	US-West-1	\N	\N	3
d1111114-1111-1111-1111-111111111111	d1111111-1111-1111-1111-111111111111	Services	Installation	SVC-INSTALL-ENT	Enterprise Installation and Configuration Service	1	40000.00	40000.00	Professional Services	\N	\N	4
d2222221-2222-2222-2222-222222222222	d2222222-2222-2222-2222-222222222222	IoT Devices	Gateways	IG-5000	Industrial IoT Gateway - Edge Computing Enabled	5	8000.00	40000.00	US-Central	60000.00	1000.00	1
d2222222-2222-2222-2222-222222222222	d2222222-2222-2222-2222-222222222222	IoT Devices	Temperature Sensors	TS-200	Industrial Temperature Sensor - Range -40°C to 125°C	200	150.00	30000.00	US-Central	24000.00	10.00	2
d2222223-2222-2222-2222-222222222222	d2222222-2222-2222-2222-222222222222	IoT Devices	Vibration Sensors	VS-300	Vibration Sensor - Predictive Maintenance Grade	200	250.00	50000.00	US-Central	30000.00	12.50	3
d2222224-2222-2222-2222-222222222222	d2222222-2222-2222-2222-222222222222	IoT Devices	Pressure Sensors	PS-400	Industrial Pressure Sensor - 0-1000 PSI	100	300.00	30000.00	US-Central	18000.00	15.00	4
d2222225-2222-2222-2222-222222222222	d2222222-2222-2222-2222-222222222222	Software	Analytics Platform	SW-IOT-CLOUD	IoT Cloud Analytics Platform - 12 month subscription	1	30000.00	30000.00	Cloud Service	\N	\N	5
d3333331-3333-3333-3333-333333333333	d3333333-3333-3333-3333-333333333333	POS Hardware	Terminals	PT-300	POS Terminal - 15" Touchscreen All-in-One	50	1200.00	60000.00	US-South	\N	\N	1
d3333332-3333-3333-3333-333333333333	d3333333-3333-3333-3333-333333333333	POS Hardware	Printers	RP-80	Receipt Printer - 80mm Thermal	50	200.00	10000.00	US-South	\N	\N	2
d3333333-3333-3333-3333-333333333333	d3333333-3333-3333-3333-333333333333	POS Hardware	Scanners	BS-2D	Barcode Scanner - 2D Imager	50	150.00	7500.00	US-South	\N	\N	3
d3333334-3333-3333-3333-333333333333	d3333333-3333-3333-3333-333333333333	POS Hardware	Cash Drawers	CD-410	Cash Drawer - 4 Bill / 10 Coin	50	100.00	5000.00	US-South	\N	\N	4
d3333335-3333-3333-3333-333333333333	d3333333-3333-3333-3333-333333333333	Software	POS License	SW-POS-CLOUD	Cloud POS Software License - 3 year	50	300.00	15000.00	Cloud Service	\N	\N	5
d3333336-3333-3333-3333-333333333333	d3333333-3333-3333-3333-333333333333	Services	Installation	SVC-INSTALL-POS	POS Installation and Training - Per Location	50	300.00	15000.00	Professional Services	\N	\N	6
d3333337-3333-3333-3333-333333333333	d3333333-3333-3333-3333-333333333333	Services	Support	SVC-SUPPORT-3YR	POS Support Contract - 3 Year	50	250.00	12500.00	Professional Services	\N	\N	7
\.


--
-- Data for Name: deals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deals (id, title, company, account_id, value, stage, probability, owner_id, closing_date, description, contact_id, next_step, forecast, type, lead_source, sdp_no, sales_created_by_rm, lead_category, product_manager, expected_revenue, bandwidth_required, product_configuration, rental_duration, enter_product_details, product_name_and_part_number, specifications, show_subform, billing_delivery_date, description_of_product, payment, payment_terms, po_number_or_mail_confirmation, integration_requirement, brand, orc_amount, product_warranty, ship_by, special_instruction, third_party_delivery_address, billing_company, email_subject, additional_information, da, delivery_address, tag, payment_flag, contact_no, designation, email, location, next_follow_up, requirement, quoted_requirement, billing_street, billing_state, billing_country, billing_city, billing_zip_code, created_at, updated_at, type_of_order) FROM stdin;
0b70cac7-c6b9-4618-845d-49d9bd0e533d	Ink Cartridges Deal - Industrial Solutions Corp 14	Industrial Solutions Corp 14	e573e8fc-7824-4b10-b3d6-0e70cbde8a52	414595.00	Negotiation	75	11f1c307-f3cc-4904-90cb-b97f89fc9d43	2026-03-02	Deal for HP Ink Cartridge 680 (Tri-color) and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
aa259e91-638c-4f70-98e8-935b7b56981a	Services Deal - Investment Partners 8	Investment Partners 8	6b479315-e98a-447c-9d64-75a8cfeea515	260077.00	New	50	43935cf9-b3be-4493-8927-06a5a6c04275	2026-04-20	Deal for On-site Installation Service and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
b34b2c7d-6467-4fc2-a58e-cecee86a42cc	Printers Deal - Learning Management Systems 42	Learning Management Systems 42	12bbedd6-0c71-4c99-b500-a8b4a5b1ac18	1523359.00	New	50	5b5738bf-2222-4ca7-90bc-bd05b58cded4	2026-06-13	Deal for HP LaserJet Pro M404dn and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
08c251ff-7b46-4543-9211-47a7bb67f1a8	Services Deal - EduTech Solutions 9	EduTech Solutions 9	66da423e-9e3b-4364-8894-8ce01f36207c	846459.00	Negotiation	75	20a1bad5-7a19-47b2-afeb-55d630ee5f13	2026-02-26	Deal for On-site Installation Service and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
62027fd2-0fd0-47b5-ad25-15c9030e69e0	Printers Deal - MediCare Solutions 24	MediCare Solutions 24	db2b6912-34e9-4ae6-977b-49e819e05648	745182.00	New	50	35417c40-2a83-4e3d-bca2-447f4304f7b3	2026-05-07	Deal for Epson EcoTank L3250 and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
26ee1a2d-2312-42fd-8e1a-cac598c9675d	Ink Cartridges Deal - Training Solutions Inc 33	Training Solutions Inc 33	6b492088-0f0c-4b5b-860d-cff6854201d7	269682.00	Proposal	50	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	2026-04-24	Deal for HP Ink Cartridge 680 (Tri-color) and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
7f2e079d-cdab-4895-bfad-e11a3989cc86	Services Deal - Financial Services Corp 34	Financial Services Corp 34	c919bd4a-8f2e-42d7-83fd-e7dff14a716b	1750980.00	Cold	10	f9701eca-09f1-48b3-95b8-9d61684cac10	2026-05-23	Deal for On-site Installation Service and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
939320a7-5459-4376-adf9-4d7b822071d2	Toner Cartridges Deal - AI Dynamics 5	AI Dynamics 5	62b1dad2-cfdd-46ab-ba22-093ddb8bf26a	1396530.00	New	50	d8699681-b89d-4914-a9e1-4cb5f15feeb2	2026-05-19	Deal for HP Toner CF410A (Black) and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
9edb66b4-53c2-433f-9603-6c0d3d8d4a3a	Accessories Deal - Digital Innovations Inc 32	Digital Innovations Inc 32	0e3764a9-5d1a-430b-b296-b9c105355a01	572589.00	New	50	6fe86a87-d903-4f41-93fc-e63196c3af1a	2026-04-29	Deal for Network Print Server and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
6aac3a93-20c1-4ccf-b107-2741071771bd	Services Deal - EduTech Solutions 47	EduTech Solutions 47	245b2ba7-c3b8-46b5-a250-2f192e60d3ce	611108.00	Cold	10	20a1bad5-7a19-47b2-afeb-55d630ee5f13	2026-06-10	Deal for On-site Installation Service and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
ab59397a-c302-4dbe-8301-087e5654c840	Printers Deal - E-Commerce Dynamics 30	E-Commerce Dynamics 30	6f5a8a04-0700-4e63-bdaa-19f3e393bc7d	282290.00	New	50	21173b45-5320-4943-ba5a-be5a3d586cb1	2026-06-09	Deal for Brother HL-L2321D and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
e39a882e-f6f8-4a9f-88b8-19fbaefc1aa6	Ink Cartridges Deal - Investment Partners 8	Investment Partners 8	6b479315-e98a-447c-9d64-75a8cfeea515	1249744.00	New	50	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	2026-05-17	Deal for HP Ink Cartridge 680 (Tri-color) and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
80b2c991-381e-4a99-a1fe-9d0de90de342	Services Deal - CyberSafe Solutions 36	CyberSafe Solutions 36	820d1b19-d1cc-4a20-aff5-660047806b61	583415.00	New	50	1b45ba6b-98f7-407b-826c-5ce61d112a0f	2026-03-24	Deal for Annual Maintenance Contract and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
1accd038-b4f3-449e-9abc-f2cbf6160df5	Printers Deal - CyberSafe Solutions 22	CyberSafe Solutions 22	dca02841-1964-401d-ac5d-1a3cbb273605	432929.00	Negotiation	75	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	2026-03-19	Deal for HP OfficeJet Pro 9015 and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
2211ad2c-e8f0-4e29-b224-e5d113432fa9	Accessories Deal - FinTech Solutions 40	FinTech Solutions 40	edd6d10d-2bfe-4774-87f8-f0194d1b9d14	235123.00	Closed Lost	0	5b5738bf-2222-4ca7-90bc-bd05b58cded4	2026-05-18	Deal for Printer Maintenance Kit and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
29632424-626c-48ef-b0fe-b494adc997e9	Accessories Deal - CyberSafe Solutions 36	CyberSafe Solutions 36	820d1b19-d1cc-4a20-aff5-660047806b61	483019.00	Proposal	50	6190aefe-9845-4000-ab34-5423f0982d38	2026-02-26	Deal for Network Print Server and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
fd11d3ab-ffe0-47d6-ba1b-a46e73e8fc5c	Ink Cartridges Deal - Consumer Goods Corp 46	Consumer Goods Corp 46	a21003d8-4d62-490b-bcf6-553482584a3a	115395.00	Negotiation	75	6fe86a87-d903-4f41-93fc-e63196c3af1a	2026-05-10	Deal for HP Ink Cartridge 680 (Tri-color) and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
2b79c472-2030-4dc4-9585-3dbb18e43030	Paper & Supplies Deal - Industrial Solutions Corp 50	Industrial Solutions Corp 50	d3300632-c2a6-4ba8-877d-14292dc6b1d1	546863.00	Cold	10	512f9954-6c97-4118-b7fe-890710702f92	2026-03-17	Deal for A4 Copy Paper (500 Sheets) and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
dfa8cf7c-7d11-4e81-a05d-532f2b96bac7	Ink Bottles Deal - Retail Tech Inc 44	Retail Tech Inc 44	3f38f5fe-dd5e-4077-986a-ac53128d7f31	1958910.00	Closed Won	100	1b45ba6b-98f7-407b-826c-5ce61d112a0f	2026-05-19	Deal for Epson Ink Bottle T664 (Black) and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
0e836ab0-3e28-4bad-a0fc-766eede19547	Paper & Supplies Deal - HealthFirst Systems 23	HealthFirst Systems 23	07cc70c1-de89-4316-8153-db2daf126b0d	851082.00	Proposal	50	1d3255e6-5d5b-4f5b-b3d6-73f01eebf427	2026-05-10	Deal for A4 Copy Paper (500 Sheets) and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
21b5829d-98d0-4203-8c11-8cdbf0bfdf76	Services Deal - Consumer Goods Corp 25	Consumer Goods Corp 25	e77a65c5-e9c8-4a06-a95f-f671000570f7	827532.00	Cold	10	1b45ba6b-98f7-407b-826c-5ce61d112a0f	2026-03-24	Deal for On-site Installation Service and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
38c939d6-83bc-4bc2-a375-1a974ce6ba8c	Printers Deal - Financial Services Corp 28	Financial Services Corp 28	028dddc1-d19a-44e5-a97f-74e23ada58d4	54912.00	Closed Won	100	20a1bad5-7a19-47b2-afeb-55d630ee5f13	2026-02-26	Deal for Canon imageCLASS MF445dw and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
d978b98c-f097-4cae-8be6-dd4056641c00	Printers Deal - TechCorp Solutions 19	TechCorp Solutions 19	5881482c-3abb-48b6-8daa-5dbedfd835a8	1090037.00	Negotiation	75	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	2026-04-08	Deal for HP LaserJet Pro M404dn and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
0538e6c6-a315-458d-a292-b604893d54f4	Accessories Deal - AutoParts Manufacturing 21	AutoParts Manufacturing 21	9cc6d8b3-e9c8-445b-b1da-f6ca60a0e005	293801.00	Closed Lost	0	d8699681-b89d-4914-a9e1-4cb5f15feeb2	2026-05-21	Deal for Network Print Server and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
21060ad7-3239-4629-9bf9-ff7e8b9f2805	Ink Bottles Deal - Financial Services Corp 28	Financial Services Corp 28	028dddc1-d19a-44e5-a97f-74e23ada58d4	1727217.00	Closed Won	100	d8699681-b89d-4914-a9e1-4cb5f15feeb2	2026-03-29	Deal for Epson Ink Bottle T664 (Black) and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
705831dd-1871-48fe-9827-53313de44bf1	Printers Deal - DataFlow Technologies 26	DataFlow Technologies 26	87149a52-d474-43c1-9cc9-32d77bdd25e5	1986870.00	New	50	20a1bad5-7a19-47b2-afeb-55d630ee5f13	2026-04-04	Deal for Xerox VersaLink C405 and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
b325b1e9-2555-442b-a573-2b7b6007db92	Accessories Deal - Steel Works Inc 11	Steel Works Inc 11	6a8be5f7-6ac2-431d-ace1-aff631f6f559	893090.00	Closed Lost	0	14a3756a-5a80-460a-90b2-96f572cffd76	2026-03-15	Deal for Network Print Server and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
ed772fd0-39f9-4f66-af9c-0e9f829f4d50	Printers Deal - HealthFirst Systems 23	HealthFirst Systems 23	07cc70c1-de89-4316-8153-db2daf126b0d	258510.00	New	50	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	2026-02-25	Deal for Epson EcoTank L3250 and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
336332c6-5274-4140-9e2a-75c1bdab38a5	Paper & Supplies Deal - Financial Services Corp 34	Financial Services Corp 34	c919bd4a-8f2e-42d7-83fd-e7dff14a716b	1391276.00	Proposal	50	09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	2026-06-10	Deal for A4 Copy Paper (500 Sheets) and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
b0825a3a-63be-468a-abae-4ff623f84687	Printers Deal - Steel Works Inc 11	Steel Works Inc 11	6a8be5f7-6ac2-431d-ace1-aff631f6f559	1920903.00	Closed Won	100	512f9954-6c97-4118-b7fe-890710702f92	2026-04-03	Deal for Brother HL-L2321D and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
c3d86b33-f774-4193-8ed1-8558c70e752f	Paper & Supplies Deal - Precision Manufacturing Ltd 17	Precision Manufacturing Ltd 17	ea2ffeae-62c5-4c89-994a-a12a76fada53	1940075.00	Negotiation	75	35417c40-2a83-4e3d-bca2-447f4304f7b3	2026-02-26	Deal for A4 Copy Paper (500 Sheets) and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
a48ab150-2732-42ae-9f4f-e5bf875ce60c	Printers Deal - Precision Manufacturing Ltd 12	Precision Manufacturing Ltd 12	b0c69eb2-0566-4cf2-83b2-268d08cddf2f	1849534.00	New	50	6fe86a87-d903-4f41-93fc-e63196c3af1a	2026-04-17	Deal for HP LaserJet Pro M404dn and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
bc36cc33-7f70-4a90-8a03-54d4934e8178	Ink Bottles Deal - Training Solutions Inc 45	Training Solutions Inc 45	112c7960-d87c-4fae-a92c-f6c772242255	1468759.00	Proposal	50	512f9954-6c97-4118-b7fe-890710702f92	2026-05-11	Deal for Epson Ink Bottle T664 (Black) and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
24eb1ac8-5dd4-48b5-9c1e-998e32788a7c	Printers Deal - FinTech Solutions 27	FinTech Solutions 27	1c23b5ca-0f1a-47aa-b5cb-8f59942bdf8b	698666.00	New	50	35417c40-2a83-4e3d-bca2-447f4304f7b3	2026-05-14	Deal for Brother HL-L2321D and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
75994e1c-d1d8-495f-8bdd-fabe8142aadf	Toner Cartridges Deal - EduTech Solutions 9	EduTech Solutions 9	66da423e-9e3b-4364-8894-8ce01f36207c	448946.00	Closed Won	100	6190aefe-9845-4000-ab34-5423f0982d38	2026-04-28	Deal for HP Toner CF410A (Black) and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
f80cd71f-89a6-4e43-9137-2aaa7bfbc406	Printers Deal - Education Innovations 15	Education Innovations 15	24e65943-7963-4ef5-a189-a1c5aa19e291	898918.00	Negotiation	75	1d3255e6-5d5b-4f5b-b3d6-73f01eebf427	2026-04-01	Deal for Brother HL-L2321D and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
d24f87fe-40d5-4f16-89b3-ab848bfc3704	Ink Bottles Deal - FinTech Solutions 27	FinTech Solutions 27	1c23b5ca-0f1a-47aa-b5cb-8f59942bdf8b	1915556.00	Cold	10	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	2026-06-01	Deal for Epson Ink Bottle T664 (Black) and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
a5ad7ecf-72e7-48b8-a6f1-bbab1b565cce	Services Deal - EduTech Solutions 20	EduTech Solutions 20	c0bebce4-e3a7-46da-9c74-b1efde053de2	1438939.00	Closed Won	100	20a1bad5-7a19-47b2-afeb-55d630ee5f13	2026-06-04	Deal for Annual Maintenance Contract and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
b6868717-fd0f-4125-b852-5562d909da29	Printers Deal - Capital Advisors 7	Capital Advisors 7	b48a0164-d69b-49ed-b1c8-645c95bbeee3	1561918.00	Closed Won	100	1b45ba6b-98f7-407b-826c-5ce61d112a0f	2026-05-24	Deal for Epson EcoTank L3250 and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
959dbdda-20ef-4000-ab38-6e65b6b4cdd0	Accessories Deal - Precision Manufacturing Ltd 6	Precision Manufacturing Ltd 6	6c3cf2ac-dae5-4b55-8e6e-488d58985d4d	1678792.00	Closed Won	100	6fe86a87-d903-4f41-93fc-e63196c3af1a	2026-06-12	Deal for Network Print Server and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
7f6a8fbe-e2ac-4858-8e77-2e1f0a593294	Printers Deal - Training Solutions Inc 31	Training Solutions Inc 31	b86cbebb-2363-4d3c-88a5-6712adb78053	760656.00	Cold	10	09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	2026-05-14	Deal for HP OfficeJet Pro 9015 and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
89e1c878-e06f-4fcc-a46c-501449c53dc7	Services Deal - Precision Manufacturing Ltd 41	Precision Manufacturing Ltd 41	f7a08d86-d0f4-454a-a3f9-c6f35559e781	1344018.00	New	50	1b45ba6b-98f7-407b-826c-5ce61d112a0f	2026-03-20	Deal for On-site Installation Service and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
a2ff46e9-0470-46f3-a915-87cc921b7334	Ink Bottles Deal - Financial Services Corp 34	Financial Services Corp 34	c919bd4a-8f2e-42d7-83fd-e7dff14a716b	1103361.00	Cold	10	512f9954-6c97-4118-b7fe-890710702f92	2026-02-21	Deal for Epson Ink Bottle T664 (Black) and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
3deb5028-bbf1-4667-86de-4a965dc46154	Accessories Deal - EduTech Solutions 47	EduTech Solutions 47	245b2ba7-c3b8-46b5-a250-2f192e60d3ce	1510458.00	Proposal	50	512f9954-6c97-4118-b7fe-890710702f92	2026-03-21	Deal for Network Print Server and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
6887852a-8354-43d5-aea3-75c2209b672e	Printers Deal - CyberSafe Solutions 36	CyberSafe Solutions 36	820d1b19-d1cc-4a20-aff5-660047806b61	986337.00	Closed Lost	0	6190aefe-9845-4000-ab34-5423f0982d38	2026-04-11	Deal for HP OfficeJet Pro 9015 and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
7c31abeb-4fb6-4d9b-9f12-f78b884ba14c	Paper & Supplies Deal - Capital Advisors 7	Capital Advisors 7	b48a0164-d69b-49ed-b1c8-645c95bbeee3	157891.00	Closed Won	100	11f1c307-f3cc-4904-90cb-b97f89fc9d43	2026-03-29	Deal for A4 Copy Paper (500 Sheets) and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
a5310e3b-7db2-4303-8d3b-7789a0d5a8d8	Printers Deal - Financial Services Corp 28	Financial Services Corp 28	028dddc1-d19a-44e5-a97f-74e23ada58d4	1481206.00	Negotiation	75	6fe86a87-d903-4f41-93fc-e63196c3af1a	2026-05-23	Deal for HP LaserJet Pro M404dn and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
c926e5c7-1d34-4ab3-9d18-2bae5253cdc0	Printers Deal - Financial Services Corp 28	Financial Services Corp 28	028dddc1-d19a-44e5-a97f-74e23ada58d4	646007.00	Negotiation	75	1d3255e6-5d5b-4f5b-b3d6-73f01eebf427	2026-04-11	Deal for HP LaserJet Pro M404dn and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
c3645a50-c9ed-4644-9411-a81adb04f413	Printers Deal - MediCare Solutions 24	MediCare Solutions 24	db2b6912-34e9-4ae6-977b-49e819e05648	195304.00	Cold	10	11f1c307-f3cc-4904-90cb-b97f89fc9d43	2026-03-31	Deal for HP LaserJet Pro M404dn and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
10770195-292c-465a-bd4d-8bd81943f965	Printers Deal - EduTech Solutions 20	EduTech Solutions 20	c0bebce4-e3a7-46da-9c74-b1efde053de2	1560205.00	New	50	43935cf9-b3be-4493-8927-06a5a6c04275	2026-05-28	Deal for HP LaserJet Pro M404dn and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
7940a58e-e438-44c0-b154-b9ede9d2e408	Accessories Deal - AutoParts Manufacturing 49	AutoParts Manufacturing 49	4cd8f069-d35b-47cf-bb89-a676cc2a45aa	1634826.00	New	50	20a1bad5-7a19-47b2-afeb-55d630ee5f13	2026-03-11	Deal for Printer Maintenance Kit and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
e5ce83d5-ce43-4a5f-b31f-c7505dec59b0	Printers Deal - Retail Tech Inc 4	Retail Tech Inc 4	d9957ed9-c587-48a1-a683-e310fefcb6c7	427628.00	New	50	1b45ba6b-98f7-407b-826c-5ce61d112a0f	2026-02-22	Deal for HP LaserJet Pro M404dn and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
461984e6-ac19-4254-89e0-50694ac16bff	Toner Cartridges Deal - Retail Chain Solutions 43	Retail Chain Solutions 43	37e0d540-33f6-44b6-a39e-a7686dc832cb	1774132.00	Closed Lost	0	43935cf9-b3be-4493-8927-06a5a6c04275	2026-05-12	Deal for Canon Toner 046 (Cyan) and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
bcc38f41-3f5d-4b8e-8761-21068e3f188d	Toner Cartridges Deal - Assembly Line Systems 39	Assembly Line Systems 39	d13ca4f4-e713-4141-9fce-f2b49b01cbee	235368.00	Negotiation	75	6fe86a87-d903-4f41-93fc-e63196c3af1a	2026-06-14	Deal for Canon Toner 046 (Cyan) and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
3fcc2a08-80d3-49fa-ac47-4ba9a1d5c37f	Printers Deal - Industrial Solutions Corp 50	Industrial Solutions Corp 50	d3300632-c2a6-4ba8-877d-14292dc6b1d1	1685964.00	Proposal	50	20a1bad5-7a19-47b2-afeb-55d630ee5f13	2026-04-22	Deal for HP OfficeJet Pro 9015 and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
3c8e1eb4-8ca1-4fdc-9e52-ae7d0eaeb066	Ink Bottles Deal - EduTech Solutions 47	EduTech Solutions 47	245b2ba7-c3b8-46b5-a250-2f192e60d3ce	1880668.00	Cold	10	6fe86a87-d903-4f41-93fc-e63196c3af1a	2026-05-04	Deal for Epson Ink Bottle T664 (Black) and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
0aea196c-c17a-443b-8855-481c7aeab59f	Printers Deal - Academic Software 35	Academic Software 35	e118cc01-a48c-4cb0-bfd5-9db549ee460c	1375005.00	Closed Won	100	43935cf9-b3be-4493-8927-06a5a6c04275	2026-05-14	Deal for Epson EcoTank L3250 and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
1dcc00ba-ff8e-489b-85d4-6ec7acadc0c3	Ink Bottles Deal - AI Dynamics 5	AI Dynamics 5	62b1dad2-cfdd-46ab-ba22-093ddb8bf26a	1632600.00	Cold	10	e03c5d7b-6be1-43da-a72b-c2f60ae9863f	2026-05-27	Deal for Epson Ink Bottle T664 (Black) and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
797e537c-d9e1-48ff-bb97-ecb11177d04d	Printers Deal - Training Solutions Inc 33	Training Solutions Inc 33	6b492088-0f0c-4b5b-860d-cff6854201d7	1127019.00	Proposal	50	512f9954-6c97-4118-b7fe-890710702f92	2026-04-28	Deal for Epson EcoTank L3250 and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
7ec21467-ab76-49c0-96dd-3d72db37e0fc	Services Deal - EduTech Solutions 20	EduTech Solutions 20	c0bebce4-e3a7-46da-9c74-b1efde053de2	665090.00	Cold	10	21173b45-5320-4943-ba5a-be5a3d586cb1	2026-03-05	Deal for On-site Installation Service and related services	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553	\N
\.


--
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_templates (id, name, subject, body, category, owner_id, created_at, updated_at) FROM stdin;
9e3425ee-3a2b-4c98-8947-b5b33b62200d	Welcome Email	Welcome to Comprint!	Dear {{name}},\n\nWelcome to Comprint! We're excited to have you on board.\n\nBest regards,\nComprint Team	Onboarding	1b45ba6b-98f7-407b-826c-5ce61d112a0f	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
2b3b48fc-f6a5-4848-b12d-219f7b1d3a81	Follow-up Email	Following up on our conversation	Hi {{name}},\n\nThank you for your time today. As discussed, I'm sending you more information about {{product}}.\n\nBest regards,\n{{sender}}	Sales	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
90da1666-6f6a-453d-a233-bfc2cb01e985	Quote Email	Quote for {{product}}	Dear {{name}},\n\nPlease find attached the quote for {{product}}. The total amount is {{amount}}.\n\nBest regards,\n{{sender}}	Sales	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
8b362b2c-4419-41f9-a92a-ee918fca2410	Meeting Reminder	Reminder: Meeting on {{date}}	Hi {{name}},\n\nThis is a reminder about our meeting scheduled for {{date}} at {{time}}.\n\nBest regards,\n{{sender}}	General	f9701eca-09f1-48b3-95b8-9d61684cac10	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
5d9b02c1-3f74-4546-870a-8746aabac0ce	Thank You Email	Thank you for your business	Dear {{name}},\n\nThank you for choosing Comprint. We appreciate your business!\n\nBest regards,\nComprint Team	Customer Service	6fe86a87-d903-4f41-93fc-e63196c3af1a	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d5407714-6e78-4890-8bfe-946cf7239d33	Product Demo Invitation	Invitation: {{product}} Demo	Hi {{name}},\n\nWe'd like to invite you to a demo of {{product}}. Please let us know your availability.\n\nBest regards,\n{{sender}}	Sales	1b45ba6b-98f7-407b-826c-5ce61d112a0f	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
16809273-d6cb-4472-a3cb-78d8755fe523	Payment Reminder	Payment Reminder - Invoice {{invoice_no}}	Dear {{name}},\n\nThis is a friendly reminder that payment for invoice {{invoice_no}} is due.\n\nBest regards,\nAccounts Team	Finance	e03c5d7b-6be1-43da-a72b-c2f60ae9863f	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
594f2bbb-4ec7-4c6a-998d-1ecc7e5d540c	Support Ticket Response	Re: Support Ticket #{{ticket_no}}	Hi {{name}},\n\nThank you for contacting support. We're working on your issue and will update you soon.\n\nBest regards,\nSupport Team	Support	43935cf9-b3be-4493-8927-06a5a6c04275	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
f5749b73-9690-4cab-8168-ab8f929dc3f9	Newsletter	Comprint Monthly Newsletter	Dear Valued Customer,\n\nHere's what's new at Comprint this month...\n\nBest regards,\nComprint Team	Marketing	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
4adfeccb-0ebe-4b80-8244-85f979c356f3	Contract Renewal	Contract Renewal - {{contract_name}}	Dear {{name}},\n\nYour contract {{contract_name}} is due for renewal. Please contact us to discuss.\n\nBest regards,\n{{sender}}	Sales	6fe86a87-d903-4f41-93fc-e63196c3af1a	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
\.


--
-- Data for Name: emails; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.emails (id, subject, body, from_address, to_address, cc, bcc, status, sent_at, scheduled_at, related_to_type, related_to_id, template_id, owner_id, created_at, updated_at) FROM stdin;
e0111111-1111-1111-1111-111111111111	RE: Enterprise Cloud Infrastructure Proposal	Hi Robert, Thank you for the opportunity to present our enterprise cloud solution. Attached is the comprehensive proposal including technical specifications, pricing, and implementation timeline. Looking forward to discussing this further in our upcoming demo.	john.smith@comprint.com	robert.williams@acmecorp.com	\N	\N	sent	2026-02-10 15:00:00+05:30	\N	deal	d1111111-1111-1111-1111-111111111111	\N	\N	2026-02-09 07:58:13.237427	2026-02-09 07:58:13.237427
e0222222-2222-2222-2222-222222222222	IoT Sensor Network - Site Survey Confirmation	Hi Jennifer, Confirming our site visit on February 14th for the IoT sensor deployment assessment. We will evaluate all 5 manufacturing zones and provide recommendations. Please arrange access to facilities.	sarah.johnson@comprint.com	jennifer.davis@globalmanuf.com	\N	\N	sent	2026-02-11 19:30:00+05:30	\N	deal	d2222222-2222-2222-2222-222222222222	\N	\N	2026-02-09 07:58:13.237427	2026-02-09 07:58:13.237427
e0333333-3333-3333-3333-333333333333	POS System Upgrade - ROI Analysis	Hi David, As requested, I have prepared a detailed ROI analysis for the POS system upgrade across your 50 locations. The analysis shows a 24-month payback period with significant operational efficiency gains. Let me know if you need any clarification.	michael.chen@comprint.com	david.martinez@retailinnov.com	\N	\N	sent	2026-02-12 16:30:00+05:30	\N	deal	d3333333-3333-3333-3333-333333333333	\N	\N	2026-02-09 07:58:13.237427	2026-02-09 07:58:13.237427
e0444444-4444-4444-4444-444444444444	TechStartup - Cloud Migration Proposal	Hi Alex, Please find attached our proposal for your cloud migration project. Looking forward to discussing this with you.	john.smith@comprint.com	alex@techstartup.com	\N	\N	sent	2026-02-09 15:30:00+05:30	\N	deal	d4444444-4444-4444-4444-444444444444	\N	\N	2026-02-09 08:24:13.659938	2026-02-09 08:24:13.659938
e0555555-5555-5555-5555-555555555555	Insurance Corp - Product Demo Confirmation	Hi David, Confirming our product demo scheduled for Feb 12 at 3 PM. Meeting link will be sent separately.	sarah.johnson@comprint.com	david@insurancecorp.com	\N	\N	sent	2026-02-09 20:00:00+05:30	\N	lead	78888888-8888-8888-8888-888888888888	\N	\N	2026-02-09 08:24:13.659938	2026-02-09 08:24:13.659938
e0666666-6666-6666-6666-666666666666	Retail Giant - Technical Requirements	Hi team, Thank you for sharing your technical requirements. We have reviewed them and have some clarification questions.	john.smith@comprint.com	sales@retailgiant.com	\N	\N	sent	2026-02-08 21:30:00+05:30	\N	deal	d7777777-7777-7777-7777-777777777777	\N	\N	2026-02-09 08:24:13.659938	2026-02-09 08:24:13.659938
e0777777-7777-7777-7777-777777777777	Marketing Masters - Welcome	Hi Lisa, Thank you for your interest in our marketing automation solution. Let me share some resources to get started.	sarah.johnson@comprint.com	lisa@marketingmasters.com	\N	\N	sent	2026-02-07 16:30:00+05:30	\N	lead	75555555-5555-5555-5555-555555555555	\N	\N	2026-02-09 08:24:13.659938	2026-02-09 08:24:13.659938
e0888888-8888-8888-8888-888888888888	EduTech - Contract Ready	Hi team, Your contract is ready for review. Please let me know if you have any questions before signing.	sarah.johnson@comprint.com	contact@edutech.com	\N	\N	sent	2026-02-10 14:30:00+05:30	\N	deal	d8888888-8888-8888-8888-888888888888	\N	\N	2026-02-09 08:24:13.659938	2026-02-09 08:24:13.659938
e0999999-9999-9999-9999-999999999999	Healthcare Plus - Proposal Update	Hi team, I have updated the proposal based on your feedback. Please review the attached revised version.	michael.chen@comprint.com	info@healthcareplus.com	\N	\N	sent	2026-02-09 18:30:00+05:30	\N	deal	d6666666-6666-6666-6666-666666666666	\N	\N	2026-02-09 08:24:13.659938	2026-02-09 08:24:13.659938
\.


--
-- Data for Name: lead_activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lead_activities (id, lead_id, activity_type, title, description, created_by, created_at) FROM stdin;
ba111111-1111-1111-1111-111111111111	71111111-1111-1111-1111-111111111111	call	Initial discovery call	Discussed network infrastructure requirements and timeline	11111111-1111-1111-1111-111111111111	2026-02-09 13:54:13.659938+05:30
ba222222-2222-2222-2222-222222222222	71111111-1111-1111-1111-111111111111	email	Sent quote QT-2026-001	Emailed detailed quote for network upgrade	11111111-1111-1111-1111-111111111111	2026-02-09 13:54:13.659938+05:30
ba333333-3333-3333-3333-333333333333	72222222-2222-2222-2222-222222222222	meeting	Technical requirements meeting	Met with IT team to review cloud migration requirements	22222222-2222-2222-2222-222222222222	2026-02-09 13:54:13.659938+05:30
ba444444-4444-4444-4444-444444444444	73333333-3333-3333-3333-333333333333	email	Sent HIPAA compliance documentation	Shared our HIPAA compliance certifications and case studies	33333333-3333-3333-3333-333333333333	2026-02-09 13:54:13.659938+05:30
ba555555-5555-5555-5555-555555555555	74444444-4444-4444-4444-444444444444	call	Follow-up call	Left voicemail regarding supply chain software demo	11111111-1111-1111-1111-111111111111	2026-02-09 13:54:13.659938+05:30
ba666666-6666-6666-6666-666666666666	75555555-5555-5555-5555-555555555555	email	Sent demo video	Shared marketing automation platform demo video	22222222-2222-2222-2222-222222222222	2026-02-09 13:54:13.659938+05:30
ba777777-7777-7777-7777-777777777777	76666666-6666-6666-6666-666666666666	meeting	On-site visit	Visited construction site to understand project management needs	11111111-1111-1111-1111-111111111111	2026-02-09 13:54:13.659938+05:30
ba888888-8888-8888-8888-888888888888	78888888-8888-8888-8888-888888888888	demo	Product demonstration	Live demo of CRM system features and customization options	22222222-2222-2222-2222-222222222222	2026-02-09 13:54:13.659938+05:30
ba999999-9999-9999-9999-999999999999	79999999-9999-9999-9999-999999999999	note	Lead converted to deal	Successfully converted lead to deal D4444444	11111111-1111-1111-1111-111111111111	2026-02-09 13:54:13.659938+05:30
baa11111-1111-1111-1111-111111111111	7a111111-1111-1111-1111-111111111111	note	Lead marked as lost	Customer chose competitor due to pricing	33333333-3333-3333-3333-333333333333	2026-02-09 13:54:13.659938+05:30
b32f6b34-a372-489c-958a-01b765df3fc2	76666666-6666-6666-6666-666666666666	meeting	test1		2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	2026-02-09 16:32:44.39434+05:30
99d8352f-04f6-4f83-ab02-a2a28d5436d6	78888888-8888-8888-8888-888888888888	converted	Lead converted to sale	Sale amount: 250000.0	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	2026-02-09 16:36:10.392439+05:30
48dde659-8e49-40b4-a2a0-641ebebe8a07	77777777-7777-7777-7777-777777777777	email	Email to user 	Done	2625f4f9-3c07-4ccf-a5b8-d199950d7c2e	2026-02-12 20:20:20.878244+05:30
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leads (id, company_name, contact_person, email, phone, source, stage, priority, estimated_value, product_interest, assigned_to, partner_id, notes, expected_close_date, lost_reason, won_sale_id, next_follow_up, first_name, last_name, mobile, mobile_alternate, phone_alternate, campaign_source, website, account_type, lead_category, product_list, type_of_order, billing_delivery_date, order_product_details, payment, po_number_or_mail_confirmation, brand, orc_amount, product_warranty, ship_by, special_instruction, third_party_delivery_address, billing_company, enter_product_details, rental_duration, product_configuration, bandwidth_required, product_name_and_part_number, specifications, form_name, billing_street, billing_city, billing_state, billing_country, billing_zip_code, description, lead_time, product_name, receiver_mobile_number, subject, sender_landline_no, sender_landline_no_alt, call_duration, lead_type, query_id, mcat_name, tag, designation, location, requirement, quoted_requirement, lead_image, created_at, updated_at) FROM stdin;
9e1e68e9-ed87-4437-836a-0f683e25c00c	Steel Works Inc 1	Amit Sharma	amit@steelworksinc1.com	+91 8051641217	Cold Call	Cold	Low	36349.00	\N	5b5738bf-2222-4ca7-90bc-bd05b58cded4	\N	Interested in Annual Maintenance Contract. Decision pending	2026-03-18	\N	\N	\N	Amit	Sharma	+91 8573098218	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Annual Maintenance Contract	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
4069719e-0164-4ef6-a1f4-a4839d971c24	Assembly Line Systems 2	Neha Pillai	neha@assemblylinesys.com	+91 9588921568	Partner	Closed Lost	Medium	413315.00	\N	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	93199341-d622-4a36-9aaf-4d6131c10c6d	Interested in HP OfficeJet Pro 9015. Budget approved	2026-03-17	\N	\N	\N	Neha	Pillai	+91 7008454566	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP OfficeJet Pro 9015	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
ad27679b-6bff-4e07-b4e6-11968ffd39bb	Investment Partners 3	Pooja Mehta	pooja@investmentpartn.com	+91 7269724347	Cold Call	Cold	High	48835.00	\N	5b5738bf-2222-4ca7-90bc-bd05b58cded4	\N	Interested in Network Print Server. Decision pending	2026-04-05	\N	\N	\N	Pooja	Mehta	+91 9001814063	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Network Print Server	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
84935780-b69a-402b-9ab4-3d006880d097	Medical Equipment Corp 4	Arjun Pillai	arjun@medicalequipmen.com	+91 7404221641	Cold Call	Closed Lost	Medium	89167.00	\N	6190aefe-9845-4000-ab34-5423f0982d38	\N	Interested in HP OfficeJet Pro 9015. Needs follow-up	2026-05-09	\N	\N	\N	Arjun	Pillai	+91 7560189116	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP OfficeJet Pro 9015	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
99626269-5f43-4da1-b2fe-2834037a1ead	CyberSafe Solutions 5	Anjali Shah	anjali@cybersafesoluti.com	+91 8215463795	Partner	Cold	Low	232827.00	\N	6190aefe-9845-4000-ab34-5423f0982d38	\N	Interested in Brother HL-L2321D. Decision pending	2026-05-20	\N	\N	\N	Anjali	Shah	+91 8416117443	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Brother HL-L2321D	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
5350c2b2-634e-4f7e-9336-0983dfaa24f0	Investment Partners 6	Rajesh Rao	rajesh@investmentpartn.com	+91 7634624600	Cold Call	Proposal	Medium	375881.00	\N	43935cf9-b3be-4493-8927-06a5a6c04275	\N	Interested in Canon Toner 046 (Cyan). Decision pending	2026-04-29	\N	\N	\N	Rajesh	Rao	+91 7779922925	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Canon Toner 046 (Cyan)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
1ffad7ef-9727-443e-82c1-1b512e9b5549	Assembly Line Systems 7	Rajesh Mehta	rajesh@assemblylinesys.com	+91 9056465382	Cold Call	Closed Won	Low	144537.00	\N	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	d43ca79b-07de-4ceb-8e3e-6898c30c85dd	Interested in HP OfficeJet Pro 9015. Hot lead	2026-04-01	\N	\N	\N	Rajesh	Mehta	+91 8464421484	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP OfficeJet Pro 9015	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
a1863c14-da6b-4501-a815-47920611b775	Investment Partners 8	Kavya Menon	kavya@investmentpartn.com	+91 7048038729	Trade Show	Closed Lost	High	320364.00	\N	35417c40-2a83-4e3d-bca2-447f4304f7b3	\N	Interested in Printer Maintenance Kit. Hot lead	2026-04-28	\N	\N	\N	Kavya	Menon	+91 9516682693	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Printer Maintenance Kit	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
828de837-cdda-47f9-8eb6-851809d2a14f	Shopping Systems 9	Sanjay Patel	sanjay@shoppingsystems.com	+91 9880070497	Referral	Negotiation	Low	285530.00	\N	d8699681-b89d-4914-a9e1-4cb5f15feeb2	6093f9de-4eb0-4041-ae04-a4797c471ba9	Interested in Epson Ink Bottle T664 (Black). Needs follow-up	2026-04-02	\N	\N	\N	Sanjay	Patel	+91 8092394260	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Epson Ink Bottle T664 (Black)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
1ebc904f-8bf9-4b52-a1d4-56b0ad1a8a40	MediCare Solutions 10	Amit Nair	amit@medicaresolutio.com	+91 7042457714	Trade Show	Proposal	Medium	322814.00	\N	11f1c307-f3cc-4904-90cb-b97f89fc9d43	93199341-d622-4a36-9aaf-4d6131c10c6d	Interested in HP OfficeJet Pro 9015. Needs follow-up	2026-04-10	\N	\N	\N	Amit	Nair	+91 7815057100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP OfficeJet Pro 9015	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
1b989478-3df4-401e-958a-def6fc1fbbd5	EduTech Solutions 11	Rahul Gupta	rahul@edutechsolution.com	+91 7622779024	Cold Call	Closed Won	Urgent	134676.00	\N	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	d43ca79b-07de-4ceb-8e3e-6898c30c85dd	Interested in Canon Toner 046 (Cyan). Decision pending	2026-04-19	\N	\N	\N	Rahul	Gupta	+91 8696994790	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Canon Toner 046 (Cyan)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
2a497f79-36f2-4217-baa4-431a531198b9	Medical Equipment Corp 12	Divya Rao	divya@medicalequipmen.com	+91 9165393356	Cold Call	Closed Won	High	293009.00	\N	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	\N	Interested in Canon imageCLASS MF445dw. Decision pending	2026-04-14	\N	\N	\N	Divya	Rao	+91 9868358385	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Canon imageCLASS MF445dw	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
944fb001-6f87-4530-a607-ebe7372b7776	Training Solutions Inc 13	Rahul Sharma	rahul@trainingsolutio.com	+91 7274297916	LinkedIn	Closed Lost	Low	165229.00	\N	35417c40-2a83-4e3d-bca2-447f4304f7b3	\N	Interested in HP LaserJet Pro M404dn. Hot lead	2026-03-04	\N	\N	\N	Rahul	Sharma	+91 8350110635	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP LaserJet Pro M404dn	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
b5907742-8dcc-4557-a9ac-830ae06c5dfa	Digital Innovations Inc 14	Vikram Rao	vikram@digitalinnovati.com	+91 9644394100	LinkedIn	Closed Won	Urgent	340494.00	\N	512f9954-6c97-4118-b7fe-890710702f92	\N	Interested in Network Print Server. Hot lead	2026-04-02	\N	\N	\N	Vikram	Rao	+91 8517898927	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Network Print Server	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
1b587691-5c4a-4191-8ebd-badde7d73498	Capital Advisors 15	Arjun Kumar	arjun@capitaladvisors.com	+91 8390893691	Website	Negotiation	Urgent	301426.00	\N	5b5738bf-2222-4ca7-90bc-bd05b58cded4	\N	Interested in Epson EcoTank L3250. Budget approved	2026-05-10	\N	\N	\N	Arjun	Kumar	+91 8744280386	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Epson EcoTank L3250	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
908b4199-d438-498c-bc68-888aa04cbbb9	Academic Software 16	Priya Nair	priya@academicsoftwar.com	+91 7118741272	Trade Show	Proposal	High	241454.00	\N	5b5738bf-2222-4ca7-90bc-bd05b58cded4	\N	Interested in Xerox VersaLink C405. Hot lead	2026-02-27	\N	\N	\N	Priya	Nair	+91 7565179644	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Xerox VersaLink C405	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
191a251c-362c-4f38-8fc7-c05ffb2cc1f8	CloudTech Systems 17	Neha Kumar	neha@cloudtechsystem.com	+91 9625642817	Email Campaign	Closed Won	Low	334993.00	\N	35417c40-2a83-4e3d-bca2-447f4304f7b3	\N	Interested in Canon imageCLASS MF445dw. Decision pending	2026-04-20	\N	\N	\N	Neha	Kumar	+91 9690856484	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Canon imageCLASS MF445dw	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
0de44766-bcb9-41dc-bd6a-6d6e9075a158	E-Commerce Dynamics 18	Neha Pillai	neha@e-commercedynam.com	+91 8149263772	Website	Closed Won	Medium	314234.00	\N	6190aefe-9845-4000-ab34-5423f0982d38	\N	Interested in HP OfficeJet Pro 9015. Needs follow-up	2026-04-24	\N	\N	\N	Neha	Pillai	+91 8787946405	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP OfficeJet Pro 9015	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
eaba9074-c6d5-4c7d-8067-192de92568d7	Financial Services Corp 19	Rahul Singh	rahul@financialservic.com	+91 7514797527	Partner	Closed Won	Medium	221580.00	\N	f9701eca-09f1-48b3-95b8-9d61684cac10	\N	Interested in HP LaserJet Pro M404dn. Needs follow-up	2026-03-30	\N	\N	\N	Rahul	Singh	+91 9321966470	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP LaserJet Pro M404dn	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
3e55bb85-b25d-4421-8ff8-d0c72689f2a1	Retail Tech Inc 20	Isha Singh	isha@retailtechinc20.com	+91 8712042966	Trade Show	Closed Won	Medium	486989.00	\N	6fe86a87-d903-4f41-93fc-e63196c3af1a	\N	Interested in Epson Ink Bottle T664 (Black). Needs follow-up	2026-03-04	\N	\N	\N	Isha	Singh	+91 8783281872	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Epson Ink Bottle T664 (Black)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
970a2bcc-d3ba-40a0-a7c4-e664d8373c34	TechCorp Solutions 21	Rohan Singh	rohan@techcorpsolutio.com	+91 7020977649	Email Campaign	Closed Lost	Urgent	225651.00	\N	f9701eca-09f1-48b3-95b8-9d61684cac10	\N	Interested in Brother HL-L2321D. Needs follow-up	2026-05-17	\N	\N	\N	Rohan	Singh	+91 9231598083	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Brother HL-L2321D	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
396623a4-98d7-4b61-a006-ad16b6f7b5f6	Academic Software 22	Priya Sharma	priya@academicsoftwar.com	+91 9423281063	LinkedIn	Closed Won	Medium	262425.00	\N	1b45ba6b-98f7-407b-826c-5ce61d112a0f	\N	Interested in Xerox VersaLink C405. Needs follow-up	2026-04-09	\N	\N	\N	Priya	Sharma	+91 9630445838	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Xerox VersaLink C405	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
29b05322-2bb9-4d58-a6f4-2339095c492f	CloudTech Systems 23	Rajesh Sharma	rajesh@cloudtechsystem.com	+91 8269388688	Trade Show	Proposal	Low	426757.00	\N	d8699681-b89d-4914-a9e1-4cb5f15feeb2	73af2a5f-9221-4551-8223-9fc0bde88af8	Interested in Canon Toner 046 (Cyan). Hot lead	2026-05-03	\N	\N	\N	Rajesh	Sharma	+91 9131828744	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Canon Toner 046 (Cyan)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
de50c11d-091b-4111-8e86-882bae9fb290	HealthFirst Systems 24	Anjali Iyer	anjali@healthfirstsyst.com	+91 9672478357	Email Campaign	Cold	High	14953.00	\N	20a1bad5-7a19-47b2-afeb-55d630ee5f13	\N	Interested in HP OfficeJet Pro 9015. Budget approved	2026-05-01	\N	\N	\N	Anjali	Iyer	+91 8102663343	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP OfficeJet Pro 9015	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
b3f8ecb0-e2ae-4470-a278-f7c41e26f436	DataFlow Technologies 25	Isha Mehta	isha@dataflowtechnol.com	+91 7513456587	Referral	Cold	Medium	83380.00	\N	6fe86a87-d903-4f41-93fc-e63196c3af1a	\N	Interested in Xerox VersaLink C405. Budget approved	2026-04-10	\N	\N	\N	Isha	Mehta	+91 7244925819	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Xerox VersaLink C405	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
609b4ba5-ad97-4307-9077-1210ed9a7690	Shopping Systems 26	Pooja Shah	pooja@shoppingsystems.com	+91 8541224924	LinkedIn	Closed Won	High	72070.00	\N	512f9954-6c97-4118-b7fe-890710702f92	\N	Interested in HP LaserJet Pro M404dn. Decision pending	2026-04-12	\N	\N	\N	Pooja	Shah	+91 7472859065	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP LaserJet Pro M404dn	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
ee9273ed-0670-4a4d-b547-1a40d3e0cf54	Learning Management Systems 27	Vikram Desai	vikram@learningmanagem.com	+91 8870664376	Website	Negotiation	Medium	234777.00	\N	6190aefe-9845-4000-ab34-5423f0982d38	a28a5b90-ae38-4587-bdd8-b63e55454de5	Interested in HP OfficeJet Pro 9015. Needs follow-up	2026-03-02	\N	\N	\N	Vikram	Desai	+91 7063141280	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP OfficeJet Pro 9015	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
1262fe86-69e6-4ffa-8c22-9dfe83e867e4	Precision Manufacturing Ltd 28	Arjun Pillai	arjun@precisionmanufa.com	+91 9489839980	Website	Negotiation	Medium	274339.00	\N	6fe86a87-d903-4f41-93fc-e63196c3af1a	\N	Interested in A4 Copy Paper (500 Sheets). Hot lead	2026-03-05	\N	\N	\N	Arjun	Pillai	+91 9672023786	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	A4 Copy Paper (500 Sheets)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
b5f5c0dc-0f60-4124-97f1-830ef281080c	Capital Advisors 29	Vikram Shah	vikram@capitaladvisors.com	+91 8066248147	Referral	Closed Lost	Low	33396.00	\N	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	\N	Interested in Network Print Server. Hot lead	2026-04-04	\N	\N	\N	Vikram	Shah	+91 7812711548	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Network Print Server	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
01806a05-3adf-4b08-9f5c-f35ec4c8c774	E-Commerce Dynamics 30	Arjun Joshi	arjun@e-commercedynam.com	+91 9245245744	Trade Show	Proposal	High	167875.00	\N	d8699681-b89d-4914-a9e1-4cb5f15feeb2	\N	Interested in Annual Maintenance Contract. Decision pending	2026-03-23	\N	\N	\N	Arjun	Joshi	+91 7834257599	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Annual Maintenance Contract	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
8f5e0834-3854-46e7-a1f3-ac4456d52cfe	Financial Services Corp 31	Rahul Verma	rahul@financialservic.com	+91 7494852749	Partner	Closed Lost	High	149739.00	\N	f9701eca-09f1-48b3-95b8-9d61684cac10	\N	Interested in Epson Ink Bottle T664 (Black). Hot lead	2026-04-14	\N	\N	\N	Rahul	Verma	+91 9366090190	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Epson Ink Bottle T664 (Black)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
a490f391-0a0e-4fb0-8707-77594684f0dc	MediCare Solutions 32	Sneha Desai	sneha@medicaresolutio.com	+91 7892715469	LinkedIn	Cold	High	204652.00	\N	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	\N	Interested in HP Ink Cartridge 680 (Tri-color). Hot lead	2026-04-21	\N	\N	\N	Sneha	Desai	+91 8922673903	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP Ink Cartridge 680 (Tri-color)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
5dbea33c-6983-4719-a7c0-f55f6fd93abc	Capital Advisors 33	Divya Rao	divya@capitaladvisors.com	+91 8806068156	Partner	Cold	Medium	225828.00	\N	6fe86a87-d903-4f41-93fc-e63196c3af1a	d8ee5a99-f12a-4470-8211-8c55aee8090f	Interested in HP OfficeJet Pro 9015. Needs follow-up	2026-03-30	\N	\N	\N	Divya	Rao	+91 8872746598	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP OfficeJet Pro 9015	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
f299d57a-a754-4cb2-a7f8-a973f16474a7	Retail Tech Inc 34	Amit Singh	amit@retailtechinc34.com	+91 9948044396	LinkedIn	Negotiation	High	292485.00	\N	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	\N	Interested in Brother HL-L2321D. Budget approved	2026-03-22	\N	\N	\N	Amit	Singh	+91 7322099087	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Brother HL-L2321D	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
93203e95-ead1-4b3f-9738-08f86d9da6c1	EduTech Solutions 35	Anjali Joshi	anjali@edutechsolution.com	+91 7613027491	Referral	Closed Won	Low	300785.00	\N	6fe86a87-d903-4f41-93fc-e63196c3af1a	a28a5b90-ae38-4587-bdd8-b63e55454de5	Interested in HP OfficeJet Pro 9015. Needs follow-up	2026-03-01	\N	\N	\N	Anjali	Joshi	+91 7954369143	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP OfficeJet Pro 9015	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
3bfe1485-ca31-4a05-8cfd-6769df2cb89b	Education Innovations 36	Rajesh Menon	rajesh@educationinnova.com	+91 8963329135	Partner	Negotiation	Medium	66431.00	\N	512f9954-6c97-4118-b7fe-890710702f92	24ec9695-6282-4b99-80db-fd20becbf39d	Interested in HP OfficeJet Pro 9015. Decision pending	2026-03-13	\N	\N	\N	Rajesh	Menon	+91 8700168203	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP OfficeJet Pro 9015	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
5edf9181-568b-4e5b-93e8-16a981f37858	Financial Services Corp 37	Sneha Rao	sneha@financialservic.com	+91 9980845115	LinkedIn	Proposal	Urgent	445605.00	\N	35417c40-2a83-4e3d-bca2-447f4304f7b3	\N	Interested in Canon Toner 046 (Cyan). Hot lead	2026-05-10	\N	\N	\N	Sneha	Rao	+91 7031287409	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Canon Toner 046 (Cyan)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
804d5858-c76f-4cf8-b9f8-ba8832c10d83	Academic Software 38	Vikram Joshi	vikram@academicsoftwar.com	+91 8252567735	Referral	Closed Lost	Medium	483201.00	\N	d8699681-b89d-4914-a9e1-4cb5f15feeb2	\N	Interested in Annual Maintenance Contract. Decision pending	2026-05-10	\N	\N	\N	Vikram	Joshi	+91 9684742288	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Annual Maintenance Contract	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
18dec920-268e-452a-85e1-d5f34fe8482d	Steel Works Inc 39	Divya Reddy	divya@steelworksinc39.com	+91 9592752540	Email Campaign	Cold	Urgent	86613.00	\N	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	\N	Interested in Epson EcoTank L3250. Hot lead	2026-03-02	\N	\N	\N	Divya	Reddy	+91 9049760216	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Epson EcoTank L3250	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
b1aeb3d2-7557-4d9d-be31-3e020812dc61	MediCare Solutions 40	Karan Rao	karan@medicaresolutio.com	+91 8202396043	Website	Closed Won	Urgent	50718.00	\N	11f1c307-f3cc-4904-90cb-b97f89fc9d43	\N	Interested in Epson Ink Bottle T664 (Black). Decision pending	2026-03-03	\N	\N	\N	Karan	Rao	+91 7530893311	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Epson Ink Bottle T664 (Black)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
966e936f-c454-4b77-bd1b-fe123b81c4a0	DataFlow Technologies 41	Karan Kumar	karan@dataflowtechnol.com	+91 7598262213	Website	Negotiation	Urgent	460560.00	\N	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	\N	Interested in Annual Maintenance Contract. Decision pending	2026-03-23	\N	\N	\N	Karan	Kumar	+91 8372971507	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Annual Maintenance Contract	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
1e6b1f34-e308-48c7-bf12-6545f9aa1d38	Retail Tech Inc 42	Sneha Reddy	sneha@retailtechinc42.com	+91 7469740108	Email Campaign	Closed Won	Urgent	154384.00	\N	5b5738bf-2222-4ca7-90bc-bd05b58cded4	8135a9f2-bd4a-4290-8bef-738fd99a243e	Interested in Xerox VersaLink C405. Needs follow-up	2026-03-18	\N	\N	\N	Sneha	Reddy	+91 9185354127	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Xerox VersaLink C405	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
614eef91-e273-4a83-b9ca-b545fe251301	Medical Equipment Corp 43	Sneha Nair	sneha@medicalequipmen.com	+91 7017716432	LinkedIn	Proposal	High	58721.00	\N	6190aefe-9845-4000-ab34-5423f0982d38	\N	Interested in Annual Maintenance Contract. Hot lead	2026-03-21	\N	\N	\N	Sneha	Nair	+91 9235591546	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Annual Maintenance Contract	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
224bd719-63d6-42b9-8132-4cd39701c5f3	HealthFirst Systems 44	Rohan Joshi	rohan@healthfirstsyst.com	+91 8025088826	Cold Call	Closed Won	Medium	368479.00	\N	e03c5d7b-6be1-43da-a72b-c2f60ae9863f	\N	Interested in HP LaserJet Pro M404dn. Decision pending	2026-05-11	\N	\N	\N	Rohan	Joshi	+91 8885831122	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP LaserJet Pro M404dn	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
40f8d6e7-8b6b-4de5-accd-a9d8e05d77a1	Capital Advisors 45	Karan Verma	karan@capitaladvisors.com	+91 7363735727	Referral	Proposal	High	291454.00	\N	5b5738bf-2222-4ca7-90bc-bd05b58cded4	\N	Interested in HP OfficeJet Pro 9015. Hot lead	2026-03-05	\N	\N	\N	Karan	Verma	+91 7463512657	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP OfficeJet Pro 9015	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
193471f6-48ee-40f9-a228-b01b29fb549d	Retail Tech Inc 46	Kavya Gupta	kavya@retailtechinc46.com	+91 9434944768	Partner	Cold	Medium	55432.00	\N	11f1c307-f3cc-4904-90cb-b97f89fc9d43	\N	Interested in Network Print Server. Hot lead	2026-03-14	\N	\N	\N	Kavya	Gupta	+91 9830930763	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Network Print Server	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
b38dd475-fbe7-49ed-9c63-92c7b136dfe5	AutoParts Manufacturing 47	Rohan Pillai	rohan@autopartsmanufa.com	+91 9576249288	LinkedIn	Proposal	Low	81356.00	\N	512f9954-6c97-4118-b7fe-890710702f92	\N	Interested in Canon Toner 046 (Cyan). Needs follow-up	2026-04-23	\N	\N	\N	Rohan	Pillai	+91 9562176090	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Canon Toner 046 (Cyan)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
db1dd5ca-4e75-4893-b6a7-e230126d2c52	Retail Tech Inc 48	Sneha Gupta	sneha@retailtechinc48.com	+91 7530412147	Trade Show	Closed Won	Low	408717.00	\N	512f9954-6c97-4118-b7fe-890710702f92	\N	Interested in Printer Maintenance Kit. Hot lead	2026-03-27	\N	\N	\N	Sneha	Gupta	+91 9941899414	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Printer Maintenance Kit	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d9262974-aaba-42dc-8256-eee27d9bb800	Retail Tech Inc 49	Arjun Menon	arjun@retailtechinc49.com	+91 7341979536	Cold Call	Cold	Medium	331792.00	\N	f9701eca-09f1-48b3-95b8-9d61684cac10	\N	Interested in Brother HL-L2321D. Budget approved	2026-04-03	\N	\N	\N	Arjun	Menon	+91 7280491649	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Brother HL-L2321D	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
77bf8ef8-8a20-473e-8f00-291f1a7c758a	Education Innovations 50	Neha Shah	neha@educationinnova.com	+91 9606347439	Website	Closed Lost	Low	476386.00	\N	21173b45-5320-4943-ba5a-be5a3d586cb1	\N	Interested in Printer Maintenance Kit. Hot lead	2026-04-27	\N	\N	\N	Neha	Shah	+91 8512893147	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Printer Maintenance Kit	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
1d7f8b18-946f-445f-8c59-781c1a7f738a	Assembly Line Systems 51	Karan Gupta	karan@assemblylinesys.com	+91 8840744755	Email Campaign	Closed Won	Urgent	388744.00	\N	11f1c307-f3cc-4904-90cb-b97f89fc9d43	f33ac0c3-3d1d-4117-9e0b-df5515a83727	Interested in HP LaserJet Pro M404dn. Needs follow-up	2026-04-10	\N	\N	\N	Karan	Gupta	+91 7678552910	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP LaserJet Pro M404dn	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
9e6bc6b3-d0cc-45ac-92f3-ac0152679b75	Digital Innovations Inc 52	Pooja Singh	pooja@digitalinnovati.com	+91 9343778397	Email Campaign	Proposal	Medium	178894.00	\N	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	5aaa5db7-6043-4cd7-ad7c-e56569b45886	Interested in HP LaserJet Pro M404dn. Hot lead	2026-05-17	\N	\N	\N	Pooja	Singh	+91 8976448116	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP LaserJet Pro M404dn	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d380a6d6-0c7a-42a6-bdab-97261ef96e9d	Academic Software 53	Priya Nair	priya@academicsoftwar.com	+91 7161959410	Trade Show	Cold	Medium	304518.00	\N	1d3255e6-5d5b-4f5b-b3d6-73f01eebf427	\N	Interested in Epson EcoTank L3250. Hot lead	2026-03-15	\N	\N	\N	Priya	Nair	+91 8928944022	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Epson EcoTank L3250	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
6fc1fdb2-1c44-4933-9155-486543eadb5f	E-Commerce Dynamics 54	Kavya Desai	kavya@e-commercedynam.com	+91 9310669072	LinkedIn	Closed Lost	Medium	419682.00	\N	1b45ba6b-98f7-407b-826c-5ce61d112a0f	\N	Interested in HP Ink Cartridge 680 (Tri-color). Decision pending	2026-03-24	\N	\N	\N	Kavya	Desai	+91 9240491275	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP Ink Cartridge 680 (Tri-color)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
c25a80ca-aad2-4381-9044-e4438b35d8d5	TechCorp Solutions 55	Sneha Verma	sneha@techcorpsolutio.com	+91 8623960300	Email Campaign	Negotiation	Medium	245047.00	\N	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	d8ee5a99-f12a-4470-8211-8c55aee8090f	Interested in Network Print Server. Hot lead	2026-04-09	\N	\N	\N	Sneha	Verma	+91 7766851131	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Network Print Server	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
2229a47c-a4a3-438d-84c1-be40fb1f751f	HealthFirst Systems 56	Amit Desai	amit@healthfirstsyst.com	+91 7300516098	Website	Closed Lost	Low	328396.00	\N	11f1c307-f3cc-4904-90cb-b97f89fc9d43	\N	Interested in On-site Installation Service. Decision pending	2026-04-24	\N	\N	\N	Amit	Desai	+91 8931519657	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	On-site Installation Service	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
2beb1ebc-5734-4829-82b8-452bf601bdff	EduTech Solutions 57	Arjun Verma	arjun@edutechsolution.com	+91 9279641618	Email Campaign	Closed Won	Low	76068.00	\N	14a3756a-5a80-460a-90b2-96f572cffd76	\N	Interested in Xerox VersaLink C405. Decision pending	2026-04-02	\N	\N	\N	Arjun	Verma	+91 8561671061	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Xerox VersaLink C405	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
7a189e92-a65c-46aa-b422-4f8591a1a95c	Academic Software 58	Sneha Patel	sneha@academicsoftwar.com	+91 9641984772	Cold Call	Closed Won	High	451800.00	\N	14a3756a-5a80-460a-90b2-96f572cffd76	\N	Interested in HP OfficeJet Pro 9015. Needs follow-up	2026-05-15	\N	\N	\N	Sneha	Patel	+91 9422571113	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP OfficeJet Pro 9015	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
216c5429-c5d8-4ba7-9179-5d609ce685ab	HealthFirst Systems 59	Rohan Gupta	rohan@healthfirstsyst.com	+91 9448887332	LinkedIn	Negotiation	High	491273.00	\N	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	\N	Interested in Printer Maintenance Kit. Needs follow-up	2026-03-13	\N	\N	\N	Rohan	Gupta	+91 7988315293	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Printer Maintenance Kit	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
2050383f-6bba-4a2b-94a9-165f75475314	Digital Innovations Inc 60	Divya Singh	divya@digitalinnovati.com	+91 7374622926	Trade Show	Proposal	Medium	162195.00	\N	1b45ba6b-98f7-407b-826c-5ce61d112a0f	d59f4209-9ed3-4bed-8231-f974138b2e65	Interested in HP OfficeJet Pro 9015. Decision pending	2026-03-05	\N	\N	\N	Divya	Singh	+91 8993987367	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP OfficeJet Pro 9015	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
f3827607-a5fc-40ad-9a4c-8b482225ac6a	Industrial Solutions Corp 61	Kavya Pillai	kavya@industrialsolut.com	+91 9247829100	Referral	Closed Lost	Low	304288.00	\N	6fe86a87-d903-4f41-93fc-e63196c3af1a	01adcd72-9019-473b-aad3-10837f6a002a	Interested in Canon Toner 046 (Cyan). Budget approved	2026-03-14	\N	\N	\N	Kavya	Pillai	+91 8567658476	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Canon Toner 046 (Cyan)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
87996160-2789-41f7-af3c-221eac41c354	Consumer Goods Corp 62	Sanjay Menon	sanjay@consumergoodsco.com	+91 7345466643	Website	Closed Lost	High	58618.00	\N	1b45ba6b-98f7-407b-826c-5ce61d112a0f	\N	Interested in HP Toner CF410A (Black). Budget approved	2026-05-01	\N	\N	\N	Sanjay	Menon	+91 8688278590	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP Toner CF410A (Black)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e1eb6604-14dc-476d-9142-b344b4083400	TechCorp Solutions 63	Rajesh Reddy	rajesh@techcorpsolutio.com	+91 8268234177	Email Campaign	Cold	Low	253363.00	\N	20a1bad5-7a19-47b2-afeb-55d630ee5f13	\N	Interested in On-site Installation Service. Budget approved	2026-04-29	\N	\N	\N	Rajesh	Reddy	+91 7937823597	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	On-site Installation Service	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
cbc0d378-88f5-4a78-b585-ee9312044b3b	Shopping Systems 64	Rajesh Joshi	rajesh@shoppingsystems.com	+91 7206199531	Email Campaign	Closed Lost	High	222791.00	\N	09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	\N	Interested in Epson EcoTank L3250. Decision pending	2026-03-14	\N	\N	\N	Rajesh	Joshi	+91 7522224798	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Epson EcoTank L3250	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
0a1da3cf-0d97-4f24-8ae3-541a080b9fdf	Financial Services Corp 65	Priya Menon	priya@financialservic.com	+91 9128466482	Trade Show	Closed Lost	Urgent	121395.00	\N	6fe86a87-d903-4f41-93fc-e63196c3af1a	24f066f8-baaf-4b93-a030-66950ae1aa53	Interested in Brother HL-L2321D. Budget approved	2026-05-05	\N	\N	\N	Priya	Menon	+91 9121260026	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Brother HL-L2321D	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
43edea9d-35ec-43fb-a22a-fa07fc32f2c1	FinTech Solutions 66	Sneha Rao	sneha@fintechsolution.com	+91 9133683119	Trade Show	Cold	Low	413111.00	\N	f9701eca-09f1-48b3-95b8-9d61684cac10	\N	Interested in Epson EcoTank L3250. Hot lead	2026-04-20	\N	\N	\N	Sneha	Rao	+91 8322932659	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Epson EcoTank L3250	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
044e92a7-fae6-427a-a8f0-d77c66df177e	DataFlow Technologies 67	Rahul Desai	rahul@dataflowtechnol.com	+91 7637568882	Referral	Proposal	Urgent	270858.00	\N	11f1c307-f3cc-4904-90cb-b97f89fc9d43	d0ba6c45-3eb6-4408-9a52-00c1c0c8dff8	Interested in HP Toner CF410A (Black). Budget approved	2026-04-27	\N	\N	\N	Rahul	Desai	+91 7453042196	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP Toner CF410A (Black)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
fad0fe20-2614-41c3-9908-bf9ab17a1a17	Banking Systems Inc 68	Sanjay Singh	sanjay@bankingsystemsi.com	+91 7741499126	Trade Show	Cold	Low	268847.00	\N	43935cf9-b3be-4493-8927-06a5a6c04275	\N	Interested in Canon Toner 046 (Cyan). Decision pending	2026-04-30	\N	\N	\N	Sanjay	Singh	+91 8352773669	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Canon Toner 046 (Cyan)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
3e4e89e7-bccd-4472-9cd9-7816ca39c3f7	Industrial Solutions Corp 69	Rohan Sharma	rohan@industrialsolut.com	+91 9576354473	LinkedIn	Proposal	Medium	240021.00	\N	6fe86a87-d903-4f41-93fc-e63196c3af1a	\N	Interested in HP Ink Cartridge 680 (Tri-color). Hot lead	2026-04-29	\N	\N	\N	Rohan	Sharma	+91 7639160171	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP Ink Cartridge 680 (Tri-color)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
5cc7c2b5-492d-4782-8632-4ce0c103bd0f	Training Solutions Inc 70	Sneha Reddy	sneha@trainingsolutio.com	+91 9244249444	Partner	Proposal	Low	44015.00	\N	6fe86a87-d903-4f41-93fc-e63196c3af1a	6093f9de-4eb0-4041-ae04-a4797c471ba9	Interested in Canon imageCLASS MF445dw. Needs follow-up	2026-04-26	\N	\N	\N	Sneha	Reddy	+91 9007187347	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Canon imageCLASS MF445dw	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
52810b8f-0489-471f-80da-e0f199f8f627	Steel Works Inc 71	Vikram Pillai	vikram@steelworksinc71.com	+91 9113998825	Trade Show	Cold	Medium	300548.00	\N	f9701eca-09f1-48b3-95b8-9d61684cac10	\N	Interested in HP LaserJet Pro M404dn. Needs follow-up	2026-04-30	\N	\N	\N	Vikram	Pillai	+91 8675148958	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP LaserJet Pro M404dn	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
dd5653e8-2b96-41f3-9288-73feb9333914	Pharma Dynamics 72	Rahul Mehta	rahul@pharmadynamics7.com	+91 7072059237	Website	Negotiation	Low	283001.00	\N	5b5738bf-2222-4ca7-90bc-bd05b58cded4	\N	Interested in Xerox VersaLink C405. Budget approved	2026-04-03	\N	\N	\N	Rahul	Mehta	+91 8395146618	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Xerox VersaLink C405	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
3645038e-49c2-4b47-91b8-fc2afda3aeff	Academic Software 73	Divya Menon	divya@academicsoftwar.com	+91 7645012532	Partner	Closed Lost	Low	222172.00	\N	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	73af2a5f-9221-4551-8223-9fc0bde88af8	Interested in HP Ink Cartridge 680 (Tri-color). Hot lead	2026-05-21	\N	\N	\N	Divya	Menon	+91 9510118786	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP Ink Cartridge 680 (Tri-color)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
7d5b2413-91e3-466f-a9a5-30e995a5c3df	Precision Manufacturing Ltd 74	Rajesh Iyer	rajesh@precisionmanufa.com	+91 9324623185	Cold Call	Cold	Medium	357765.00	\N	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	\N	Interested in Annual Maintenance Contract. Needs follow-up	2026-03-06	\N	\N	\N	Rajesh	Iyer	+91 9088796788	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Annual Maintenance Contract	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
966cfb09-a769-4c9e-becb-c2c988877b0d	Precision Manufacturing Ltd 75	Divya Kumar	divya@precisionmanufa.com	+91 9638624547	Partner	Closed Won	High	495690.00	\N	5b5738bf-2222-4ca7-90bc-bd05b58cded4	\N	Interested in A4 Copy Paper (500 Sheets). Needs follow-up	2026-03-03	\N	\N	\N	Divya	Kumar	+91 9719140529	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	A4 Copy Paper (500 Sheets)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
b144a3e2-6c27-4745-ac15-f80a7996c29a	Medical Equipment Corp 76	Neha Iyer	neha@medicalequipmen.com	+91 9057942752	Referral	Proposal	High	317972.00	\N	6fe86a87-d903-4f41-93fc-e63196c3af1a	24ec9695-6282-4b99-80db-fd20becbf39d	Interested in Canon imageCLASS MF445dw. Budget approved	2026-02-28	\N	\N	\N	Neha	Iyer	+91 9287682632	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Canon imageCLASS MF445dw	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
918fee94-05af-4780-bc00-6fa82d16ef21	AI Dynamics 77	Amit Nair	amit@aidynamics77.com	+91 9231486127	Trade Show	Closed Lost	Urgent	79538.00	\N	43935cf9-b3be-4493-8927-06a5a6c04275	f33ac0c3-3d1d-4117-9e0b-df5515a83727	Interested in Canon Toner 046 (Cyan). Decision pending	2026-02-28	\N	\N	\N	Amit	Nair	+91 7119378843	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Canon Toner 046 (Cyan)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
ff14b351-0531-4308-823e-4e0880fcea1b	Retail Chain Solutions 78	Pooja Menon	pooja@retailchainsolu.com	+91 7066629746	LinkedIn	Closed Lost	Low	448078.00	\N	09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	93199341-d622-4a36-9aaf-4d6131c10c6d	Interested in Canon Toner 046 (Cyan). Decision pending	2026-04-21	\N	\N	\N	Pooja	Menon	+91 9001842607	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Canon Toner 046 (Cyan)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
76ad4943-6553-43d3-88dc-10d7bd717bd3	Shopping Systems 79	Rajesh Singh	rajesh@shoppingsystems.com	+91 7094184265	LinkedIn	Closed Lost	Medium	44224.00	\N	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	\N	Interested in HP Toner CF410A (Black). Budget approved	2026-05-08	\N	\N	\N	Rajesh	Singh	+91 7213145203	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP Toner CF410A (Black)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
62c692f0-7f7d-4a0f-bb21-cfa36d35a134	AutoParts Manufacturing 80	Anjali Desai	anjali@autopartsmanufa.com	+91 8492787129	Trade Show	Closed Lost	Low	315863.00	\N	20a1bad5-7a19-47b2-afeb-55d630ee5f13	\N	Interested in HP LaserJet Pro M404dn. Hot lead	2026-05-11	\N	\N	\N	Anjali	Desai	+91 7041245325	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	HP LaserJet Pro M404dn	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
dde540ef-83d0-4c49-9ce1-1afb83f2a434	Test Company ABC	John Doe	john@test.com	\N	\N	New	High	50000.00	\N	43935cf9-b3be-4493-8927-06a5a6c04275	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 16:28:49.517897	2026-02-20 16:28:49.517897
\.


--
-- Data for Name: master_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.master_categories (id, name, is_active, created_at) FROM stdin;
c632557d-c56a-47df-9d3b-6faa3246c9d2	Laptops	t	2026-02-20 12:21:47.778155+05:30
4b8e7841-3d20-431c-a0a4-ac26e2dad46d	Desktops	t	2026-02-20 12:21:47.778155+05:30
b7fd14f3-ef30-432f-8db4-649c93b4f3a2	Servers	t	2026-02-20 12:21:47.778155+05:30
c4155df7-7bdd-4b3a-ad4c-90e4dd33e4c4	Storage	t	2026-02-20 12:21:47.778155+05:30
f007a330-15a0-45f2-9d4e-925ba83bc3f9	Networking	t	2026-02-20 12:21:47.778155+05:30
671845b9-00c2-4aac-bf0a-c013f6a21696	Printers	t	2026-02-20 12:21:47.778155+05:30
6a58f70f-50c5-4b96-8bbb-15dd1af3ff58	Monitors	t	2026-02-20 12:21:47.778155+05:30
45c438aa-d206-4ea3-9542-9dad44111187	Accessories	t	2026-02-20 12:21:47.778155+05:30
be1e9b7c-3456-40e6-b21d-513f1cb40d7f	Software	t	2026-02-20 12:21:47.778155+05:30
279f5515-0e4e-4b31-b9dd-f607ec508613	Services	t	2026-02-20 12:21:47.778155+05:30
\.


--
-- Data for Name: master_dropdowns; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.master_dropdowns (id, entity, value, label, sort_order, is_active, metadata, created_at) FROM stdin;
b649680e-9757-4afa-b33e-5c1d53eadc48	deal-types	New Business	New Business	1	t	{}	2026-02-14 18:02:30.464202+05:30
da7fa4f8-7f1e-4c6a-ad7c-6135042cc07e	deal-types	Existing Business	Existing Business	2	t	{}	2026-02-14 18:02:30.464202+05:30
1bd17b09-5177-4d3d-803d-2af220e52eb1	deal-types	Renewal	Renewal	3	t	{}	2026-02-14 18:02:30.464202+05:30
7a075243-85a7-4280-a2d0-347e613a5d71	deal-types	Upsell	Upsell	4	t	{}	2026-02-14 18:02:30.464202+05:30
0df1f6b8-816c-4208-a299-cb0d0ae4673a	lead-sources	Website	Website	1	t	{}	2026-02-14 18:02:30.464202+05:30
f1641313-0a87-4aae-aa91-3eaa6288ba64	lead-sources	Referral	Referral	2	t	{}	2026-02-14 18:02:30.464202+05:30
7a5d531b-eeed-4f07-858a-a48384ad08df	lead-sources	Cold Call	Cold Call	3	t	{}	2026-02-14 18:02:30.464202+05:30
58633be4-98d0-4acf-89cb-68f4b6f6c995	lead-sources	Event	Event	4	t	{}	2026-02-14 18:02:30.464202+05:30
8c2c1f77-924b-4c8e-b001-ad8327b3031d	lead-sources	Partner	Partner	5	t	{}	2026-02-14 18:02:30.464202+05:30
65aad15c-0f81-41f2-b3c5-d30fd0c61493	lead-sources	Other	Other	6	t	{}	2026-02-14 18:02:30.464202+05:30
118658da-688b-4023-a247-43e6387b0b5a	forecast-options	Pipeline	Pipeline	1	t	{}	2026-02-14 18:02:30.464202+05:30
420ef0ff-aa46-4d2a-ba1e-f32aa91684e2	forecast-options	Best Case	Best Case	2	t	{}	2026-02-14 18:02:30.464202+05:30
6ed3af30-06a4-40fd-9d45-a4b01b89df95	forecast-options	Commit	Commit	3	t	{}	2026-02-14 18:02:30.464202+05:30
c56a8530-766c-4099-b262-22be961b6070	forecast-options	Omitted	Omitted	4	t	{}	2026-02-14 18:02:30.464202+05:30
fd959fc6-72e0-43fe-9ca8-fd91e42b6d7c	task-statuses	pending	Pending	1	t	{}	2026-02-14 18:02:30.464202+05:30
bc876311-9e25-41b0-a7e1-b82d0044b232	task-statuses	in_progress	In Progress	2	t	{}	2026-02-14 18:02:30.464202+05:30
ca184666-7340-4e0a-8fe1-cc35fee4d93f	task-statuses	completed	Completed	3	t	{}	2026-02-14 18:02:30.464202+05:30
bed2cf1b-1362-477f-930c-b73449db7e51	priorities	Low	Low	1	t	{}	2026-02-14 18:02:30.464202+05:30
ccab4d7f-79c7-4f6d-9e4e-194070074a0f	priorities	Medium	Medium	2	t	{}	2026-02-14 18:02:30.464202+05:30
fb7c8915-9d66-4a8d-ae7e-d53e60eb9385	priorities	High	High	3	t	{}	2026-02-14 18:02:30.464202+05:30
3276a847-06af-40d2-9019-dc40d9f56306	task-types	Call	Call	1	t	{}	2026-02-14 18:02:30.464202+05:30
5daff6c2-150c-4603-8917-7a114e990364	task-types	Email	Email	2	t	{}	2026-02-14 18:02:30.464202+05:30
d990fffa-7d3e-4c70-8a0f-33cd25f50021	task-types	Meeting	Meeting	3	t	{}	2026-02-14 18:02:30.464202+05:30
e3c2cba0-53cc-4291-9bbb-69bee9dff32e	task-types	Demo	Demo	4	t	{}	2026-02-14 18:02:30.464202+05:30
ea473168-26c2-4d09-a3f6-36fdf0082b37	event-types	Meeting	Meeting	1	t	{}	2026-02-14 18:02:30.464202+05:30
eb5738d8-d630-4f55-8e1f-44520911935b	event-types	Call	Call	2	t	{}	2026-02-14 18:02:30.464202+05:30
b0f13f81-6484-459d-94c0-69079973a78c	event-types	Demo	Demo	3	t	{}	2026-02-14 18:02:30.464202+05:30
8d20d607-ebad-4cbf-9214-c216e52ca593	event-types	Webinar	Webinar	4	t	{}	2026-02-14 18:02:30.464202+05:30
e83e715f-e74c-41d2-96f0-8b40da1687bb	event-types	Task	Task	5	t	{}	2026-02-14 18:02:30.464202+05:30
d735b9e5-85e2-48a9-aece-008bbcc39fd2	event-types	Reminder	Reminder	6	t	{}	2026-02-14 18:02:30.464202+05:30
dc25173b-0722-46c4-adec-c07772ce19b1	email-statuses	draft	Draft	1	t	{}	2026-02-14 18:02:30.464202+05:30
0e7d743e-af03-4a9a-b0fb-42d55fa48340	email-statuses	sent	Sent	2	t	{}	2026-02-14 18:02:30.464202+05:30
03f0531c-51f7-4945-a13b-a6664eeea967	email-statuses	scheduled	Scheduled	3	t	{}	2026-02-14 18:02:30.464202+05:30
15da986f-eb1d-4ba3-872e-7fa8326919c1	template-categories	Sales	Sales	1	t	{}	2026-02-14 18:02:30.464202+05:30
6fd7b555-75da-4e47-bc4c-1201cf7064c2	template-categories	Marketing	Marketing	2	t	{}	2026-02-14 18:02:30.464202+05:30
1a06d8d8-b4b7-4019-b257-8106a7f44eb8	template-categories	Support	Support	3	t	{}	2026-02-14 18:02:30.464202+05:30
25c2bac8-19fe-4ee4-a4ad-cc03b347e759	template-categories	Follow-up	Follow-up	4	t	{}	2026-02-14 18:02:30.464202+05:30
a7478949-1477-4695-9439-bfbeaefc46a0	contact-types	Customer	Customer	1	t	{}	2026-02-14 18:02:30.464202+05:30
07862d8c-01a9-4241-aaa6-2ddea31bb06e	contact-types	Prospect	Prospect	2	t	{}	2026-02-14 18:02:30.464202+05:30
eab70f95-6d17-4403-8530-576d0eb3d54a	contact-types	Partner	Partner	3	t	{}	2026-02-14 18:02:30.464202+05:30
a441fa9b-a93a-4896-bc6c-d23edc250342	contact-types	Vendor	Vendor	4	t	{}	2026-02-14 18:02:30.464202+05:30
50bb5469-d413-4f35-af5d-90ca6690cdb0	partner-tiers	elite	Elite	1	t	{}	2026-02-14 18:02:30.464202+05:30
d7fe96d3-4a9e-4f6a-bca5-84e4b38c08e9	partner-tiers	growth	Growth	2	t	{}	2026-02-14 18:02:30.464202+05:30
f1794fdc-e333-471d-a2c5-7c973c308827	partner-tiers	new	New	3	t	{}	2026-02-14 18:02:30.464202+05:30
bfbaa43a-ea26-42a8-9492-6095ce8f5f5d	partner-statuses	pending	Pending	1	t	{}	2026-02-14 18:02:30.464202+05:30
818e89fa-36f9-4406-a791-c50a89d0607c	partner-statuses	approved	Approved	2	t	{}	2026-02-14 18:02:30.464202+05:30
97a3be26-a48f-4634-b747-ae65a989e587	partner-statuses	rejected	Rejected	3	t	{}	2026-02-14 18:02:30.464202+05:30
8484ae4c-5378-4c21-86c8-ae587e41859f	deal-stages	New	New	1	t	{"is_pipeline": true}	2026-02-20 12:09:27.935212+05:30
f9cf0340-445f-4e2a-9d25-05fde274c1bb	deal-stages	Proposal	Proposal	2	t	{"is_pipeline": true}	2026-02-14 18:02:30.464202+05:30
9f2d021f-372f-427d-89e6-054c711559e8	deal-stages	Cold	Cold	3	t	{"is_pipeline": true}	2026-02-14 18:02:30.464202+05:30
0f46cb58-64cd-49ac-8385-b6f79407947b	deal-stages	Negotiation	Negotiation	4	t	{"is_pipeline": true}	2026-02-14 18:02:30.464202+05:30
98a791ec-0dbd-49c1-925f-e991e67d53ab	deal-stages	Closed Lost	Closed Lost	5	t	{"is_terminal": true}	2026-02-14 18:02:30.464202+05:30
0ad6c50d-0ad0-44a6-a286-30ffb8c98e78	deal-stages	Closed Won	Closed Won	6	t	{"is_terminal": true}	2026-02-14 18:02:30.464202+05:30
\.


--
-- Data for Name: master_locations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.master_locations (id, city, state, region, is_active, created_at) FROM stdin;
22592579-3482-4787-87b9-c0166683a3fc	Mumbai	Maharashtra	West	t	2026-02-20 12:21:46.610809+05:30
ae01383e-f07e-4f9a-9e92-85d7e17ba05c	Delhi	Delhi	North	t	2026-02-20 12:21:46.610809+05:30
84c4ea6d-c284-4447-a8be-4cb89d19f33b	Bangalore	Karnataka	South	t	2026-02-20 12:21:46.610809+05:30
55a169d8-bac1-4dbd-8541-0087a604ca06	Hyderabad	Telangana	South	t	2026-02-20 12:21:46.610809+05:30
31feb8b1-16c2-461d-8981-a4e82c964596	Chennai	Tamil Nadu	South	t	2026-02-20 12:21:46.610809+05:30
c0ac8a91-9aab-456b-ab29-0ddf49265fa5	Kolkata	West Bengal	East	t	2026-02-20 12:21:46.610809+05:30
4afd9840-9e84-4acf-b05b-2d275587669c	Pune	Maharashtra	West	t	2026-02-20 12:21:46.610809+05:30
ee8d1575-48ae-48c4-b5fa-37b8b87df3d3	Ahmedabad	Gujarat	West	t	2026-02-20 12:21:46.610809+05:30
a703430a-1658-4fc8-a5a1-647d4a8c7006	Jaipur	Rajasthan	North	t	2026-02-20 12:21:46.610809+05:30
e5b21359-819c-406e-be7b-9edaa9e1a91a	Lucknow	Uttar Pradesh	North	t	2026-02-20 12:21:46.610809+05:30
\.


--
-- Data for Name: master_oems; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.master_oems (id, name, oem_id, is_active, created_at, product_manager_id, product_manager_ids) FROM stdin;
dd031cad-5d78-4d78-a702-dea24ed2f766	HP	\N	t	2026-02-12 18:45:17.618812+05:30	\N	[]
c8cf1628-f976-468c-b258-d1e29195130b	Dell	\N	t	2026-02-12 18:45:28.019206+05:30	\N	[]
2fd7099b-2afd-4267-a7a6-da746a1ae5ab	Apple	\N	t	2026-02-12 18:45:33.793189+05:30	\N	[]
be8ac621-b40f-416a-8412-cfe6269464a5	Asus	\N	t	2026-02-12 18:45:58.454358+05:30	\N	[]
2b978c2f-d6c6-4a9a-b459-5d42e07eff3a	Acer	\N	t	2026-02-12 18:46:03.666747+05:30	\N	[]
85e4ad5e-8d4a-4540-a16a-ef2811a2974d	HPE	\N	t	2026-02-12 18:46:08.821381+05:30	\N	[]
2c40902f-0594-49cf-9f77-2ea5c7cdeee6	Lenovo	\N	t	2026-02-12 18:45:45.555546+05:30	\N	[]
\.


--
-- Data for Name: master_partner_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.master_partner_types (id, name, is_active, created_at) FROM stdin;
7b3d92be-f103-4821-9a8f-c9859bcd57c2	Distributor	t	2026-02-20 12:21:44.600842+05:30
f65e76b7-2071-41c0-94db-2e8ea5bfc055	Reseller	t	2026-02-20 12:21:44.600842+05:30
30a9afb5-fa08-459f-a884-65261d6699bc	System Integrator	t	2026-02-20 12:21:44.600842+05:30
6a028cfc-de27-4573-b727-295a991dad13	OEM Partner	t	2026-02-20 12:21:44.600842+05:30
52ef00fc-c0dd-4373-9718-d91e1208c04b	Referral Partner	t	2026-02-20 12:21:44.600842+05:30
9fc0d26b-d943-4cf5-bc4c-3cab69a023c9	Technology Partner	t	2026-02-20 12:21:44.600842+05:30
\.


--
-- Data for Name: master_verticals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.master_verticals (id, name, is_active, created_at) FROM stdin;
aecc23c4-4427-469b-ad3e-ce5ecb771a1a	BFSI	t	2026-02-20 12:21:43.590223+05:30
b9c9d2ab-ce1d-48b4-b86b-931d545f093d	Education	t	2026-02-20 12:21:43.590223+05:30
c4a504ce-b8b2-46a6-9636-6401268ed487	Government	t	2026-02-20 12:21:43.590223+05:30
57ac8960-48a9-437c-be80-6b83252b2244	Healthcare	t	2026-02-20 12:21:43.590223+05:30
8e3677b4-0ec3-45bc-ab29-145ebfde3aa5	IT/ITES	t	2026-02-20 12:21:43.590223+05:30
774aa74d-c796-406b-8688-3709cbff2ea1	Manufacturing	t	2026-02-20 12:21:43.590223+05:30
101f1d3a-1b30-4543-8d7e-8f9e4aa52461	Media & Entertainment	t	2026-02-20 12:21:43.590223+05:30
1119e564-62d5-438a-8df8-8afa56c73044	Retail	t	2026-02-20 12:21:43.590223+05:30
c02fb3e0-d472-4bbc-bba1-30889c8bc3c6	Telecom	t	2026-02-20 12:21:43.590223+05:30
833b1e1e-fe8c-45c0-b32f-d78fa1400afa	Energy & Utilities	t	2026-02-20 12:21:43.590223+05:30
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, type, title, message, link, is_read, metadata, created_at) FROM stdin;
01111111-1111-1111-1111-111111111111	11111111-1111-1111-1111-111111111111	task	Task Due Tomorrow	Task "Follow up on Acme Corp proposal" is due tomorrow	/tasks/a4111111-1111-1111-1111-111111111111	f	\N	2026-02-09 13:54:13.659938+05:30
02222222-2222-2222-2222-222222222222	22222222-2222-2222-2222-222222222222	meeting	Upcoming Meeting	Meeting "Finance Solutions Security Review" starts in 1 hour	/calendar/e5555555-5555-5555-5555-555555555555	f	\N	2026-02-09 13:54:13.659938+05:30
03333333-3333-3333-3333-333333333333	11111111-1111-1111-1111-111111111111	deal	Deal Stage Updated	Deal "TechStartup - Cloud Migration" moved to Qualification	/deals/d4444444-4444-4444-4444-444444444444	t	\N	2026-02-09 13:54:13.659938+05:30
04444444-4444-4444-4444-444444444444	22222222-2222-2222-2222-222222222222	lead	New Lead Assigned	New lead "Insurance Corp" has been assigned to you	/leads/78888888-8888-8888-8888-888888888888	t	\N	2026-02-09 13:54:13.659938+05:30
05555555-5555-5555-5555-555555555555	33333333-3333-3333-3333-333333333333	quote	Quote Accepted	Quote QT-2026-005 has been accepted by TechStartup Inc	/quotes/e5555555-5555-5555-5555-555555555555	f	\N	2026-02-09 13:54:13.659938+05:30
06666666-6666-6666-6666-666666666666	11111111-1111-1111-1111-111111111111	task	Overdue Task	Task "Call TechStartup CEO" is overdue	/tasks/a5111111-1111-1111-1111-111111111111	f	\N	2026-02-09 13:54:13.659938+05:30
07777777-7777-7777-7777-777777777777	22222222-2222-2222-2222-222222222222	deal	Deal Won!	Congratulations! Deal "Previous Deal - Software Licenses" has been won	/deals/da111111-1111-1111-1111-111111111111	t	\N	2026-02-09 13:54:13.659938+05:30
08888888-8888-8888-8888-888888888888	33333333-3333-3333-3333-333333333333	account	Account Health Alert	Account "Healthcare Plus" health score dropped below 70	/accounts/a6666666-6666-6666-6666-666666666666	f	\N	2026-02-09 13:54:13.659938+05:30
09999999-9999-9999-9999-999999999999	11111111-1111-1111-1111-111111111111	email	Email Sent	Email sent to Future Tech Systems regarding proposal	/emails/e0444444-4444-4444-4444-444444444444	t	\N	2026-02-09 13:54:13.659938+05:30
0a111111-1111-1111-1111-111111111111	22222222-2222-2222-2222-222222222222	system	Weekly Summary	Your weekly sales summary is ready to view	/dashboard	f	\N	2026-02-09 13:54:13.659938+05:30
7a0dafc0-89bb-45c0-ae0f-f6dee46bf3a8	33333333-3333-3333-3333-333333333333	stage_change	Lead moved to Negotiation	Lead 'Legal Associates' has moved to Negotiation stage	\N	f	\N	2026-02-12 20:19:55.389944+05:30
696553a9-fd00-47bd-8eaf-813943861678	33333333-3333-3333-3333-333333333333	stage_change	Deal moved to Negotiation	Deal 'Acme Corp - Enterprise Cloud Infrastructure' has moved to Negotiation stage	\N	f	\N	2026-02-17 12:15:11.633472+05:30
80e90b9a-7fdd-4f08-8204-df3bbca7405f	43935cf9-b3be-4493-8927-06a5a6c04275	value_change	Deal value updated	Deal 'Final Test Deal' value changed from ₹50,000 to ₹75,000	\N	f	\N	2026-02-20 16:32:22.086238+05:30
\.


--
-- Data for Name: partners; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.partners (id, company_name, contact_person, email, phone, mobile, gst_number, pan_number, address, city, state, pincode, partner_type, vertical, status, tier, assigned_to, approved_by, approved_at, rejection_reason, notes, is_active, created_at, updated_at) FROM stdin;
24ec9695-6282-4b99-80db-fd20becbf39d	Vikram Technologies	Karan Joshi	karan@vikramtechnolog.com	+91 9291941856	+91 7385450658	27AABCU5837C1Z6	AABCU6195C	295 Main Road	Bangalore	Maharashtra	908181	Distributor	Services	active	silver	\N	\N	\N	\N	Partner since 2020	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
8135a9f2-bd4a-4290-8bef-738fd99a243e	Karan Technologies	Anjali Mehta	anjali@karantechnologi.com	+91 8181710560	+91 8296034793	27AABCU4994C1Z4	AABCU8985C	960 Commercial Street	Mumbai	Rajasthan	429435	Reseller	Software	active	new	\N	\N	\N	\N	Partner since 2019	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
01adcd72-9019-473b-aad3-10837f6a002a	Priya Technologies	Divya Rao	divya@priyatechnologi.com	+91 7655047780	+91 7732215604	27AABCU5215C1Z7	AABCU4418C	233 Park Street	Ahmedabad	Uttar Pradesh	558597	Distributor	Networking	pending	new	\N	\N	\N	\N	Partner since 2021	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d8ee5a99-f12a-4470-8211-8c55aee8090f	Vikram Technologies	Sanjay Rao	sanjay@vikramtechnolog.com	+91 9002767956	+91 8773989633	27AABCU6497C1Z3	AABCU1087C	875 Main Road	Nagpur	West Bengal	947946	Distributor	Software	approved	silver	\N	\N	\N	\N	Partner since 2020	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d59f4209-9ed3-4bed-8231-f974138b2e65	Amit Technologies	Vikram Menon	vikram@amittechnologie.com	+91 9248266016	+91 9008019208	27AABCU8839C1Z5	AABCU7150C	400 MG Road	Nagpur	Uttar Pradesh	402715	Consultant	Services	approved	new	\N	\N	\N	\N	Partner since 2024	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
24f066f8-baaf-4b93-a030-66950ae1aa53	Divya Enterprises	Priya Pillai	priya@divyaenterprise.com	+91 9623671198	+91 8539061919	27AABCU4058C1Z6	AABCU6634C	445 MG Road	Kolkata	Madhya Pradesh	441761	Consultant	IT Hardware	active	gold	\N	\N	\N	\N	Partner since 2018	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
a28a5b90-ae38-4587-bdd8-b63e55454de5	Divya Enterprises	Rahul Sharma	rahul@divyaenterprise.com	+91 8029199544	+91 7042389609	27AABCU1600C1Z2	AABCU9065C	786 Commercial Street	Bangalore	Tamil Nadu	823788	System Integrator	Software	active	silver	\N	\N	\N	\N	Partner since 2024	f	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
6786bf47-38e0-4276-b435-010e156e9cda	Pooja Systems	Priya Desai	priya@poojasystems.com	+91 9855655178	+91 8422141784	27AABCU4774C1Z3	AABCU2700C	652 Main Road	Mumbai	Uttar Pradesh	260364	Distributor	Services	active	platinum	\N	\N	\N	\N	Partner since 2018	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d0ba6c45-3eb6-4408-9a52-00c1c0c8dff8	Sneha Technologies	Neha Reddy	neha@snehatechnologi.com	+91 8325965319	+91 8753821770	27AABCU6581C1Z4	AABCU5575C	561 MG Road	Jaipur	Rajasthan	901617	Reseller	Software	active	new	\N	\N	\N	\N	Partner since 2021	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d43ca79b-07de-4ceb-8e3e-6898c30c85dd	Priya Technologies	Rohan Kumar	rohan@priyatechnologi.com	+91 8006698545	+91 8744592495	27AABCU1562C1Z3	AABCU6060C	559 Park Street	Jaipur	Tamil Nadu	397715	System Integrator	Printing	approved	platinum	\N	\N	\N	\N	Partner since 2019	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
5aaa5db7-6043-4cd7-ad7c-e56569b45886	Rohan Systems	Rohan Desai	rohan@rohansystems.com	+91 7548751684	+91 7207775509	27AABCU5572C1Z8	AABCU5348C	588 Commercial Street	Bangalore	Delhi	420269	Distributor	IT Hardware	approved	new	\N	\N	\N	\N	Partner since 2020	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
6093f9de-4eb0-4041-ae04-a4797c471ba9	Amit Solutions	Divya Verma	divya@amitsolutions.com	+91 8180151715	+91 9330861810	27AABCU4246C1Z1	AABCU5324C	640 Main Road	Jaipur	Tamil Nadu	456020	Distributor	Networking	active	new	\N	\N	\N	\N	Partner since 2020	f	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
f33ac0c3-3d1d-4117-9e0b-df5515a83727	Kavya Systems	Sanjay Reddy	sanjay@kavyasystems.com	+91 8110754774	+91 8591676906	27AABCU9491C1Z3	AABCU5741C	234 Main Road	Kanpur	Gujarat	946011	Distributor	Services	active	platinum	\N	\N	\N	\N	Partner since 2019	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
93199341-d622-4a36-9aaf-4d6131c10c6d	Rohan Systems	Karan Gupta	karan@rohansystems.com	+91 8217761948	+91 8815918431	27AABCU2036C1Z2	AABCU2610C	91 Main Road	Indore	Telangana	788869	Consultant	Software	pending	platinum	\N	\N	\N	\N	Partner since 2019	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
73af2a5f-9221-4551-8223-9fc0bde88af8	Karan Technologies	Pooja Joshi	pooja@karantechnologi.com	+91 7794178104	+91 9744276044	27AABCU1150C1Z2	AABCU3596C	171 Park Street	Mumbai	Madhya Pradesh	598895	Distributor	Services	approved	new	\N	\N	\N	\N	Partner since 2020	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, name, category, base_price, commission_rate, stock, is_active, created_at, updated_at) FROM stdin;
a3cfad26-ad47-4de1-80fa-60120e384c39	HP LaserJet Pro M404dn	Printers	25000.00	8.00	90	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
88981683-f904-43df-a4b8-ff28fc31c186	HP OfficeJet Pro 9015	Printers	18000.00	7.00	96	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
ed856fbc-6a3a-4cf4-9ed6-7a946490d90a	Canon imageCLASS MF445dw	Printers	32000.00	9.00	58	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
187b5688-182f-4ab9-8557-d972d5103268	Epson EcoTank L3250	Printers	15000.00	6.00	18	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
1a9a0d1d-650e-4f5b-96b2-2f0464f6dba3	Brother HL-L2321D	Printers	12000.00	5.00	97	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
a1858fbd-78af-467e-840b-92a8c6f12720	Xerox VersaLink C405	Printers	45000.00	10.00	42	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
f03c7ef2-88e1-47ae-a0e2-50de9c5f8e01	HP Toner CF410A (Black)	Toner Cartridges	3500.00	12.00	43	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
3fc4168c-4d1a-41c4-aa4f-3038daa8d21d	Canon Toner 046 (Cyan)	Toner Cartridges	4200.00	12.00	68	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
cbecc664-2ca8-4559-83a7-9ffa61b2d0fe	Epson Ink Bottle T664 (Black)	Ink Bottles	450.00	15.00	46	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d9bd400b-282a-485b-9532-0da13f9b29e9	HP Ink Cartridge 680 (Tri-color)	Ink Cartridges	850.00	14.00	95	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
6be2d346-d911-4fb3-8a51-4828824ae4a0	A4 Copy Paper (500 Sheets)	Paper & Supplies	250.00	8.00	98	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
bdf20aeb-93bc-4aef-923d-b8f451ba9109	Printer Maintenance Kit	Accessories	5000.00	10.00	88	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
f69b743f-d29a-4a61-92cb-b388e2750879	Network Print Server	Accessories	8000.00	9.00	90	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
cc3138c2-ce5f-4516-b77b-2b79f1ff4cde	Annual Maintenance Contract	Services	15000.00	20.00	48	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
bccb0d6d-cc24-4874-931d-838ee9c4cd8c	On-site Installation Service	Services	2000.00	25.00	69	t	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
\.


--
-- Data for Name: quote_line_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quote_line_items (id, quote_id, product_id, description, quantity, unit_price, discount_pct, line_total, sort_order) FROM stdin;
ea111112-1111-1111-1111-111111111111	e1111111-1111-1111-1111-111111111111	f8888888-8888-8888-8888-888888888888	Fortinet FortiGate 100F Next-Gen Firewall	2	3500.00	0.00	7000.00	2
ea111113-1111-1111-1111-111111111111	e1111111-1111-1111-1111-111111111111	fa111111-1111-1111-1111-111111111111	Professional installation and configuration	1	15000.00	0.00	15000.00	3
ea111114-1111-1111-1111-111111111111	e1111111-1111-1111-1111-111111111111	fb111111-1111-1111-1111-111111111111	3-year support and maintenance	10	250.00	0.00	2500.00	4
ea222223-1111-1111-1111-111111111111	e2222222-2222-2222-2222-222222222222	fa111111-1111-1111-1111-111111111111	Migration services	1	5000.00	0.00	5000.00	3
ea333331-1111-1111-1111-111111111111	e3333333-3333-3333-3333-333333333333	f8888888-8888-8888-8888-888888888888	Fortinet firewall for HIPAA compliance	3	3500.00	0.00	10500.00	1
ea333333-1111-1111-1111-111111111111	e3333333-3333-3333-3333-333333333333	fa111111-1111-1111-1111-111111111111	Installation and HIPAA configuration	1	8000.00	0.00	8000.00	3
ea444442-1111-1111-1111-111111111111	e4444444-4444-4444-4444-444444444444	fa111111-1111-1111-1111-111111111111	Implementation and training	1	15000.00	0.00	15000.00	2
ea111111-1111-1111-1111-111111111111	e1111111-1111-1111-1111-111111111111	f3333333-3333-3333-3333-333333333333	Cisco Catalyst 9300 24-port managed switches	10	5000.00	0.00	50000.00	1
ea222221-1111-1111-1111-111111111111	e2222222-2222-2222-2222-222222222222	f1111111-1111-1111-1111-111111111111	Cloud server instances (12 months)	5	12000.00	0.00	60000.00	1
ea222222-1111-1111-1111-111111111111	e2222222-2222-2222-2222-222222222222	f2222222-2222-2222-2222-222222222222	Storage array 10TB	2	8000.00	0.00	16000.00	2
ea333332-1111-1111-1111-111111111111	e3333333-3333-3333-3333-333333333333	fd111111-1111-1111-1111-111111111111	Network security bundle	2	12000.00	0.00	24000.00	2
ea444441-1111-1111-1111-111111111111	e4444444-4444-4444-4444-444444444444	f9999999-9999-9999-9999-999999999999	Project management software licenses	50	1500.00	0.00	75000.00	1
\.


--
-- Data for Name: quote_selected_terms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quote_selected_terms (id, quote_id, term_id, sort_order) FROM stdin;
\.


--
-- Data for Name: quote_terms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quote_terms (id, content, is_predefined, sort_order, created_at, updated_at) FROM stdin;
8c58f256-8c93-4beb-a8e1-6a9bfe77c756	Payment is due within 30 days of invoice date.	t	1	2026-02-16 12:35:04.821752+05:30	2026-02-16 12:35:04.821752+05:30
387398f1-64e4-4dea-9ea9-198fc00a0be0	All prices are exclusive of applicable taxes unless stated otherwise.	t	2	2026-02-16 12:35:04.821752+05:30	2026-02-16 12:35:04.821752+05:30
b0596d19-6402-4a27-9e9a-3ad268b465a2	Delivery timelines are subject to product availability.	t	3	2026-02-16 12:35:04.821752+05:30	2026-02-16 12:35:04.821752+05:30
1886a806-40ca-4907-85d8-9c19bde3c29f	Warranty terms are as per manufacturer's policy.	t	4	2026-02-16 12:35:04.821752+05:30	2026-02-16 12:35:04.821752+05:30
e6c1e98e-642f-4bb1-ab0c-1ad1215c2d6a	This quotation is valid for the period specified above.	t	5	2026-02-16 12:35:04.821752+05:30	2026-02-16 12:35:04.821752+05:30
d61d9ab9-0f8c-4863-bc53-e323e8204b8e	Cancellation after order confirmation may attract cancellation charges.	t	6	2026-02-16 12:35:04.821752+05:30	2026-02-16 12:35:04.821752+05:30
\.


--
-- Data for Name: quotes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quotes (id, quote_number, lead_id, partner_id, customer_name, valid_until, subtotal, tax_rate, tax_amount, discount_amount, total_amount, status, terms, notes, pdf_url, created_by, created_at, updated_at) FROM stdin;
e1111111-1111-1111-1111-111111111111	QT-2026-001	71111111-1111-1111-1111-111111111111	\N	Future Tech Systems	2026-03-15	74500.00	18.00	12510.00	5000.00	82010.00	sent	Net 30 days. Installation included.	Network infrastructure upgrade project	\N	11111111-1111-1111-1111-111111111111	2026-02-09 08:24:13.659938	2026-02-09 08:24:13.659938
e2222222-2222-2222-2222-222222222222	QT-2026-002	72222222-2222-2222-2222-222222222222	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	Smart Retail Solutions	2026-04-20	81000.00	18.00	14220.00	2000.00	93220.00	draft	Payment terms: 50% upfront, 50% on delivery	Cloud migration quote	\N	22222222-2222-2222-2222-222222222222	2026-02-09 08:24:13.659938	2026-02-09 08:24:13.659938
e3333333-3333-3333-3333-333333333333	QT-2026-003	73333333-3333-3333-3333-333333333333	\N	Healthcare Innovations	2026-05-25	42500.00	18.00	7470.00	1000.00	48970.00	sent	HIPAA compliant deployment. Training included.	Security infrastructure quote	\N	33333333-3333-3333-3333-333333333333	2026-02-09 08:24:13.659938	2026-02-09 08:24:13.659938
e4444444-4444-4444-4444-444444444444	QT-2026-004	76666666-6666-6666-6666-666666666666	\N	Construction Plus	2026-04-15	90000.00	18.00	15660.00	3000.00	102660.00	sent	Project management software with on-site training	Construction management solution	\N	11111111-1111-1111-1111-111111111111	2026-02-09 08:24:13.659938	2026-02-09 08:24:13.659938
e5555555-5555-5555-5555-555555555555	QT-2026-005	79999999-9999-9999-9999-999999999999	\N	TechStartup Inc	2026-03-30	0.00	18.00	-720.00	4000.00	-4720.00	accepted	Cloud services agreement	Quote accepted, converted to deal	\N	11111111-1111-1111-1111-111111111111	2026-02-09 08:24:13.659938	2026-02-09 08:24:13.659938
e6666666-6666-6666-6666-666666666666	QT-2026-006	7a111111-1111-1111-1111-111111111111	\N	Budget Retail	2026-02-28	0.00	18.00	0.00	0.00	0.00	rejected	Standard POS terms	Price too high for customer	\N	33333333-3333-3333-3333-333333333333	2026-02-09 08:24:13.659938	2026-02-09 08:24:13.659938
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (id, role_id, entity, can_view, can_create, can_edit, can_delete) FROM stdin;
0353b6b5-bc78-4a42-a2fb-1ef9ffda4318	9c7113dc-0617-42b7-b07f-52e4ccef8206	partners	t	t	t	t
452f7376-1831-439f-84db-6243e7a62f4a	9c7113dc-0617-42b7-b07f-52e4ccef8206	leads	t	t	t	t
4cf3b5d7-a2c1-49be-9772-cca4862172fb	9c7113dc-0617-42b7-b07f-52e4ccef8206	accounts	t	t	t	t
787aca73-28b1-415c-b9fc-4abcf124bfff	9c7113dc-0617-42b7-b07f-52e4ccef8206	contacts	t	t	t	t
14bf23eb-c2d7-44a7-a1d1-085bb009e785	9c7113dc-0617-42b7-b07f-52e4ccef8206	deals	t	t	t	t
227b4489-58aa-442d-a652-f6c95f60e12d	9c7113dc-0617-42b7-b07f-52e4ccef8206	sales_entries	t	t	t	t
803f2b7e-7cd0-48e3-9bb8-d71f610dc9cf	9c7113dc-0617-42b7-b07f-52e4ccef8206	products	t	t	t	t
e0a11599-886e-435f-a39f-25beeeaf84ee	9c7113dc-0617-42b7-b07f-52e4ccef8206	tasks	t	t	t	t
0c88d23f-ea23-4b97-b519-7685e89a172c	9c7113dc-0617-42b7-b07f-52e4ccef8206	quotes	t	t	t	t
20de8fc0-30fb-4852-8ca3-97b6ea87566b	9c7113dc-0617-42b7-b07f-52e4ccef8206	carepacks	t	t	t	t
b3b73948-2c24-4dbb-8307-96b51534b20b	9c7113dc-0617-42b7-b07f-52e4ccef8206	calendar_events	t	t	t	t
31ac5722-7901-4cea-a3cb-499549a2065d	9c7113dc-0617-42b7-b07f-52e4ccef8206	emails	t	t	t	t
3b103d42-2164-42f3-89cd-6c0dbacbcf0c	9c7113dc-0617-42b7-b07f-52e4ccef8206	reports	t	t	t	t
d672d7dd-9d93-4244-9602-58246c28d5b4	7473cb49-cf6a-4c2d-900a-359be2899ab7	partners	t	t	t	t
a353992e-5efb-4197-9ffb-cf87c84d782b	7473cb49-cf6a-4c2d-900a-359be2899ab7	leads	t	t	t	t
e5e3bc05-c3c6-4990-b6b7-b061fff1a4cb	7473cb49-cf6a-4c2d-900a-359be2899ab7	accounts	t	t	t	t
a080467c-34ab-44c9-9d51-4bffc11c6392	7473cb49-cf6a-4c2d-900a-359be2899ab7	contacts	t	t	t	t
c3eb8c6c-4d18-43c0-af55-9e01092b4c3e	7473cb49-cf6a-4c2d-900a-359be2899ab7	deals	t	t	t	t
837b8009-79d6-4cbc-a660-8bcabf5ae045	7473cb49-cf6a-4c2d-900a-359be2899ab7	sales_entries	t	t	t	t
817e9a13-f00a-41d5-8dec-4149e16ce7d7	7473cb49-cf6a-4c2d-900a-359be2899ab7	products	t	t	t	t
3e3591ef-660f-43df-a403-6dc68428651a	7473cb49-cf6a-4c2d-900a-359be2899ab7	tasks	t	t	t	t
e09bc188-72e6-47d0-ab87-d1952c4fe8d5	7473cb49-cf6a-4c2d-900a-359be2899ab7	quotes	t	t	t	t
6121bec6-e62e-4e94-8f8b-79722f8dda85	7473cb49-cf6a-4c2d-900a-359be2899ab7	carepacks	t	t	t	t
2c38662a-0922-4135-8d07-7268fdc257c2	7473cb49-cf6a-4c2d-900a-359be2899ab7	calendar_events	t	t	t	t
e46385ac-5ab4-4854-a021-85a15710e7ab	7473cb49-cf6a-4c2d-900a-359be2899ab7	emails	t	t	t	t
0ee43980-8006-44b4-b425-bf750f9b43e3	7473cb49-cf6a-4c2d-900a-359be2899ab7	reports	t	t	t	t
8f1f7343-5156-4195-a390-6a0c952684be	f8dc639b-8232-4540-94e5-870f502c5de7	partners	t	t	t	f
462b86ba-81c3-401e-97e6-ed39d48b03b0	f8dc639b-8232-4540-94e5-870f502c5de7	leads	t	t	t	f
ceade921-712d-456b-ac20-b3d435ed9064	f8dc639b-8232-4540-94e5-870f502c5de7	accounts	t	t	t	f
4b19315d-a535-433d-b7e4-404f7733740f	f8dc639b-8232-4540-94e5-870f502c5de7	contacts	t	t	t	f
d377c3ac-cba8-47ca-a3e6-2706deb6fef4	f8dc639b-8232-4540-94e5-870f502c5de7	deals	t	t	t	f
6bb48f23-4c1c-4a4f-b811-2a3426cf0487	f8dc639b-8232-4540-94e5-870f502c5de7	sales_entries	t	t	t	f
748f391a-3806-4034-aa12-9e72beb0c655	f8dc639b-8232-4540-94e5-870f502c5de7	products	t	t	t	f
616377e7-5953-437d-a267-1e9743f9310e	f8dc639b-8232-4540-94e5-870f502c5de7	tasks	t	t	t	f
667b3019-26ab-48eb-84d2-5ec495acf80e	f8dc639b-8232-4540-94e5-870f502c5de7	quotes	t	t	t	f
edfc3d27-92e5-4f55-b206-9908a4de3ef2	f8dc639b-8232-4540-94e5-870f502c5de7	carepacks	t	t	t	f
9e30b88b-e2ae-4355-8f54-15658dd37c93	f8dc639b-8232-4540-94e5-870f502c5de7	calendar_events	t	t	t	f
2d1c87da-f708-49e3-8730-d59864bd2ad3	f8dc639b-8232-4540-94e5-870f502c5de7	emails	t	t	t	f
dd05420f-3efb-462b-bafd-e3313c41132b	f8dc639b-8232-4540-94e5-870f502c5de7	reports	t	t	t	f
7fcc150b-ee63-42fa-a355-106ae7c40d5f	494c9b34-6485-49d3-b7bb-4873e8cc26d1	partners	t	t	t	f
b2c32fb7-fdbf-43dc-a466-fbc3fd927eaa	494c9b34-6485-49d3-b7bb-4873e8cc26d1	leads	t	t	t	f
f2794a94-1cdb-44a6-ac11-e9deabda77db	494c9b34-6485-49d3-b7bb-4873e8cc26d1	accounts	t	t	t	f
7ecf606a-d682-4ddc-bc90-13bc7f26a0d3	494c9b34-6485-49d3-b7bb-4873e8cc26d1	contacts	t	t	t	f
e8302333-3ef8-48af-8a1c-a2215669eeab	494c9b34-6485-49d3-b7bb-4873e8cc26d1	deals	t	t	t	f
82f3fcdb-5d22-4ec4-890e-40d8e337abe0	494c9b34-6485-49d3-b7bb-4873e8cc26d1	sales_entries	t	t	t	f
3939729d-a6f1-479c-ad6c-0a1a177015ea	494c9b34-6485-49d3-b7bb-4873e8cc26d1	products	t	t	t	f
a335b88b-302d-4419-9476-955ac6b2a2ec	494c9b34-6485-49d3-b7bb-4873e8cc26d1	tasks	t	t	t	f
a1ca2690-115d-480a-a335-6853bfbcb185	494c9b34-6485-49d3-b7bb-4873e8cc26d1	quotes	t	t	t	f
b9eacefa-ad12-4070-9c65-9e4b7b66050f	494c9b34-6485-49d3-b7bb-4873e8cc26d1	carepacks	t	t	t	f
cd07fcba-ce78-4991-98da-a0fb5eea15fb	494c9b34-6485-49d3-b7bb-4873e8cc26d1	calendar_events	t	t	t	f
091c83b3-a606-4fbd-89bc-1732b19e32ec	494c9b34-6485-49d3-b7bb-4873e8cc26d1	emails	t	t	t	f
ee8554e4-ab5f-4bd7-833b-37e5565cb571	494c9b34-6485-49d3-b7bb-4873e8cc26d1	reports	t	t	t	f
bc4fee42-82ab-4cca-a787-cfb353a7d381	840600ca-8591-4462-b784-9443e27a6641	partners	t	t	t	f
0a6e9e70-123e-4d0c-b56e-da4d7a1a5471	840600ca-8591-4462-b784-9443e27a6641	leads	t	t	t	f
a4df737a-9ecd-4ce4-b665-1f00035631d7	840600ca-8591-4462-b784-9443e27a6641	accounts	t	t	t	f
65dde6f9-b764-4068-bb59-188430a4d10d	840600ca-8591-4462-b784-9443e27a6641	contacts	t	t	t	f
3b3a7311-38e5-4e1c-9056-4c15499bda0c	840600ca-8591-4462-b784-9443e27a6641	deals	t	t	t	f
84c3d5a6-3f42-4546-a65c-e7ece4bbc344	840600ca-8591-4462-b784-9443e27a6641	sales_entries	t	t	t	f
e745652c-4c16-4b8f-a21c-64bc0ad9de32	840600ca-8591-4462-b784-9443e27a6641	products	t	t	t	f
65ee4868-f8a7-4df4-bdc1-0fde10370749	840600ca-8591-4462-b784-9443e27a6641	tasks	t	t	t	f
9b202456-227f-4522-962a-87caf490e070	840600ca-8591-4462-b784-9443e27a6641	quotes	t	t	t	f
251cceda-09d9-4059-aa0e-8fc96720bba6	840600ca-8591-4462-b784-9443e27a6641	carepacks	t	t	t	f
88133ed1-e1ca-4241-bb38-d0c505a4b595	840600ca-8591-4462-b784-9443e27a6641	calendar_events	t	t	t	f
be6164df-f1f0-4802-8d56-545f4447b1c8	840600ca-8591-4462-b784-9443e27a6641	emails	t	t	t	f
aa3438b9-a8e8-4f68-ad04-54575c4d2a1c	840600ca-8591-4462-b784-9443e27a6641	reports	t	t	t	f
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, label, description, is_system, is_active, created_at, updated_at) FROM stdin;
9c7113dc-0617-42b7-b07f-52e4ccef8206	superadmin	Super Admin	\N	t	t	2026-02-11 08:43:05.663229	2026-02-11 08:43:05.663229
7473cb49-cf6a-4c2d-900a-359be2899ab7	admin	Admin	\N	t	t	2026-02-11 08:43:05.663229	2026-02-11 08:43:05.663229
f8dc639b-8232-4540-94e5-870f502c5de7	businesshead	Business Head	\N	t	t	2026-02-11 08:43:05.663229	2026-02-11 08:43:05.663229
840600ca-8591-4462-b784-9443e27a6641	sales	Sales	\N	t	t	2026-02-11 08:43:05.663229	2026-02-11 08:43:05.663229
494c9b34-6485-49d3-b7bb-4873e8cc26d1	productmanager	Product Manager	\N	t	t	2026-02-11 08:43:05.663229	2026-02-11 08:43:05.663229
\.


--
-- Data for Name: sales_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_entries (id, partner_id, product_id, salesperson_id, customer_name, quantity, amount, po_number, invoice_no, payment_status, commission_amount, sale_date, location_id, vertical_id, notes, description, deal_id, product_ids, contact_name, contact_no, email, gstin, pan_no, dispatch_method, payment_terms, order_type, serial_number, boq, price, created_at, updated_at) FROM stdin;
f922429a-d50c-4219-a361-011b38c30347	\N	6be2d346-d911-4fb3-8a51-4828824ae4a0	20a1bad5-7a19-47b2-afeb-55d630ee5f13	Banking Systems Inc Customer	8	2000.00	PO34709	INV42679	pending	160.00	2026-01-29	\N	\N	Sale of 8 units of A4 Copy Paper (500 Sheets)	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
02446904-889c-43b9-916e-2b0890ceabe7	d0ba6c45-3eb6-4408-9a52-00c1c0c8dff8	f03c7ef2-88e1-47ae-a0e2-50de9c5f8e01	14a3756a-5a80-460a-90b2-96f572cffd76	CloudTech Systems Customer	9	31500.00	PO46676	INV18374	paid	3780.00	2025-12-23	\N	\N	Sale of 9 units of HP Toner CF410A (Black)	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
1b0e37af-ff2d-4382-86ec-8b012a1036fe	73af2a5f-9221-4551-8223-9fc0bde88af8	cbecc664-2ca8-4559-83a7-9ffa61b2d0fe	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	Industrial Solutions Corp Customer	3	1350.00	PO34504	INV22590	paid	202.50	2026-01-02	\N	\N	Sale of 3 units of Epson Ink Bottle T664 (Black)	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
db7ec006-af59-4dc9-8951-19f0c93faef9	\N	f03c7ef2-88e1-47ae-a0e2-50de9c5f8e01	1b45ba6b-98f7-407b-826c-5ce61d112a0f	E-Commerce Dynamics Customer	19	66500.00	PO98758	INV81831	partial	7980.00	2025-12-02	\N	\N	Sale of 19 units of HP Toner CF410A (Black)	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
b6b815ea-742c-41b6-baf3-f12805e072d2	01adcd72-9019-473b-aad3-10837f6a002a	6be2d346-d911-4fb3-8a51-4828824ae4a0	6fe86a87-d903-4f41-93fc-e63196c3af1a	HealthFirst Systems Customer	6	1500.00	PO88689	INV72096	overdue	120.00	2026-02-08	\N	\N	Sale of 6 units of A4 Copy Paper (500 Sheets)	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
52792774-2eba-4ea7-883e-97e3f7b98dcf	24f066f8-baaf-4b93-a030-66950ae1aa53	bccb0d6d-cc24-4874-931d-838ee9c4cd8c	512f9954-6c97-4118-b7fe-890710702f92	Precision Manufacturing Ltd Customer	17	34000.00	PO92586	INV44847	paid	8500.00	2026-01-31	\N	\N	Sale of 17 units of On-site Installation Service	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
f9897789-4e01-46a2-bae7-6aa185c5a323	5aaa5db7-6043-4cd7-ad7c-e56569b45886	cc3138c2-ce5f-4516-b77b-2b79f1ff4cde	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	MediCare Solutions Customer	14	210000.00	PO73910	INV18577	partial	42000.00	2026-02-19	\N	\N	Sale of 14 units of Annual Maintenance Contract	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
9510a15d-13e9-4b12-b0f7-1f3a40fa9313	24ec9695-6282-4b99-80db-fd20becbf39d	bdf20aeb-93bc-4aef-923d-b8f451ba9109	1d3255e6-5d5b-4f5b-b3d6-73f01eebf427	TechCorp Solutions Customer	2	10000.00	PO64565	INV50054	paid	1000.00	2026-01-20	\N	\N	Sale of 2 units of Printer Maintenance Kit	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
67f969ec-dd38-4c82-a811-f355603d2a5e	24ec9695-6282-4b99-80db-fd20becbf39d	1a9a0d1d-650e-4f5b-96b2-2f0464f6dba3	1d3255e6-5d5b-4f5b-b3d6-73f01eebf427	Precision Manufacturing Ltd Customer	16	192000.00	PO88856	INV98389	partial	9600.00	2026-02-14	\N	\N	Sale of 16 units of Brother HL-L2321D	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
2de825f4-4bbc-42b1-a6e9-c4cde4115aa3	6786bf47-38e0-4276-b435-010e156e9cda	a3cfad26-ad47-4de1-80fa-60120e384c39	35417c40-2a83-4e3d-bca2-447f4304f7b3	Retail Tech Inc Customer	17	425000.00	PO67039	INV58007	pending	34000.00	2025-12-05	\N	\N	Sale of 17 units of HP LaserJet Pro M404dn	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
6f0a87c9-0b36-491f-9d8f-48f22580ce48	01adcd72-9019-473b-aad3-10837f6a002a	f69b743f-d29a-4a61-92cb-b388e2750879	11f1c307-f3cc-4904-90cb-b97f89fc9d43	Precision Manufacturing Ltd Customer	15	120000.00	PO15660	INV14097	pending	10800.00	2026-01-25	\N	\N	Sale of 15 units of Network Print Server	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
5efd6e69-2dd1-45fd-bb6c-8397bc6ea993	\N	f03c7ef2-88e1-47ae-a0e2-50de9c5f8e01	43935cf9-b3be-4493-8927-06a5a6c04275	Shopping Systems Customer	12	42000.00	PO20469	INV85728	paid	5040.00	2026-01-13	\N	\N	Sale of 12 units of HP Toner CF410A (Black)	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
076c75bf-b432-4272-ab4d-5633d6040187	d8ee5a99-f12a-4470-8211-8c55aee8090f	ed856fbc-6a3a-4cf4-9ed6-7a946490d90a	512f9954-6c97-4118-b7fe-890710702f92	Medical Equipment Corp Customer	5	160000.00	PO20829	INV81075	partial	14400.00	2026-02-09	\N	\N	Sale of 5 units of Canon imageCLASS MF445dw	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e79d1b36-9b6e-4b19-be8b-f58d3bb61e9f	\N	f69b743f-d29a-4a61-92cb-b388e2750879	512f9954-6c97-4118-b7fe-890710702f92	Education Innovations Customer	9	72000.00	PO89748	INV72543	paid	6480.00	2025-12-27	\N	\N	Sale of 9 units of Network Print Server	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
a71fb14e-c17a-4947-9be4-06b16384a9bc	5aaa5db7-6043-4cd7-ad7c-e56569b45886	f03c7ef2-88e1-47ae-a0e2-50de9c5f8e01	6190aefe-9845-4000-ab34-5423f0982d38	Digital Innovations Inc Customer	20	70000.00	PO73613	INV35974	pending	8400.00	2025-11-26	\N	\N	Sale of 20 units of HP Toner CF410A (Black)	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
033c0c7b-3319-429b-9ff0-00e6ca4bce37	24f066f8-baaf-4b93-a030-66950ae1aa53	cbecc664-2ca8-4559-83a7-9ffa61b2d0fe	09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	Pharma Dynamics Customer	12	5400.00	PO31871	INV56096	overdue	810.00	2026-02-14	\N	\N	Sale of 12 units of Epson Ink Bottle T664 (Black)	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
64cf1b9a-94bf-4dfc-bb2e-f8698c3c1377	\N	1a9a0d1d-650e-4f5b-96b2-2f0464f6dba3	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	Consumer Goods Corp Customer	3	36000.00	PO91503	INV39982	partial	1800.00	2026-02-09	\N	\N	Sale of 3 units of Brother HL-L2321D	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
20805a53-7cef-4049-9ace-1a40c274398e	24ec9695-6282-4b99-80db-fd20becbf39d	ed856fbc-6a3a-4cf4-9ed6-7a946490d90a	43935cf9-b3be-4493-8927-06a5a6c04275	MediCare Solutions Customer	7	224000.00	PO29371	INV93184	pending	20160.00	2026-01-11	\N	\N	Sale of 7 units of Canon imageCLASS MF445dw	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
f8668a4e-208b-496f-a1bb-0f65600a14bd	d59f4209-9ed3-4bed-8231-f974138b2e65	f69b743f-d29a-4a61-92cb-b388e2750879	14a3756a-5a80-460a-90b2-96f572cffd76	AutoParts Manufacturing Customer	12	96000.00	PO37116	INV51657	overdue	8640.00	2026-02-12	\N	\N	Sale of 12 units of Network Print Server	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
fce7ea93-faad-469c-b1f4-e9c19593424d	d0ba6c45-3eb6-4408-9a52-00c1c0c8dff8	187b5688-182f-4ab9-8557-d972d5103268	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	CyberSafe Solutions Customer	3	45000.00	PO92146	INV40457	overdue	2700.00	2025-12-06	\N	\N	Sale of 3 units of Epson EcoTank L3250	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
bb7465ba-7929-4493-9e2b-3e8089c93782	d43ca79b-07de-4ceb-8e3e-6898c30c85dd	3fc4168c-4d1a-41c4-aa4f-3038daa8d21d	11f1c307-f3cc-4904-90cb-b97f89fc9d43	Pharma Dynamics Customer	9	37800.00	PO69263	INV15332	partial	4536.00	2025-12-07	\N	\N	Sale of 9 units of Canon Toner 046 (Cyan)	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e02e3a25-70e0-4ae6-aa5e-1ad958e0d6de	5aaa5db7-6043-4cd7-ad7c-e56569b45886	a3cfad26-ad47-4de1-80fa-60120e384c39	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	TechCorp Solutions Customer	1	25000.00	PO43008	INV42725	paid	2000.00	2026-02-07	\N	\N	Sale of 1 units of HP LaserJet Pro M404dn	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
dc37caec-9e00-47da-b9b0-c2c07e5b0281	d8ee5a99-f12a-4470-8211-8c55aee8090f	d9bd400b-282a-485b-9532-0da13f9b29e9	11f1c307-f3cc-4904-90cb-b97f89fc9d43	Investment Partners Customer	14	11900.00	PO82944	INV53724	pending	1666.00	2025-12-01	\N	\N	Sale of 14 units of HP Ink Cartridge 680 (Tri-color)	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
ae5b00f8-dfad-4382-a338-0c05c33a6a28	d59f4209-9ed3-4bed-8231-f974138b2e65	bccb0d6d-cc24-4874-931d-838ee9c4cd8c	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	Capital Advisors Customer	5	10000.00	PO95682	INV89590	pending	2500.00	2025-11-27	\N	\N	Sale of 5 units of On-site Installation Service	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
426160d2-08a1-4f9f-ac81-cdf3cea25fcd	\N	f03c7ef2-88e1-47ae-a0e2-50de9c5f8e01	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	AutoParts Manufacturing Customer	15	52500.00	PO60363	INV31903	paid	6300.00	2025-11-27	\N	\N	Sale of 15 units of HP Toner CF410A (Black)	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
29efef8c-5839-47fb-a810-49e762f3c64d	24ec9695-6282-4b99-80db-fd20becbf39d	d9bd400b-282a-485b-9532-0da13f9b29e9	11f1c307-f3cc-4904-90cb-b97f89fc9d43	Medical Equipment Corp Customer	13	11050.00	PO94237	INV17687	overdue	1547.00	2026-02-07	\N	\N	Sale of 13 units of HP Ink Cartridge 680 (Tri-color)	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
755f568b-0ffe-4036-b01d-45b6073d0c1e	73af2a5f-9221-4551-8223-9fc0bde88af8	ed856fbc-6a3a-4cf4-9ed6-7a946490d90a	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	Financial Services Corp Customer	4	128000.00	PO13412	INV17524	partial	11520.00	2026-01-30	\N	\N	Sale of 4 units of Canon imageCLASS MF445dw	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
0c295ece-0eea-4ea9-b919-b40c86fc489c	8135a9f2-bd4a-4290-8bef-738fd99a243e	d9bd400b-282a-485b-9532-0da13f9b29e9	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	AI Dynamics Customer	16	13600.00	PO44348	INV39274	overdue	1904.00	2026-01-28	\N	\N	Sale of 16 units of HP Ink Cartridge 680 (Tri-color)	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
6c45bb63-5b94-49cf-a25c-b33437c52355	24ec9695-6282-4b99-80db-fd20becbf39d	ed856fbc-6a3a-4cf4-9ed6-7a946490d90a	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	Learning Management Systems Customer	7	224000.00	PO32859	INV98389	paid	20160.00	2026-01-23	\N	\N	Sale of 7 units of Canon imageCLASS MF445dw	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
c14b3ef9-7b83-4822-8403-f7e279a84a69	\N	cc3138c2-ce5f-4516-b77b-2b79f1ff4cde	09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	Industrial Solutions Corp Customer	16	240000.00	PO83128	INV63841	pending	48000.00	2025-11-28	\N	\N	Sale of 16 units of Annual Maintenance Contract	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e6ec83e5-1b7f-46c0-aa48-ca9e18727882	\N	d9bd400b-282a-485b-9532-0da13f9b29e9	f9701eca-09f1-48b3-95b8-9d61684cac10	TechCorp Solutions Customer	18	15300.00	PO47597	INV89844	paid	2142.00	2025-12-11	\N	\N	Sale of 18 units of HP Ink Cartridge 680 (Tri-color)	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
8f72c02e-1fcc-49b2-8ace-2198d01cddbe	d59f4209-9ed3-4bed-8231-f974138b2e65	ed856fbc-6a3a-4cf4-9ed6-7a946490d90a	f9701eca-09f1-48b3-95b8-9d61684cac10	HealthFirst Systems Customer	16	512000.00	PO28766	INV36067	partial	46080.00	2026-02-14	\N	\N	Sale of 16 units of Canon imageCLASS MF445dw	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
ab5bdce2-89b6-4fb5-90db-7fa0708b4070	24ec9695-6282-4b99-80db-fd20becbf39d	cc3138c2-ce5f-4516-b77b-2b79f1ff4cde	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	Medical Equipment Corp Customer	12	180000.00	PO80853	INV26195	pending	36000.00	2026-01-03	\N	\N	Sale of 12 units of Annual Maintenance Contract	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
9d91ba9b-05ea-4c5c-845d-959019057baa	\N	f03c7ef2-88e1-47ae-a0e2-50de9c5f8e01	35417c40-2a83-4e3d-bca2-447f4304f7b3	Industrial Solutions Corp Customer	1	3500.00	PO44631	INV84742	pending	420.00	2025-12-28	\N	\N	Sale of 1 units of HP Toner CF410A (Black)	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
7ef837c7-7ec8-42e6-aebc-e61ac9396d56	d59f4209-9ed3-4bed-8231-f974138b2e65	bdf20aeb-93bc-4aef-923d-b8f451ba9109	f9701eca-09f1-48b3-95b8-9d61684cac10	Shopping Systems Customer	10	50000.00	PO33376	INV48130	overdue	5000.00	2025-12-28	\N	\N	Sale of 10 units of Printer Maintenance Kit	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
cfe774fd-97f8-4ba8-be6c-7ee6de13292f	5aaa5db7-6043-4cd7-ad7c-e56569b45886	1a9a0d1d-650e-4f5b-96b2-2f0464f6dba3	512f9954-6c97-4118-b7fe-890710702f92	Consumer Goods Corp Customer	13	156000.00	PO95077	INV92600	overdue	7800.00	2025-12-06	\N	\N	Sale of 13 units of Brother HL-L2321D	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
4d0ad107-9998-43c4-b8a4-042753240791	a28a5b90-ae38-4587-bdd8-b63e55454de5	3fc4168c-4d1a-41c4-aa4f-3038daa8d21d	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	Retail Tech Inc Customer	2	8400.00	PO10571	INV11367	partial	1008.00	2025-11-28	\N	\N	Sale of 2 units of Canon Toner 046 (Cyan)	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
700fa05f-6799-4498-9fef-b8dcc3489ec5	\N	6be2d346-d911-4fb3-8a51-4828824ae4a0	e03c5d7b-6be1-43da-a72b-c2f60ae9863f	EduTech Solutions Customer	18	4500.00	PO46374	INV26481	paid	360.00	2026-01-20	\N	\N	Sale of 18 units of A4 Copy Paper (500 Sheets)	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
26b59ba2-047c-45b0-a4f6-ea565585e86d	d43ca79b-07de-4ceb-8e3e-6898c30c85dd	cbecc664-2ca8-4559-83a7-9ffa61b2d0fe	1d3255e6-5d5b-4f5b-b3d6-73f01eebf427	MediCare Solutions Customer	2	900.00	PO39302	INV28642	overdue	135.00	2025-11-30	\N	\N	Sale of 2 units of Epson Ink Bottle T664 (Black)	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e3b11048-0844-4ea0-9fa2-13d8bfc0fd93	d43ca79b-07de-4ceb-8e3e-6898c30c85dd	a1858fbd-78af-467e-840b-92a8c6f12720	09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	DataFlow Technologies Customer	11	495000.00	PO88173	INV37379	partial	49500.00	2026-01-10	\N	\N	Sale of 11 units of Xerox VersaLink C405	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
944d294f-2474-40be-bc19-8c4223f97173	d43ca79b-07de-4ceb-8e3e-6898c30c85dd	ed856fbc-6a3a-4cf4-9ed6-7a946490d90a	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	Precision Manufacturing Ltd Customer	10	320000.00	PO29769	INV87757	overdue	28800.00	2026-01-10	\N	\N	Sale of 10 units of Canon imageCLASS MF445dw	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
3ef71f3c-c9c0-4e0a-99e8-0c31dee9da1d	6786bf47-38e0-4276-b435-010e156e9cda	f69b743f-d29a-4a61-92cb-b388e2750879	e03c5d7b-6be1-43da-a72b-c2f60ae9863f	Assembly Line Systems Customer	6	48000.00	PO40173	INV46665	partial	4320.00	2026-02-03	\N	\N	Sale of 6 units of Network Print Server	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
cd34ba94-995c-4821-832d-771039b8bb89	24f066f8-baaf-4b93-a030-66950ae1aa53	88981683-f904-43df-a4b8-ff28fc31c186	35417c40-2a83-4e3d-bca2-447f4304f7b3	Pharma Dynamics Customer	10	180000.00	PO11981	INV76735	partial	12600.00	2025-11-24	\N	\N	Sale of 10 units of HP OfficeJet Pro 9015	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
19b6047b-7908-4b3d-9340-9e3685b52ff3	\N	88981683-f904-43df-a4b8-ff28fc31c186	09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	Retail Tech Inc Customer	19	342000.00	PO73296	INV51280	partial	23940.00	2026-01-16	\N	\N	Sale of 19 units of HP OfficeJet Pro 9015	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e19f6a9e-3e44-4588-ab7f-3a4367c62c2a	f33ac0c3-3d1d-4117-9e0b-df5515a83727	d9bd400b-282a-485b-9532-0da13f9b29e9	43935cf9-b3be-4493-8927-06a5a6c04275	Retail Tech Inc Customer	6	5100.00	PO53723	INV17982	partial	714.00	2026-02-01	\N	\N	Sale of 6 units of HP Ink Cartridge 680 (Tri-color)	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
94f53b81-3836-4d41-a492-c3ec071f1f1b	\N	cbecc664-2ca8-4559-83a7-9ffa61b2d0fe	6fe86a87-d903-4f41-93fc-e63196c3af1a	FinTech Solutions Customer	16	7200.00	PO97120	INV73189	partial	1080.00	2026-01-17	\N	\N	Sale of 16 units of Epson Ink Bottle T664 (Black)	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
59c4caa1-b1f0-4e90-82db-86f25f3c6d24	24ec9695-6282-4b99-80db-fd20becbf39d	a3cfad26-ad47-4de1-80fa-60120e384c39	d8699681-b89d-4914-a9e1-4cb5f15feeb2	Training Solutions Inc Customer	16	400000.00	PO65931	INV88088	partial	32000.00	2025-12-30	\N	\N	Sale of 16 units of HP LaserJet Pro M404dn	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
0b75641a-9d46-4ba1-bdd4-efacbc602667	01adcd72-9019-473b-aad3-10837f6a002a	a1858fbd-78af-467e-840b-92a8c6f12720	20a1bad5-7a19-47b2-afeb-55d630ee5f13	Assembly Line Systems Customer	16	720000.00	PO13287	INV35148	partial	72000.00	2025-12-19	\N	\N	Sale of 16 units of Xerox VersaLink C405	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
3ee32923-1dbf-4bea-8ca4-fd2e4296d3fb	\N	88981683-f904-43df-a4b8-ff28fc31c186	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	Medical Equipment Corp Customer	9	162000.00	PO60822	INV65207	partial	11340.00	2025-12-16	\N	\N	Sale of 9 units of HP OfficeJet Pro 9015	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
17f132c2-1e99-4159-8c44-cf59bdd32462	d0ba6c45-3eb6-4408-9a52-00c1c0c8dff8	f03c7ef2-88e1-47ae-a0e2-50de9c5f8e01	14a3756a-5a80-460a-90b2-96f572cffd76	Steel Works Inc Customer	18	63000.00	PO99092	INV89614	paid	7560.00	2025-11-22	\N	\N	Sale of 18 units of HP Toner CF410A (Black)	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.settings (id, key, value, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, title, description, type, status, priority, due_date, due_time, assigned_to, created_by, completed_at, related_to_type, related_to_id, created_at, updated_at) FROM stdin;
8736d0f0-b305-4ad3-9c8c-3de3047463b4	Follow-up: Follow up	Complete follow-up activity for the opportunity	Follow-up	completed	Medium	2026-04-06	\N	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	14a3756a-5a80-460a-90b2-96f572cffd76	2026-02-20 15:06:19.513832+05:30	lead	18dec920-268e-452a-85e1-d5f34fe8482d	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
96733557-e589-46b9-8b32-8ba901a549b1	Call: Close deal	Complete call activity for the opportunity	Call	completed	Urgent	2026-04-07	\N	1b45ba6b-98f7-407b-826c-5ce61d112a0f	d8699681-b89d-4914-a9e1-4cb5f15feeb2	2026-02-20 15:06:19.513879+05:30	deal	a5ad7ecf-72e7-48b8-a6f1-bbab1b565cce	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
dcdbe2f5-2aef-4737-98e4-cb0d1be1505a	Email: Schedule demo	Complete email activity for the opportunity	Email	pending	Low	2026-03-25	\N	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	\N	deal	80b2c991-381e-4a99-a1fe-9d0de90de342	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
45574472-6ad6-4d6c-936f-165dcee2ae43	Call: Close deal	Complete call activity for the opportunity	Call	pending	Medium	2026-03-24	\N	5b5738bf-2222-4ca7-90bc-bd05b58cded4	5b5738bf-2222-4ca7-90bc-bd05b58cded4	\N	deal	b34b2c7d-6467-4fc2-a58e-cecee86a42cc	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
86e88f29-8ecb-42bc-9dfa-ab5531b52c6c	Meeting: Send proposal	Complete meeting activity for the opportunity	Meeting	pending	Low	2026-04-17	\N	09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	\N	deal	a2ff46e9-0470-46f3-a915-87cc921b7334	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
fa25f893-60e9-4fe2-886d-920f8432d739	Call: Schedule demo	Complete call activity for the opportunity	Call	pending	Medium	2026-04-12	\N	f9701eca-09f1-48b3-95b8-9d61684cac10	1b45ba6b-98f7-407b-826c-5ce61d112a0f	\N	lead	99626269-5f43-4da1-b2fe-2834037a1ead	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
1729ba45-42d2-4d97-84e0-5b405243db17	Follow-up: Schedule demo	Complete follow-up activity for the opportunity	Follow-up	pending	Low	2026-04-10	\N	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	6190aefe-9845-4000-ab34-5423f0982d38	\N	deal	62027fd2-0fd0-47b5-ad25-15c9030e69e0	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
10bddfbe-257e-4834-bdc3-360ad66daf17	Follow-up: Schedule demo	Complete follow-up activity for the opportunity	Follow-up	in_progress	Medium	2026-03-27	\N	1d3255e6-5d5b-4f5b-b3d6-73f01eebf427	6190aefe-9845-4000-ab34-5423f0982d38	\N	deal	08c251ff-7b46-4543-9211-47a7bb67f1a8	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
c6394df9-2668-422a-9894-0c0110165d67	Call: Close deal	Complete call activity for the opportunity	Call	in_progress	Urgent	2026-04-19	\N	11f1c307-f3cc-4904-90cb-b97f89fc9d43	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	\N	deal	336332c6-5274-4140-9e2a-75c1bdab38a5	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
50a7ca63-dfe7-45a9-8c54-048fbea38f59	Proposal: Send proposal	Complete proposal activity for the opportunity	Proposal	completed	Low	2026-04-16	\N	6190aefe-9845-4000-ab34-5423f0982d38	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	2026-02-20 15:06:19.514032+05:30	deal	a5310e3b-7db2-4303-8d3b-7789a0d5a8d8	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
0b574a1b-2a4b-4cec-90a2-52f6a6e8475e	Follow-up: Discuss pricing	Complete follow-up activity for the opportunity	Follow-up	pending	Urgent	2026-03-26	\N	35417c40-2a83-4e3d-bca2-447f4304f7b3	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	\N	lead	40f8d6e7-8b6b-4de5-accd-a9d8e05d77a1	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
fd6facf5-2faa-44ab-94b2-efc9bd274a97	Meeting: Schedule demo	Complete meeting activity for the opportunity	Meeting	cancelled	Urgent	2026-04-15	\N	6fe86a87-d903-4f41-93fc-e63196c3af1a	6190aefe-9845-4000-ab34-5423f0982d38	\N	lead	9e1e68e9-ed87-4437-836a-0f683e25c00c	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
46b24032-9a98-48b9-97a1-f4ffe0c2850d	Call: Discuss pricing	Complete call activity for the opportunity	Call	completed	Urgent	2026-04-01	\N	e03c5d7b-6be1-43da-a72b-c2f60ae9863f	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	2026-02-20 15:06:19.514086+05:30	deal	1accd038-b4f3-449e-9abc-f2cbf6160df5	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
ed6f32b0-2643-47f9-bd81-755ade37278b	Follow-up: Discuss pricing	Complete follow-up activity for the opportunity	Follow-up	in_progress	Urgent	2026-04-19	\N	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	\N	lead	01806a05-3adf-4b08-9f5c-f35ec4c8c774	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
c70ba099-03e6-4030-b8a7-ab27147b56f6	Follow-up: Send proposal	Complete follow-up activity for the opportunity	Follow-up	cancelled	Urgent	2026-04-13	\N	20a1bad5-7a19-47b2-afeb-55d630ee5f13	14a3756a-5a80-460a-90b2-96f572cffd76	\N	lead	8f5e0834-3854-46e7-a1f3-ac4456d52cfe	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
68b054a9-2384-4c4c-b599-a3c89e91696c	Email: Follow up	Complete email activity for the opportunity	Email	cancelled	High	2026-04-16	\N	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	\N	deal	21060ad7-3239-4629-9bf9-ff7e8b9f2805	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
79ffaf27-1638-49e2-ad4d-789a188c4ec7	Demo: Follow up	Complete demo activity for the opportunity	Demo	pending	High	2026-04-12	\N	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	6fe86a87-d903-4f41-93fc-e63196c3af1a	\N	lead	0a1da3cf-0d97-4f24-8ae3-541a080b9fdf	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
68d24ad8-aadf-4894-b209-a280d88c482f	Follow-up: Close deal	Complete follow-up activity for the opportunity	Follow-up	completed	Low	2026-04-02	\N	d8699681-b89d-4914-a9e1-4cb5f15feeb2	14a3756a-5a80-460a-90b2-96f572cffd76	2026-02-20 15:06:19.514173+05:30	deal	26ee1a2d-2312-42fd-8e1a-cac598c9675d	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
31fd1c90-f478-4477-bfd1-d621bbd491a5	Meeting: Send proposal	Complete meeting activity for the opportunity	Meeting	in_progress	Urgent	2026-03-23	\N	11f1c307-f3cc-4904-90cb-b97f89fc9d43	d8699681-b89d-4914-a9e1-4cb5f15feeb2	\N	lead	18dec920-268e-452a-85e1-d5f34fe8482d	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
a57d72fe-8ca8-4776-9a2e-8f26b377d7cb	Proposal: Send proposal	Complete proposal activity for the opportunity	Proposal	in_progress	Low	2026-04-05	\N	20a1bad5-7a19-47b2-afeb-55d630ee5f13	6fe86a87-d903-4f41-93fc-e63196c3af1a	\N	deal	29632424-626c-48ef-b0fe-b494adc997e9	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
fe354329-ee70-4e0e-8f12-094e789e3a17	Proposal: Send proposal	Complete proposal activity for the opportunity	Proposal	cancelled	Urgent	2026-03-25	\N	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	43935cf9-b3be-4493-8927-06a5a6c04275	\N	lead	9e6bc6b3-d0cc-45ac-92f3-ac0152679b75	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
c6f5f43a-e069-45bd-a00d-548b41a31300	Email: Close deal	Complete email activity for the opportunity	Email	completed	Medium	2026-04-18	\N	6fe86a87-d903-4f41-93fc-e63196c3af1a	1b45ba6b-98f7-407b-826c-5ce61d112a0f	2026-02-20 15:06:19.514242+05:30	deal	7c31abeb-4fb6-4d9b-9f12-f78b884ba14c	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e9586d29-f371-4e0a-ab2a-6cb24ccc56ea	Meeting: Discuss pricing	Complete meeting activity for the opportunity	Meeting	in_progress	High	2026-04-01	\N	20a1bad5-7a19-47b2-afeb-55d630ee5f13	f9701eca-09f1-48b3-95b8-9d61684cac10	\N	deal	38c939d6-83bc-4bc2-a375-1a974ce6ba8c	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
dd9c94a9-d106-4f1a-bfc6-5a037ed6b4a7	Proposal: Follow up	Complete proposal activity for the opportunity	Proposal	cancelled	Low	2026-04-07	\N	21173b45-5320-4943-ba5a-be5a3d586cb1	1d3255e6-5d5b-4f5b-b3d6-73f01eebf427	\N	deal	959dbdda-20ef-4000-ab38-6e65b6b4cdd0	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
85fcf5de-ba9f-45fd-a236-b971a53a831f	Call: Discuss pricing	Complete call activity for the opportunity	Call	pending	Low	2026-04-06	\N	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	e03c5d7b-6be1-43da-a72b-c2f60ae9863f	\N	deal	2b79c472-2030-4dc4-9585-3dbb18e43030	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
b7877ee0-b2b7-4baa-9ec9-38fcc0c7329b	Demo: Follow up	Complete demo activity for the opportunity	Demo	pending	High	2026-03-29	\N	6190aefe-9845-4000-ab34-5423f0982d38	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	\N	lead	970a2bcc-d3ba-40a0-a7c4-e664d8373c34	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
6eab2451-a984-450a-96d1-39c74cc09c48	Proposal: Schedule demo	Complete proposal activity for the opportunity	Proposal	pending	Medium	2026-04-11	\N	43935cf9-b3be-4493-8927-06a5a6c04275	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	\N	deal	7c31abeb-4fb6-4d9b-9f12-f78b884ba14c	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
9c53341a-0b03-499a-a456-0ac3f9b897a9	Proposal: Schedule demo	Complete proposal activity for the opportunity	Proposal	pending	Low	2026-04-04	\N	1b45ba6b-98f7-407b-826c-5ce61d112a0f	d8699681-b89d-4914-a9e1-4cb5f15feeb2	\N	deal	21b5829d-98d0-4203-8c11-8cdbf0bfdf76	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
6dc44ced-e340-46a2-ab60-280fe5dbbbe7	Email: Schedule demo	Complete email activity for the opportunity	Email	cancelled	Urgent	2026-04-05	\N	5b5738bf-2222-4ca7-90bc-bd05b58cded4	1b45ba6b-98f7-407b-826c-5ce61d112a0f	\N	deal	797e537c-d9e1-48ff-bb97-ecb11177d04d	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
002f1fde-2df9-450e-90b4-2b3a78b4ce30	Meeting: Send proposal	Complete meeting activity for the opportunity	Meeting	in_progress	Medium	2026-04-13	\N	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	14a3756a-5a80-460a-90b2-96f572cffd76	\N	deal	705831dd-1871-48fe-9827-53313de44bf1	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
bdac1f60-dcab-49de-849c-5bcef78b12c2	Email: Schedule demo	Complete email activity for the opportunity	Email	pending	Urgent	2026-03-28	\N	43935cf9-b3be-4493-8927-06a5a6c04275	35417c40-2a83-4e3d-bca2-447f4304f7b3	\N	deal	b34b2c7d-6467-4fc2-a58e-cecee86a42cc	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
9c160b97-6e84-4699-80f7-bffcda1ffe4a	Demo: Schedule demo	Complete demo activity for the opportunity	Demo	completed	Low	2026-04-18	\N	512f9954-6c97-4118-b7fe-890710702f92	21173b45-5320-4943-ba5a-be5a3d586cb1	2026-02-20 15:06:19.514413+05:30	deal	29632424-626c-48ef-b0fe-b494adc997e9	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
09ff3e2f-896c-4418-94ba-b7038e835603	Demo: Discuss pricing	Complete demo activity for the opportunity	Demo	completed	Medium	2026-03-24	\N	21173b45-5320-4943-ba5a-be5a3d586cb1	6190aefe-9845-4000-ab34-5423f0982d38	2026-02-20 15:06:19.51443+05:30	lead	d9262974-aaba-42dc-8256-eee27d9bb800	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d954608e-37ff-495c-a3b6-60defdf1725c	Proposal: Close deal	Complete proposal activity for the opportunity	Proposal	completed	Medium	2026-04-01	\N	21173b45-5320-4943-ba5a-be5a3d586cb1	f9701eca-09f1-48b3-95b8-9d61684cac10	2026-02-20 15:06:19.514447+05:30	deal	d978b98c-f097-4cae-8be6-dd4056641c00	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
efc992d2-7fca-4635-af1d-8ba4e51e84d2	Meeting: Discuss pricing	Complete meeting activity for the opportunity	Meeting	in_progress	Urgent	2026-03-30	\N	6fe86a87-d903-4f41-93fc-e63196c3af1a	512f9954-6c97-4118-b7fe-890710702f92	\N	deal	62027fd2-0fd0-47b5-ad25-15c9030e69e0	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e5fc99e1-b6a5-4c82-8029-ebd2746aa744	Demo: Close deal	Complete demo activity for the opportunity	Demo	pending	Medium	2026-04-02	\N	35417c40-2a83-4e3d-bca2-447f4304f7b3	09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	\N	deal	0538e6c6-a315-458d-a292-b604893d54f4	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
44ebf651-6beb-46da-a5c5-4cf4a367aaa2	Call: Follow up	Complete call activity for the opportunity	Call	pending	Low	2026-03-27	\N	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	5b5738bf-2222-4ca7-90bc-bd05b58cded4	\N	deal	d978b98c-f097-4cae-8be6-dd4056641c00	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
5cd1b0c4-235e-450b-83de-df0a36ebb025	Follow-up: Send proposal	Complete follow-up activity for the opportunity	Follow-up	cancelled	Medium	2026-03-27	\N	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	\N	deal	bcc38f41-3f5d-4b8e-8761-21068e3f188d	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
685369d7-6333-4d4d-ba23-cc2ba26bd809	Meeting: Send proposal	Complete meeting activity for the opportunity	Meeting	in_progress	Medium	2026-04-19	\N	f9701eca-09f1-48b3-95b8-9d61684cac10	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	\N	lead	b5f5c0dc-0f60-4124-97f1-830ef281080c	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
f1b916e2-1551-4bc0-ad2e-8bdae2c2bb9a	Meeting: Follow up	Complete meeting activity for the opportunity	Meeting	cancelled	High	2026-04-10	\N	f9701eca-09f1-48b3-95b8-9d61684cac10	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	\N	deal	0aea196c-c17a-443b-8855-481c7aeab59f	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
ff17efd9-08c7-434a-97c1-d5d483ee4e8d	Follow-up: Send proposal	Complete follow-up activity for the opportunity	Follow-up	cancelled	Medium	2026-03-23	\N	35417c40-2a83-4e3d-bca2-447f4304f7b3	1d3255e6-5d5b-4f5b-b3d6-73f01eebf427	\N	lead	c25a80ca-aad2-4381-9044-e4438b35d8d5	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
1f27a6a4-d33a-4c96-b52c-d84e2f9fea65	Call: Follow up	Complete call activity for the opportunity	Call	cancelled	Urgent	2026-03-25	\N	6190aefe-9845-4000-ab34-5423f0982d38	1b45ba6b-98f7-407b-826c-5ce61d112a0f	\N	deal	3fcc2a08-80d3-49fa-ac47-4ba9a1d5c37f	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
dd750173-0dc7-44f6-9ea0-45a9e2cc082a	Demo: Close deal	Complete demo activity for the opportunity	Demo	completed	Low	2026-04-03	\N	14a3756a-5a80-460a-90b2-96f572cffd76	21173b45-5320-4943-ba5a-be5a3d586cb1	2026-02-20 15:06:19.514601+05:30	deal	fd11d3ab-ffe0-47d6-ba1b-a46e73e8fc5c	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
55d34ad5-1bb8-40ff-a282-b59c9c848014	Email: Close deal	Complete email activity for the opportunity	Email	pending	Urgent	2026-04-05	\N	20a1bad5-7a19-47b2-afeb-55d630ee5f13	6fe86a87-d903-4f41-93fc-e63196c3af1a	\N	lead	1ebc904f-8bf9-4b52-a1d4-56b0ad1a8a40	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
99da4cfe-4d14-4327-b72d-c42e62ab7b30	Demo: Follow up	Complete demo activity for the opportunity	Demo	pending	Medium	2026-04-21	\N	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	1b45ba6b-98f7-407b-826c-5ce61d112a0f	\N	lead	193471f6-48ee-40f9-a228-b01b29fb549d	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
85600d84-4e7a-48ad-9d47-9be9095bab20	Proposal: Follow up	Complete proposal activity for the opportunity	Proposal	in_progress	High	2026-03-22	\N	35417c40-2a83-4e3d-bca2-447f4304f7b3	512f9954-6c97-4118-b7fe-890710702f92	\N	deal	e39a882e-f6f8-4a9f-88b8-19fbaefc1aa6	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
f3ec6873-a8af-4a03-a088-07600305a942	Proposal: Schedule demo	Complete proposal activity for the opportunity	Proposal	completed	Low	2026-04-03	\N	6190aefe-9845-4000-ab34-5423f0982d38	6fe86a87-d903-4f41-93fc-e63196c3af1a	2026-02-20 15:06:19.514669+05:30	lead	29b05322-2bb9-4d58-a6f4-2339095c492f	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
f4f484f7-9474-4af2-99d0-de301e7d6c1a	Follow-up: Discuss pricing	Complete follow-up activity for the opportunity	Follow-up	completed	Low	2026-04-16	\N	09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	1d3255e6-5d5b-4f5b-b3d6-73f01eebf427	2026-02-20 15:06:19.514686+05:30	deal	9edb66b4-53c2-433f-9603-6c0d3d8d4a3a	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
dd81e4b6-e7cd-45da-bda2-8706c682ee5f	Email: Send proposal	Complete email activity for the opportunity	Email	completed	Low	2026-03-22	\N	f9701eca-09f1-48b3-95b8-9d61684cac10	f9701eca-09f1-48b3-95b8-9d61684cac10	2026-02-20 15:06:19.514703+05:30	deal	10770195-292c-465a-bd4d-8bd81943f965	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
40e2fc6c-e07c-4efa-97b6-725d23cd41a5	Follow-up: Discuss pricing	Complete follow-up activity for the opportunity	Follow-up	pending	Urgent	2026-03-26	\N	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	1b45ba6b-98f7-407b-826c-5ce61d112a0f	\N	deal	f80cd71f-89a6-4e43-9137-2aaa7bfbc406	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
67ce1865-497e-4781-9f03-5bcd1f4eb22d	Proposal: Send proposal	Complete proposal activity for the opportunity	Proposal	completed	Urgent	2026-04-16	\N	6190aefe-9845-4000-ab34-5423f0982d38	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	2026-02-20 15:06:19.514746+05:30	deal	797e537c-d9e1-48ff-bb97-ecb11177d04d	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
9e4a6410-ea1d-43cc-90f6-8d88a37800ed	Call: Close deal	Complete call activity for the opportunity	Call	completed	Medium	2026-04-03	\N	5b5738bf-2222-4ca7-90bc-bd05b58cded4	09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	2026-02-20 15:06:19.514763+05:30	deal	ed772fd0-39f9-4f66-af9c-0e9f829f4d50	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
4e7bc286-4df4-4890-919d-ccfa67092f39	Follow-up: Discuss pricing	Complete follow-up activity for the opportunity	Follow-up	pending	Medium	2026-04-12	\N	14a3756a-5a80-460a-90b2-96f572cffd76	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	\N	deal	1accd038-b4f3-449e-9abc-f2cbf6160df5	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d738ab44-a70e-40cc-91e4-3d1f919a0ca1	Call: Send proposal	Complete call activity for the opportunity	Call	cancelled	Urgent	2026-04-19	\N	1b45ba6b-98f7-407b-826c-5ce61d112a0f	5b5738bf-2222-4ca7-90bc-bd05b58cded4	\N	lead	43edea9d-35ec-43fb-a22a-fa07fc32f2c1	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
8b56d6f6-3176-4a5d-a028-ee768c140ae0	Proposal: Schedule demo	Complete proposal activity for the opportunity	Proposal	cancelled	Urgent	2026-04-14	\N	14a3756a-5a80-460a-90b2-96f572cffd76	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	\N	deal	bcc38f41-3f5d-4b8e-8761-21068e3f188d	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
27d88f57-f46e-4f08-a3f5-55777c57346c	Meeting: Schedule demo	Complete meeting activity for the opportunity	Meeting	completed	High	2026-04-10	\N	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	6fe86a87-d903-4f41-93fc-e63196c3af1a	2026-02-20 15:06:19.514833+05:30	deal	24eb1ac8-5dd4-48b5-9c1e-998e32788a7c	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
ebdddca1-2cc5-4a3e-a1c3-44a9ab17f08b	Email: Close deal	Complete email activity for the opportunity	Email	in_progress	Medium	2026-04-06	\N	20a1bad5-7a19-47b2-afeb-55d630ee5f13	14a3756a-5a80-460a-90b2-96f572cffd76	\N	lead	cbc0d378-88f5-4a78-b585-ee9312044b3b	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
09728f80-4850-4b83-bf5b-d45f34488275	Email: Follow up	Complete email activity for the opportunity	Email	pending	High	2026-03-23	\N	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	\N	deal	7f2e079d-cdab-4895-bfad-e11a3989cc86	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
3544b44a-03a5-45ca-abb7-f95346305550	Email: Follow up	Complete email activity for the opportunity	Email	in_progress	Medium	2026-04-12	\N	21173b45-5320-4943-ba5a-be5a3d586cb1	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	\N	deal	1dcc00ba-ff8e-489b-85d4-6ec7acadc0c3	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
1dfba137-f692-4b07-bea9-bb625ae885b8	Email: Follow up	Complete email activity for the opportunity	Email	completed	Urgent	2026-04-10	\N	d8699681-b89d-4914-a9e1-4cb5f15feeb2	f9701eca-09f1-48b3-95b8-9d61684cac10	2026-02-20 15:06:19.514901+05:30	lead	7d5b2413-91e3-466f-a9a5-30e995a5c3df	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
5969b1bb-d924-449e-961c-cc1ece587955	Call: Schedule demo	Complete call activity for the opportunity	Call	cancelled	Urgent	2026-04-01	\N	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	6190aefe-9845-4000-ab34-5423f0982d38	\N	lead	5dbea33c-6983-4719-a7c0-f55f6fd93abc	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
37b3d794-3f2c-4eb0-85d4-9d40f2a6f955	Proposal: Follow up	Complete proposal activity for the opportunity	Proposal	in_progress	Low	2026-03-30	\N	35417c40-2a83-4e3d-bca2-447f4304f7b3	e03c5d7b-6be1-43da-a72b-c2f60ae9863f	\N	lead	3bfe1485-ca31-4a05-8cfd-6769df2cb89b	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
8a59e59d-1e71-4602-8fef-c7ade00385d8	Demo: Send proposal	Complete demo activity for the opportunity	Demo	completed	Medium	2026-04-15	\N	6190aefe-9845-4000-ab34-5423f0982d38	21173b45-5320-4943-ba5a-be5a3d586cb1	2026-02-20 15:06:19.514996+05:30	lead	5350c2b2-634e-4f7e-9336-0983dfaa24f0	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e69a13d3-e043-4e5a-afa9-e5fa61d86ced	Meeting: Send proposal	Complete meeting activity for the opportunity	Meeting	pending	High	2026-04-06	\N	21173b45-5320-4943-ba5a-be5a3d586cb1	6190aefe-9845-4000-ab34-5423f0982d38	\N	deal	0aea196c-c17a-443b-8855-481c7aeab59f	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
0b8a1ff1-43bb-4f45-bf86-42fed41c192d	Email: Schedule demo	Complete email activity for the opportunity	Email	completed	Medium	2026-03-28	\N	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	43935cf9-b3be-4493-8927-06a5a6c04275	2026-02-20 15:06:19.51503+05:30	lead	918fee94-05af-4780-bc00-6fa82d16ef21	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
b91e0dad-ad8a-4b40-9e1c-63a9c410c546	Proposal: Send proposal	Complete proposal activity for the opportunity	Proposal	completed	Urgent	2026-04-05	\N	14a3756a-5a80-460a-90b2-96f572cffd76	35417c40-2a83-4e3d-bca2-447f4304f7b3	2026-02-20 15:06:19.515048+05:30	lead	b5f5c0dc-0f60-4124-97f1-830ef281080c	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
49363a7d-ac08-4677-9fe0-1d7f21491c0f	Follow-up: Discuss pricing	Complete follow-up activity for the opportunity	Follow-up	in_progress	Low	2026-04-21	\N	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	21173b45-5320-4943-ba5a-be5a3d586cb1	\N	deal	461984e6-ac19-4254-89e0-50694ac16bff	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
02460e2d-6e47-46af-8326-3601c426ee77	Meeting: Send proposal	Complete meeting activity for the opportunity	Meeting	pending	Urgent	2026-04-03	\N	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	11f1c307-f3cc-4904-90cb-b97f89fc9d43	\N	lead	93203e95-ead1-4b3f-9738-08f86d9da6c1	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
ada0059f-550a-476b-b559-f9b22f1c45d4	Proposal: Send proposal	Complete proposal activity for the opportunity	Proposal	pending	Low	2026-04-21	\N	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	e03c5d7b-6be1-43da-a72b-c2f60ae9863f	\N	deal	a48ab150-2732-42ae-9f4f-e5bf875ce60c	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
94998060-350d-47eb-a7a6-1e02ea037061	Proposal: Send proposal	Complete proposal activity for the opportunity	Proposal	in_progress	Low	2026-04-02	\N	14a3756a-5a80-460a-90b2-96f572cffd76	11f1c307-f3cc-4904-90cb-b97f89fc9d43	\N	deal	3fcc2a08-80d3-49fa-ac47-4ba9a1d5c37f	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
c596637b-66a8-4963-9ff5-4226c10bc26f	Follow-up: Discuss pricing	Complete follow-up activity for the opportunity	Follow-up	cancelled	Urgent	2026-03-25	\N	20a1bad5-7a19-47b2-afeb-55d630ee5f13	43935cf9-b3be-4493-8927-06a5a6c04275	\N	deal	3fcc2a08-80d3-49fa-ac47-4ba9a1d5c37f	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
8ee70c41-6a1d-4727-a747-276ef6e3e27c	Call: Schedule demo	Complete call activity for the opportunity	Call	cancelled	Medium	2026-03-24	\N	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	f9701eca-09f1-48b3-95b8-9d61684cac10	\N	lead	224bd719-63d6-42b9-8132-4cd39701c5f3	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
7a68c2ce-2a15-4d6f-acb0-d99ef687d335	Proposal: Schedule demo	Complete proposal activity for the opportunity	Proposal	pending	Urgent	2026-04-04	\N	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	\N	deal	6aac3a93-20c1-4ccf-b107-2741071771bd	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
683532c6-6cac-427a-a68a-9cc3108493e1	Email: Discuss pricing	Complete email activity for the opportunity	Email	cancelled	Urgent	2026-03-28	\N	d8699681-b89d-4914-a9e1-4cb5f15feeb2	d8699681-b89d-4914-a9e1-4cb5f15feeb2	\N	deal	0e836ab0-3e28-4bad-a0fc-766eede19547	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
bb3db140-731e-4826-9a7f-0dbfb68af1c0	Proposal: Schedule demo	Complete proposal activity for the opportunity	Proposal	in_progress	Low	2026-04-02	\N	6fe86a87-d903-4f41-93fc-e63196c3af1a	14a3756a-5a80-460a-90b2-96f572cffd76	\N	lead	2050383f-6bba-4a2b-94a9-165f75475314	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
bcb792a9-6c10-4f81-a0f7-4ce9a1d0689b	Proposal: Discuss pricing	Complete proposal activity for the opportunity	Proposal	in_progress	Medium	2026-03-30	\N	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	e03c5d7b-6be1-43da-a72b-c2f60ae9863f	\N	lead	1ffad7ef-9727-443e-82c1-1b512e9b5549	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
6a40678e-3d9b-45f8-b53e-4ea0fa562bdc	Call: Schedule demo	Complete call activity for the opportunity	Call	pending	Low	2026-04-05	\N	6190aefe-9845-4000-ab34-5423f0982d38	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	\N	deal	7f6a8fbe-e2ac-4858-8e77-2e1f0a593294	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e4683696-5c64-46ab-bd76-5ecdd967bdd9	Follow-up: Close deal	Complete follow-up activity for the opportunity	Follow-up	in_progress	Medium	2026-04-07	\N	20a1bad5-7a19-47b2-afeb-55d630ee5f13	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	\N	deal	0aea196c-c17a-443b-8855-481c7aeab59f	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
594c1b27-df9f-4d9b-98a9-9b04b2ecdc4b	Demo: Close deal	Complete demo activity for the opportunity	Demo	in_progress	Medium	2026-04-13	\N	11f1c307-f3cc-4904-90cb-b97f89fc9d43	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	\N	deal	aa259e91-638c-4f70-98e8-935b7b56981a	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
faaca916-9b8d-4baa-96d0-f851a57d99b6	Proposal: Send proposal	Complete proposal activity for the opportunity	Proposal	cancelled	High	2026-04-01	\N	e03c5d7b-6be1-43da-a72b-c2f60ae9863f	512f9954-6c97-4118-b7fe-890710702f92	\N	lead	828de837-cdda-47f9-8eb6-851809d2a14f	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e9eccb80-a32c-4cc5-90b2-0c343c8ad121	Email: Close deal	Complete email activity for the opportunity	Email	pending	Low	2026-04-15	\N	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	\N	lead	1ebc904f-8bf9-4b52-a1d4-56b0ad1a8a40	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
a8108cff-4db7-4242-ad29-37b5393286fd	Demo: Follow up	Complete demo activity for the opportunity	Demo	completed	Urgent	2026-04-17	\N	14a3756a-5a80-460a-90b2-96f572cffd76	5b5738bf-2222-4ca7-90bc-bd05b58cded4	2026-02-20 15:06:19.515328+05:30	deal	aa259e91-638c-4f70-98e8-935b7b56981a	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
dc903bc6-2a92-46a9-8673-78c5515c3a0b	Meeting: Discuss pricing	Complete meeting activity for the opportunity	Meeting	in_progress	Medium	2026-04-01	\N	09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	1b45ba6b-98f7-407b-826c-5ce61d112a0f	\N	lead	7a189e92-a65c-46aa-b422-4f8591a1a95c	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
9e8e714f-3c7d-45f4-95c1-2c74a9b8c308	Meeting: Close deal	Complete meeting activity for the opportunity	Meeting	cancelled	Low	2026-03-26	\N	512f9954-6c97-4118-b7fe-890710702f92	20a1bad5-7a19-47b2-afeb-55d630ee5f13	\N	deal	3deb5028-bbf1-4667-86de-4a965dc46154	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
73ca81d8-5cf9-4b42-91fc-4274acb0b861	Demo: Close deal	Complete demo activity for the opportunity	Demo	completed	High	2026-04-10	\N	f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	6190aefe-9845-4000-ab34-5423f0982d38	2026-02-20 15:06:19.51538+05:30	deal	0b70cac7-c6b9-4618-845d-49d9bd0e533d	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e13fb02a-8859-4b0f-a795-8bbf665e0a2e	Demo: Follow up	Complete demo activity for the opportunity	Demo	completed	Low	2026-04-08	\N	512f9954-6c97-4118-b7fe-890710702f92	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	2026-02-20 15:06:19.515397+05:30	lead	77bf8ef8-8a20-473e-8f00-291f1a7c758a	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
54dba419-403b-40f0-a6b8-505ceca334ef	Meeting: Schedule demo	Complete meeting activity for the opportunity	Meeting	cancelled	Medium	2026-04-15	\N	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	43935cf9-b3be-4493-8927-06a5a6c04275	\N	deal	336332c6-5274-4140-9e2a-75c1bdab38a5	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d5db9534-4f9b-4a02-8ca5-03b3fbf25b1b	Demo: Close deal	Complete demo activity for the opportunity	Demo	completed	High	2026-04-15	\N	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	f9701eca-09f1-48b3-95b8-9d61684cac10	2026-02-20 15:06:19.515433+05:30	lead	0de44766-bcb9-41dc-bd6a-6d6e9075a158	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
301eb981-7205-4b01-a6c8-90828a5a17c0	Demo: Send proposal	Complete demo activity for the opportunity	Demo	in_progress	High	2026-04-02	\N	6190aefe-9845-4000-ab34-5423f0982d38	09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	\N	deal	d978b98c-f097-4cae-8be6-dd4056641c00	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
40f84a49-9af7-473d-b3ed-9b568ee29519	Proposal: Schedule demo	Complete proposal activity for the opportunity	Proposal	in_progress	High	2026-04-02	\N	6fe86a87-d903-4f41-93fc-e63196c3af1a	11f1c307-f3cc-4904-90cb-b97f89fc9d43	\N	deal	c3645a50-c9ed-4644-9411-a81adb04f413	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
b3c981b6-2695-4618-8131-6905fd2af82b	Follow-up: Discuss pricing	Complete follow-up activity for the opportunity	Follow-up	pending	Low	2026-04-15	\N	05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	35417c40-2a83-4e3d-bca2-447f4304f7b3	\N	lead	01806a05-3adf-4b08-9f5c-f35ec4c8c774	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d877064d-61a8-413b-bbcc-0c0fd294a516	Proposal: Close deal	Complete proposal activity for the opportunity	Proposal	completed	Low	2026-04-20	\N	35417c40-2a83-4e3d-bca2-447f4304f7b3	14a3756a-5a80-460a-90b2-96f572cffd76	2026-02-20 15:06:19.515501+05:30	lead	db1dd5ca-4e75-4893-b6a7-e230126d2c52	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
47d1cac7-d2df-474c-b026-58013e2e14be	Demo: Follow up	Complete demo activity for the opportunity	Demo	completed	Urgent	2026-04-05	\N	d8699681-b89d-4914-a9e1-4cb5f15feeb2	512f9954-6c97-4118-b7fe-890710702f92	2026-02-20 15:06:19.515518+05:30	deal	705831dd-1871-48fe-9827-53313de44bf1	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
cfd3506d-c75a-404b-b3bd-6276b7e98b82	Email: Close deal	Complete email activity for the opportunity	Email	in_progress	High	2026-03-28	\N	21173b45-5320-4943-ba5a-be5a3d586cb1	512f9954-6c97-4118-b7fe-890710702f92	\N	lead	40f8d6e7-8b6b-4de5-accd-a9d8e05d77a1	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
6ad07226-37c8-4064-bf77-c80d59a6f008	Demo: Schedule demo	Complete demo activity for the opportunity	Demo	pending	Urgent	2026-03-23	\N	35417c40-2a83-4e3d-bca2-447f4304f7b3	43935cf9-b3be-4493-8927-06a5a6c04275	\N	deal	6aac3a93-20c1-4ccf-b107-2741071771bd	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
8230199c-4917-4d53-b06f-3f9e35511b3a	Demo: Schedule demo	Complete demo activity for the opportunity	Demo	in_progress	High	2026-04-08	\N	d8699681-b89d-4914-a9e1-4cb5f15feeb2	e03c5d7b-6be1-43da-a72b-c2f60ae9863f	\N	lead	1b989478-3df4-401e-958a-def6fc1fbbd5	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
73e7ca0b-ad84-4298-9a55-cbde1b537dc2	Follow-up: Schedule demo	Complete follow-up activity for the opportunity	Follow-up	pending	Low	2026-04-05	\N	43935cf9-b3be-4493-8927-06a5a6c04275	6190aefe-9845-4000-ab34-5423f0982d38	\N	deal	0aea196c-c17a-443b-8855-481c7aeab59f	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
86784df7-45b7-463b-be60-0f7bb7b83a9f	Email: Send proposal	Complete email activity for the opportunity	Email	pending	High	2026-03-28	\N	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	9f501dc2-1b1c-4c67-9541-55e9f6538bfa	\N	deal	ed772fd0-39f9-4f66-af9c-0e9f829f4d50	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
0ff73e0e-a234-4ee0-903b-6fca968d6a0f	Follow-up: Close deal	Complete follow-up activity for the opportunity	Follow-up	completed	Low	2026-03-31	\N	43935cf9-b3be-4493-8927-06a5a6c04275	e03c5d7b-6be1-43da-a72b-c2f60ae9863f	2026-02-20 15:06:19.51562+05:30	deal	7ec21467-ab76-49c0-96dd-3d72db37e0fc	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
0708a868-8c95-416a-a5ac-bca553de6e43	Demo: Discuss pricing	Complete demo activity for the opportunity	Demo	pending	Medium	2026-04-01	\N	20a1bad5-7a19-47b2-afeb-55d630ee5f13	11f1c307-f3cc-4904-90cb-b97f89fc9d43	\N	deal	e39a882e-f6f8-4a9f-88b8-19fbaefc1aa6	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, name, role, department, phone, employee_id, manager_id, is_active, must_change_password, monthly_target, last_login, view_access, tag, dashboard_preferences, created_at, updated_at) FROM stdin;
14a3756a-5a80-460a-90b2-96f572cffd76	sales4@comprint.com	$2b$12$wQXJBgL8WqfGmZX95JefYeX3TyE6.gRVV8zY589e831UQ602kppy2	Vikram Menon	sales	Sales	+91 9467152521	EMP203	21173b45-5320-4943-ba5a-be5a3d586cb1	t	f	321462.00	\N	own	\N	{"widgets": [], "lastModified": null}	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
f9701eca-09f1-48b3-95b8-9d61684cac10	sales5@comprint.com	$2b$12$kHpy2JqzeAdkBC5yGbibMuaq26Zv2HTLu4ZsJZuWyB6jvjOA0sq9C	Divya Kumar	sales	Sales	+91 9276023787	EMP204	6190aefe-9845-4000-ab34-5423f0982d38	t	f	446114.00	\N	own	\N	{"widgets": [], "lastModified": null}	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
f00c5bda-3bdf-49d3-9f8f-ba8d8ffe0881	sales6@comprint.com	$2b$12$RZ2VYafXlW8d8ijYsDLnWOYXPIb.VkRyg/Wg.H1CVDHX6TqEbTM7e	Sanjay Reddy	sales	Sales	+91 7410760022	EMP205	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	t	f	447359.00	\N	own	\N	{"widgets": [], "lastModified": null}	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
21173b45-5320-4943-ba5a-be5a3d586cb1	manager1@comprint.com	$2b$12$Rvh7tuXB1zJ7gkOwFDvZjuGGVZHfmLsl6ogYMEkcXp2piFGABovCq	Sanjay Iyer	manager	Sales	+91 8795413919	EMP100	\N	t	f	816889.00	\N	team	\N	{"widgets": [], "lastModified": null}	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
6190aefe-9845-4000-ab34-5423f0982d38	manager2@comprint.com	$2b$12$ZZdz3lWhSzgmVcrbc8ihbOZSaqzy5i3YPgCbwONH8w.D51ZbBCZU.	Arjun Singh	manager	Sales	+91 9811117745	EMP101	\N	t	f	823688.00	\N	team	\N	{"widgets": [], "lastModified": null}	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	manager3@comprint.com	$2b$12$mahYmsWSiuEhEWWM4werRe7T8/3Hd.wzkbCmYkG.AXY8Tw4y4eBvu	Isha Menon	manager	Sales	+91 8982616190	EMP102	\N	t	f	943506.00	\N	team	\N	{"widgets": [], "lastModified": null}	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
20a1bad5-7a19-47b2-afeb-55d630ee5f13	sales1@comprint.com	$2b$12$NirbsbH9WgzN5KYF9IU/0OAJ/cjcGYgow5rSnzGscGO.PyOJA2S7C	Karan Reddy	sales	Sales	+91 8203745654	EMP200	21173b45-5320-4943-ba5a-be5a3d586cb1	t	f	286324.00	\N	own	\N	{"widgets": [], "lastModified": null}	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
e03c5d7b-6be1-43da-a72b-c2f60ae9863f	sales2@comprint.com	$2b$12$b4Rim6Ky5Bif6I6bObZ4Qufdk/9Yt/ghAHqoFWvSl3kK8RsXejFzG	Rahul Desai	sales	Sales	+91 9362959080	EMP201	6190aefe-9845-4000-ab34-5423f0982d38	t	f	312997.00	\N	own	\N	{"widgets": [], "lastModified": null}	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
9f501dc2-1b1c-4c67-9541-55e9f6538bfa	sales3@comprint.com	$2b$12$Q15lSvsvWpQdbHwO6Z/siOR0h2RDypPhmetumBn7KhcRjW7aKyGxS	Neha Shah	sales	Sales	+91 9943960642	EMP202	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	t	f	391814.00	\N	own	\N	{"widgets": [], "lastModified": null}	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
d8699681-b89d-4914-a9e1-4cb5f15feeb2	sales7@comprint.com	$2b$12$DmZ6q78oYYpl2J1KOSrCReS2Ko2oUKE/3xgwnmXp0NG1F..yCVO3m	Anjali Reddy	sales	Sales	+91 8142851976	EMP206	21173b45-5320-4943-ba5a-be5a3d586cb1	t	f	255983.00	\N	own	\N	{"widgets": [], "lastModified": null}	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
35417c40-2a83-4e3d-bca2-447f4304f7b3	sales8@comprint.com	$2b$12$V7iq0qT5mcAyAdwA4ACBt.mOu/ePP6HBrnqEWel/7AjHL.nWMTyVO	Karan Kumar	sales	Sales	+91 7142439493	EMP207	6190aefe-9845-4000-ab34-5423f0982d38	t	f	265575.00	\N	own	\N	{"widgets": [], "lastModified": null}	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
1b45ba6b-98f7-407b-826c-5ce61d112a0f	sales9@comprint.com	$2b$12$R/vGL7RMyOLzxKeH1w0mOOGFhBMmtNqh7DxEN45YISNNNaGVtNUW.	Vikram Kumar	sales	Sales	+91 7683582469	EMP208	9c15a16e-575f-4f6d-bc18-f04a3eacc6fc	t	f	363669.00	\N	own	\N	{"widgets": [], "lastModified": null}	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
11f1c307-f3cc-4904-90cb-b97f89fc9d43	sales10@comprint.com	$2b$12$4XeDU5wZTwBZ0MJ0kS4QueMjja7sG4dqmxPnVWJEtix8ZZ.vd0HXW	Priya Iyer	sales	Sales	+91 7554995491	EMP209	21173b45-5320-4943-ba5a-be5a3d586cb1	t	f	318570.00	\N	own	\N	{"widgets": [], "lastModified": null}	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
512f9954-6c97-4118-b7fe-890710702f92	support1@comprint.com	$2b$12$kxHcbyR9yMdh9vgrhLgQXOtjTGxp/NjAeL8LFYnvjx9HM.9ZHlvYS	Amit Nair	support	Customer Support	+91 9726212132	EMP300	\N	t	f	\N	\N	all	\N	{"widgets": [], "lastModified": null}	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
6fe86a87-d903-4f41-93fc-e63196c3af1a	support2@comprint.com	$2b$12$XE7yiS4hI9iUEO0Mb5xWx.BHRunS9WJL6to3HmQOGROuwowZtHMeK	Divya Singh	support	Customer Support	+91 8582489259	EMP301	\N	t	f	\N	\N	all	\N	{"widgets": [], "lastModified": null}	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
05ff6a28-0d13-4c7e-b7bd-2c03a4f4016d	support3@comprint.com	$2b$12$/hpjVsgqmJGhzU2DfhhVXeKs6YGPW5X/WUG8wG4XJnstXPkvyqsj.	Rahul Desai	support	Customer Support	+91 8523395179	EMP302	\N	t	f	\N	\N	all	\N	{"widgets": [], "lastModified": null}	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
09b9d38c-9ffc-481e-ae32-a7fb1af34ccf	presales1@comprint.com	$2b$12$5x1IJcydqTFuZWw3Jr2Sl.lQjpPlSXyomz0Mc7FwWAcg5PVZIScqG	Sneha Joshi	presales	Presales	+91 7632551799	EMP400	\N	t	f	\N	\N	presales	\N	{"widgets": [], "lastModified": null}	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
5b5738bf-2222-4ca7-90bc-bd05b58cded4	presales2@comprint.com	$2b$12$e//jf/uqv2L1w6leP.tG8OthOlVakYI5wMEvbxC3a1VNdW9z6FG8i	Isha Gupta	presales	Presales	+91 8019727570	EMP401	\N	t	f	\N	\N	presales	\N	{"widgets": [], "lastModified": null}	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
1d3255e6-5d5b-4f5b-b3d6-73f01eebf427	presales3@comprint.com	$2b$12$1QjPIKdGiidIVLke2oHiOe.BsDEA0/ghsX3L/rVl1lwx82kk//16S	Rohan Patel	presales	Presales	+91 8923734320	EMP402	\N	t	f	\N	\N	presales	\N	{"widgets": [], "lastModified": null}	2026-02-20 15:06:15.669553	2026-02-20 15:06:15.669553
43935cf9-b3be-4493-8927-06a5a6c04275	admin@comprint.com	$2b$12$ra4l/B3l0hW7e/aQURdQY.Jjltma2HX4eoYOlCEQ1O.6TbENTdFlC	Admin User	admin	Management	+91 8339164917	EMP001	\N	t	f	\N	2026-02-24 08:29:57.681563+05:30	all	\N	{"widgets": [{"id": "sales-team", "order": 1, "visible": true, "grid_position": null}, {"id": "monthly", "order": 2, "visible": true, "grid_position": null}, {"id": "partners", "order": 3, "visible": true, "grid_position": null}, {"id": "pipeline", "order": 4, "visible": true, "grid_position": null}, {"id": "growth", "order": 5, "visible": true, "grid_position": null}, {"id": "products", "order": 6, "visible": true, "grid_position": null}, {"id": "leads", "order": 7, "visible": true, "grid_position": null}, {"id": "top-partners", "order": 9, "visible": true, "grid_position": null}, {"id": "recent-sales", "order": 10, "visible": true, "grid_position": null}, {"id": "revenue-trend", "order": 11, "visible": true, "grid_position": null}, {"id": "pipeline-chart", "order": 12, "visible": true, "grid_position": null}, {"id": "assignee-summary", "order": 8, "visible": true, "grid_position": null}, {"id": "leads-distribution", "order": 13, "visible": true, "grid_position": null}, {"id": "tasks", "order": 14, "visible": true, "grid_position": null}], "last_modified": "2026-02-24T08:29:57.941Z"}	2026-02-20 15:06:15.669553	2026-02-24 13:59:57.95631
\.


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- Name: carepacks carepacks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carepacks
    ADD CONSTRAINT carepacks_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: deal_activities deal_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_activities
    ADD CONSTRAINT deal_activities_pkey PRIMARY KEY (id);


--
-- Name: deal_line_items deal_line_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_line_items
    ADD CONSTRAINT deal_line_items_pkey PRIMARY KEY (id);


--
-- Name: deals deals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: emails emails_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emails
    ADD CONSTRAINT emails_pkey PRIMARY KEY (id);


--
-- Name: lead_activities lead_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: master_categories master_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_categories
    ADD CONSTRAINT master_categories_pkey PRIMARY KEY (id);


--
-- Name: master_dropdowns master_dropdowns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_dropdowns
    ADD CONSTRAINT master_dropdowns_pkey PRIMARY KEY (id);


--
-- Name: master_locations master_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_locations
    ADD CONSTRAINT master_locations_pkey PRIMARY KEY (id);


--
-- Name: master_oems master_oems_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_oems
    ADD CONSTRAINT master_oems_pkey PRIMARY KEY (id);


--
-- Name: master_partner_types master_partner_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_partner_types
    ADD CONSTRAINT master_partner_types_pkey PRIMARY KEY (id);


--
-- Name: master_verticals master_verticals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_verticals
    ADD CONSTRAINT master_verticals_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: partners partners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: quote_line_items quote_line_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_line_items
    ADD CONSTRAINT quote_line_items_pkey PRIMARY KEY (id);


--
-- Name: quote_selected_terms quote_selected_terms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_selected_terms
    ADD CONSTRAINT quote_selected_terms_pkey PRIMARY KEY (id);


--
-- Name: quote_terms quote_terms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_terms
    ADD CONSTRAINT quote_terms_pkey PRIMARY KEY (id);


--
-- Name: quotes quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);


--
-- Name: quotes quotes_quote_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_quote_number_key UNIQUE (quote_number);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sales_entries sales_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_entries
    ADD CONSTRAINT sales_entries_pkey PRIMARY KEY (id);


--
-- Name: settings settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_key_key UNIQUE (key);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: role_permissions uq_role_permissions_role_entity; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT uq_role_permissions_role_entity UNIQUE (role_id, entity);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id);


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: sales_entries sales_entries_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_entries
    ADD CONSTRAINT sales_entries_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id);


--
-- PostgreSQL database dump complete
--

\unrestrict PoBZbPYkYcEhUzrlEWugKloHaXppZqPr3SaW1ehXAakhNJ38yavUnvLTacACZXo

