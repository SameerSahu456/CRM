from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.security import get_current_user
from app.models.User import User
from app.repositories.UserRepository import UserRepository
from app.schemas.UserSchema import (
    ChangePasswordRequest,
    LoginRequest,
    UserOut,
)
from app.services.AuthService import AuthService

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
