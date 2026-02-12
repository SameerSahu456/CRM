#!/usr/bin/env python3
"""Add view_access column to local database"""
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def add_view_access_column():
    # Connect to local database
    engine = create_async_engine("postgresql+asyncpg://localhost:5432/zenith_crm")

    async with engine.begin() as conn:
        # Add column
        await conn.execute(text(
            """
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS view_access VARCHAR(50) NOT NULL DEFAULT 'presales'
            """
        ))
        print("✓ Added view_access column")

        # Drop existing constraint if it exists
        await conn.execute(text(
            """
            ALTER TABLE users DROP CONSTRAINT IF EXISTS check_view_access
            """
        ))

        # Add check constraint
        await conn.execute(text(
            """
            ALTER TABLE users
            ADD CONSTRAINT check_view_access
            CHECK (view_access IN ('presales', 'postsales', 'both'))
            """
        ))
        print("✓ Added check constraint")

        # Update admin users
        result = await conn.execute(text(
            """
            UPDATE users
            SET view_access = 'both'
            WHERE role IN ('admin', 'superadmin')
            """
        ))
        print(f"✓ Updated {result.rowcount} admin users to have 'both' access")

    await engine.dispose()
    print("\n✅ Migration completed successfully!")

if __name__ == "__main__":
    asyncio.run(add_view_access_column())
