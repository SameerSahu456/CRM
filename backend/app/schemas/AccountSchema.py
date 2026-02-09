from __future__ import annotations

from typing import Optional
from uuid import UUID
from datetime import datetime

from app.schemas.common import CamelModel


class AccountOut(CamelModel):
    id: UUID
    name: str
    industry: Optional[str] = None
    website: Optional[str] = None
    revenue: Optional[float] = None
    employees: Optional[int] = None
    location: Optional[str] = None
    type: Optional[str] = None
    status: str = "active"
    phone: Optional[str] = None
    email: Optional[str] = None
    health_score: Optional[int] = None
    description: Optional[str] = None
    owner_id: Optional[UUID] = None
    gstin_no: Optional[str] = None
    payment_terms: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Joined fields
    owner_name: Optional[str] = None


class AccountCreate(CamelModel):
    name: str
    industry: Optional[str] = None
    website: Optional[str] = None
    revenue: Optional[float] = None
    employees: Optional[int] = None
    location: Optional[str] = None
    type: Optional[str] = None
    status: str = "active"
    phone: Optional[str] = None
    email: Optional[str] = None
    health_score: Optional[int] = None
    description: Optional[str] = None
    owner_id: Optional[UUID] = None
    gstin_no: Optional[str] = None
    payment_terms: Optional[str] = None


class AccountUpdate(CamelModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    revenue: Optional[float] = None
    employees: Optional[int] = None
    location: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    health_score: Optional[int] = None
    description: Optional[str] = None
    owner_id: Optional[UUID] = None
    gstin_no: Optional[str] = None
    payment_terms: Optional[str] = None
