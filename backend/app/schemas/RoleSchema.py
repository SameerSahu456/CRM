from __future__ import annotations

from typing import Optional, List
from datetime import datetime
from uuid import UUID

from app.schemas.common import CamelModel


class PermissionOut(CamelModel):
    id: Optional[UUID] = None
    entity: str
    can_view: bool = False
    can_create: bool = False
    can_edit: bool = False
    can_delete: bool = False


class PermissionUpdate(CamelModel):
    entity: str
    can_view: bool = False
    can_create: bool = False
    can_edit: bool = False
    can_delete: bool = False


class RoleOut(CamelModel):
    id: UUID
    name: str
    label: str
    description: Optional[str] = None
    is_system: bool = False
    is_active: bool = True
    permissions: List[PermissionOut] = []
    created_at: Optional[datetime] = None


class RoleCreate(CamelModel):
    name: str
    label: str
    description: Optional[str] = None


class RoleUpdate(CamelModel):
    name: Optional[str] = None
    label: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
