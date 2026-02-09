from __future__ import annotations

from typing import Optional
from uuid import UUID
from datetime import date, datetime

from app.schemas.common import CamelModel


class DealOut(CamelModel):
    id: UUID
    title: str
    company: Optional[str] = None
    account_id: Optional[UUID] = None
    value: Optional[float] = None
    stage: str = "Qualification"
    probability: Optional[int] = None
    owner_id: Optional[UUID] = None
    closing_date: Optional[date] = None
    description: Optional[str] = None
    contact_id: Optional[UUID] = None
    next_step: Optional[str] = None
    forecast: Optional[str] = None
    type: Optional[str] = None
    lead_source: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Joined fields
    account_name: Optional[str] = None
    contact_name: Optional[str] = None
    owner_name: Optional[str] = None


class DealCreate(CamelModel):
    title: str
    company: Optional[str] = None
    account_id: Optional[UUID] = None
    value: Optional[float] = None
    stage: str = "Qualification"
    probability: Optional[int] = None
    owner_id: Optional[UUID] = None
    closing_date: Optional[date] = None
    description: Optional[str] = None
    contact_id: Optional[UUID] = None
    next_step: Optional[str] = None
    forecast: Optional[str] = None
    type: Optional[str] = None
    lead_source: Optional[str] = None


class DealUpdate(CamelModel):
    title: Optional[str] = None
    company: Optional[str] = None
    account_id: Optional[UUID] = None
    value: Optional[float] = None
    stage: Optional[str] = None
    probability: Optional[int] = None
    owner_id: Optional[UUID] = None
    closing_date: Optional[date] = None
    description: Optional[str] = None
    contact_id: Optional[UUID] = None
    next_step: Optional[str] = None
    forecast: Optional[str] = None
    type: Optional[str] = None
    lead_source: Optional[str] = None
