"""
Admin Service Layer

This module contains all business logic for admin user management operations.
Following SOLID principles with clear separation of concerns.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import BadRequestException, NotFoundException
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user_schema import UserCreate, UserOut, UserUpdate
from app.services.auth_service import AuthService
from app.utils.activity_logger import compute_changes, log_activity, model_to_dict


class AdminService:
    """Service for admin user management operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def list_users(
        self,
        page: int,
        limit: int,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """
        List users with pagination and filtering.

        Args:
            page: Page number (1-based)
            limit: Items per page
            role: Filter by role
            is_active: Filter by active status

        Returns:
            Dictionary with data and pagination
        """
        filters = []
        if role:
            filters.append(User.role == role)
        if is_active is not None:
            filters.append(User.is_active == is_active)

        result = await self.user_repo.get_paginated(
            page=page, limit=limit, filters=filters or None
        )

        users_list = result["data"]

        # Build manager name lookup
        manager_ids = {str(u.manager_id) for u in users_list if u.manager_id}
        all_ids = {str(u.id) for u in users_list}
        missing_ids = manager_ids - all_ids
        manager_lookup = {str(u.id): u.name for u in users_list}

        # If managers not in current page, fetch them
        if missing_ids:
            for mid in missing_ids:
                mgr = await self.user_repo.get_by_id(mid)
                if mgr:
                    manager_lookup[mid] = mgr.name

        data = []
        for u in users_list:
            out = UserOut.model_validate(u).model_dump(by_alias=True)
            if u.manager_id:
                out["managerName"] = manager_lookup.get(str(u.manager_id))
            data.append(out)

        return {"data": data, "pagination": result["pagination"]}

    async def create_user(
        self, user_data: UserCreate, admin: User
    ) -> Dict[str, Any]:
        """
        Create a new user.

        Args:
            user_data: User creation data
            admin: Admin user performing the action

        Returns:
            Created user data

        Raises:
            BadRequestException: If email already exists
        """
        # Check duplicate email
        existing = await self.user_repo.get_by_email(user_data.email)
        if existing:
            raise BadRequestException("A user with this email already exists")

        data = user_data.model_dump(exclude_unset=True)
        data["password_hash"] = AuthService.hash_password(data.pop("password"))

        user = await self.user_repo.create(data)
        await log_activity(
            self.db, admin, "create", "user", str(user.id), user.name or user.email
        )

        return UserOut.model_validate(user).model_dump(by_alias=True)

    async def update_user(
        self, user_id: str, user_data: UserUpdate, admin: User
    ) -> Dict[str, Any]:
        """
        Update an existing user.

        Args:
            user_id: User ID to update
            user_data: User update data
            admin: Admin user performing the action

        Returns:
            Updated user data

        Raises:
            NotFoundException: If user not found
        """
        old = await self.user_repo.get_by_id(user_id)
        if not old:
            raise NotFoundException("User not found")

        old_data = model_to_dict(old)
        user = await self.user_repo.update(
            user_id, user_data.model_dump(exclude_unset=True)
        )
        changes = compute_changes(old_data, model_to_dict(user))
        await log_activity(
            self.db,
            admin,
            "update",
            "user",
            str(user.id),
            user.name or user.email,
            changes,
        )

        return UserOut.model_validate(user).model_dump(by_alias=True)

    async def reset_password(
        self, user_id: str, new_password: str, admin: User
    ) -> bool:
        """
        Reset a user's password.

        Args:
            user_id: User ID to reset password for
            new_password: New password
            admin: Admin user performing the action

        Returns:
            True if successful
        """
        target = await self.user_repo.get_by_id(user_id)
        auth_service = AuthService(self.user_repo)
        await auth_service.reset_password(user_id, new_password)
        await log_activity(
            self.db,
            admin,
            "update",
            "user",
            user_id,
            (target.name or target.email) if target else user_id,
            [{"field": "password", "old": "***", "new": "***"}],
        )
        return True

