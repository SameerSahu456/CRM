from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.EmailTemplate import EmailTemplate
from app.models.User import User
from app.repositories.base import BaseRepository


class EmailTemplateRepository(BaseRepository[EmailTemplate]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, EmailTemplate)

    async def get_with_owner(
        self,
        page: int = 1,
        limit: int = 20,
        filters: list | None = None,
    ) -> dict:
        stmt = (
            select(EmailTemplate, User.name.label("owner_name"))
            .outerjoin(User, EmailTemplate.owner_id == User.id)
        )
        count_stmt = select(func.count()).select_from(EmailTemplate)

        if filters:
            for f in filters:
                stmt = stmt.where(f)
                count_stmt = count_stmt.where(f)

        stmt = stmt.order_by(EmailTemplate.created_at.desc())
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        rows = result.all()

        items = []
        for row in rows:
            items.append({
                "template": row[0],
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
