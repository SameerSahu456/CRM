"""
Activity Log Service Layer

This module contains all business logic for activity log management.
Following SOLID principles with clear separation of concerns.
"""

from __future__ import annotations

import math
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity_log import ActivityLog
from app.models.user import User
from app.schemas.activity_log_schema import ActivityLogOut
from app.utils.activity_logger import log_activity

# Roles that can see all activity logs
_ADMIN_ROLES = {"admin", "superadmin"}
# Roles that can see their own + their team's activity logs
_MANAGER_ROLES = {"manager", "businesshead", "productmanager"}


class ActivityLogService:
    """Service for activity log management operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_activity_log(
        self,
        action: str,
        entity_type: str,
        entity_name: Optional[str],
        user: User,
    ) -> bool:
        """
        Create an activity log entry.

        Args:
            action: Action performed
            entity_type: Type of entity
            entity_name: Name of entity
            user: User performing the action

        Returns:
            True if successful
        """
        await log_activity(
            db=self.db,
            user=user,
            action=action,
            entity_type=entity_type,
            entity_name=entity_name,
        )
        await self.db.commit()
        return True

    async def list_activity_logs(
        self,
        page: int,
        limit: int,
        user_id: Optional[str] = None,
        entity_type: Optional[str] = None,
        action: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        current_user: Optional[User] = None,
    ) -> Dict[str, Any]:
        """
        List activity logs with pagination and filtering.

        Role-based visibility:
        - admin / superadmin: see all logs
        - manager / businesshead / productmanager: see own + team's logs
        - others: see only their own logs

        Args:
            page: Page number (1-based)
            limit: Items per page
            user_id: Filter by user ID
            entity_type: Filter by entity type
            action: Filter by action
            date_from: Filter by start date (ISO format)
            date_to: Filter by end date (ISO format)
            current_user: The authenticated user (for role-based filtering)

        Returns:
            Dictionary with data and pagination
        """
        # Build filters
        conditions = []

        # Role-based visibility filtering
        if current_user:
            role = current_user.role
            if role in _ADMIN_ROLES:
                # Admin / superadmin can see everything — no extra filter
                pass
            elif role in _MANAGER_ROLES:
                # Managers see their own logs + logs from users they manage
                team_ids_stmt = select(User.id).where(
                    User.manager_id == current_user.id
                )
                team_result = await self.db.execute(team_ids_stmt)
                team_ids = [row[0] for row in team_result.fetchall()]
                allowed_ids = [current_user.id] + team_ids
                conditions.append(ActivityLog.user_id.in_(allowed_ids))
            else:
                # Regular users see only their own logs
                conditions.append(ActivityLog.user_id == current_user.id)

        if user_id:
            conditions.append(ActivityLog.user_id == user_id)
        if entity_type:
            conditions.append(ActivityLog.entity_type == entity_type)
        if action:
            conditions.append(ActivityLog.action == action)
        if date_from:
            try:
                dt_from = datetime.fromisoformat(date_from)
                conditions.append(ActivityLog.created_at >= dt_from)
            except ValueError:
                pass
        if date_to:
            try:
                dt_to = datetime.fromisoformat(date_to)
                conditions.append(ActivityLog.created_at <= dt_to)
            except ValueError:
                pass

        # Get total count
        count_stmt = select(func.count()).select_from(ActivityLog)
        for cond in conditions:
            count_stmt = count_stmt.where(cond)

        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0
        total_pages = max(1, math.ceil(total / limit))

        # Get paginated data
        offset = (page - 1) * limit
        query = (
            select(ActivityLog)
            .order_by(ActivityLog.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        for cond in conditions:
            query = query.where(cond)

        result = await self.db.execute(query)
        rows = result.scalars().all()

        data = [
            ActivityLogOut.model_validate(row).model_dump(by_alias=True)
            for row in rows
        ]

        return {
            "data": data,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": total_pages,
            },
        }

