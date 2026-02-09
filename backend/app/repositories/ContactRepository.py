from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.Account import Account
from app.models.Contact import Contact
from app.models.User import User
from app.repositories.base import BaseRepository


class ContactRepository(BaseRepository[Contact]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Contact)

    async def get_with_names(
        self,
        page: int = 1,
        limit: int = 20,
        filters: list | None = None,
    ) -> dict:
        stmt = (
            select(
                Contact,
                Account.name.label("account_name"),
                User.name.label("owner_name"),
            )
            .outerjoin(Account, Contact.account_id == Account.id)
            .outerjoin(User, Contact.owner_id == User.id)
        )
        count_stmt = select(func.count()).select_from(Contact)

        if filters:
            for f in filters:
                stmt = stmt.where(f)
                count_stmt = count_stmt.where(f)

        stmt = stmt.order_by(Contact.created_at.desc())
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        rows = result.all()

        items = []
        for row in rows:
            items.append({
                "contact": row[0],
                "account_name": row[1],
                "owner_name": row[2],
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

    async def get_by_account(
        self,
        account_id,
        page: int = 1,
        limit: int = 20,
    ) -> dict:
        stmt = (
            select(
                Contact,
                Account.name.label("account_name"),
                User.name.label("owner_name"),
            )
            .outerjoin(Account, Contact.account_id == Account.id)
            .outerjoin(User, Contact.owner_id == User.id)
            .where(Contact.account_id == account_id)
        )
        count_stmt = (
            select(func.count())
            .select_from(Contact)
            .where(Contact.account_id == account_id)
        )

        stmt = stmt.order_by(Contact.created_at.desc())
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        rows = result.all()

        items = []
        for row in rows:
            items.append({
                "contact": row[0],
                "account_name": row[1],
                "owner_name": row[2],
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
