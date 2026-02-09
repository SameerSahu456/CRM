from __future__ import annotations

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.CalendarEvent import CalendarEvent
from app.models.User import User
from app.repositories.base import BaseRepository


class CalendarEventRepository(BaseRepository[CalendarEvent]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, CalendarEvent)

    async def get_with_owner(
        self,
        page: int = 1,
        limit: int = 20,
        filters: list | None = None,
    ) -> dict:
        stmt = (
            select(CalendarEvent, User.name.label("owner_name"))
            .outerjoin(User, CalendarEvent.owner_id == User.id)
        )
        count_stmt = select(func.count()).select_from(CalendarEvent)

        if filters:
            for f in filters:
                stmt = stmt.where(f)
                count_stmt = count_stmt.where(f)

        stmt = stmt.order_by(CalendarEvent.start_time.desc())
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        rows = result.all()

        items = []
        for row in rows:
            items.append({
                "event": row[0],
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

    async def get_by_range(
        self,
        start_date: datetime,
        end_date: datetime,
        filters: list | None = None,
    ) -> list:
        stmt = (
            select(CalendarEvent, User.name.label("owner_name"))
            .outerjoin(User, CalendarEvent.owner_id == User.id)
            .where(CalendarEvent.start_time >= start_date)
            .where(CalendarEvent.start_time <= end_date)
        )

        if filters:
            for f in filters:
                stmt = stmt.where(f)

        stmt = stmt.order_by(CalendarEvent.start_time.asc())

        result = await self.db.execute(stmt)
        rows = result.all()

        items = []
        for row in rows:
            items.append({
                "event": row[0],
                "owner_name": row[1],
            })
        return items
