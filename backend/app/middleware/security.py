from __future__ import annotations

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import UnauthorizedException
from app.models.User import User
from app.repositories.UserRepository import UserRepository
from app.services.AuthService import AuthService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not token:
        raise UnauthorizedException("Not authenticated")

    user_repo = UserRepository(db)
    auth_service = AuthService(user_repo)
    payload = auth_service.verify_token(token)

    user = await user_repo.get_by_id(payload.get("sub"))
    if not user:
        raise UnauthorizedException("User not found")
    if not user.is_active:
        raise UnauthorizedException("Account is deactivated")
    return user
