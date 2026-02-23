from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api.v1.router import api_router
from app.config import settings
from app.database import engine
from app.exceptions import CRMException, crm_exception_handler, generic_exception_handler


async def _ensure_schema() -> None:
    """Ensure new columns exist on production DB (idempotent)."""
    migrations = [
        "ALTER TABLE deals ADD COLUMN IF NOT EXISTS type_of_order VARCHAR(100)",
        """CREATE TABLE IF NOT EXISTS file_uploads (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL,
            original_filename VARCHAR(255) NOT NULL,
            content_type VARCHAR(100) NOT NULL,
            data TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )""",
    ]
    async with engine.begin() as conn:
        for stmt in migrations:
            await conn.execute(text(stmt))


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run lightweight schema migrations on startup."""
    try:
        await _ensure_schema()
    except Exception:
        pass  # Don't block app startup if migration fails
    yield


app = FastAPI(
    lifespan=lifespan,
    title="Comprint CRM API",
    version="1.0.0",
    # Optimize for production
    docs_url=None if not settings.DEBUG else "/docs",
    redoc_url=None if not settings.DEBUG else "/redoc",
)

# Add GZip compression for responses (reduces payload size by ~70%)
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    # Allow all Vercel deployments via regex pattern
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(CRMException, crm_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

app.include_router(api_router, prefix=settings.API_PREFIX)

# Serve uploaded files from local storage (skip on serverless/Vercel)
upload_dir = Path(settings.UPLOAD_DIR)
try:
    upload_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/files", StaticFiles(directory=str(upload_dir)), name="uploaded-files")
except OSError:
    pass  # Read-only filesystem (Vercel serverless)


@app.get("/api/status")
async def health_check():
    return {"status": "ok", "version": "1.0.0", "engine": "FastAPI"}
