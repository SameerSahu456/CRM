from __future__ import annotations

from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

from app.schemas.common import CamelModel


class SalesEntryOut(CamelModel):
    id: UUID
    partner_id: Optional[UUID] = None
    product_id: Optional[UUID] = None
    salesperson_id: UUID
    customer_name: Optional[str] = None
    quantity: int = 1
    amount: float
    po_number: Optional[str] = None
    invoice_no: Optional[str] = None
    payment_status: str = "pending"
    commission_amount: Optional[float] = 0
    sale_date: date
    location_id: Optional[UUID] = None
    vertical_id: Optional[UUID] = None
    notes: Optional[str] = None
    description: Optional[str] = None
    deal_id: Optional[UUID] = None
    product_ids: Optional[List[UUID]] = None
    # Sales Order extended fields
    contact_name: Optional[str] = None
    contact_no: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    pan_no: Optional[str] = None
    dispatch_method: Optional[str] = None
    payment_terms: Optional[str] = None
    order_type: Optional[str] = None
    serial_number: Optional[str] = None
    boq: Optional[str] = None
    price: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Joined fields
    partner_name: Optional[str] = None
    product_name: Optional[str] = None
    product_names: Optional[List[str]] = None
    salesperson_name: Optional[str] = None


class SalesEntryCreate(CamelModel):
    partner_id: Optional[UUID] = None
    product_id: Optional[UUID] = None
    salesperson_id: Optional[UUID] = None
    customer_name: Optional[str] = None
    quantity: int = 1
    amount: float
    po_number: Optional[str] = None
    invoice_no: Optional[str] = None
    payment_status: str = "pending"
    commission_amount: Optional[float] = 0
    sale_date: date
    location_id: Optional[UUID] = None
    vertical_id: Optional[UUID] = None
    notes: Optional[str] = None
    description: Optional[str] = None
    deal_id: Optional[UUID] = None
    product_ids: Optional[List[UUID]] = None
    # Sales Order extended fields
    contact_name: Optional[str] = None
    contact_no: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    pan_no: Optional[str] = None
    dispatch_method: Optional[str] = None
    payment_terms: Optional[str] = None
    order_type: Optional[str] = None
    serial_number: Optional[str] = None
    boq: Optional[str] = None
    price: Optional[float] = None


class SalesEntryUpdate(CamelModel):
    partner_id: Optional[UUID] = None
    product_id: Optional[UUID] = None
    customer_name: Optional[str] = None
    quantity: Optional[int] = None
    amount: Optional[float] = None
    po_number: Optional[str] = None
    invoice_no: Optional[str] = None
    payment_status: Optional[str] = None
    commission_amount: Optional[float] = None
    sale_date: Optional[date] = None
    location_id: Optional[UUID] = None
    vertical_id: Optional[UUID] = None
    notes: Optional[str] = None
    description: Optional[str] = None
    deal_id: Optional[UUID] = None
    product_ids: Optional[List[UUID]] = None
    # Sales Order extended fields
    contact_name: Optional[str] = None
    contact_no: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    pan_no: Optional[str] = None
    dispatch_method: Optional[str] = None
    payment_terms: Optional[str] = None
    order_type: Optional[str] = None
    serial_number: Optional[str] = None
    boq: Optional[str] = None
    price: Optional[float] = None


class SalesSummary(CamelModel):
    total_amount: float = 0
    total_count: int = 0
    total_commission: float = 0
    pending_payments: int = 0
    paid_count: int = 0
