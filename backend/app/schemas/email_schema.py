from __future__ import annotations

from typing import Optional
from uuid import UUID
from datetime import datetime

from app.schemas.common import CamelModel


class EmailOut(CamelModel):
    id: UUID
    subject: str
    body: Optional[str] = None
    from_address: Optional[str] = None
    to_address: Optional[str] = None
    cc: Optional[str] = None
    bcc: Optional[str] = None
    status: str = "draft"
    sent_at: Optional[datetime] = None
    scheduled_at: Optional[datetime] = None
    related_to_type: Optional[str] = None
    related_to_id: Optional[UUID] = None
    template_id: Optional[UUID] = None
    owner_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Joined fields
    owner_name: Optional[str] = None
    template_name: Optional[str] = None


class EmailCreate(CamelModel):
    subject: str
    body: Optional[str] = None
    from_address: Optional[str] = None
    to_address: Optional[str] = None
    cc: Optional[str] = None
    bcc: Optional[str] = None
    status: str = "draft"
    scheduled_at: Optional[datetime] = None
    related_to_type: Optional[str] = None
    related_to_id: Optional[UUID] = None
    template_id: Optional[UUID] = None
    owner_id: Optional[UUID] = None


class EmailUpdate(CamelModel):
    subject: Optional[str] = None
    body: Optional[str] = None
    from_address: Optional[str] = None
    to_address: Optional[str] = None
    cc: Optional[str] = None
    bcc: Optional[str] = None
    status: Optional[str] = None
    sent_at: Optional[datetime] = None
    scheduled_at: Optional[datetime] = None
    related_to_type: Optional[str] = None
    related_to_id: Optional[UUID] = None
    template_id: Optional[UUID] = None
    owner_id: Optional[UUID] = None
