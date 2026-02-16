from __future__ import annotations

import httpx

from app.config import settings

BUCKET_NAME = "documents"


async def upload_to_supabase(file_bytes: bytes, file_name: str, content_type: str) -> str:
    url = f"{settings.SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{file_name}"
    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
        "Content-Type": content_type,
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, content=file_bytes, headers=headers)
        resp.raise_for_status()
    return f"{settings.SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{file_name}"
