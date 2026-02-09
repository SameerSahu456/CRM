from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.Task import Task
from app.models.User import User
from app.repositories.base import BaseRepository


class TaskRepository(BaseRepository[Task]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Task)

    async def get_with_names(
        self,
        page: int = 1,
        limit: int = 20,
        filters: list | None = None,
    ) -> dict:
        CreatorUser = aliased(User)

        stmt = (
            select(
                Task,
                User.name.label("assigned_to_name"),
                CreatorUser.name.label("created_by_name"),
            )
            .outerjoin(User, Task.assigned_to == User.id)
            .outerjoin(CreatorUser, Task.created_by == CreatorUser.id)
        )
        count_stmt = select(func.count()).select_from(Task)

        if filters:
            for f in filters:
                stmt = stmt.where(f)
                count_stmt = count_stmt.where(f)

        stmt = stmt.order_by(Task.created_at.desc())
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        rows = result.all()

        items = []
        for row in rows:
            items.append({
                "task": row[0],
                "assigned_to_name": row[1],
                "created_by_name": row[2],
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
        statuses = ["pending", "in_progress", "completed"]
        stats = {}
        for status in statuses:
            stmt = select(func.count()).select_from(Task).where(Task.status == status)
            if filters:
                for f in filters:
                    stmt = stmt.where(f)
            result = await self.db.execute(stmt)
            stats[status] = result.scalar_one()
        return stats
