import ssl

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.config import settings

_db_url = settings.DATABASE_URL
_is_supabase = "supabase" in _db_url

if _is_supabase:
    # Strip query params like ?pgbouncer=true&connection_limit=1 that break asyncpg
    _db_url = _db_url.split("?")[0]

    # Supabase uses pgBouncer which requires special handling:
    #   - NullPool (serverless, no persistent connections)
    #   - statement_cache_size=0 (pgBouncer doesn't support prepared statements)
    #   - SSL required
    _ssl_ctx = ssl.create_default_context()
    _ssl_ctx.check_hostname = False
    _ssl_ctx.verify_mode = ssl.CERT_NONE

    engine = create_async_engine(
        _db_url,
        echo=False,
        poolclass=NullPool,
        connect_args={
            "ssl": _ssl_ctx,
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,
        },
    )
else:
    # Local PostgreSQL — standard connection pooling
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
