from __future__ import annotations

from typing import Optional
from uuid import UUID
from datetime import datetime

from app.schemas.common import CamelModel


class CalendarEventOut(CamelModel):
    id: UUID
    title: str
    description: Optional[str] = None
    type: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    all_day: Optional[bool] = False
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    owner_id: Optional[UUID] = None
    color: Optional[str] = None
    related_to_type: Optional[str] = None
    related_to_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Joined fields
    owner_name: Optional[str] = None


class CalendarEventCreate(CamelModel):
    title: str
    description: Optional[str] = None
    type: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    all_day: Optional[bool] = False
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    owner_id: Optional[UUID] = None
    color: Optional[str] = None
    related_to_type: Optional[str] = None
    related_to_id: Optional[UUID] = None


class CalendarEventUpdate(CamelModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    all_day: Optional[bool] = None
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    owner_id: Optional[UUID] = None
    color: Optional[str] = None
    related_to_type: Optional[str] = None
    related_to_id: Optional[UUID] = None
