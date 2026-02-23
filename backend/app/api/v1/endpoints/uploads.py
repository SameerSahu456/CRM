from __future__ import annotations

import base64

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import Response

from app.middleware.security import get_current_user
from app.models.user import User
from app.services.upload_service import UploadService
from app.utils.response_utils import success_response
from app.utils.storage import get_file

router = APIRouter()


@router.post("/")
async def upload_file_endpoint(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    """
    Upload a file to storage.

    Returns:
        URL and filename of uploaded file
    """
    service = UploadService()
    data = await service.upload_file(file, user)
    return success_response(data, "File uploaded successfully")


@router.get("/files/{file_id}")
async def serve_file(file_id: int):
    """Serve a file stored in the database."""
    record = await get_file(file_id)
    if not record:
        return Response(status_code=404, content="File not found")
    file_bytes = base64.b64decode(record["data"])
    return Response(
        content=file_bytes,
        media_type=record["content_type"],
        headers={"Content-Disposition": f'inline; filename="{record["original_filename"]}"'},
    )
