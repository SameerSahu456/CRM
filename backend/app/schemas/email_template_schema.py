from __future__ import annotations

from typing import Optional
from uuid import UUID
from datetime import datetime

from app.schemas.common import CamelModel


class EmailTemplateOut(CamelModel):
    id: UUID
    name: str
    subject: Optional[str] = None
    body: Optional[str] = None
    category: Optional[str] = None
    owner_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Joined fields
    owner_name: Optional[str] = None


class EmailTemplateCreate(CamelModel):
    name: str
    subject: Optional[str] = None
    body: Optional[str] = None
    category: Optional[str] = None
    owner_id: Optional[UUID] = None


class EmailTemplateUpdate(CamelModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    category: Optional[str] = None
    owner_id: Optional[UUID] = None
