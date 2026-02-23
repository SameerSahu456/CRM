from __future__ import annotations

import base64

from sqlalchemy import select

from app.database import async_session
from app.models.file_upload import FileUpload


async def upload_file(file_bytes: bytes, file_name: str, content_type: str) -> str:
    """Store file as base64 in DB and return its serve URL."""
    encoded = base64.b64encode(file_bytes).decode("ascii")

    record = FileUpload(
        filename=file_name,
        original_filename=file_name,
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
