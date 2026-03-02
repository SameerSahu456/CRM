import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy import text

from app.api.v1.router import api_router
from app.config import settings
from app.database import engine
from app.exceptions import CRMException, crm_exception_handler, generic_exception_handler


_schema_ensured = False

# Single SQL batch — one round trip to DB instead of 100+ individual statements
_MIGRATION_SQL = """
-- file_uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    data TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS type_of_order VARCHAR(100);

-- sales_entries
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS contact_no VARCHAR(50);
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS gstin VARCHAR(50);
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS pan_no VARCHAR(50);
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS dispatch_method VARCHAR(50);
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(255);
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS order_type VARCHAR(50);
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS serial_number VARCHAR(255);
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS boq TEXT;
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS price NUMERIC(15,2);
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS product_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS deal_id UUID;
ALTER TABLE sales_entries ADD COLUMN IF NOT EXISTS description TEXT;

-- accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS revenue NUMERIC(15,2);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS employees INTEGER;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS health_score INTEGER;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS gstin_no VARCHAR(50);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_image VARCHAR(500);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS group_name VARCHAR(255);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS parent_account_id UUID;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS endcustomer_category VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS products_selling_to_them TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS products_they_sell TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS pan_no VARCHAR(50);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS partner_id UUID;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS lead_category VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS new_leads INTEGER DEFAULT 0;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS references_doc VARCHAR(500);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS bank_statement_doc VARCHAR(500);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS tag VARCHAR(50);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_type VARCHAR(50);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS contact_designation VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS contact_designation_other VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS billing_street TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS billing_city VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS billing_state VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS billing_code VARCHAR(20);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS billing_country VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS shipping_street TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS shipping_code VARCHAR(20);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(100);

-- contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS job_title VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS preferred_contact VARCHAR(50);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS image VARCHAR(500);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_group VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS ctsipl_email VARCHAR(255);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS pan VARCHAR(50);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS gstin_no VARCHAR(50);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS product_interested VARCHAR(255);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS product_interested_text TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_source VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_category VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS partner_id UUID;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS new_leads BOOLEAN DEFAULT false;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS gst_certificate_url TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS msme_certificate_url TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS pan_card_url TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS aadhar_card_url TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS bandwidth_required VARCHAR(255);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS product_configuration TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS product_details TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS rental_duration VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS product_name_part_number TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS specifications TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mailing_street TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mailing_city VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mailing_state VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mailing_zip VARCHAR(20);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mailing_country VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS other_street TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS other_city VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS other_state VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS other_zip VARCHAR(20);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS other_country VARCHAR(100);

-- products inventory fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS ipn VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS part_image VARCHAR(500);
ALTER TABLE products ADD COLUMN IF NOT EXISTS batch VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS stocktake VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS purchase_order VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'OK';
"""


async def _ensure_schema() -> None:
    """Run migrations only if needed (checks DB first)."""
    global _schema_ensured
    if _schema_ensured:
        return
    try:
        async with engine.begin() as conn:
            # Quick check: if the last column we added exists, skip migration
            result = await conn.execute(text(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_name='contacts' AND column_name='other_country' LIMIT 1"
            ))
            if result.fetchone():
                # Also ensure file_uploads table exists
                result2 = await conn.execute(text(
                    "SELECT 1 FROM information_schema.tables "
                    "WHERE table_name='file_uploads' LIMIT 1"
                ))
                # Check if latest product inventory columns exist
                result3 = await conn.execute(text(
                    "SELECT 1 FROM information_schema.columns "
                    "WHERE table_name='products' AND column_name='ipn' LIMIT 1"
                ))
                if result2.fetchone() and result3.fetchone():
                    _schema_ensured = True
                    return
            # Columns missing — run statements one by one (asyncpg doesn't support multi-statement)
            for stmt in _MIGRATION_SQL.split(";"):
                stmt = stmt.strip()
                if stmt and not stmt.startswith("--"):
                    await conn.execute(text(stmt))
        _schema_ensured = True
    except Exception as e:
        print(f"[SCHEMA MIGRATION] Error: {e}")
        _schema_ensured = True


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run schema migrations on startup (works locally, not on Vercel)."""
    await _ensure_schema()
    yield


app = FastAPI(
    lifespan=lifespan,
    title="Comprint CRM API",
    version="1.0.0",
    docs_url=None if not settings.DEBUG else "/docs",
    redoc_url=None if not settings.DEBUG else "/redoc",
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(CRMException, crm_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)


@app.middleware("http")
async def ensure_schema_middleware(request, call_next):
    """Run schema migration on first request (for Vercel where lifespan doesn't fire)."""
    if not _schema_ensured:
        await _ensure_schema()
    return await call_next(request)


app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/api/status")
async def health_check():
    return {"status": "ok", "version": "1.0.0", "engine": "FastAPI"}
