from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import NotFoundException
from app.middleware.security import get_current_user
from app.models.CalendarEvent import CalendarEvent
from app.models.User import User
from app.repositories.CalendarEventRepository import CalendarEventRepository
from app.schemas.CalendarEventSchema import (
    CalendarEventOut,
    CalendarEventCreate,
    CalendarEventUpdate,
)

router = APIRouter()


@router.get("/")
async def list_calendar_events(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = CalendarEventRepository(db)
    filters = []

    if user.role == "sales":
        filters.append(CalendarEvent.owner_id == user.id)

    result = await repo.get_with_owner(page=page, limit=limit, filters=filters or None)

    data = []
    for item in result["data"]:
        out = CalendarEventOut.model_validate(item["event"]).model_dump(by_alias=True)
        out["ownerName"] = item["owner_name"]
        data.append(out)

    return {"data": data, "pagination": result["pagination"]}


@router.get("/range")
async def get_events_by_range(
    start: str = Query(..., description="Start date (ISO format)"),
    end: str = Query(..., description="End date (ISO format)"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = CalendarEventRepository(db)
    filters = []

    if user.role == "sales":
        filters.append(CalendarEvent.owner_id == user.id)

    start_date = datetime.fromisoformat(start)
    end_date = datetime.fromisoformat(end)

    items = await repo.get_by_range(
        start_date=start_date,
        end_date=end_date,
        filters=filters or None,
    )

    data = []
    for item in items:
        out = CalendarEventOut.model_validate(item["event"]).model_dump(by_alias=True)
        out["ownerName"] = item["owner_name"]
        data.append(out)

    return data


@router.get("/{event_id}")
async def get_calendar_event(
    event_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = CalendarEventRepository(db)
    event = await repo.get_by_id(event_id)
    if not event:
        raise NotFoundException("Calendar event not found")
    return CalendarEventOut.model_validate(event).model_dump(by_alias=True)


@router.post("/")
async def create_calendar_event(
    body: CalendarEventCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = CalendarEventRepository(db)
    data = body.model_dump(exclude_unset=True)
    if "owner_id" not in data or data["owner_id"] is None:
        data["owner_id"] = user.id
    event = await repo.create(data)
    return CalendarEventOut.model_validate(event).model_dump(by_alias=True)


@router.put("/{event_id}")
async def update_calendar_event(
    event_id: str,
    body: CalendarEventUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = CalendarEventRepository(db)
    event = await repo.update(event_id, body.model_dump(exclude_unset=True))
    if not event:
        raise NotFoundException("Calendar event not found")
    return CalendarEventOut.model_validate(event).model_dump(by_alias=True)


@router.delete("/{event_id}")
async def delete_calendar_event(
    event_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = CalendarEventRepository(db)
    deleted = await repo.delete(event_id)
    if not deleted:
        raise NotFoundException("Calendar event not found")
    return {"success": True}
