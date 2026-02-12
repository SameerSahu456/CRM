from __future__ import annotations

from typing import Optional
from uuid import UUID
from datetime import datetime

from app.schemas.common import CamelModel


class PartnerOut(CamelModel):
    id: UUID
    company_name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    partner_type: Optional[str] = None
    vertical: Optional[str] = None
    status: str = "pending"
    tier: str = "new"
    assigned_to: Optional[UUID] = None
    approved_by: Optional[UUID] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Joined
    assigned_to_name: Optional[str] = None


class PartnerCreate(CamelModel):
    company_name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    partner_type: Optional[str] = None
    vertical: Optional[str] = None
    tier: str = "new"
    notes: Optional[str] = None
    assigned_to: Optional[UUID] = None


class PartnerUpdate(CamelModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    partner_type: Optional[str] = None
    vertical: Optional[str] = None
    tier: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None
    assigned_to: Optional[UUID] = None


class PartnerApproveRequest(CamelModel):
    approved: bool
    rejection_reason: Optional[str] = None
