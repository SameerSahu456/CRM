from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.security import get_current_user
from app.models.user import User
from app.services.bulk_import_service import BulkImportService
from app.utils.response_utils import success_response

router = APIRouter()


@router.get("/template/{entity}")
async def download_template(
    entity: str,
    user: User = Depends(get_current_user),
) -> StreamingResponse:
    """
    Return a CSV template with the correct headers and a sample row for the requested entity.

    Returns:
        CSV file download
    """
    service = BulkImportService(None)  # No DB needed for template generation
    csv_content, filename = service.get_template(entity)
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/import/{entity}")
async def bulk_import(
    entity: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Accept a CSV file, validate each row, and bulk-insert valid records.

    Returns:
        Dictionary with total, imported count, and errors
    """
    service = BulkImportService(db)
    result = await service.import_data(entity, file, user)
    return success_response(
        result,
        f"Imported {result['imported']} of {result['total']} {entity} records",
    )
