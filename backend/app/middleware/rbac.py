from __future__ import annotations

from functools import wraps

from fastapi import Depends

from app.exceptions import ForbiddenException
from app.models.User import User
from app.middleware.security import get_current_user


def require_role(*allowed_roles: str):
    """FastAPI dependency that checks if the current user has one of the allowed roles."""
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise ForbiddenException(
                f"Access denied. Required role: {', '.join(allowed_roles)}"
            )
        return user
    return role_checker


def require_admin():
    """Shortcut for admin-only endpoints."""
    return require_role("admin", "superadmin")


def require_manager():
    """Shortcut for manager-level and above."""
    return require_role("admin", "superadmin", "businesshead", "productmanager")
