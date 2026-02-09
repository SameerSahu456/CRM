import os
import ssl as ssl_module

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.config import settings

# Handle sslmode and pgbouncer for asyncpg (Supabase connection pooling)
db_url = settings.DATABASE_URL
connect_args = {}

# Supabase ALWAYS requires SSL - configure it first
if "supabase" in db_url.lower():
    ssl_ctx = ssl_module.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl_module.CERT_NONE
    connect_args["ssl"] = ssl_ctx

    # Disable prepared statements for pgbouncer compatibility
    # Connection pooling URLs (.pooler.supabase.com) use pgbouncer
    if ".pooler.supabase.com" in db_url or "pgbouncer" in db_url:
        connect_args["statement_cache_size"] = 0

# Strip query parameters that asyncpg doesn't support (sslmode, pgbouncer, etc.)
if "?" in db_url:
    db_url = db_url.split("?")[0]

# Detect serverless environment (Vercel / AWS Lambda)
is_serverless = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))

# NullPool for serverless (no persistent pool), regular pool for local dev
engine_kwargs = dict(
    echo=False,
    connect_args=connect_args,
)

if is_serverless:
    engine_kwargs["poolclass"] = NullPool
else:
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_async_engine(db_url, **engine_kwargs)

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
