from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import BadRequestException, NotFoundException
from app.middleware.rbac import require_admin
from app.middleware.security import get_current_user
from app.models.User import User
from app.repositories.UserRepository import UserRepository
from app.schemas.UserSchema import (
    ResetPasswordRequest,
    UserCreate,
    UserOut,
    UserUpdate,
)
from app.services.AuthService import AuthService
from app.utils.activity_logger import compute_changes, log_activity, model_to_dict

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
    repo = UserRepository(db)
    filters = []
    if role:
        filters.append(User.role == role)
    if is_active is not None:
        filters.append(User.is_active == is_active)

    result = await repo.get_paginated(
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
            mgr = await repo.get_by_id(mid)
            if mgr:
                manager_lookup[mid] = mgr.name

    data = []
    for u in users_list:
        out = UserOut.model_validate(u).model_dump(by_alias=True)
        if u.manager_id:
            out["managerName"] = manager_lookup.get(str(u.manager_id))
        data.append(out)

    return {"data": data, "pagination": result["pagination"]}


@router.post("/")
async def create_user(
    body: UserCreate,
    admin: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)

    # Check duplicate email
    existing = await repo.get_by_email(body.email)
    if existing:
        raise BadRequestException("A user with this email already exists")

    data = body.model_dump(exclude_unset=True)
    data["password_hash"] = AuthService.hash_password(data.pop("password"))

    user = await repo.create(data)
    await log_activity(db, admin, "create", "user", str(user.id), user.name or user.email)
    return UserOut.model_validate(user).model_dump(by_alias=True)


@router.put("/{user_id}")
async def update_user(
    user_id: str,
    body: UserUpdate,
    admin: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    old = await repo.get_by_id(user_id)
    if not old:
        raise NotFoundException("User not found")
    old_data = model_to_dict(old)
    user = await repo.update(user_id, body.model_dump(exclude_unset=True))
    changes = compute_changes(old_data, model_to_dict(user))
    await log_activity(db, admin, "update", "user", str(user.id), user.name or user.email, changes)
    return UserOut.model_validate(user).model_dump(by_alias=True)


@router.post("/{user_id}/reset-password")
async def reset_password(
    user_id: str,
    body: ResetPasswordRequest,
    admin: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    target = await repo.get_by_id(user_id)
    auth_service = AuthService(repo)
    await auth_service.reset_password(user_id, body.new_password)
    await log_activity(
        db, admin, "update", "user", user_id,
        (target.name or target.email) if target else user_id,
        [{"field": "password", "old": "***", "new": "***"}],
    )
    return {"success": True, "message": "Password reset successfully"}
