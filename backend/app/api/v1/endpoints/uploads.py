from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, UploadFile, File

from app.middleware.security import get_current_user
from app.models.User import User
from app.utils.storage import upload_file

router = APIRouter()


@router.post("/")
async def upload_file_endpoint(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    file_bytes = await file.read()
    ext = file.filename.split(".")[-1] if file.filename else "pdf"
    unique_name = f"{uuid.uuid4()}.{ext}"
    url = await upload_file(
        file_bytes, unique_name, file.content_type or "application/pdf"
    )
    return {"url": url, "filename": file.filename}
