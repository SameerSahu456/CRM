from __future__ import annotations

from typing import List, Optional

from sqlalchemy import text
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
    - manager-level roles → own ID + ALL subordinates recursively
      (walks the full manager_id chain: L1 → L2 → ... → this manager)
    - sales                → own ID only
    """
    if user.role in ADMIN_ROLES:
        return None

    if user.role in MANAGER_ROLES:
        # Recursive CTE to find all subordinates at every level
        result = await db.execute(
            text("""
                WITH RECURSIVE subordinates AS (
                    SELECT id FROM users WHERE manager_id = :uid
                    UNION ALL
                    SELECT u.id FROM users u
                    INNER JOIN subordinates s ON u.manager_id = s.id
                )
                SELECT id FROM subordinates
            """),
            {"uid": str(user.id)},
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
