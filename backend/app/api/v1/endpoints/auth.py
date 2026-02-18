from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.security import get_current_user
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user_schema import (
    ChangePasswordRequest,
    DashboardPreferences,
    LoginRequest,
    UserOut,
)
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user_repo = UserRepository(db)
    auth_service = AuthService(user_repo)
    result = await auth_service.login(body.email, body.password)
    return {
        "token": result["token"],
        "user": UserOut.model_validate(result["user"]).model_dump(by_alias=True),
    }


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user).model_dump(by_alias=True)


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_repo = UserRepository(db)
    auth_service = AuthService(user_repo)
    await auth_service.change_password(
        str(user.id), body.current_password, body.new_password
    )
    return {"message": "Password changed successfully"}


@router.get("/me/dashboard-preferences", response_model=DashboardPreferences)
async def get_dashboard_preferences(
    user: User = Depends(get_current_user),
):
    """Get current user's dashboard layout preferences"""
    if user.dashboard_preferences:
        return DashboardPreferences.model_validate(user.dashboard_preferences)
    # Return default empty preferences
    return DashboardPreferences(widgets=[], last_modified=None)


@router.put("/me/dashboard-preferences", response_model=DashboardPreferences)
async def update_dashboard_preferences(
    preferences: DashboardPreferences,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's dashboard layout preferences"""
    user_repo = UserRepository(db)
    # Update the dashboard_preferences field
    user.dashboard_preferences = preferences.model_dump()
    await db.commit()
    await db.refresh(user)
    return DashboardPreferences.model_validate(user.dashboard_preferences)
