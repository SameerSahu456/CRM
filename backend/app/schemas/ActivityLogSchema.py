from __future__ import annotations

from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID

from app.schemas.common import CamelModel


class ActivityLogOut(CamelModel):
    id: UUID
    user_id: Optional[UUID] = None
    user_name: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    entity_name: Optional[str] = None
    changes: Optional[List[Any]] = None
    ip_address: Optional[str] = None
    created_at: Optional[datetime] = None
