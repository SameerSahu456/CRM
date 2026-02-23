from __future__ import annotations

import base64

from sqlalchemy import select, text

from app.database import async_session
from app.models.file_upload import FileUpload

_table_ensured = False


async def _ensure_table() -> None:
    """Create file_uploads table if it doesn't exist (idempotent)."""
    global _table_ensured
    if _table_ensured:
        return
    async with async_session() as session:
        await session.execute(text("""
            CREATE TABLE IF NOT EXISTS file_uploads (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                original_filename VARCHAR(255) NOT NULL,
                content_type VARCHAR(100) NOT NULL,
                data TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        """))
        await session.commit()
    _table_ensured = True


async def upload_file(
    file_bytes: bytes,
    file_name: str,
    content_type: str,
    original_filename: str | None = None,
) -> str:
    """Store file as base64 in DB and return its serve URL."""
    await _ensure_table()

    encoded = base64.b64encode(file_bytes).decode("ascii")

    record = FileUpload(
        filename=file_name,
        original_filename=original_filename or file_name,
        content_type=content_type,
        data=encoded,
    )
    async with async_session() as session:
        session.add(record)
        await session.commit()
        await session.refresh(record)

    return f"/api/uploads/files/{record.id}"


async def get_file(file_id: int) -> FileUpload | None:
    """Retrieve a file record from DB by ID."""
    async with async_session() as session:
        result = await session.execute(
            select(FileUpload).where(FileUpload.id == file_id)
        )
        return result.scalar_one_or_none()
