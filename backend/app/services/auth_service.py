from __future__ import annotations

from datetime import datetime, timedelta

import bcrypt
from jose import JWTError, jwt

from app.config import settings
from app.exceptions import BadRequestException, UnauthorizedException
from app.repositories.user_repository import UserRepository

ALGORITHM = "HS256"


def _hash_password(password: str) -> str:
    """Hash a password using bcrypt. Truncates to 72 bytes (bcrypt limit)."""
    password_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against a hash. Truncates to 72 bytes (bcrypt limit)."""
    password_bytes = password.encode("utf-8")[:72]
    return bcrypt.checkpw(password_bytes, password_hash.encode("utf-8"))


class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def login(self, email: str, password: str) -> dict:
        user = await self.user_repo.get_by_email(email)
        if not user:
            raise UnauthorizedException("Invalid email or password")

        if not _verify_password(password, user.password_hash):
            raise UnauthorizedException("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedException("Account is deactivated")

        # Update last login
        user.last_login = datetime.utcnow()
        await self.user_repo.db.flush()

        token = self._create_token(str(user.id), user.role)
        return {"token": token, "user": user}

    async def change_password(self, user_id: str, current_password: str, new_password: str) -> bool:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise BadRequestException("User not found")

        if not _verify_password(current_password, user.password_hash):
            raise BadRequestException("Current password is incorrect")

        user.password_hash = _hash_password(new_password)
        user.must_change_password = False
        await self.user_repo.db.flush()
        return True

    async def reset_password(self, user_id: str, new_password: str) -> bool:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise BadRequestException("User not found")

        user.password_hash = _hash_password(new_password)
        user.must_change_password = True
        await self.user_repo.db.flush()
        return True

    def verify_token(self, token: str) -> dict:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
            if payload.get("sub") is None:
                raise UnauthorizedException("Invalid token")
            return payload
        except JWTError:
            raise UnauthorizedException("Invalid or expired token")

    @staticmethod
    def _create_token(user_id: str, role: str) -> str:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode = {"sub": user_id, "role": role, "exp": expire}
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)

    @staticmethod
    def hash_password(password: str) -> str:
        return _hash_password(password)
