#!/usr/bin/env python3
"""
Migrate all data from Supabase PostgreSQL to local PostgreSQL.
Uses raw asyncpg (no SQLAlchemy) to avoid pgBouncer prepared statement issues.
Run from the backend directory: python3 scripts/migrate_from_supabase.py
"""
import asyncio
import json
import sys
import os
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncpg

SUPABASE_DSN = "postgresql://postgres.wnkidelrhkvagghaftnf:Sahusameer456%40@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres"
LOCAL_DSN = "postgresql://localhost:5432/comprint_crm"

# Tables in dependency order (parents before children)
TABLES_IN_ORDER = [
    "users",
    "roles",
    "role_permissions",
    "partners",
    "products",
    "accounts",
    "contacts",
    "leads",
    "deals",
    "deal_line_items",
    "deal_activities",
    "lead_activities",
    "sales_entries",
    "quotes",
    "quote_line_items",
    "quote_terms",
    "quote_selected_terms",
    "tasks",
    "calendar_events",
    "email_templates",
    "emails",
    "notifications",
    "activity_logs",
    "carepacks",
    "settings",
    # Master tables (raw SQL, not ORM models)
    "master_dropdowns",
    "master_oems",
    "master_locations",
    "master_partner_types",
    "master_categories",
    "master_verticals",
]

MASTER_TABLE_DDL = [
    """CREATE TABLE IF NOT EXISTS master_categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now()
    )""",
    """CREATE TABLE IF NOT EXISTS master_verticals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now()
    )""",
    """CREATE TABLE IF NOT EXISTS master_partner_types (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now()
    )""",
    """CREATE TABLE IF NOT EXISTS master_locations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        city VARCHAR(255) NOT NULL,
        state VARCHAR(255),
        region VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now()
    )""",
    """CREATE TABLE IF NOT EXISTS master_oems (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        oem_id UUID,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        product_manager_id UUID,
        product_manager_ids TEXT DEFAULT '[]'
    )""",
    """CREATE TABLE IF NOT EXISTS master_dropdowns (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        entity VARCHAR(255) NOT NULL,
        value VARCHAR(255) NOT NULL,
        label VARCHAR(255) NOT NULL,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT now()
    )""",
]


async def run():
    print("=" * 60)
    print("Supabase -> Local PostgreSQL Data Migration")
    print("=" * 60)

    # Connect to Supabase with prepared statements disabled (pgBouncer)
    print("\nConnecting to Supabase...")
    supabase = await asyncpg.connect(
        SUPABASE_DSN,
        statement_cache_size=0,
    )
    print("  Connected to Supabase")

    print("Connecting to local PostgreSQL...")
    local = await asyncpg.connect(LOCAL_DSN)
    print("  Connected to local PostgreSQL")

    # Step 1: Create master tables locally
    print("\n[1/4] Creating master tables locally...")
    for ddl in MASTER_TABLE_DDL:
        await local.execute(ddl)
    print("  Master tables created")

    # Step 2: Get list of tables on both sides
    print("\n[2/4] Checking table availability...")
    supabase_tables = {
        row["tablename"]
        for row in await supabase.fetch(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
        )
    }
    local_tables = {
        row["tablename"]
        for row in await local.fetch(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
        )
    }
    print(f"  Supabase tables: {len(supabase_tables)}")
    print(f"  Local tables:    {len(local_tables)}")

    # Step 3: Migrate data table by table
    print("\n[3/4] Migrating data...")
    total_rows = 0

    for table in TABLES_IN_ORDER:
        if table not in supabase_tables:
            print(f"  SKIP {table} (not on Supabase)")
            continue
        if table not in local_tables:
            print(f"  SKIP {table} (not on local)")
            continue

        # Get row count
        count = await supabase.fetchval(f"SELECT count(*) FROM {table}")
        if count == 0:
            print(f"  SKIP {table} (0 rows)")
            continue

        # Get columns that exist in BOTH source and target
        s_cols = {
            row["column_name"]
            for row in await supabase.fetch(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_schema = 'public' AND table_name = $1",
                table,
            )
        }
        l_cols = {
            row["column_name"]
            for row in await local.fetch(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_schema = 'public' AND table_name = $1",
                table,
            )
        }
        common_cols = sorted(s_cols & l_cols)
        if not common_cols:
            print(f"  SKIP {table} (no common columns)")
            continue

        # Find JSONB columns (need special handling)
        jsonb_cols = {
            row["column_name"]
            for row in await local.fetch(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_schema = 'public' AND table_name = $1 "
                "AND data_type = 'jsonb'",
                table,
            )
        }

        # Find timestamp column types on the LOCAL side
        ts_col_types = {}
        for ts_row in await local.fetch(
            "SELECT column_name, data_type FROM information_schema.columns "
            "WHERE table_schema = 'public' AND table_name = $1 "
            "AND data_type IN ('timestamp with time zone', 'timestamp without time zone')",
            table,
        ):
            ts_col_types[ts_row["column_name"]] = ts_row["data_type"]

        # Read all rows from Supabase
        cols_str = ", ".join(common_cols)
        rows = await supabase.fetch(f"SELECT {cols_str} FROM {table}")

        if not rows:
            print(f"  SKIP {table} (0 rows after fetch)")
            continue

        # Delete existing local data and insert from Supabase
        await local.execute(f"ALTER TABLE {table} DISABLE TRIGGER ALL")
        await local.execute(f"DELETE FROM {table}")

        # Build INSERT with positional params ($1, $2, ...)
        # Cast all timestamps as text and let PostgreSQL parse them
        placeholders_parts = []
        for i, col in enumerate(common_cols):
            if col in jsonb_cols:
                placeholders_parts.append(f"${i+1}::jsonb")
            elif col in ts_col_types:
                # Pass as text, let PostgreSQL cast
                placeholders_parts.append(f"${i+1}::text::timestamptz" if ts_col_types[col] == "timestamp with time zone" else f"${i+1}::text::timestamp")
            else:
                placeholders_parts.append(f"${i+1}")
        placeholders = ", ".join(placeholders_parts)
        insert_sql = f"INSERT INTO {table} ({cols_str}) VALUES ({placeholders})"

        # Insert rows
        for row in rows:
            values = []
            for col in common_cols:
                val = row[col]
                if col in jsonb_cols and val is not None:
                    # asyncpg returns dicts/lists for jsonb, cast to JSON string
                    if isinstance(val, (dict, list)):
                        values.append(json.dumps(val))
                    else:
                        values.append(val if isinstance(val, str) else json.dumps(val))
                elif col in ts_col_types and val is not None:
                    # Convert datetime to ISO string to avoid tz mismatch
                    values.append(val.isoformat())
                else:
                    values.append(val)
            await local.execute(insert_sql, *values)

        await local.execute(f"ALTER TABLE {table} ENABLE TRIGGER ALL")
        total_rows += len(rows)
        print(f"  OK   {table}: {len(rows)} rows ({len(common_cols)} columns)")

    # Step 4: Verify counts
    print(f"\n[4/4] Verifying migration...")
    print(f"{'Table':<25} {'Supabase':>10} {'Local':>10} {'Status':>10}")
    print("-" * 60)

    all_ok = True
    for table in TABLES_IN_ORDER:
        if table not in supabase_tables or table not in local_tables:
            continue

        s_count = await supabase.fetchval(f"SELECT count(*) FROM {table}")
        l_count = await local.fetchval(f"SELECT count(*) FROM {table}")

        if s_count == 0 and l_count == 0:
            continue

        status = "OK" if s_count == l_count else "MISMATCH"
        if status == "MISMATCH":
            all_ok = False
        print(f"  {table:<23} {s_count:>10} {l_count:>10} {status:>10}")

    await supabase.close()
    await local.close()

    print(f"\nTotal rows migrated: {total_rows}")
    if all_ok:
        print("Migration successful!")
    else:
        print("WARNING: Some tables have mismatched counts!")


if __name__ == "__main__":
    asyncio.run(run())
