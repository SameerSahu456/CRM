from __future__ import annotations

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_admin
from app.models.user import User
from app.schemas.role_schema import (
    PermissionOut,
    PermissionUpdate,
    RoleCreate,
    RoleOut,
    RoleUpdate,
)
from app.services.role_service import RoleService
from app.utils.response_utils import deleted_response

router = APIRouter()


@router.get("/", response_model=List[RoleOut])
async def list_roles(
    user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """
    List all roles with their permissions (admin only).

    Returns:
        List of roles with permissions
    """
    service = RoleService(db)
    data = await service.list_roles()
    return data


@router.post("/", response_model=RoleOut, status_code=201)
async def create_role(
    body: RoleCreate,
    user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new role (admin only).

    Returns:
        Created role with permissions
    """
    service = RoleService(db)
    data = await service.create_role(body)
    return data


@router.put("/{role_id}", response_model=RoleOut)
async def update_role(
    role_id: UUID,
    body: RoleUpdate,
    user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """
    Update role label/description (admin only).

    Returns:
        Updated role with permissions
    """
    service = RoleService(db)
    data = await service.update_role(role_id, body)
    return data


@router.delete("/{role_id}")
async def delete_role(
    role_id: UUID,
    user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a role (admin only). Only non-system roles can be deleted.

    Returns:
        Success status
    """
    service = RoleService(db)
    await service.delete_role(role_id)
    return deleted_response("Role deleted successfully")


@router.put("/{role_id}/permissions", response_model=List[PermissionOut])
async def update_permissions(
    role_id: UUID,
    body: List[PermissionUpdate],
    user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """
    Update permissions for a role (admin only). Replaces all existing permissions.

    Returns:
        List of updated permissions
    """
    service = RoleService(db)
    data = await service.update_permissions(role_id, body)
    return data
