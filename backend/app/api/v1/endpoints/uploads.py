from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile

from app.middleware.security import get_current_user
from app.models.user import User
from app.services.upload_service import UploadService
from app.utils.response_utils import success_response

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
