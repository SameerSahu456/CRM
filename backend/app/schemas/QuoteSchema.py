from __future__ import annotations

from typing import Optional
from uuid import UUID
from datetime import date, datetime

from app.schemas.common import CamelModel


class QuoteLineItemOut(CamelModel):
    id: UUID
    quote_id: UUID
    product_id: Optional[UUID] = None
    description: Optional[str] = None
    quantity: int = 1
    unit_price: float
    discount_pct: float = 0
    line_total: float
    sort_order: int = 0
    product_name: Optional[str] = None


class QuoteLineItemCreate(CamelModel):
    product_id: Optional[UUID] = None
    description: Optional[str] = None
    quantity: int = 1
    unit_price: float
    discount_pct: float = 0
    line_total: float
    sort_order: int = 0


class QuoteOut(CamelModel):
    id: UUID
    quote_number: Optional[str] = None
    lead_id: Optional[UUID] = None
    partner_id: Optional[UUID] = None
    customer_name: str
    valid_until: Optional[date] = None
    subtotal: float = 0
    tax_rate: float = 18
    tax_amount: float = 0
    discount_amount: float = 0
    total_amount: float = 0
    status: str = "draft"
    terms: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    partner_name: Optional[str] = None
    line_items: Optional[list[QuoteLineItemOut]] = None


class QuoteCreate(CamelModel):
    partner_id: Optional[UUID] = None
    lead_id: Optional[UUID] = None
    customer_name: str
    valid_until: Optional[date] = None
    tax_rate: float = 18
    discount_amount: float = 0
    terms: Optional[str] = None
    notes: Optional[str] = None
    line_items: list[QuoteLineItemCreate] = []


class QuoteUpdate(CamelModel):
    partner_id: Optional[UUID] = None
    lead_id: Optional[UUID] = None
    customer_name: Optional[str] = None
    valid_until: Optional[date] = None
    tax_rate: Optional[float] = None
    discount_amount: Optional[float] = None
    status: Optional[str] = None
    terms: Optional[str] = None
    notes: Optional[str] = None
    line_items: Optional[list[QuoteLineItemCreate]] = None
