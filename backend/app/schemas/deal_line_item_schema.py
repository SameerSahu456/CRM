from __future__ import annotations

from typing import Optional
from uuid import UUID

from app.schemas.common import CamelModel


class DealLineItemOut(CamelModel):
    id: UUID
    deal_id: UUID
    product_category: Optional[str] = None
    product_sub_category: Optional[str] = None
    part_number: Optional[str] = None
    description: Optional[str] = None
    quantity: int = 1
    pricing: Optional[float] = None
    total_price: Optional[float] = None
    warehouse: Optional[str] = None
    total_rental: Optional[float] = None
    rental_per_unit: Optional[float] = None
    sort_order: int = 0


class DealLineItemCreate(CamelModel):
    product_category: Optional[str] = None
    product_sub_category: Optional[str] = None
    part_number: Optional[str] = None
    description: Optional[str] = None
    quantity: int = 1
    pricing: Optional[float] = None
    total_price: Optional[float] = None
    warehouse: Optional[str] = None
    total_rental: Optional[float] = None
    rental_per_unit: Optional[float] = None
    sort_order: int = 0
