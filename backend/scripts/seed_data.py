"""
Seed Data Script for Comprint CRM

This script populates the database with comprehensive test data including:
- Users (various roles and departments)
- Accounts (different industries and sizes)
- Contacts (various designations)
- Leads (different stages and priorities)
- Deals (various stages and values)
- Products (different categories)
- Partners (different tiers and types)
- Tasks (various types and statuses)
- Sales Entries
- Calendar Events
- Email Templates

Usage:
    poetry run python scripts/seed_data.py
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, date, timedelta
from decimal import Decimal
import random

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import bcrypt

from app.models import (
    User,
    Account,
    Contact,
    Lead,
    Deal,
    Product,
    Partner,
    Task,
    SalesEntry,
    CalendarEvent,
    EmailTemplate,
    Role,
)
from app.config import settings

# Database setup
engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt. Truncates to 72 bytes (bcrypt limit)."""
    password_bytes = password.encode("utf-8")[:72]  # bcrypt max is 72 bytes
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")


# Sample data generators
class DataGenerator:
    """Generate realistic sample data."""

    # Company names by industry
    COMPANIES = {
        "Technology": [
            "TechCorp Solutions",
            "Digital Innovations Inc",
            "CloudTech Systems",
            "DataFlow Technologies",
            "AI Dynamics",
            "CyberSafe Solutions",
        ],
        "Manufacturing": [
            "Precision Manufacturing Ltd",
            "Industrial Solutions Corp",
            "AutoParts Manufacturing",
            "Steel Works Inc",
            "Assembly Line Systems",
        ],
        "Healthcare": [
            "MediCare Solutions",
            "HealthTech Innovations",
            "Pharma Dynamics",
            "Medical Equipment Corp",
            "HealthFirst Systems",
        ],
        "Finance": [
            "FinTech Solutions",
            "Capital Advisors",
            "Investment Partners",
            "Banking Systems Inc",
            "Financial Services Corp",
        ],
        "Retail": [
            "Retail Chain Solutions",
            "E-Commerce Dynamics",
            "Shopping Systems",
            "Consumer Goods Corp",
            "Retail Tech Inc",
        ],
        "Education": [
            "EduTech Solutions",
            "Learning Management Systems",
            "Academic Software",
            "Training Solutions Inc",
            "Education Innovations",
        ],
    }

    INDUSTRIES = list(COMPANIES.keys())

    FIRST_NAMES = [
        "Rajesh",
        "Priya",
        "Amit",
        "Sneha",
        "Vikram",
        "Anjali",
        "Rahul",
        "Pooja",
        "Arjun",
        "Kavya",
        "Sanjay",
        "Divya",
        "Karan",
        "Neha",
        "Rohan",
        "Isha",
    ]

    LAST_NAMES = [
        "Sharma",
        "Patel",
        "Kumar",
        "Singh",
        "Reddy",
        "Gupta",
        "Mehta",
        "Shah",
        "Verma",
        "Joshi",
        "Nair",
        "Iyer",
        "Desai",
        "Rao",
        "Pillai",
        "Menon",
    ]

    CITIES = [
        "Mumbai",
        "Delhi",
        "Bangalore",
        "Hyderabad",
        "Chennai",
        "Pune",
        "Kolkata",
        "Ahmedabad",
        "Jaipur",
        "Surat",
        "Lucknow",
        "Kanpur",
        "Nagpur",
        "Indore",
    ]

    STATES = [
        "Maharashtra",
        "Delhi",
        "Karnataka",
        "Telangana",
        "Tamil Nadu",
        "Gujarat",
        "West Bengal",
        "Rajasthan",
        "Uttar Pradesh",
        "Madhya Pradesh",
    ]

    # Main products that Comprint sells
    MAIN_PRODUCTS = [
        {
            "name": "HP LaserJet Pro M404dn",
            "category": "Printers",
            "base_price": 25000,
            "commission_rate": 8,
        },
        {
            "name": "HP OfficeJet Pro 9015",
            "category": "Printers",
            "base_price": 18000,
            "commission_rate": 7,
        },
        {
            "name": "Canon imageCLASS MF445dw",
            "category": "Printers",
            "base_price": 32000,
            "commission_rate": 9,
        },
        {
            "name": "Epson EcoTank L3250",
            "category": "Printers",
            "base_price": 15000,
            "commission_rate": 6,
        },
        {
            "name": "Brother HL-L2321D",
            "category": "Printers",
            "base_price": 12000,
            "commission_rate": 5,
        },
        {
            "name": "Xerox VersaLink C405",
            "category": "Printers",
            "base_price": 45000,
            "commission_rate": 10,
        },
        {
            "name": "HP Toner CF410A (Black)",
            "category": "Toner Cartridges",
            "base_price": 3500,
            "commission_rate": 12,
        },
        {
            "name": "Canon Toner 046 (Cyan)",
            "category": "Toner Cartridges",
            "base_price": 4200,
            "commission_rate": 12,
        },
        {
            "name": "Epson Ink Bottle T664 (Black)",
            "category": "Ink Bottles",
            "base_price": 450,
            "commission_rate": 15,
        },
        {
            "name": "HP Ink Cartridge 680 (Tri-color)",
            "category": "Ink Cartridges",
            "base_price": 850,
            "commission_rate": 14,
        },
        {
            "name": "A4 Copy Paper (500 Sheets)",
            "category": "Paper & Supplies",
            "base_price": 250,
            "commission_rate": 8,
        },
        {
            "name": "Printer Maintenance Kit",
            "category": "Accessories",
            "base_price": 5000,
            "commission_rate": 10,
        },
        {
            "name": "Network Print Server",
            "category": "Accessories",
            "base_price": 8000,
            "commission_rate": 9,
        },
        {
            "name": "Annual Maintenance Contract",
            "category": "Services",
            "base_price": 15000,
            "commission_rate": 20,
        },
        {
            "name": "On-site Installation Service",
            "category": "Services",
            "base_price": 2000,
            "commission_rate": 25,
        },
    ]

    LEAD_SOURCES = [
        "Website",
        "Referral",
        "Cold Call",
        "Trade Show",
        "LinkedIn",
        "Email Campaign",
        "Partner",
    ]
    LEAD_STAGES = ["Cold", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]
    DEAL_STAGES = ["Cold", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]
    PRIORITIES = ["Low", "Medium", "High", "Urgent"]
    TASK_TYPES = ["Call", "Email", "Meeting", "Follow-up", "Demo", "Proposal"]
    TASK_STATUSES = ["pending", "in_progress", "completed", "cancelled"]
    PARTNER_TYPES = ["Reseller", "Distributor", "System Integrator", "Consultant"]
    PARTNER_TIERS = ["new", "bronze", "silver", "gold", "platinum"]
    PAYMENT_STATUSES = ["pending", "partial", "paid", "overdue"]

    @staticmethod
    def random_name():
        """Generate a random full name."""
        return (
            f"{random.choice(DataGenerator.FIRST_NAMES)} {random.choice(DataGenerator.LAST_NAMES)}"
        )

    @staticmethod
    def random_company(industry=None):
        """Get a random company name."""
        if industry is None:
            industry = random.choice(DataGenerator.INDUSTRIES)
        return random.choice(DataGenerator.COMPANIES[industry])

    @staticmethod
    def random_email(name, company=None):
        """Generate an email address."""
        first_name = name.split()[0].lower()
        if company:
            domain = company.lower().replace(" ", "").replace(".", "")[:15]
            return f"{first_name}@{domain}.com"
        return f"{first_name}@example.com"

    @staticmethod
    def random_phone():
        """Generate an Indian phone number."""
        return f"+91 {random.randint(70000, 99999)}{random.randint(10000, 99999)}"

    @staticmethod
    def random_gst():
        """Generate a GST number."""
        state_code = random.randint(10, 36)
        pan = "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", k=10))
        entity = random.randint(1, 9)
        checksum = random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
        return f"{state_code:02d}{pan}{entity}{checksum}"

    @staticmethod
    def random_pan():
        """Generate a PAN number."""
        return (
            "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=5))
            + "".join(random.choices("0123456789", k=4))
            + random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
        )

    @staticmethod
    def random_date_range(days_back=90, days_forward=30):
        """Generate a random date within a range."""
        start = datetime.now() - timedelta(days=days_back)
        end = datetime.now() + timedelta(days=days_forward)
        delta = end - start
        random_days = random.randint(0, delta.days)
        return (start + timedelta(days=random_days)).date()


async def create_users(session: AsyncSession, count=20):
    """Create sample users with various roles."""
    print(f"Creating {count} users...")
    users = []

    # Create admin user
    admin = User(
        email="admin@comprint.com",
        password_hash=hash_password("admin123"),
        name="Admin User",
        role="admin",
        department="Management",
        phone=DataGenerator.random_phone(),
        employee_id="EMP001",
        is_active=True,
        view_access="all",
    )
    session.add(admin)
    users.append(admin)

    # Create sales managers
    for i in range(3):
        manager = User(
            email=f"manager{i+1}@comprint.com",
            password_hash=hash_password("password123"),
            name=DataGenerator.random_name(),
            role="manager",
            department="Sales",
            phone=DataGenerator.random_phone(),
            employee_id=f"EMP{100+i:03d}",
            monthly_target=Decimal(500000 + random.randint(0, 500000)),
            is_active=True,
            view_access="team",
        )
        session.add(manager)
        users.append(manager)

    await session.flush()

    # Create sales representatives
    for i in range(10):
        sales_rep = User(
            email=f"sales{i+1}@comprint.com",
            password_hash=hash_password("password123"),
            name=DataGenerator.random_name(),
            role="sales",
            department="Sales",
            phone=DataGenerator.random_phone(),
            employee_id=f"EMP{200+i:03d}",
            manager_id=users[1 + (i % 3)].id,  # Assign to one of the managers
            monthly_target=Decimal(200000 + random.randint(0, 300000)),
            is_active=True,
            view_access="own",
        )
        session.add(sales_rep)
        users.append(sales_rep)

    # Create support staff
    for i in range(3):
        support = User(
            email=f"support{i+1}@comprint.com",
            password_hash=hash_password("password123"),
            name=DataGenerator.random_name(),
            role="support",
            department="Customer Support",
            phone=DataGenerator.random_phone(),
            employee_id=f"EMP{300+i:03d}",
            is_active=True,
            view_access="all",
        )
        session.add(support)
        users.append(support)

    # Create presales staff
    for i in range(3):
        presales = User(
            email=f"presales{i+1}@comprint.com",
            password_hash=hash_password("password123"),
            name=DataGenerator.random_name(),
            role="presales",
            department="Presales",
            phone=DataGenerator.random_phone(),
            employee_id=f"EMP{400+i:03d}",
            is_active=True,
            view_access="presales",
        )
        session.add(presales)
        users.append(presales)

    await session.flush()
    print(f"✅ Created {len(users)} users")
    return users


async def create_products(session: AsyncSession):
    """Create main products."""
    print("Creating products...")
    products = []

    for product_data in DataGenerator.MAIN_PRODUCTS:
        product = Product(
            name=product_data["name"],
            category=product_data["category"],
            base_price=Decimal(product_data["base_price"]),
            commission_rate=Decimal(product_data["commission_rate"]),
            stock=random.randint(10, 100),
            is_active=True,
        )
        session.add(product)
        products.append(product)

    await session.flush()
    print(f"✅ Created {len(products)} products")
    return products


async def create_partners(session: AsyncSession, users, count=15):
    """Create sample partners."""
    print(f"Creating {count} partners...")
    partners = []

    for i in range(count):
        company_name = f"{random.choice(DataGenerator.FIRST_NAMES)} {random.choice(['Enterprises', 'Solutions', 'Systems', 'Technologies'])}"
        contact_person = DataGenerator.random_name()

        city = random.choice(DataGenerator.CITIES)
        state = random.choice(DataGenerator.STATES)

        partner = Partner(
            company_name=company_name,
            partner_type=random.choice(DataGenerator.PARTNER_TYPES),
            status=random.choice(["active", "pending", "approved"]),
            tier=random.choice(["new", "silver", "gold", "platinum"]),
            contact_person=contact_person,
            email=DataGenerator.random_email(contact_person, company_name),
            phone=DataGenerator.random_phone(),
            mobile=DataGenerator.random_phone(),
            gst_number=f"27AABCU{random.randint(1000, 9999)}C1Z{random.randint(1, 9)}",
            pan_number=f"AABCU{random.randint(1000, 9999)}C",
            address=f"{random.randint(1, 999)} {random.choice(['MG Road', 'Park Street', 'Main Road', 'Commercial Street'])}",
            city=city,
            state=state,
            pincode=f"{random.randint(100000, 999999)}",
            vertical=random.choice(
                ["IT Hardware", "Printing", "Networking", "Software", "Services"]
            ),
            notes=f"Partner since {random.randint(2018, 2024)}",
            is_active=random.choice([True, True, True, False]),
        )
        session.add(partner)
        partners.append(partner)

    await session.flush()
    print(f"✅ Created {len(partners)} partners")
    return partners


async def create_accounts(session: AsyncSession, users, partners, count=50):
    """Create sample accounts."""
    print(f"Creating {count} accounts...")
    accounts = []

    for i in range(count):
        industry = random.choice(DataGenerator.INDUSTRIES)
        company_name = DataGenerator.random_company(industry)
        contact_name = DataGenerator.random_name()
        city = random.choice(DataGenerator.CITIES)
        state = random.choice(DataGenerator.STATES)

        account = Account(
            name=f"{company_name} {i+1}",
            industry=industry,
            website=f"www.{company_name.lower().replace(' ', '')}{i}.com",
            phone=DataGenerator.random_phone(),
            email=DataGenerator.random_email(contact_name, company_name),
            billing_street=f"{random.randint(1, 999)} {random.choice(['MG Road', 'Park Street', 'Main Road'])}",
            billing_city=city,
            billing_state=state,
            billing_code=f"{random.randint(100000, 999999)}",
            billing_country="India",
            shipping_street=f"{random.randint(1, 999)} {random.choice(['Industrial Area', 'Tech Park', 'Business District'])}",
            shipping_city=city,
            shipping_state=state,
            shipping_code=f"{random.randint(100000, 999999)}",
            shipping_country="India",
            status=random.choice(["active", "inactive"]),
            partner_id=random.choice(partners).id if random.random() > 0.5 else None,
            owner_id=random.choice(users).id,
            description=f"Leading {industry.lower()} company with {random.randint(10, 5000)} employees",
        )
        session.add(account)
        accounts.append(account)

    await session.flush()
    print(f"✅ Created {len(accounts)} accounts")
    return accounts


async def create_contacts(session: AsyncSession, accounts, users, count=100):
    """Create sample contacts."""
    print(f"Creating {count} contacts...")
    contacts = []

    for i in range(count):
        account = random.choice(accounts)
        name_parts = DataGenerator.random_name().split()
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else "Kumar"

        contact = Contact(
            first_name=first_name,
            last_name=last_name,
            email=DataGenerator.random_email(f"{first_name} {last_name}", account.name),
            phone=DataGenerator.random_phone(),
            mobile=DataGenerator.random_phone(),
            job_title=random.choice(
                ["Manager", "Director", "VP", "Executive", "Specialist", "Coordinator"]
            ),
            department=random.choice(["IT", "Sales", "Finance", "Operations", "HR"]),
            account_id=account.id,
            status="active",
            notes=f"Contact for {account.name}",
        )
        session.add(contact)
        contacts.append(contact)

    await session.flush()
    print(f"✅ Created {len(contacts)} contacts")
    return contacts


async def create_leads(session: AsyncSession, users, partners, products, count=80):
    """Create sample leads."""
    print(f"Creating {count} leads...")
    leads = []

    for i in range(count):
        company_name = f"{DataGenerator.random_company()} {i+1}"
        contact_name = DataGenerator.random_name()
        product = random.choice(products)
        industry = random.choice(list(DataGenerator.COMPANIES.keys()))

        lead = Lead(
            company_name=company_name,
            contact_person=contact_name,
            first_name=contact_name.split()[0] if contact_name else None,
            last_name=(
                contact_name.split()[-1] if contact_name and len(contact_name.split()) > 1 else None
            ),
            email=DataGenerator.random_email(contact_name, company_name),
            phone=DataGenerator.random_phone(),
            mobile=DataGenerator.random_phone(),
            source=random.choice(DataGenerator.LEAD_SOURCES),
            stage=random.choice(["Cold", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]),
            priority=random.choice(["Low", "Medium", "High", "Urgent"]),
            estimated_value=Decimal(random.randint(10000, 500000)),
            assigned_to=random.choice(users).id,
            partner_id=random.choice(partners).id if random.random() > 0.7 else None,
            expected_close_date=date.today() + timedelta(days=random.randint(7, 90)),
            product_name=product.name,
            notes=f"Interested in {product.name}. {random.choice(['Hot lead', 'Needs follow-up', 'Budget approved', 'Decision pending'])}",
        )
        session.add(lead)
        leads.append(lead)

    await session.flush()
    print(f"✅ Created {len(leads)} leads")
    return leads


async def create_deals(session: AsyncSession, accounts, users, products, count=60):
    """Create sample deals."""
    print(f"Creating {count} deals...")
    deals = []

    for i in range(count):
        account = random.choice(accounts)
        product = random.choice(products)
        stage = random.choice(DataGenerator.DEAL_STAGES)

        # Probability based on stage
        probability_map = {
            "Cold": 10,
            "Proposal": 50,
            "Negotiation": 75,
            "Closed Won": 100,
            "Closed Lost": 0,
        }

        deal = Deal(
            title=f"{product.category} Deal - {account.name}",
            company=account.name,
            account_id=account.id,
            value=Decimal(random.randint(50000, 2000000)),
            stage=stage,
            probability=probability_map.get(stage, 50),
            owner_id=random.choice(users).id,
            closing_date=DataGenerator.random_date_range(0, 120),
            description=f"Deal for {product.name} and related services",
        )
        session.add(deal)
        deals.append(deal)

    await session.flush()
    print(f"✅ Created {len(deals)} deals")
    return deals


async def create_tasks(session: AsyncSession, users, leads, deals, count=100):
    """Create sample tasks."""
    print(f"Creating {count} tasks...")
    tasks = []

    for i in range(count):
        task_type = random.choice(DataGenerator.TASK_TYPES)
        status = random.choice(DataGenerator.TASK_STATUSES)

        # Randomly assign to lead or deal
        if random.random() > 0.5 and leads:
            related_to_type = "lead"
            related_to_id = random.choice(leads).id
        elif deals:
            related_to_type = "deal"
            related_to_id = random.choice(deals).id
        else:
            related_to_type = None
            related_to_id = None

        task = Task(
            title=f"{task_type}: {random.choice(['Follow up', 'Send proposal', 'Schedule demo', 'Discuss pricing', 'Close deal'])}",
            description=f"Complete {task_type.lower()} activity for the opportunity",
            type=task_type,
            status=status,
            priority=random.choice(DataGenerator.PRIORITIES),
            due_date=DataGenerator.random_date_range(-30, 60),
            assigned_to=random.choice(users).id,
            created_by=random.choice(users).id,
            related_to_type=related_to_type,
            related_to_id=related_to_id,
            completed_at=datetime.now() if status == "completed" else None,
        )
        session.add(task)
        tasks.append(task)

    await session.flush()
    print(f"✅ Created {len(tasks)} tasks")
    return tasks


async def create_sales_entries(session: AsyncSession, partners, products, users, count=50):
    """Create sample sales entries."""
    print(f"Creating {count} sales entries...")
    sales_entries = []

    for i in range(count):
        product = random.choice(products)
        quantity = random.randint(1, 20)
        base_price = float(product.base_price) if product.base_price else 10000
        commission_rate = float(product.commission_rate) if product.commission_rate else 5
        amount = base_price * quantity
        commission = amount * (commission_rate / 100)

        sales_entry = SalesEntry(
            partner_id=random.choice(partners).id if random.random() > 0.3 else None,
            product_id=product.id,
            salesperson_id=random.choice(users).id,
            customer_name=f"{DataGenerator.random_company()} Customer",
            quantity=quantity,
            amount=Decimal(str(amount)),
            po_number=f"PO{random.randint(10000, 99999)}",
            invoice_no=f"INV{random.randint(10000, 99999)}",
            payment_status=random.choice(DataGenerator.PAYMENT_STATUSES),
            commission_amount=Decimal(str(commission)),
            sale_date=DataGenerator.random_date_range(90, 0),
            notes=f"Sale of {quantity} units of {product.name}",
        )
        session.add(sales_entry)
        sales_entries.append(sales_entry)

    await session.flush()
    print(f"✅ Created {len(sales_entries)} sales entries")
    return sales_entries


async def create_calendar_events(session: AsyncSession, users, count=40):
    """Create sample calendar events."""
    print(f"Creating {count} calendar events...")
    events = []

    event_types = ["Meeting", "Call", "Demo", "Training", "Review", "Planning"]

    for i in range(count):
        start_date = DataGenerator.random_date_range(-30, 60)
        start_hour = random.randint(9, 17)
        duration = random.choice([30, 60, 90, 120])

        start_time = datetime.combine(start_date, datetime.min.time()).replace(hour=start_hour)
        end_time = start_time + timedelta(minutes=duration)

        event_type = random.choice(event_types)

        event = CalendarEvent(
            title=f"{event_type} - {random.choice(['Client', 'Team', 'Partner', 'Prospect'])}",
            description=f"{event_type} scheduled for discussion",
            start_time=start_time,
            end_time=end_time,
            type=event_type,
            location=random.choice(
                ["Conference Room A", "Online", "Client Office", "HQ Meeting Room"]
            ),
            owner_id=random.choice(users).id,
        )
        session.add(event)
        events.append(event)

    await session.flush()
    print(f"✅ Created {len(events)} calendar events")
    return events


async def create_email_templates(session: AsyncSession, users, count=10):
    """Create sample email templates."""
    print(f"Creating {count} email templates...")
    templates = []

    template_data = [
        {
            "name": "Welcome Email",
            "subject": "Welcome to Comprint!",
            "body": "Dear {{name}},\n\nWelcome to Comprint! We're excited to have you on board.\n\nBest regards,\nComprint Team",
            "category": "Onboarding",
        },
        {
            "name": "Follow-up Email",
            "subject": "Following up on our conversation",
            "body": "Hi {{name}},\n\nThank you for your time today. As discussed, I'm sending you more information about {{product}}.\n\nBest regards,\n{{sender}}",
            "category": "Sales",
        },
        {
            "name": "Quote Email",
            "subject": "Quote for {{product}}",
            "body": "Dear {{name}},\n\nPlease find attached the quote for {{product}}. The total amount is {{amount}}.\n\nBest regards,\n{{sender}}",
            "category": "Sales",
        },
        {
            "name": "Meeting Reminder",
            "subject": "Reminder: Meeting on {{date}}",
            "body": "Hi {{name}},\n\nThis is a reminder about our meeting scheduled for {{date}} at {{time}}.\n\nBest regards,\n{{sender}}",
            "category": "General",
        },
        {
            "name": "Thank You Email",
            "subject": "Thank you for your business",
            "body": "Dear {{name}},\n\nThank you for choosing Comprint. We appreciate your business!\n\nBest regards,\nComprint Team",
            "category": "Customer Service",
        },
        {
            "name": "Product Demo Invitation",
            "subject": "Invitation: {{product}} Demo",
            "body": "Hi {{name}},\n\nWe'd like to invite you to a demo of {{product}}. Please let us know your availability.\n\nBest regards,\n{{sender}}",
            "category": "Sales",
        },
        {
            "name": "Payment Reminder",
            "subject": "Payment Reminder - Invoice {{invoice_no}}",
            "body": "Dear {{name}},\n\nThis is a friendly reminder that payment for invoice {{invoice_no}} is due.\n\nBest regards,\nAccounts Team",
            "category": "Finance",
        },
        {
            "name": "Support Ticket Response",
            "subject": "Re: Support Ticket #{{ticket_no}}",
            "body": "Hi {{name}},\n\nThank you for contacting support. We're working on your issue and will update you soon.\n\nBest regards,\nSupport Team",
            "category": "Support",
        },
        {
            "name": "Newsletter",
            "subject": "Comprint Monthly Newsletter",
            "body": "Dear Valued Customer,\n\nHere's what's new at Comprint this month...\n\nBest regards,\nComprint Team",
            "category": "Marketing",
        },
        {
            "name": "Contract Renewal",
            "subject": "Contract Renewal - {{contract_name}}",
            "body": "Dear {{name}},\n\nYour contract {{contract_name}} is due for renewal. Please contact us to discuss.\n\nBest regards,\n{{sender}}",
            "category": "Sales",
        },
    ]

    for template_info in template_data[:count]:
        template = EmailTemplate(
            name=template_info["name"],
            subject=template_info["subject"],
            body=template_info["body"],
            category=template_info["category"],
            owner_id=random.choice(users).id,
        )
        session.add(template)
        templates.append(template)

    await session.flush()
    print(f"✅ Created {len(templates)} email templates")
    return templates


async def clear_database(session: AsyncSession):
    """Clear all existing data from the database."""
    print("🗑️  Clearing existing data...")

    # Delete in reverse order of dependencies
    tables = [
        "email_templates",
        "calendar_events",
        "sales_entries",
        "tasks",
        "deals",
        "leads",
        "contacts",
        "accounts",
        "partners",
        "products",
        "users",
    ]

    for table in tables:
        await session.execute(text(f"DELETE FROM {table}"))
        print(f"   Cleared {table}")

    await session.commit()
    print("✅ Database cleared\n")


async def seed_database():
    """Main function to seed all data."""
    print("\n" + "=" * 60)
    print("🌱 Starting Comprint CRM Database Seeding")
    print("=" * 60 + "\n")

    try:
        async with async_session() as session:
            # Clear existing data first
            await clear_database(session)

            # Create data in order of dependencies
            users = await create_users(session, count=20)
            products = await create_products(session)
            partners = await create_partners(session, users, count=15)
            accounts = await create_accounts(session, users, partners, count=50)
            contacts = await create_contacts(session, accounts, users, count=100)
            leads = await create_leads(session, users, partners, products, count=80)
            deals = await create_deals(session, accounts, users, products, count=60)
            tasks = await create_tasks(session, users, leads, deals, count=100)
            sales_entries = await create_sales_entries(session, partners, products, users, count=50)
            events = await create_calendar_events(session, users, count=40)
            templates = await create_email_templates(session, users, count=10)

            # Commit all changes
            await session.commit()

            print("\n" + "=" * 60)
            print("✅ Database Seeding Completed Successfully!")
            print("=" * 60)
            print(f"\n📊 Summary:")
            print(f"   - Users: {len(users)}")
            print(f"   - Products: {len(products)}")
            print(f"   - Partners: {len(partners)}")
            print(f"   - Accounts: {len(accounts)}")
            print(f"   - Contacts: {len(contacts)}")
            print(f"   - Leads: {len(leads)}")
            print(f"   - Deals: {len(deals)}")
            print(f"   - Tasks: {len(tasks)}")
            print(f"   - Sales Entries: {len(sales_entries)}")
            print(f"   - Calendar Events: {len(events)}")
            print(f"   - Email Templates: {len(templates)}")
            print(f"\n🔑 Login Credentials:")
            print(f"   Admin: admin@comprint.com / admin123")
            print(f"   Manager: manager1@comprint.com / password123")
            print(f"   Sales: sales1@comprint.com / password123")
            print("\n")

    except Exception as e:
        print(f"\n❌ Error during seeding: {str(e)}")
        raise


if __name__ == "__main__":
    asyncio.run(seed_database())
