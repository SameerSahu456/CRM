from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.Partner import Partner
from app.models.User import User
from app.repositories.base import BaseRepository


class PartnerRepository(BaseRepository[Partner]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Partner)

    async def get_with_assigned(
        self,
        page: int = 1,
        limit: int = 20,
        filters: list | None = None,
    ) -> dict:
        stmt = (
            select(Partner, User.name.label("assigned_to_name"))
            .outerjoin(User, Partner.assigned_to == User.id)
        )
        count_stmt = select(func.count()).select_from(Partner)

        if filters:
            for f in filters:
                stmt = stmt.where(f)
                count_stmt = count_stmt.where(f)

        stmt = stmt.order_by(Partner.created_at.desc())
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        rows = result.all()

        items = []
        for row in rows:
            items.append({
                "partner": row[0],
                "assigned_to_name": row[1],
            })

        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar_one()
        total_pages = (total + limit - 1) // limit

        return {
            "data": items,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": total_pages,
            },
        }

    async def get_pending(self) -> list[Partner]:
        result = await self.db.execute(
            select(Partner).where(Partner.status == "pending").order_by(Partner.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_assigned(self, user_id) -> list[Partner]:
        result = await self.db.execute(
            select(Partner).where(Partner.assigned_to == user_id).order_by(Partner.created_at.desc())
        )
        return list(result.scalars().all())
