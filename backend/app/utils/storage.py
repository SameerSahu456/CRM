from __future__ import annotations

from pathlib import Path

from app.config import settings


async def upload_file(file_bytes: bytes, file_name: str, content_type: str) -> str:
    """Save file to local filesystem and return its public URL."""
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Support subdirectories (e.g., "quotes/quote-xxx.pdf")
    file_path = upload_dir / file_name
    file_path.parent.mkdir(parents=True, exist_ok=True)

    file_path.write_bytes(file_bytes)

    return f"{settings.BASE_URL}/files/{file_name}"
