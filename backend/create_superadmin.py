#!/usr/bin/env python3
"""Create superadmin and admin users with proper access levels"""
import asyncio
from passlib.context import CryptContext
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin_users():
    # Connect to local database
    engine = create_async_engine("postgresql+asyncpg://localhost:5432/comprint_crm")

    async with engine.begin() as conn:
        # Create superadmin (full access to everything)
        superadmin_password = pwd_context.hash("superadmin123")
        await conn.execute(text("""
            INSERT INTO users (email, password_hash, name, role, view_access, is_active)
            VALUES (:email, :password_hash, :name, :role, :view_access, :is_active)
            ON CONFLICT (email) DO UPDATE
            SET password_hash = EXCLUDED.password_hash,
                role = EXCLUDED.role,
                view_access = EXCLUDED.view_access,
                is_active = EXCLUDED.is_active
        """), {
            "email": "superadmin@comprint.com",
            "password_hash": superadmin_password,
            "name": "Super Administrator",
            "role": "superadmin",
            "view_access": "both",
            "is_active": True
        })
        print("✓ Created/Updated Superadmin: superadmin@comprint.com / superadmin123")

        # Create admin (has both views but may have some restrictions in future)
        admin_password = pwd_context.hash("admin123")
        await conn.execute(text("""
            INSERT INTO users (email, password_hash, name, role, view_access, is_active)
            VALUES (:email, :password_hash, :name, :role, :view_access, :is_active)
            ON CONFLICT (email) DO UPDATE
            SET password_hash = EXCLUDED.password_hash,
                role = EXCLUDED.role,
                view_access = EXCLUDED.view_access,
                is_active = EXCLUDED.is_active
        """), {
            "email": "admin@comprint.com",
            "password_hash": admin_password,
            "name": "Administrator",
            "role": "admin",
            "view_access": "both",
            "is_active": True
        })
        print("✓ Created/Updated Admin: admin@comprint.com / admin123")

        # Update existing admin@gmail.com to admin role
        await conn.execute(text("""
            UPDATE users
            SET role = 'admin',
                view_access = 'both'
            WHERE email = 'admin@gmail.com'
        """))
        print("✓ Updated admin@gmail.com to admin role with both access")

        # Display all admin users
        result = await conn.execute(text("""
            SELECT email, name, role, view_access, is_active
            FROM users
            WHERE role IN ('superadmin', 'admin')
            ORDER BY
                CASE role
                    WHEN 'superadmin' THEN 1
                    WHEN 'admin' THEN 2
                END,
                email
        """))

        print("\n📊 Admin Users:")
        print("=" * 80)
        print(f"{'Email':<30} {'Name':<25} {'Role':<12} {'View':<10} {'Active'}")
        print("-" * 80)
        for row in result:
            print(f"{row[0]:<30} {row[1]:<25} {row[2]:<12} {row[3]:<10} {'✓' if row[4] else '✗'}")

    await engine.dispose()
    print("\n✅ Admin users created successfully!")
    print("\nLogin Credentials:")
    print("  Superadmin: superadmin@comprint.com / superadmin123")
    print("  Admin:      admin@comprint.com / admin123")
    print("  Admin:      admin@gmail.com / 1")

if __name__ == "__main__":
    asyncio.run(create_admin_users())
