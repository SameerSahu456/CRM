"""
Calendar Event Service

This module contains business logic for calendar event management.
Follows SOLID principles and service layer architecture.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundException
from app.models.calendar_event import CalendarEvent
from app.models.user import User
from app.repositories.calendar_event_repository import CalendarEventRepository
from app.schemas.calendar_event_schema import (
    CalendarEventCreate,
    CalendarEventOut,
    CalendarEventUpdate,
)


class CalendarEventService:
    """
    Service layer for calendar event business logic.

    Handles:
    - Calendar event listing with pagination and filtering
    - Calendar event retrieval by date range
    - Calendar event retrieval by ID
    - Calendar event creation
    - Calendar event updates
    - Calendar event deletion
    - Access control (sales users only see their own events)
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.event_repo = CalendarEventRepository(db)

    async def list_calendar_events(
        self,
        page: int,
        limit: int,
        user: User,
    ) -> Dict[str, Any]:
        """
        List calendar events with filtering and pagination.

        Args:
            page: Page number
            limit: Items per page
            user: Current user

        Returns:
            Dictionary with data and pagination info
        """
        filters = []

        # Sales users only see their own events
        if user.role == "sales":
            filters.append(CalendarEvent.owner_id == user.id)

        result = await self.event_repo.get_with_owner(
            page=page, limit=limit, filters=filters or None
        )

        # Transform data to include owner name
        data = []
        for item in result["data"]:
            out = CalendarEventOut.model_validate(item["event"]).model_dump(
                by_alias=True
            )
            out["ownerName"] = item["owner_name"]
            data.append(out)

        return {"data": data, "pagination": result["pagination"]}

    async def get_events_by_range(
        self,
        start_date: datetime,
        end_date: datetime,
        user: User,
    ) -> List[Dict[str, Any]]:
        """
        Get calendar events within a date range.

        Args:
            start_date: Start date
            end_date: End date
            user: Current user

        Returns:
            List of calendar events
        """
        filters = []

        # Sales users only see their own events
        if user.role == "sales":
            filters.append(CalendarEvent.owner_id == user.id)

        items = await self.event_repo.get_by_range(
            start_date=start_date,
            end_date=end_date,
            filters=filters or None,
        )

        # Transform data to include owner name
        data = []
        for item in items:
            out = CalendarEventOut.model_validate(item["event"]).model_dump(
                by_alias=True
            )
            out["ownerName"] = item["owner_name"]
            data.append(out)

        return data

    async def get_calendar_event_by_id(
        self,
        event_id: str,
    ) -> Dict[str, Any]:
        """
        Get a single calendar event by ID.

        Args:
            event_id: Calendar event ID

        Returns:
            Calendar event dictionary

        Raises:
            NotFoundException: If calendar event not found
        """
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException("Calendar event not found")

        return CalendarEventOut.model_validate(event).model_dump(by_alias=True)

    async def create_calendar_event(
        self,
        event_data: CalendarEventCreate,
        user: User,
    ) -> Dict[str, Any]:
        """
        Create a new calendar event.

        Args:
            event_data: Calendar event creation data
            user: Current user

        Returns:
            Created calendar event dictionary
        """
        data = event_data.model_dump(exclude_unset=True)

        # Set owner_id to current user if not provided
        if "owner_id" not in data or data["owner_id"] is None:
            data["owner_id"] = user.id

        event = await self.event_repo.create(data)

        return CalendarEventOut.model_validate(event).model_dump(by_alias=True)

    async def update_calendar_event(
        self,
        event_id: str,
        event_data: CalendarEventUpdate,
    ) -> Dict[str, Any]:
        """
        Update an existing calendar event.

        Args:
            event_id: Calendar event ID
            event_data: Calendar event update data

        Returns:
            Updated calendar event dictionary

        Raises:
            NotFoundException: If calendar event not found
        """
        update_data = event_data.model_dump(exclude_unset=True)
        event = await self.event_repo.update(event_id, update_data)

        if not event:
            raise NotFoundException("Calendar event not found")

        return CalendarEventOut.model_validate(event).model_dump(by_alias=True)

    async def delete_calendar_event(
        self,
        event_id: str,
    ) -> bool:
        """
        Delete a calendar event.

        Args:
            event_id: Calendar event ID

        Returns:
            True if deleted successfully

        Raises:
            NotFoundException: If calendar event not found
        """
        deleted = await self.event_repo.delete(event_id)

        if not deleted:
            raise NotFoundException("Calendar event not found")

        return True
