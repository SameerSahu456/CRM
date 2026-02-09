from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.Account import Account
from app.models.Contact import Contact
from app.models.Deal import Deal
from app.models.User import User
from app.repositories.base import BaseRepository


class DealRepository(BaseRepository[Deal]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Deal)

    async def get_with_names(
        self,
        page: int = 1,
        limit: int = 20,
        filters: list | None = None,
    ) -> dict:
        stmt = (
            select(
                Deal,
                Account.name.label("account_name"),
                Contact.first_name.label("contact_name"),
                User.name.label("owner_name"),
            )
            .outerjoin(Account, Deal.account_id == Account.id)
            .outerjoin(Contact, Deal.contact_id == Contact.id)
            .outerjoin(User, Deal.owner_id == User.id)
        )
        count_stmt = select(func.count()).select_from(Deal)

        if filters:
            for f in filters:
                stmt = stmt.where(f)
                count_stmt = count_stmt.where(f)

        stmt = stmt.order_by(Deal.created_at.desc())
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        rows = result.all()

        items = []
        for row in rows:
            items.append({
                "deal": row[0],
                "account_name": row[1],
                "contact_name": row[2],
                "owner_name": row[3],
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

    async def get_pipeline_stats(self, filters: list | None = None) -> dict:
        stages = [
            "Qualification", "Needs Analysis", "Proposal",
            "Negotiation", "Closed Won", "Closed Lost",
        ]
        stats = {}
        for stage in stages:
            count_stmt = (
                select(func.count())
                .select_from(Deal)
                .where(Deal.stage == stage)
            )
            value_stmt = (
                select(func.coalesce(func.sum(Deal.value), 0))
                .select_from(Deal)
                .where(Deal.stage == stage)
            )
            if filters:
                for f in filters:
                    count_stmt = count_stmt.where(f)
                    value_stmt = value_stmt.where(f)

            count_result = await self.db.execute(count_stmt)
            value_result = await self.db.execute(value_stmt)

            stats[stage] = {
                "count": count_result.scalar_one(),
                "value": float(value_result.scalar_one()),
            }
        return stats

    async def get_by_account(self, account_id) -> list:
        stmt = (
            select(
                Deal,
                Account.name.label("account_name"),
                Contact.first_name.label("contact_name"),
                User.name.label("owner_name"),
            )
            .outerjoin(Account, Deal.account_id == Account.id)
            .outerjoin(Contact, Deal.contact_id == Contact.id)
            .outerjoin(User, Deal.owner_id == User.id)
            .where(Deal.account_id == account_id)
            .order_by(Deal.created_at.desc())
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        items = []
        for row in rows:
            items.append({
                "deal": row[0],
                "account_name": row[1],
                "contact_name": row[2],
                "owner_name": row[3],
            })
        return items
