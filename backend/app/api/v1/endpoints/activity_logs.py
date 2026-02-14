from __future__ import annotations

import math
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_role
from app.middleware.security import get_current_user
from app.models.ActivityLog import ActivityLog
from app.models.User import User
from app.schemas.ActivityLogSchema import ActivityLogOut
from app.utils.activity_logger import log_activity

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
    """Log an activity (e.g. export) from the frontend."""
    await log_activity(
        db=db,
        user=user,
        action=body.action,
        entity_type=body.entity_type,
        entity_name=body.entity_name,
    )
    await db.commit()
    return {"ok": True}


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
    """Return a paginated list of activity logs. Superadmin only."""

    # ---------- filters ----------
    conditions = []

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

    # ---------- total count ----------
    count_stmt = select(func.count()).select_from(ActivityLog)
    for cond in conditions:
        count_stmt = count_stmt.where(cond)

    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0
    total_pages = max(1, math.ceil(total / limit))

    # ---------- paginated query ----------
    offset = (page - 1) * limit
    query = (
        select(ActivityLog)
        .order_by(ActivityLog.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    for cond in conditions:
        query = query.where(cond)

    result = await db.execute(query)
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
