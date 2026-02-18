from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.security import get_current_user
from app.models.user import User
from app.schemas.calendar_event_schema import (
    CalendarEventCreate,
    CalendarEventUpdate,
)
from app.services.calendar_event_service import CalendarEventService
from app.utils.response_utils import (
    created_response,
    deleted_response,
    paginated_response,
    success_response,
)

router = APIRouter()


@router.get("/")
async def list_calendar_events(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    List calendar events with filtering and pagination.

    Returns standardized response:
    {
        "code": 200,
        "data": [...],
        "message": "Success",
        "pagination": {...}
    }
    """
    service = CalendarEventService(db)
    result = await service.list_calendar_events(page=page, limit=limit, user=user)

    return paginated_response(
        data=result["data"],
        page=page,
        limit=limit,
        total=result["pagination"]["total"],
        message="Calendar events retrieved successfully",
    )


@router.get("/range")
async def get_events_by_range(
    start: str = Query(..., description="Start date (ISO format)"),
    end: str = Query(..., description="End date (ISO format)"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get calendar events within a date range.

    Returns standardized response:
    {
        "code": 200,
        "data": [...],
        "message": "Success"
    }
    """
    service = CalendarEventService(db)
    start_date = datetime.fromisoformat(start)
    end_date = datetime.fromisoformat(end)

    data = await service.get_events_by_range(
        start_date=start_date, end_date=end_date, user=user
    )

    return success_response(data=data, message="Calendar events retrieved successfully")


@router.get("/{event_id}")
async def get_calendar_event(
    event_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get a single calendar event by ID.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = CalendarEventService(db)
    event = await service.get_calendar_event_by_id(event_id=event_id)

    return success_response(data=event, message="Calendar event retrieved successfully")


@router.post("/")
async def create_calendar_event(
    body: CalendarEventCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Create a new calendar event.

    Returns standardized response:
    {
        "code": 201,
        "data": {...},
        "message": "Created successfully"
    }
    """
    service = CalendarEventService(db)
    event = await service.create_calendar_event(event_data=body, user=user)

    return created_response(data=event, message="Calendar event created successfully")


@router.put("/{event_id}")
async def update_calendar_event(
    event_id: str,
    body: CalendarEventUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Update an existing calendar event.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = CalendarEventService(db)
    event = await service.update_calendar_event(event_id=event_id, event_data=body)

    return success_response(data=event, message="Calendar event updated successfully")


@router.delete("/{event_id}")
async def delete_calendar_event(
    event_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Delete a calendar event.

    Returns standardized response:
    {
        "code": 200,
        "data": null,
        "message": "Deleted successfully"
    }
    """
    service = CalendarEventService(db)
    await service.delete_calendar_event(event_id=event_id)

    return deleted_response(message="Calendar event deleted successfully")
