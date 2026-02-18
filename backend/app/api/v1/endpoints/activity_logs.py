from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_role
from app.middleware.security import get_current_user
from app.models.user import User
from app.services.activity_log_service import ActivityLogService
from app.utils.response_utils import created_response, success_response

router = APIRouter()


class ActivityLogCreate(BaseModel):
    action: str
    entity_type: str
    entity_name: Optional[str] = None


@router.post("/")
async def create_activity_log(
    body: ActivityLogCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Log an activity (e.g. export) from the frontend.

    Returns:
        Success status
    """
    service = ActivityLogService(db)
    await service.create_activity_log(
        body.action, body.entity_type, body.entity_name, user
    )
    return created_response({"ok": True}, "Activity logged successfully")


@router.get("/")
async def list_activity_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user_id: Optional[str] = None,
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    user: User = Depends(require_role("superadmin")),
    db: AsyncSession = Depends(get_db),
):
    """
    Return a paginated list of activity logs (superadmin only).

    Returns:
        Paginated list of activity logs
    """
    service = ActivityLogService(db)
    result = await service.list_activity_logs(
        page, limit, user_id, entity_type, action, date_from, date_to
    )
    return success_response(
        result["data"],
        "Activity logs retrieved successfully",
        pagination=result["pagination"],
    )
