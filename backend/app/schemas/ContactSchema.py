from __future__ import annotations

from typing import Optional
from uuid import UUID
from datetime import datetime

from app.schemas.common import CamelModel


class ContactOut(CamelModel):
    id: UUID
    first_name: str
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    account_id: Optional[UUID] = None
    type: Optional[str] = None
    status: str = "active"
    notes: Optional[str] = None
    preferred_contact: Optional[str] = None
    owner_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Joined fields
    account_name: Optional[str] = None
    owner_name: Optional[str] = None


class ContactCreate(CamelModel):
    first_name: str
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    account_id: Optional[UUID] = None
    type: Optional[str] = None
    status: str = "active"
    notes: Optional[str] = None
    preferred_contact: Optional[str] = None
    owner_id: Optional[UUID] = None


class ContactUpdate(CamelModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    account_id: Optional[UUID] = None
    type: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    preferred_contact: Optional[str] = None
    owner_id: Optional[UUID] = None
