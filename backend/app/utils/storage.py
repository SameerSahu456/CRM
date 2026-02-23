from __future__ import annotations

import base64

from sqlalchemy import text

from app.database import engine

_table_ensured = False

_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS file_uploads (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    data TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
)
"""

_INSERT = """
INSERT INTO file_uploads (filename, original_filename, content_type, data)
VALUES (:filename, :original_filename, :content_type, :data)
RETURNING id
"""


async def _ensure_table() -> None:
    global _table_ensured
    if _table_ensured:
        return
    async with engine.begin() as conn:
        await conn.execute(text(_CREATE_TABLE))
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

    async with engine.begin() as conn:
        result = await conn.execute(
            text(_INSERT),
            {
                "filename": file_name,
                "original_filename": original_filename or file_name,
                "content_type": content_type,
                "data": encoded,
            },
        )
        row = result.fetchone()
        file_id = row[0]

    return f"/api/uploads/files/{file_id}"


_SELECT = "SELECT id, filename, original_filename, content_type, data FROM file_uploads WHERE id = :id"


async def get_file(file_id: int) -> dict | None:
    """Retrieve a file record from DB by ID."""
    async with engine.begin() as conn:
        result = await conn.execute(text(_SELECT), {"id": file_id})
        row = result.fetchone()
        if not row:
            return None
        return {
            "id": row[0],
            "filename": row[1],
            "original_filename": row[2],
            "content_type": row[3],
            "data": row[4],
        }
