from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.user import User
from app.repositories.base import BaseRepository


class AccountRepository(BaseRepository[Account]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Account)

    async def get_with_owner(
        self,
        page: int = 1,
        limit: int = 20,
        filters: list | None = None,
    ) -> dict:
        stmt = (
            select(Account, User.name.label("owner_name"))
            .outerjoin(User, Account.owner_id == User.id)
        )
        count_stmt = select(func.count()).select_from(Account)

        if filters:
            for f in filters:
                stmt = stmt.where(f)
                count_stmt = count_stmt.where(f)

        stmt = stmt.order_by(Account.created_at.desc())
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        rows = result.all()

        items = []
        for row in rows:
            items.append({
                "account": row[0],
                "owner_name": row[1],
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

    async def get_stats(self, filters: list | None = None) -> dict:
        statuses = ["active", "inactive"]
        stats = {}
        for status in statuses:
            stmt = select(func.count()).select_from(Account).where(Account.status == status)
            if filters:
                for f in filters:
                    stmt = stmt.where(f)
            result = await self.db.execute(stmt)
            stats[status] = result.scalar_one()
        return stats
