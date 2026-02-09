from __future__ import annotations

from datetime import datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings
from app.exceptions import BadRequestException, UnauthorizedException
from app.repositories.UserRepository import UserRepository

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def login(self, email: str, password: str) -> dict:
        user = await self.user_repo.get_by_email(email)
        if not user:
            raise UnauthorizedException("Invalid email or password")

        if not pwd_context.verify(password, user.password_hash):
            raise UnauthorizedException("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedException("Account is deactivated")

        # Update last login
        user.last_login = datetime.utcnow()
        await self.user_repo.db.flush()

        token = self._create_token(str(user.id), user.role)
        return {"token": token, "user": user}

    async def change_password(
        self, user_id: str, current_password: str, new_password: str
    ) -> bool:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise BadRequestException("User not found")

        if not pwd_context.verify(current_password, user.password_hash):
            raise BadRequestException("Current password is incorrect")

        user.password_hash = pwd_context.hash(new_password)
        user.must_change_password = False
        await self.user_repo.db.flush()
        return True

    async def reset_password(self, user_id: str, new_password: str) -> bool:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise BadRequestException("User not found")

        user.password_hash = pwd_context.hash(new_password)
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
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        to_encode = {"sub": user_id, "role": role, "exp": expire}
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)

    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)
