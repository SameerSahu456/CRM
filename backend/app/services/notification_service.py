"""
Notification Service Layer

This module contains all business logic for notification management.
Following SOLID principles with clear separation of concerns.
"""

from __future__ import annotations

from typing import Any, Dict, List

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundException
from app.models.notification import Notification
from app.models.user import User


class NotificationService:
    """Service for notification management operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_notifications(self, user: User) -> List[Dict[str, Any]]:
        """
        Get user's notifications (last 50).

        Args:
            user: Current user

        Returns:
            List of notifications
        """
        stmt = (
            select(Notification)
            .where(Notification.user_id == user.id)
            .order_by(Notification.created_at.desc())
            .limit(50)
        )
        result = await self.db.execute(stmt)
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

    async def mark_read(self, notification_id: str, user: User) -> bool:
        """
        Mark a single notification as read.

        Args:
            notification_id: Notification ID
            user: Current user

        Returns:
            True if successful

        Raises:
            NotFoundException: If notification not found
        """
        stmt = (
            select(Notification)
            .where(Notification.id == notification_id)
            .where(Notification.user_id == user.id)
        )
        result = await self.db.execute(stmt)
        notif = result.scalar_one_or_none()
        if not notif:
            raise NotFoundException("Notification not found")
        notif.is_read = True
        await self.db.flush()
        return True

    async def mark_all_read(self, user: User) -> bool:
        """
        Mark all user's notifications as read.

        Args:
            user: Current user

        Returns:
            True if successful
        """
        stmt = (
            update(Notification)
            .where(Notification.user_id == user.id)
            .where(Notification.is_read == False)
            .values(is_read=True)
        )
        await self.db.execute(stmt)
        return True

