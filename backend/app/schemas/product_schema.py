from __future__ import annotations

from typing import Optional
from uuid import UUID
from datetime import date, datetime

from app.schemas.common import CamelModel


class ProductOut(CamelModel):
    id: UUID
    name: str
    category: Optional[str] = None
    base_price: Optional[float] = None
    commission_rate: Optional[float] = None
    stock: int = 0
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    ipn: Optional[str] = None
    description: Optional[str] = None
    part_image: Optional[str] = None
    batch: Optional[str] = None
    location: Optional[str] = None
    stocktake: Optional[str] = None
    expiry_date: Optional[date] = None
    purchase_order: Optional[str] = None
    status: Optional[str] = "OK"


class ProductCreate(CamelModel):
    name: str
    category: Optional[str] = None
    base_price: Optional[float] = None
    commission_rate: Optional[float] = 0
    stock: int = 0
    is_active: bool = True
    ipn: Optional[str] = None
    description: Optional[str] = None
    part_image: Optional[str] = None
    batch: Optional[str] = None
    location: Optional[str] = None
    stocktake: Optional[str] = None
    expiry_date: Optional[date] = None
    purchase_order: Optional[str] = None
    status: Optional[str] = "OK"


class ProductUpdate(CamelModel):
    name: Optional[str] = None
    category: Optional[str] = None
    base_price: Optional[float] = None
    commission_rate: Optional[float] = None
    stock: Optional[int] = None
    is_active: Optional[bool] = None
    ipn: Optional[str] = None
    description: Optional[str] = None
    part_image: Optional[str] = None
    batch: Optional[str] = None
    location: Optional[str] = None
    stocktake: Optional[str] = None
    expiry_date: Optional[date] = None
    purchase_order: Optional[str] = None
    status: Optional[str] = None
