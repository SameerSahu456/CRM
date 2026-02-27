"""Alembic environment configuration for async SQLAlchemy."""

import asyncio
from logging.config import fileConfig

from sqlalchemy import pool, create_engine
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context

# Import your app config and models
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings
from app.models.base import Base

# Import all models to ensure they're registered with Base.metadata
from app.models.user import User
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.account import Account
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.deal_line_item import DealLineItem
from app.models.deal_activity import DealActivity
from app.models.lead import Lead
from app.models.lead_activity import LeadActivity
from app.models.task import Task
from app.models.product import Product
from app.models.email import Email
from app.models.email_template import EmailTemplate
from app.models.calendar_event import CalendarEvent
from app.models.partner import Partner
from app.models.quote import Quote
from app.models.quote_line_item import QuoteLineItem
from app.models.quote_term import QuoteTerm
from app.models.quote_selected_term import QuoteSelectedTerm
from app.models.carepack import Carepack
from app.models.sales_entry import SalesEntry
from app.models.activity_log import ActivityLog
from app.models.notification import Notification
from app.models.file_upload import FileUpload

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the SQLAlchemy URL from app settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL.replace("%", "%%"))

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata


def _get_sync_url() -> str:
    """Convert async DB URL to sync (psycopg2) URL for migrations."""
    url = settings.DATABASE_URL
    return url.replace("postgresql+asyncpg://", "postgresql://")


def _uses_pgbouncer() -> bool:
    """Detect if the URL goes through pgbouncer/supavisor (port 6543)."""
    return ":6543/" in settings.DATABASE_URL or "pooler.supabase.com" in settings.DATABASE_URL


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


def run_sync_migrations() -> None:
    """Run migrations using sync psycopg2 driver (for pgbouncer/Supabase)."""
    connectable = create_engine(
        _get_sync_url(),
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        do_run_migrations(connection)

    connectable.dispose()


async def run_async_migrations() -> None:
    """Run migrations using async asyncpg driver (for local dev)."""
    connectable = create_async_engine(
        settings.DATABASE_URL,
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    if _uses_pgbouncer():
        run_sync_migrations()
    else:
        asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
