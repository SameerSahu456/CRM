from __future__ import annotations

from typing import Optional
from uuid import UUID
from datetime import date, datetime

from app.schemas.common import CamelModel


class CarepackOut(CamelModel):
    id: UUID
    partner_id: Optional[UUID] = None
    product_type: Optional[str] = None
    serial_number: Optional[str] = None
    carepack_sku: Optional[str] = None
    customer_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = "active"
    notes: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    partner_name: Optional[str] = None


class CarepackCreate(CamelModel):
    partner_id: Optional[UUID] = None
    product_type: Optional[str] = None
    serial_number: Optional[str] = None
    carepack_sku: Optional[str] = None
    customer_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = "active"
    notes: Optional[str] = None


class CarepackUpdate(CamelModel):
    partner_id: Optional[UUID] = None
    product_type: Optional[str] = None
    serial_number: Optional[str] = None
    carepack_sku: Optional[str] = None
    customer_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None
