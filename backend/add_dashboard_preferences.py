#!/usr/bin/env python3
"""Add dashboard_preferences column to local database"""
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def add_dashboard_preferences():
    # Connect to local database
    engine = create_async_engine("postgresql+asyncpg://localhost:5432/zenith_crm")

    async with engine.begin() as conn:
        # Add dashboard_preferences column
        await conn.execute(text(
            """
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS dashboard_preferences JSONB DEFAULT '{
              "widgets": [],
              "lastModified": null
            }'::jsonb
            """
        ))
        print("✓ Added dashboard_preferences column")

        # Add GIN index for faster JSONB queries
        await conn.execute(text(
            """
            CREATE INDEX IF NOT EXISTS idx_users_dashboard_preferences
            ON users USING gin(dashboard_preferences)
            """
        ))
        print("✓ Added GIN index for dashboard_preferences")

        # Add comment
        await conn.execute(text(
            """
            COMMENT ON COLUMN users.dashboard_preferences IS
            'Stores user dashboard layout: widget IDs, order, visibility, and grid positions'
            """
        ))
        print("✓ Added column comment")

    await engine.dispose()
    print("\n✅ Migration completed successfully!")
    print("\nDashboard preferences column added to users table.")
    print("Users can now customize their dashboard layouts with drag-and-drop widgets.")

if __name__ == "__main__":
    asyncio.run(add_dashboard_preferences())
