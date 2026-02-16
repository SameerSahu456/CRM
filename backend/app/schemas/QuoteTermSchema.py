from __future__ import annotations

from typing import Optional
from uuid import UUID
from datetime import datetime

from app.schemas.common import CamelModel


class QuoteTermOut(CamelModel):
    id: UUID
    content: str
    is_predefined: bool = False
    sort_order: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class QuoteTermCreate(CamelModel):
    content: str
    sort_order: int = 0


class QuoteTermUpdate(CamelModel):
    content: Optional[str] = None
    sort_order: Optional[int] = None
