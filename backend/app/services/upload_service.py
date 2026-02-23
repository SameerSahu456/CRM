"""
Upload Service Layer

This module contains all business logic for file upload operations.
Following SOLID principles with clear separation of concerns.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict

from fastapi import UploadFile

from app.models.user import User
from app.utils.storage import upload_file


class UploadService:
    """Service for file upload operations."""

    async def upload_file(self, file: UploadFile, user: User) -> Dict[str, Any]:
        """
        Upload a file to storage.

        Args:
            file: File to upload
            user: Current user

        Returns:
            Dictionary with URL and filename
        """
        file_bytes = await file.read()
        ext = file.filename.split(".")[-1] if file.filename else "pdf"
        unique_name = f"{uuid.uuid4()}.{ext}"
        url = await upload_file(
            file_bytes,
            unique_name,
            file.content_type or "application/pdf",
            original_filename=file.filename,
        )
        return {"url": url, "filename": file.filename}

