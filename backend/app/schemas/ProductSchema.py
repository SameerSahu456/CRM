from __future__ import annotations

from typing import Optional
from uuid import UUID
from datetime import datetime

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


class ProductCreate(CamelModel):
    name: str
    category: Optional[str] = None
    base_price: Optional[float] = None
    commission_rate: Optional[float] = 0
    stock: int = 0
    is_active: bool = True


class ProductUpdate(CamelModel):
    name: Optional[str] = None
    category: Optional[str] = None
    base_price: Optional[float] = None
    commission_rate: Optional[float] = None
    stock: Optional[int] = None
    is_active: Optional[bool] = None
