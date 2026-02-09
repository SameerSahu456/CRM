from __future__ import annotations

from typing import Optional
from uuid import UUID
from datetime import date, datetime

from app.schemas.common import CamelModel


class LeadOut(CamelModel):
    id: UUID
    company_name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    stage: str = "New"
    priority: str = "Medium"
    estimated_value: Optional[float] = None
    product_interest: Optional[str] = None
    assigned_to: Optional[UUID] = None
    partner_id: Optional[UUID] = None
    notes: Optional[str] = None
    expected_close_date: Optional[date] = None
    lost_reason: Optional[str] = None
    won_sale_id: Optional[UUID] = None
    next_follow_up: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    assigned_to_name: Optional[str] = None


class LeadCreate(CamelModel):
    company_name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    stage: str = "New"
    priority: str = "Medium"
    estimated_value: Optional[float] = None
    product_interest: Optional[str] = None
    assigned_to: Optional[UUID] = None
    partner_id: Optional[UUID] = None
    notes: Optional[str] = None
    expected_close_date: Optional[date] = None
    next_follow_up: Optional[date] = None


class LeadUpdate(CamelModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    stage: Optional[str] = None
    priority: Optional[str] = None
    estimated_value: Optional[float] = None
    product_interest: Optional[str] = None
    assigned_to: Optional[UUID] = None
    partner_id: Optional[UUID] = None
    notes: Optional[str] = None
    expected_close_date: Optional[date] = None
    lost_reason: Optional[str] = None
    next_follow_up: Optional[date] = None


class LeadActivityOut(CamelModel):
    id: UUID
    lead_id: UUID
    activity_type: str
    title: str
    description: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: Optional[datetime] = None
    created_by_name: Optional[str] = None


class LeadActivityCreate(CamelModel):
    activity_type: str
    title: str
    description: Optional[str] = None


class LeadConvertRequest(CamelModel):
    partner_id: UUID
    product_id: UUID
    amount: float
    sale_date: date
    customer_name: Optional[str] = None
