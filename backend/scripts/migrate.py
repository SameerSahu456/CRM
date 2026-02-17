#!/usr/bin/env python3
"""
Create all tables from SQLAlchemy models and seed initial data.
Run from the backend directory: python -m scripts.migrate
"""
import asyncio
import sys
import os

# Add backend to path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Import Base and all models so metadata knows about every table
from app.models import Base  # noqa: F401 — triggers all model imports


DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://localhost:5432/comprint_crm",
)


async def run_migration():
    print(f"Connecting to: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
    engine = create_async_engine(DATABASE_URL, echo=False)

    # 1. Create uuid-ossp extension
    async with engine.begin() as conn:
        await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'))
    print("[1/4] uuid-ossp extension enabled")

    # 2. Create all tables from SQLAlchemy models
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[2/4] All tables created from SQLAlchemy models")

    # 3. Create settings table (used by partners endpoint but not an ORM model)
    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS settings (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                key VARCHAR(100) UNIQUE NOT NULL,
                value TEXT,
                created_at TIMESTAMPTZ DEFAULT now(),
                updated_at TIMESTAMPTZ DEFAULT now()
            )
        """))
    print("[3/4] Settings table created")

    # 4. Seed default data
    async with engine.begin() as conn:
        # Seed roles
        await conn.execute(text("""
            INSERT INTO roles (name, label, description, is_system) VALUES
                ('superadmin', 'Super Admin', 'Full system access', true),
                ('admin', 'Admin', 'Administrative access', true),
                ('businesshead', 'Business Head', 'Business operations lead', true),
                ('productmanager', 'Product Manager', 'Product management access', true),
                ('sales', 'Sales Rep', 'Sales representative access', true)
            ON CONFLICT (name) DO NOTHING
        """))

        # Seed quote terms
        await conn.execute(text("""
            INSERT INTO quote_terms (content, is_predefined, sort_order) VALUES
                ('Payment is due within 30 days of invoice date.', true, 1),
                ('All prices are exclusive of applicable taxes (GST).', true, 2),
                ('Delivery will be completed within 7-10 business days from order confirmation.', true, 3),
                ('Products come with standard manufacturer warranty.', true, 4),
                ('This quotation is valid for 30 days from the date of issue.', true, 5),
                ('Cancellation after order confirmation may attract cancellation charges.', true, 6)
            ON CONFLICT DO NOTHING
        """))

    print("[4/4] Seed data inserted (roles, quote terms)")

    # List created tables
    async with engine.connect() as conn:
        result = await conn.execute(text("""
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
        """))
        tables = [row[0] for row in result]
        print(f"\nCreated {len(tables)} tables:")
        for t in tables:
            print(f"  - {t}")

    await engine.dispose()
    print("\nMigration complete!")


if __name__ == "__main__":
    asyncio.run(run_migration())
