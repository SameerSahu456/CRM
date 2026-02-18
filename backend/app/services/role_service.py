"""
Role Service Layer

This module contains all business logic for role and permission management.
Following SOLID principles with clear separation of concerns.
"""

from __future__ import annotations

from typing import Any, Dict, List
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import Role
from app.models.role_permission import RolePermission
from app.schemas.role_schema import (
    PermissionOut,
    PermissionUpdate,
    RoleCreate,
    RoleOut,
    RoleUpdate,
)


class RoleService:
    """Service for role and permission management operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_permissions_for_role(self, role_id: UUID) -> List[RolePermission]:
        """Get all permissions for a role."""
        result = await self.db.execute(
            select(RolePermission).where(RolePermission.role_id == role_id)
        )
        return list(result.scalars().all())

    async def _build_role_out(self, role: Role) -> RoleOut:
        """Build RoleOut schema with permissions."""
        perms = await self._get_permissions_for_role(role.id)
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

    async def list_roles(self) -> List[RoleOut]:
        """
        List all roles with their permissions.

        Returns:
            List of roles with permissions
        """
        result = await self.db.execute(
            select(Role).order_by(Role.is_system.desc(), Role.name)
        )
        roles = list(result.scalars().all())

        role_outs = []
        for role in roles:
            role_out = await self._build_role_out(role)
            role_outs.append(role_out)
        return role_outs

    async def create_role(self, role_data: RoleCreate) -> RoleOut:
        """
        Create a new role.

        Args:
            role_data: Role creation data

        Returns:
            Created role with permissions

        Raises:
            HTTPException: If role name already exists
        """
        # Check if name already exists
        existing = await self.db.execute(
            select(Role).where(Role.name == role_data.name)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=409, detail=f"Role '{role_data.name}' already exists"
            )

        role = Role(
            name=role_data.name,
            label=role_data.label,
            description=role_data.description,
        )
        self.db.add(role)
        await self.db.flush()
        await self.db.refresh(role)
        return await self._build_role_out(role)

    async def update_role(self, role_id: UUID, role_data: RoleUpdate) -> RoleOut:
        """
        Update a role.

        Args:
            role_id: Role ID to update
            role_data: Role update data

        Returns:
            Updated role with permissions

        Raises:
            HTTPException: If role not found or name already exists
        """
        result = await self.db.execute(select(Role).where(Role.id == role_id))
        role = result.scalar_one_or_none()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")

        # Check name uniqueness if being updated
        if role_data.name and role_data.name != role.name:
            existing = await self.db.execute(
                select(Role).where(Role.name == role_data.name)
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=409,
                    detail=f"Role name '{role_data.name}' already exists",
                )

        update_data = role_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(role, key, value)

        await self.db.flush()
        await self.db.refresh(role)
        return await self._build_role_out(role)

    async def delete_role(self, role_id: UUID) -> bool:
        """
        Delete a role.

        Args:
            role_id: Role ID to delete

        Returns:
            True if successful

        Raises:
            HTTPException: If role not found or is a system role
        """
        result = await self.db.execute(select(Role).where(Role.id == role_id))
        role = result.scalar_one_or_none()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")

        if role.is_system:
            raise HTTPException(status_code=400, detail="Cannot delete a system role")

        # Delete permissions first (cascade should handle it, but be explicit)
        await self.db.execute(
            delete(RolePermission).where(RolePermission.role_id == role_id)
        )
        await self.db.delete(role)
        await self.db.flush()
        return True

    async def update_permissions(
        self, role_id: UUID, permissions: List[PermissionUpdate]
    ) -> List[PermissionOut]:
        """
        Update permissions for a role (replaces all existing permissions).

        Args:
            role_id: Role ID to update permissions for
            permissions: List of new permissions

        Returns:
            List of updated permissions

        Raises:
            HTTPException: If role not found
        """
        # Verify role exists
        result = await self.db.execute(select(Role).where(Role.id == role_id))
        role = result.scalar_one_or_none()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")

        # Delete existing permissions for this role
        await self.db.execute(
            delete(RolePermission).where(RolePermission.role_id == role_id)
        )

        # Insert new permissions
        new_perms = []
        for perm in permissions:
            rp = RolePermission(
                role_id=role_id,
                entity=perm.entity,
                can_view=perm.can_view,
                can_create=perm.can_create,
                can_edit=perm.can_edit,
                can_delete=perm.can_delete,
            )
            self.db.add(rp)
            new_perms.append(rp)

        await self.db.flush()
        # Refresh to get generated IDs
        for rp in new_perms:
            await self.db.refresh(rp)

        return [PermissionOut.model_validate(p) for p in new_perms]
