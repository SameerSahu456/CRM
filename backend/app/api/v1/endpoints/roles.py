from __future__ import annotations

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_admin
from app.models.Role import Role
from app.models.RolePermission import RolePermission
from app.models.User import User
from app.schemas.RoleSchema import (
    PermissionOut,
    PermissionUpdate,
    RoleCreate,
    RoleOut,
    RoleUpdate,
)

router = APIRouter()


async def _get_permissions_for_role(
    db: AsyncSession, role_id: UUID
) -> list[RolePermission]:
    result = await db.execute(
        select(RolePermission).where(RolePermission.role_id == role_id)
    )
    return list(result.scalars().all())


async def _build_role_out(db: AsyncSession, role: Role) -> RoleOut:
    perms = await _get_permissions_for_role(db, role.id)
    return RoleOut(
        id=role.id,
        name=role.name,
        label=role.label,
        description=role.description,
        is_system=role.is_system,
        is_active=role.is_active,
        permissions=[PermissionOut.model_validate(p) for p in perms],
        created_at=role.created_at,
    )


@router.get("/", response_model=List[RoleOut])
async def list_roles(
    user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """List all roles with their permissions (admin only)."""
    result = await db.execute(
        select(Role).order_by(Role.is_system.desc(), Role.name)
    )
    roles = list(result.scalars().all())

    role_outs = []
    for role in roles:
        role_out = await _build_role_out(db, role)
        role_outs.append(role_out)
    return role_outs


@router.post("/", response_model=RoleOut, status_code=201)
async def create_role(
    body: RoleCreate,
    user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """Create a new role (admin only)."""
    # Check if name already exists
    existing = await db.execute(
        select(Role).where(Role.name == body.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Role '{body.name}' already exists")

    role = Role(
        name=body.name,
        label=body.label,
        description=body.description,
    )
    db.add(role)
    await db.flush()
    await db.refresh(role)
    return await _build_role_out(db, role)


@router.put("/{role_id}", response_model=RoleOut)
async def update_role(
    role_id: UUID,
    body: RoleUpdate,
    user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """Update role label/description (admin only). Cannot update system role name."""
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Check name uniqueness if being updated
    if body.name and body.name != role.name:
        existing = await db.execute(
            select(Role).where(Role.name == body.name)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail=f"Role name '{body.name}' already exists")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(role, key, value)

    await db.flush()
    await db.refresh(role)
    return await _build_role_out(db, role)


@router.delete("/{role_id}")
async def delete_role(
    role_id: UUID,
    user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """Delete a role (admin only). Only non-system roles can be deleted."""
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if role.is_system:
        raise HTTPException(status_code=400, detail="Cannot delete a system role")

    # Delete permissions first (cascade should handle it, but be explicit)
    await db.execute(
        delete(RolePermission).where(RolePermission.role_id == role_id)
    )
    await db.delete(role)
    await db.flush()
    return {"success": True}


@router.put("/{role_id}/permissions", response_model=List[PermissionOut])
async def update_permissions(
    role_id: UUID,
    body: List[PermissionUpdate],
    user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """Update permissions for a role (admin only). Replaces all existing permissions."""
    # Verify role exists
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Delete existing permissions for this role
    await db.execute(
        delete(RolePermission).where(RolePermission.role_id == role_id)
    )

    # Insert new permissions
    new_perms = []
    for perm in body:
        rp = RolePermission(
            role_id=role_id,
            entity=perm.entity,
            can_view=perm.can_view,
            can_create=perm.can_create,
            can_edit=perm.can_edit,
            can_delete=perm.can_delete,
        )
        db.add(rp)
        new_perms.append(rp)

    await db.flush()
    # Refresh to get generated IDs
    for rp in new_perms:
        await db.refresh(rp)

    return [PermissionOut.model_validate(p) for p in new_perms]
