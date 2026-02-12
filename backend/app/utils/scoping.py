from __future__ import annotations

from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import ForbiddenException
from app.models.User import User

ADMIN_ROLES = ("admin", "superadmin")
MANAGER_ROLES = ("businesshead", "productmanager")


async def get_scoped_user_ids(
    user: User, db: AsyncSession
) -> Optional[List[str]]:
    """Return list of user IDs this user can see, or None for unrestricted.

    - admin / superadmin  → None (see everything)
    - manager-level roles → own ID + direct reports (via manager_id)
    - sales                → own ID only
    """
    if user.role in ADMIN_ROLES:
        return None

    if user.role in MANAGER_ROLES:
        result = await db.execute(
            select(User.id).where(User.manager_id == user.id)
        )
        team_ids: List[str] = [str(row[0]) for row in result.all()]
        team_ids.append(str(user.id))
        return team_ids

    return [str(user.id)]


async def enforce_scope(
    entity: object,
    owner_field: str,
    user: User,
    db: AsyncSession,
    *,
    resource_name: str = "resource",
) -> None:
    """Raise ForbiddenException if user doesn't have access to this entity."""
    scoped_ids = await get_scoped_user_ids(user, db)
    if scoped_ids is not None:
        entity_owner = getattr(entity, owner_field, None)
        if entity_owner is None or str(entity_owner) not in [str(s) for s in scoped_ids]:
            raise ForbiddenException(f"You don't have access to this {resource_name}")
