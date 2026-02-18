from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_admin
from app.middleware.security import get_current_user
from app.models.user import User
from app.services.settings_service import SettingsService
from app.utils.response_utils import success_response

router = APIRouter()


@router.get("/")
async def list_settings(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all settings.

    Returns:
        List of all settings
    """
    service = SettingsService(db)
    data = await service.list_settings()
    return success_response(data, "Settings retrieved successfully")


@router.put("/")
async def update_setting(
    body: dict,
    admin: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """
    Update or create a setting (admin only).

    Returns:
        Success status with key and value
    """
    service = SettingsService(db)
    key = body.get("key")
    value = body.get("value")
    data = await service.update_setting(key, value, admin)
    return success_response(data, "Setting updated successfully")
