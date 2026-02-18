from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.security import get_current_user
from app.models.user import User
from app.services.notification_service import NotificationService
from app.utils.response_utils import success_response

router = APIRouter()


@router.get("/")
async def list_notifications(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get user's notifications (last 50).

    Returns:
        List of notifications
    """
    service = NotificationService(db)
    data = await service.list_notifications(user)
    return success_response(data, "Notifications retrieved successfully")


@router.patch("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark a single notification as read.

    Returns:
        Success status
    """
    service = NotificationService(db)
    await service.mark_read(notification_id, user)
    return success_response({"success": True}, "Notification marked as read")


@router.patch("/all/read")
async def mark_all_read(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark all user's notifications as read.

    Returns:
        Success status
    """
    service = NotificationService(db)
    await service.mark_all_read(user)
    return success_response({"success": True}, "All notifications marked as read")
