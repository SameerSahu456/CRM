from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import NotFoundException
from app.middleware.security import get_current_user
from app.models.Notification import Notification
from app.models.User import User

router = APIRouter()


@router.get("/")
async def list_notifications(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    result = await db.execute(stmt)
    notifications = result.scalars().all()

    return [
        {
            "id": str(n.id),
            "userId": str(n.user_id) if n.user_id else None,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "link": n.link,
            "isRead": n.is_read,
            "metadata": n.extra_data,
            "createdAt": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifications
    ]


@router.patch("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Notification)
        .where(Notification.id == notification_id)
        .where(Notification.user_id == user.id)
    )
    result = await db.execute(stmt)
    notif = result.scalar_one_or_none()
    if not notif:
        raise NotFoundException("Notification not found")
    notif.is_read = True
    await db.flush()
    return {"success": True}


@router.patch("/all/read")
async def mark_all_read(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        update(Notification)
        .where(Notification.user_id == user.id)
        .where(Notification.is_read == False)
        .values(is_read=True)
    )
    await db.execute(stmt)
    return {"success": True}
