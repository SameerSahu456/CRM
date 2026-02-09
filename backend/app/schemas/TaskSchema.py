from __future__ import annotations

from typing import Optional
from uuid import UUID
from datetime import date, datetime

from pydantic import field_validator

from app.schemas.common import CamelModel


class TaskOut(CamelModel):
    id: UUID
    title: str
    description: Optional[str] = None
    type: Optional[str] = None
    status: str = "pending"
    priority: str = "Medium"
    due_date: Optional[date] = None
    due_time: Optional[str] = None

    @field_validator("due_time", mode="before")
    @classmethod
    def coerce_time(cls, v):
        if v is None:
            return None
        if hasattr(v, "strftime"):
            return v.strftime("%H:%M")
        return str(v)
    assigned_to: Optional[UUID] = None
    created_by: Optional[UUID] = None
    completed_at: Optional[datetime] = None
    related_to_type: Optional[str] = None
    related_to_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Joined fields
    assigned_to_name: Optional[str] = None
    created_by_name: Optional[str] = None


class TaskCreate(CamelModel):
    title: str
    description: Optional[str] = None
    type: Optional[str] = None
    status: str = "pending"
    priority: str = "Medium"
    due_date: Optional[date] = None
    due_time: Optional[str] = None
    assigned_to: Optional[UUID] = None
    created_by: Optional[UUID] = None
    related_to_type: Optional[str] = None
    related_to_id: Optional[UUID] = None


class TaskUpdate(CamelModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[date] = None
    due_time: Optional[str] = None
    assigned_to: Optional[UUID] = None
    completed_at: Optional[datetime] = None
    related_to_type: Optional[str] = None
    related_to_id: Optional[UUID] = None
