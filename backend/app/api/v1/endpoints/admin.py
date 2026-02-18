from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_admin
from app.models.user import User
from app.schemas.user_schema import ResetPasswordRequest, UserCreate, UserUpdate
from app.services.admin_service import AdminService
from app.utils.response_utils import created_response, success_response

router = APIRouter()


@router.get("/")
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    admin: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """
    List users with pagination and filtering (admin only).

    Returns:
        Paginated list of users with manager names
    """
    service = AdminService(db)
    result = await service.list_users(page, limit, role, is_active)
    return success_response(
        result["data"],
        "Users retrieved successfully",
        pagination=result["pagination"],
    )


@router.post("/")
async def create_user(
    body: UserCreate,
    admin: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new user (admin only).

    Returns:
        Created user data
    """
    service = AdminService(db)
    data = await service.create_user(body, admin)
    return created_response(data, "User created successfully")


@router.put("/{user_id}")
async def update_user(
    user_id: str,
    body: UserUpdate,
    admin: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """
    Update an existing user (admin only).

    Returns:
        Updated user data
    """
    service = AdminService(db)
    data = await service.update_user(user_id, body, admin)
    return success_response(data, "User updated successfully")


@router.post("/{user_id}/reset-password")
async def reset_password(
    user_id: str,
    body: ResetPasswordRequest,
    admin: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """
    Reset a user's password (admin only).

    Returns:
        Success message
    """
    service = AdminService(db)
    await service.reset_password(user_id, body.new_password, admin)
    return success_response({"success": True}, "Password reset successfully")
