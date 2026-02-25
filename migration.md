# Supabase to PostgreSQL Migration Plan

## Comprint CRM — Full Migration Guide

**Date:** 2026-02-17
**Scope:** Migrate from Supabase-hosted PostgreSQL to standalone PostgreSQL + local file storage
**Risk Level:** Low-Medium (backend already uses SQLAlchemy ORM — database layer is abstracted)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture](#2-current-architecture)
3. [Target Architecture](#3-target-architecture)
4. [Supabase Dependencies Inventory](#4-supabase-dependencies-inventory)
5. [Migration Steps — Backend](#5-migration-steps--backend)
6. [Migration Steps — Frontend](#6-migration-steps--frontend)
7. [Migration Steps — Database](#7-migration-steps--database)
8. [Migration Steps — Deployment](#8-migration-steps--deployment)
9. [File-by-File Change List](#9-file-by-file-change-list)
10. [Database Schema (Complete)](#10-database-schema-complete)
11. [Testing Checklist](#11-testing-checklist)
12. [Rollback Plan](#12-rollback-plan)

---

## 1. Executive Summary

### What We're Migrating

The Comprint CRM uses Supabase for **two things only**:

| Supabase Feature | Used? | Migration Target |
|---|---|---|
| PostgreSQL Database | YES | Standalone PostgreSQL (local/VPS/RDS) |
| Storage (file uploads) | YES | Local filesystem storage (or S3/MinIO) |
| Auth | NO | Already uses custom JWT auth |
| Realtime | NO | Not used |
| RPC/Functions | NO | Not used |
| Row Level Security | NO | RBAC is in application code |

### Why This Is Low Risk

- Backend uses **SQLAlchemy ORM** — all queries are database-agnostic
- Auth is **custom JWT** — no Supabase Auth dependency
- Frontend **never calls Supabase directly** — `lib/supabase.ts` exists but is dead code
- All API calls go through the FastAPI backend via `/api` routes

### Estimated Changes

- **Files to modify:** 7
- **Files to delete:** 1
- **New files to create:** 1
- **Lines of code changed:** ~80

---

## 2. Current Architecture

```
Frontend (React/Vite)
    |
    | HTTP (fetch → /api/*)
    |
    v
Backend (FastAPI + SQLAlchemy)
    |
    |--- Database: Supabase PostgreSQL (via asyncpg + pgBouncer)
    |--- Storage: Supabase Storage REST API (bucket: "documents")
    |--- Auth: Custom JWT (python-jose + passlib/bcrypt)
```

### Current Supabase Touchpoints

1. **`backend/app/database.py`** — Connection string handling with Supabase-specific SSL/pgBouncer logic
2. **`backend/app/config.py`** — `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` settings
3. **`backend/app/utils/storage.py`** — `upload_to_supabase()` function (HTTP POST to Supabase Storage API)
4. **`backend/app/api/v1/endpoints/uploads.py`** — Calls `upload_to_supabase()`
5. **`backend/app/api/v1/endpoints/quotes.py`** — Calls `upload_to_supabase()` for PDF storage
6. **`lib/supabase.ts`** — Dead code (frontend Supabase client, never imported by any component)
7. **`package.json`** — `@supabase/supabase-js` dependency (unused)
8. **`.env.production.example`** — Supabase connection string
9. **`backend/.env`** — Local database URL (already pointing to local PostgreSQL)
10. **`services/api.ts`** — Comment referencing Supabase (line 472)

---

## 3. Target Architecture

```
Frontend (React/Vite)
    |
    | HTTP (fetch → /api/*)
    |
    v
Backend (FastAPI + SQLAlchemy)
    |
    |--- Database: Standalone PostgreSQL (local or VPS)
    |--- Storage: Local filesystem (./uploads/) with static file serving
    |--- Auth: Custom JWT (unchanged)
```

### Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Database | Standalone PostgreSQL | Direct connection, no pgBouncer needed for non-serverless |
| File Storage | Local filesystem | Simplest option; can migrate to S3 later if needed |
| File Serving | FastAPI static files or direct serve | No external dependency |
| Deployment | VPS/Docker (not Vercel serverless) | Full control, persistent connections |

---

## 4. Supabase Dependencies Inventory

### Backend Python Dependencies

| Package | Supabase-Related? | Action |
|---|---|---|
| `asyncpg` | No (PostgreSQL driver) | KEEP — works with any PostgreSQL |
| `sqlalchemy[asyncio]` | No (ORM) | KEEP — database agnostic |
| `httpx` | Used for Supabase Storage API calls | KEEP — still useful, storage code changes |
| All others | No | KEEP |

### Frontend NPM Dependencies

| Package | Supabase-Related? | Action |
|---|---|---|
| `@supabase/supabase-js` | YES — unused dead dependency | REMOVE |
| All others | No | KEEP |

---

## 5. Migration Steps — Backend

### Step 5.1: Simplify Database Connection (`backend/app/database.py`)

**Current code** has Supabase-specific logic:
- SSL context for Supabase
- pgBouncer statement cache disabling
- NullPool for serverless (Vercel)
- URL parameter stripping

**New code** should be a clean PostgreSQL connection:

```python
# backend/app/database.py
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=300,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    session = async_session()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()
```

**What changed:**
- Removed all Supabase SSL detection logic
- Removed pgBouncer statement cache workaround
- Removed NullPool/serverless detection
- Clean standard PostgreSQL connection pool

---

### Step 5.2: Clean Up Config (`backend/app/config.py`)

**Remove** Supabase-specific settings, **add** local storage settings:

```python
# backend/app/config.py
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    DATABASE_URL: str = "postgresql+asyncpg://localhost:5432/comprint_crm"
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 525600
    CORS_ORIGINS_STR: Optional[str] = None
    DEBUG: bool = False
    API_PREFIX: str = "/api"

    # File storage config (replaces Supabase Storage)
    UPLOAD_DIR: str = "uploads"
    BASE_URL: str = "http://localhost:3002"

    @property
    def CORS_ORIGINS(self) -> List[str]:
        if self.CORS_ORIGINS_STR:
            return [origin.strip() for origin in self.CORS_ORIGINS_STR.split(",")]
        return [
            "http://localhost:3000",
            "http://localhost:5173",
        ]


settings = Settings()
```

**What changed:**
- Removed `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Added `UPLOAD_DIR` — directory for local file storage
- Added `BASE_URL` — for generating file download URLs

---

### Step 5.3: Replace Storage Utility (`backend/app/utils/storage.py`)

**Current:** HTTP POST to Supabase Storage REST API
**New:** Write to local filesystem

```python
# backend/app/utils/storage.py
from __future__ import annotations

import os
from pathlib import Path

from app.config import settings


async def upload_file(file_bytes: bytes, file_name: str, content_type: str) -> str:
    """Save file to local filesystem and return its public URL."""
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Support subdirectories (e.g., "quotes/quote-xxx.pdf")
    file_path = upload_dir / file_name
    file_path.parent.mkdir(parents=True, exist_ok=True)

    file_path.write_bytes(file_bytes)

    # Return URL that can be served by FastAPI static files
    return f"{settings.BASE_URL}/files/{file_name}"
```

**What changed:**
- Replaced `upload_to_supabase()` with `upload_file()`
- Writes to local filesystem instead of HTTP POST to Supabase
- Returns a URL pointing to FastAPI static file endpoint

---

### Step 5.4: Update Upload Endpoint (`backend/app/api/v1/endpoints/uploads.py`)

```python
# backend/app/api/v1/endpoints/uploads.py
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, UploadFile, File

from app.middleware.security import get_current_user
from app.models.User import User
from app.utils.storage import upload_file

router = APIRouter()


@router.post("/")
async def upload_file_endpoint(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    file_bytes = await file.read()
    ext = file.filename.split(".")[-1] if file.filename else "pdf"
    unique_name = f"{uuid.uuid4()}.{ext}"
    url = await upload_file(
        file_bytes, unique_name, file.content_type or "application/pdf"
    )
    return {"url": url, "filename": file.filename}
```

**What changed:**
- Import changed from `upload_to_supabase` to `upload_file`
- Function call changed from `upload_to_supabase(...)` to `upload_file(...)`

---

### Step 5.5: Update Quotes Endpoint (`backend/app/api/v1/endpoints/quotes.py`)

Only the `_generate_and_store_pdf` function needs to change (line 130-144):

```python
async def _generate_and_store_pdf(db: AsyncSession, quote: Quote, quote_data: dict) -> str | None:
    """Generate a PDF for a quote and store it locally. Returns the URL."""
    try:
        from app.utils.pdf_generator import generate_quote_pdf
        from app.utils.storage import upload_file

        pdf_bytes = generate_quote_pdf(quote_data)
        file_name = f"quotes/quote-{quote.id}.pdf"
        pdf_url = await upload_file(pdf_bytes, file_name, "application/pdf")
        quote.pdf_url = pdf_url
        await db.flush()
        return pdf_url
    except Exception:
        logger.exception("Failed to generate PDF for quote %s", quote.id)
        return None
```

**What changed:**
- Import: `upload_to_supabase` → `upload_file`
- Function call: `upload_to_supabase(...)` → `upload_file(...)`
- Comment updated

---

### Step 5.6: Add Static File Serving (`backend/app/main.py`)

Add a route to serve uploaded files:

```python
# Add these imports at the top
import os
from fastapi.staticfiles import StaticFiles
from pathlib import Path

# Add AFTER the router include (after line 33):

# Serve uploaded files
upload_dir = Path(settings.UPLOAD_DIR)
upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/files", StaticFiles(directory=str(upload_dir)), name="uploaded-files")
```

The full `main.py` becomes:

```python
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.config import settings
from app.exceptions import CRMException, crm_exception_handler, generic_exception_handler

app = FastAPI(
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

app.include_router(api_router, prefix=settings.API_PREFIX)

# Serve uploaded files from local storage
upload_dir = Path(settings.UPLOAD_DIR)
upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/files", StaticFiles(directory=str(upload_dir)), name="uploaded-files")


@app.get("/api/status")
async def health_check():
    return {"status": "ok", "version": "1.0.0", "engine": "FastAPI"}
```

**What changed:**
- Added `StaticFiles` mount at `/files` to serve uploaded documents
- Upload directory auto-created on startup

---

### Step 5.7: Update Environment File (`backend/.env`)

```env
# Local PostgreSQL database
DATABASE_URL=postgresql+asyncpg://localhost:5432/comprint_crm
SECRET_KEY=zenith-crm-secret-key-change-in-production-2024
CORS_ORIGINS_STR=http://localhost:3000,http://localhost:5173
DEBUG=false

# File storage
UPLOAD_DIR=uploads
BASE_URL=http://localhost:3002
```

**What changed:**
- Added `UPLOAD_DIR` and `BASE_URL` for local file storage
- No more `SUPABASE_URL` or `SUPABASE_SERVICE_KEY` needed

---

## 6. Migration Steps — Frontend

### Step 6.1: Delete Supabase Client (`lib/supabase.ts`)

This file is dead code — no component imports it. Delete it entirely.

```bash
rm lib/supabase.ts
```

### Step 6.2: Remove Supabase Dependency (`package.json`)

Remove the `@supabase/supabase-js` package:

```bash
npm uninstall @supabase/supabase-js
```

The dependency line to remove from `package.json`:
```diff
-    "@supabase/supabase-js": "^2.95.3",
```

### Step 6.3: Update Upload Comment (`services/api.ts`)

Line 472 has a comment referencing Supabase:
```diff
- // Uploads (file upload to Supabase Storage)
+ // Uploads (file upload)
```

This is a cosmetic change only — the actual upload code already goes through the backend API (`/api/uploads/`), not directly to Supabase.

### Step 6.4: No Other Frontend Changes Needed

The frontend is already clean:
- Auth uses custom JWT via `services/api.ts` → `AuthContext.tsx`
- All data flows through `/api/*` endpoints
- No direct Supabase client calls from any component

---

## 7. Migration Steps — Database

### Step 7.1: Set Up Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql@16
brew services start postgresql@16

# Create database
createdb comprint_crm
```

### Step 7.2: Run Schema Migration

Use the existing Alembic setup or run the consolidated migration SQL.

**Option A: Alembic (recommended)**
```bash
cd backend
alembic upgrade head
```

**Option B: Manual SQL** — Run the consolidated schema below against your local PostgreSQL:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- See Section 10 for the complete schema
```

### Step 7.3: Export Data from Supabase

```bash
# Export from Supabase (using pg_dump on the Supabase connection)
pg_dump "postgresql://postgres.wnkidelrhkvagghaftnf:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres" \
  --data-only --no-owner --no-acl \
  -f supabase_data_export.sql

# Import to local PostgreSQL
psql comprint_crm < supabase_data_export.sql
```

### Step 7.4: Migrate Uploaded Files

If you have files in Supabase Storage that need to be preserved:

```bash
# Create upload directory
mkdir -p uploads/quotes

# Download files from Supabase Storage (manual or via script)
# For each file URL in your database:
# https://ornwvpbgmsvcobzgpbwm.supabase.co/storage/v1/object/public/documents/xxx.pdf
# Download and save to uploads/xxx.pdf
```

You'll also need to update file URLs in the database:

```sql
-- Update quote PDF URLs from Supabase to local
UPDATE quotes
SET pdf_url = REPLACE(
    pdf_url,
    'https://ornwvpbgmsvcobzgpbwm.supabase.co/storage/v1/object/public/documents/',
    'http://localhost:3002/files/'
)
WHERE pdf_url LIKE '%supabase%';

-- Update contact document URLs
UPDATE contacts
SET gst_certificate_url = REPLACE(gst_certificate_url, 'https://ornwvpbgmsvcobzgpbwm.supabase.co/storage/v1/object/public/documents/', 'http://localhost:3002/files/')
WHERE gst_certificate_url LIKE '%supabase%';

-- Repeat for msme_certificate_url, pan_card_url, aadhar_card_url
UPDATE contacts SET msme_certificate_url = REPLACE(msme_certificate_url, 'https://ornwvpbgmsvcobzgpbwm.supabase.co/storage/v1/object/public/documents/', 'http://localhost:3002/files/') WHERE msme_certificate_url LIKE '%supabase%';
UPDATE contacts SET pan_card_url = REPLACE(pan_card_url, 'https://ornwvpbgmsvcobzgpbwm.supabase.co/storage/v1/object/public/documents/', 'http://localhost:3002/files/') WHERE pan_card_url LIKE '%supabase%';
UPDATE contacts SET aadhar_card_url = REPLACE(aadhar_card_url, 'https://ornwvpbgmsvcobzgpbwm.supabase.co/storage/v1/object/public/documents/', 'http://localhost:3002/files/') WHERE aadhar_card_url LIKE '%supabase%';

-- Update account image URLs
UPDATE accounts SET account_image = REPLACE(account_image, 'https://ornwvpbgmsvcobzgpbwm.supabase.co/storage/v1/object/public/documents/', 'http://localhost:3002/files/') WHERE account_image LIKE '%supabase%';
```

---

## 8. Migration Steps — Deployment

### Step 8.1: Local Development Setup

**Before (Supabase):**
```
Frontend: vite dev → localhost:3000 → proxy /api → localhost:3002
Backend: uvicorn → localhost:3002 → Supabase PostgreSQL (remote)
```

**After (Local PostgreSQL):**
```
Frontend: vite dev → localhost:3000 → proxy /api → localhost:3002
Backend: uvicorn → localhost:3002 → Local PostgreSQL (localhost:5432)
```

The Vite proxy config in `vite.config.ts` does NOT change — it already proxies `/api` to `localhost:3002`.

### Step 8.2: Production Deployment (VPS/Docker)

Since we're moving away from Vercel serverless, here's a Docker-based deployment:

**`docker-compose.yml`** (new file, optional):
```yaml
version: '3.8'
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: comprint_crm
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your-strong-password
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:your-strong-password@db:5432/comprint_crm
      SECRET_KEY: your-production-secret-key
      CORS_ORIGINS_STR: https://your-domain.com
      UPLOAD_DIR: /app/uploads
      BASE_URL: https://your-domain.com
    volumes:
      - uploads:/app/uploads
    ports:
      - "3002:3002"
    depends_on:
      - db

volumes:
  pgdata:
  uploads:
```

### Step 8.3: Update Vercel Config (if still using Vercel for frontend)

If you keep Vercel for frontend-only hosting, update `vercel.json` to point API rewrites to your backend server instead of the serverless function:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://your-backend-server.com/api/$1" },
    { "source": "/((?!api).*)", "destination": "/" }
  ]
}
```

Or remove the `functions` block entirely if not using Vercel for the backend.

### Step 8.4: Clean Up Vercel-Specific Code

If no longer deploying backend on Vercel, these can be removed/simplified:
- `vercel.json` — Remove `functions` block
- `backend/app/database.py` — Already simplified (no NullPool/serverless detection)
- `.vercel/` directories — Can be deleted if not using Vercel

---

## 9. File-by-File Change List

### Files to MODIFY

| # | File | Change Description |
|---|---|---|
| 1 | `backend/app/database.py` | Remove Supabase SSL/pgBouncer logic, use clean PostgreSQL connection |
| 2 | `backend/app/config.py` | Remove `SUPABASE_URL`/`SUPABASE_SERVICE_KEY`, add `UPLOAD_DIR`/`BASE_URL` |
| 3 | `backend/app/utils/storage.py` | Replace `upload_to_supabase()` with `upload_file()` (local filesystem) |
| 4 | `backend/app/api/v1/endpoints/uploads.py` | Change import from `upload_to_supabase` to `upload_file` |
| 5 | `backend/app/api/v1/endpoints/quotes.py` | Change import from `upload_to_supabase` to `upload_file` (line 134, 138) |
| 6 | `backend/app/main.py` | Add `StaticFiles` mount for serving uploaded files at `/files` |
| 7 | `backend/.env` | Add `UPLOAD_DIR` and `BASE_URL` settings |
| 8 | `services/api.ts` | Update comment on line 472 (cosmetic only) |
| 9 | `package.json` | Remove `@supabase/supabase-js` dependency |

### Files to DELETE

| # | File | Reason |
|---|---|---|
| 1 | `lib/supabase.ts` | Dead code — never imported, contains hardcoded Supabase credentials |

### Files to CREATE (Optional)

| # | File | Purpose |
|---|---|---|
| 1 | `backend/uploads/.gitkeep` | Ensure upload directory exists in git |

### Files that DO NOT CHANGE

Everything else stays the same:
- All SQLAlchemy models (28 files) — database-agnostic
- All repositories (17 files) — use SQLAlchemy ORM
- All services (27 files) — business logic unchanged
- All schemas (22 files) — Pydantic validation unchanged
- All frontend components — use `/api/*` endpoints
- Auth middleware — custom JWT, no Supabase
- RBAC middleware — application-level
- All other API endpoints — use SQLAlchemy

---

## 10. Database Schema (Complete)

This is the complete schema for your standalone PostgreSQL instance. Run this to create all tables:

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- USERS
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(200) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'sales',
    department VARCHAR(100),
    phone VARCHAR(50),
    employee_id VARCHAR(50),
    manager_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    must_change_password BOOLEAN DEFAULT false,
    monthly_target NUMERIC(15,2),
    last_login TIMESTAMPTZ,
    view_access VARCHAR(50) NOT NULL DEFAULT 'presales',
    tag VARCHAR(50),
    dashboard_preferences JSONB DEFAULT '{"widgets": [], "lastModified": null}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- ROLES & PERMISSIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    entity VARCHAR(50) NOT NULL,
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    UNIQUE(role_id, entity)
);

-- ==========================================
-- PARTNERS
-- ==========================================
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    gst_number VARCHAR(50),
    pan_number VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    partner_type VARCHAR(50),
    vertical VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    tier VARCHAR(50) DEFAULT 'new',
    assigned_to UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- ACCOUNTS
-- ==========================================
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    website VARCHAR(500),
    revenue NUMERIC(15,2),
    employees INTEGER,
    location VARCHAR(255),
    type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    phone VARCHAR(50),
    email VARCHAR(255),
    health_score INTEGER,
    description TEXT,
    owner_id UUID REFERENCES users(id),
    gstin_no VARCHAR(50),
    payment_terms VARCHAR(100),
    account_image VARCHAR(500),
    group_name VARCHAR(255),
    parent_account_id UUID REFERENCES accounts(id),
    endcustomer_category VARCHAR(100),
    products_selling_to_them TEXT,
    products_they_sell TEXT,
    pan_no VARCHAR(50),
    partner_id UUID REFERENCES partners(id),
    lead_category VARCHAR(100),
    new_leads INTEGER DEFAULT 0,
    references_doc VARCHAR(500),
    bank_statement_doc VARCHAR(500),
    tag VARCHAR(50),
    account_type VARCHAR(50),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_designation VARCHAR(100),
    contact_designation_other VARCHAR(100),
    billing_street TEXT,
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_code VARCHAR(20),
    billing_country VARCHAR(100),
    shipping_street TEXT,
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_code VARCHAR(20),
    shipping_country VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounts_gstin ON accounts(gstin_no);
CREATE INDEX IF NOT EXISTS idx_accounts_payment_terms ON accounts(payment_terms);

-- ==========================================
-- CONTACTS
-- ==========================================
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    job_title VARCHAR(100),
    department VARCHAR(100),
    account_id UUID REFERENCES accounts(id),
    type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    preferred_contact VARCHAR(50),
    owner_id UUID REFERENCES users(id),
    image VARCHAR(500),
    description TEXT,
    contact_group VARCHAR(100),
    ctsipl_email VARCHAR(255),
    pan VARCHAR(50),
    gstin_no VARCHAR(50),
    product_interested VARCHAR(255),
    product_interested_text TEXT,
    lead_source VARCHAR(100),
    lead_category VARCHAR(100),
    designation VARCHAR(100),
    vendor_name VARCHAR(255),
    partner_id UUID REFERENCES partners(id),
    new_leads BOOLEAN DEFAULT false,
    gst_certificate_url TEXT,
    msme_certificate_url TEXT,
    pan_card_url TEXT,
    aadhar_card_url TEXT,
    bandwidth_required VARCHAR(255),
    product_configuration TEXT,
    product_details TEXT,
    rental_duration VARCHAR(100),
    product_name_part_number TEXT,
    specifications TEXT,
    mailing_street TEXT,
    mailing_city VARCHAR(100),
    mailing_state VARCHAR(100),
    mailing_zip VARCHAR(20),
    mailing_country VARCHAR(100),
    other_street TEXT,
    other_city VARCHAR(100),
    other_state VARCHAR(100),
    other_zip VARCHAR(20),
    other_country VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- PRODUCTS
-- ==========================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    base_price NUMERIC(15,2),
    commission_rate NUMERIC(5,2) DEFAULT 0,
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- LEADS
-- ==========================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(100),
    stage VARCHAR(50) DEFAULT 'Cold',
    priority VARCHAR(20) DEFAULT 'Medium',
    estimated_value NUMERIC(15,2),
    product_interest VARCHAR(255),
    assigned_to UUID REFERENCES users(id),
    partner_id UUID REFERENCES partners(id),
    notes TEXT,
    expected_close_date DATE,
    lost_reason TEXT,
    next_follow_up DATE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    mobile VARCHAR(50),
    mobile_alternate VARCHAR(50),
    phone_alternate VARCHAR(50),
    campaign_source VARCHAR(100),
    website VARCHAR(500),
    account_type VARCHAR(50),
    lead_category VARCHAR(50),
    product_list VARCHAR(255),
    type_of_order VARCHAR(100),
    billing_delivery_date DATE,
    order_product_details TEXT,
    payment VARCHAR(100),
    po_number_or_mail_confirmation VARCHAR(100),
    brand VARCHAR(100),
    orc_amount NUMERIC(15,2),
    product_warranty VARCHAR(100),
    ship_by VARCHAR(100),
    special_instruction TEXT,
    third_party_delivery_address TEXT,
    billing_company VARCHAR(255),
    enter_product_details TEXT,
    rental_duration VARCHAR(100),
    product_configuration TEXT,
    bandwidth_required VARCHAR(100),
    product_name_and_part_number VARCHAR(255),
    specifications TEXT,
    form_name VARCHAR(100),
    billing_street VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_country VARCHAR(100),
    billing_zip_code VARCHAR(20),
    description TEXT,
    lead_time VARCHAR(100),
    product_name VARCHAR(255),
    receiver_mobile_number VARCHAR(50),
    subject VARCHAR(500),
    sender_landline_no VARCHAR(50),
    sender_landline_no_alt VARCHAR(50),
    call_duration VARCHAR(50),
    lead_type VARCHAR(50),
    query_id VARCHAR(100),
    mcat_name VARCHAR(100),
    tag VARCHAR(50),
    designation VARCHAR(200),
    location VARCHAR(255),
    requirement TEXT,
    quoted_requirement TEXT,
    lead_image TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- won_sale_id added after sales_entries table exists
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS won_sale_id UUID REFERENCES sales_entries(id);

-- ==========================================
-- DEALS
-- ==========================================
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    account_id UUID REFERENCES accounts(id),
    value NUMERIC(15,2),
    stage VARCHAR(50) DEFAULT 'Cold',
    probability INTEGER,
    owner_id UUID REFERENCES users(id),
    closing_date DATE,
    description TEXT,
    contact_id UUID REFERENCES contacts(id),
    next_step VARCHAR(500),
    forecast VARCHAR(50),
    type VARCHAR(50),
    lead_source VARCHAR(100),
    sdp_no VARCHAR(100),
    sales_created_by_rm UUID REFERENCES users(id),
    lead_category VARCHAR(100),
    product_manager VARCHAR(255),
    expected_revenue NUMERIC(15,2),
    bandwidth_required VARCHAR(255),
    product_configuration TEXT,
    rental_duration VARCHAR(100),
    enter_product_details TEXT,
    product_name_and_part_number VARCHAR(500),
    specifications TEXT,
    show_subform BOOLEAN DEFAULT false,
    billing_delivery_date DATE,
    description_of_product TEXT,
    payment VARCHAR(255),
    payment_terms VARCHAR(100),
    po_number_or_mail_confirmation VARCHAR(255),
    integration_requirement VARCHAR(100),
    brand VARCHAR(255),
    orc_amount NUMERIC(15,2),
    product_warranty VARCHAR(255),
    ship_by VARCHAR(100),
    special_instruction TEXT,
    third_party_delivery_address TEXT,
    billing_company VARCHAR(255),
    email_subject VARCHAR(500),
    additional_information TEXT,
    da VARCHAR(100),
    delivery_address TEXT,
    tag VARCHAR(50),
    payment_flag BOOLEAN DEFAULT false,
    contact_no VARCHAR(50),
    designation VARCHAR(200),
    email VARCHAR(255),
    location VARCHAR(255),
    next_follow_up DATE,
    requirement TEXT,
    quoted_requirement TEXT,
    billing_street TEXT,
    billing_state VARCHAR(100),
    billing_country VARCHAR(100),
    billing_city VARCHAR(100),
    billing_zip_code VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- DEAL LINE ITEMS
-- ==========================================
CREATE TABLE IF NOT EXISTS deal_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    product_category VARCHAR(100),
    product_sub_category VARCHAR(100),
    part_number VARCHAR(255),
    description TEXT,
    quantity INTEGER DEFAULT 1,
    pricing NUMERIC(15,2),
    total_price NUMERIC(15,2),
    warehouse VARCHAR(100),
    total_rental NUMERIC(15,2),
    rental_per_unit NUMERIC(15,2),
    sort_order INTEGER DEFAULT 0
);

-- ==========================================
-- DEAL ACTIVITIES
-- ==========================================
CREATE TABLE IF NOT EXISTS deal_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- LEAD ACTIVITIES
-- ==========================================
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at DESC);

-- ==========================================
-- SALES ENTRIES
-- ==========================================
CREATE TABLE IF NOT EXISTS sales_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES partners(id),
    product_id UUID REFERENCES products(id),
    salesperson_id UUID NOT NULL REFERENCES users(id),
    customer_name VARCHAR(255),
    quantity INTEGER DEFAULT 1,
    amount NUMERIC(15,2) NOT NULL,
    po_number VARCHAR(100),
    invoice_no VARCHAR(100),
    payment_status VARCHAR(50) DEFAULT 'pending',
    commission_amount NUMERIC(15,2) DEFAULT 0,
    sale_date DATE NOT NULL,
    location_id UUID,
    vertical_id UUID,
    notes TEXT,
    description TEXT,
    deal_id UUID REFERENCES deals(id),
    product_ids JSONB DEFAULT '[]',
    contact_name VARCHAR(255),
    contact_no VARCHAR(50),
    email VARCHAR(255),
    gstin VARCHAR(50),
    pan_no VARCHAR(50),
    dispatch_method VARCHAR(50),
    payment_terms VARCHAR(255),
    order_type VARCHAR(50),
    serial_number VARCHAR(255),
    boq TEXT,
    price NUMERIC(15,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key from leads to sales_entries
ALTER TABLE leads ADD COLUMN IF NOT EXISTS won_sale_id UUID REFERENCES sales_entries(id);

-- ==========================================
-- QUOTES
-- ==========================================
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_number VARCHAR(50) UNIQUE,
    lead_id UUID REFERENCES leads(id),
    partner_id UUID REFERENCES partners(id),
    customer_name VARCHAR(255) NOT NULL,
    valid_until DATE,
    subtotal NUMERIC(15,2) DEFAULT 0,
    tax_rate NUMERIC(5,2) DEFAULT 18,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft',
    terms TEXT,
    notes TEXT,
    pdf_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- QUOTE LINE ITEMS
-- ==========================================
CREATE TABLE IF NOT EXISTS quote_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC(15,2) NOT NULL,
    discount_pct NUMERIC(5,2) DEFAULT 0,
    line_total NUMERIC(15,2) NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- ==========================================
-- QUOTE TERMS (Master)
-- ==========================================
CREATE TABLE IF NOT EXISTS quote_terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    is_predefined BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- QUOTE SELECTED TERMS (Junction)
-- ==========================================
CREATE TABLE IF NOT EXISTS quote_selected_terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES quote_terms(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    UNIQUE(quote_id, term_id)
);

-- ==========================================
-- TASKS
-- ==========================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'Medium',
    due_date DATE,
    due_time TIME,
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    completed_at TIMESTAMPTZ,
    related_to_type VARCHAR(50),
    related_to_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- CALENDAR EVENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    all_day BOOLEAN DEFAULT false,
    location VARCHAR(500),
    meeting_link VARCHAR(500),
    owner_id UUID REFERENCES users(id),
    color VARCHAR(20),
    related_to_type VARCHAR(50),
    related_to_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- EMAILS
-- ==========================================
CREATE TABLE IF NOT EXISTS emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject VARCHAR(500) NOT NULL,
    body TEXT,
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    cc TEXT,
    bcc TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    sent_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    related_to_type VARCHAR(50),
    related_to_id UUID,
    template_id UUID,
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- EMAIL TEMPLATES
-- ==========================================
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    body TEXT,
    category VARCHAR(100),
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE emails ADD CONSTRAINT fk_emails_template FOREIGN KEY (template_id) REFERENCES email_templates(id);

-- ==========================================
-- NOTIFICATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- ACTIVITY LOGS
-- ==========================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    user_name VARCHAR(200),
    action VARCHAR(20) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    entity_name VARCHAR(255),
    changes JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- CAREPACKS
-- ==========================================
CREATE TABLE IF NOT EXISTS carepacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES partners(id),
    product_type VARCHAR(100),
    serial_number VARCHAR(100),
    carepack_sku VARCHAR(100),
    customer_name VARCHAR(255),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- SETTINGS (Key-Value Store)
-- ==========================================
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- AUTO-UPDATE TRIGGERS
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT unnest(ARRAY[
            'users', 'roles', 'partners', 'accounts', 'contacts',
            'products', 'leads', 'deals', 'sales_entries', 'quotes',
            'quote_terms', 'tasks', 'calendar_events', 'emails',
            'email_templates', 'carepacks', 'settings'
        ])
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS update_%s_updated_at ON %s; CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
            t, t, t, t
        );
    END LOOP;
END;
$$;

-- ==========================================
-- SEED DATA: Default Roles
-- ==========================================
INSERT INTO roles (name, label, description, is_system) VALUES
    ('superadmin', 'Super Admin', 'Full system access', true),
    ('admin', 'Admin', 'Administrative access', true),
    ('businesshead', 'Business Head', 'Business operations lead', true),
    ('productmanager', 'Product Manager', 'Product management access', true),
    ('sales', 'Sales Rep', 'Sales representative access', true)
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- SEED DATA: Default Quote Terms
-- ==========================================
INSERT INTO quote_terms (content, is_predefined, sort_order) VALUES
    ('Payment is due within 30 days of invoice date.', true, 1),
    ('All prices are exclusive of applicable taxes (GST).', true, 2),
    ('Delivery will be completed within 7-10 business days from order confirmation.', true, 3),
    ('Products come with standard manufacturer warranty.', true, 4),
    ('This quotation is valid for 30 days from the date of issue.', true, 5),
    ('Cancellation after order confirmation may attract cancellation charges.', true, 6)
ON CONFLICT DO NOTHING;
```

---

## 11. Testing Checklist

After migration, verify all functionality works:

### Authentication
- [ ] Login with email/password
- [ ] JWT token generation and validation
- [ ] `GET /auth/me` returns current user
- [ ] Change password works

### CRUD Operations
- [ ] Create, read, update, delete: Accounts
- [ ] Create, read, update, delete: Contacts
- [ ] Create, read, update, delete: Leads
- [ ] Create, read, update, delete: Deals (with line items)
- [ ] Create, read, update, delete: Partners
- [ ] Create, read, update, delete: Sales Entries
- [ ] Create, read, update, delete: Tasks
- [ ] Create, read, update, delete: Calendar Events
- [ ] Create, read, update, delete: Emails
- [ ] Create, read, update, delete: Carepacks
- [ ] Create, read, update, delete: Products

### Quotes
- [ ] Create quote with line items and terms
- [ ] PDF generation works
- [ ] PDF file stored locally and accessible via URL
- [ ] Update quote regenerates PDF

### File Uploads
- [ ] Upload file via `/api/uploads/`
- [ ] File saved to `uploads/` directory
- [ ] File accessible via `/files/{filename}` URL
- [ ] Contact document uploads (GST, MSME, PAN, Aadhar)

### Dashboard
- [ ] Dashboard stats load correctly
- [ ] Monthly stats, growth stats work
- [ ] Dashboard preferences save/load

### Admin
- [ ] User management (create, update, reset password)
- [ ] Role management
- [ ] Activity logs
- [ ] Bulk import

### Access Control
- [ ] RBAC (admin vs sales vs manager)
- [ ] Data scoping (users see only their own data)
- [ ] Admin sees all data

---

## 12. Rollback Plan

If migration fails, reverting is straightforward:

1. **Database:** Re-point `DATABASE_URL` back to Supabase connection string
2. **Storage:** Revert `storage.py` to use `upload_to_supabase()`
3. **Config:** Restore `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
4. **Frontend:** No changes needed (was already clean)

Since the ORM layer is identical and the database schema is the same PostgreSQL schema, switching back is just a connection string change + storage function swap.

---

## Summary

This migration is **low complexity** because:

1. The backend already uses **SQLAlchemy ORM** — no raw Supabase queries to rewrite
2. Auth is **custom JWT** — no Supabase Auth migration needed
3. The frontend **never talks to Supabase directly** — all via `/api/*`
4. Only **2 Supabase-specific features** need replacement:
   - Database connection (just change the URL)
   - File storage (replace HTTP API call with filesystem write)

**Total estimated code changes: ~80 lines across 9 files.**
