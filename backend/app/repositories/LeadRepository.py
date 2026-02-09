from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.Lead import Lead
from app.models.LeadActivity import LeadActivity
from app.models.User import User
from app.repositories.base import BaseRepository


class LeadRepository(BaseRepository[Lead]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Lead)

    async def get_with_assigned(
        self,
        page: int = 1,
        limit: int = 20,
        filters: list | None = None,
    ) -> dict:
        stmt = (
            select(Lead, User.name.label("assigned_to_name"))
            .outerjoin(User, Lead.assigned_to == User.id)
        )
        count_stmt = select(func.count()).select_from(Lead)

        if filters:
            for f in filters:
                stmt = stmt.where(f)
                count_stmt = count_stmt.where(f)

        stmt = stmt.order_by(Lead.created_at.desc())
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        rows = result.all()

        items = []
        for row in rows:
            items.append({
                "lead": row[0],
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

    async def get_stats(self, filters: list | None = None) -> dict:
        stages = ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"]
        stats = {}
        for stage in stages:
            stmt = select(func.count()).select_from(Lead).where(Lead.stage == stage)
            if filters:
                for f in filters:
                    stmt = stmt.where(f)
            result = await self.db.execute(stmt)
            stats[stage] = result.scalar_one()
        return stats

    async def get_activities(self, lead_id) -> list:
        stmt = (
            select(LeadActivity, User.name.label("created_by_name"))
            .outerjoin(User, LeadActivity.created_by == User.id)
            .where(LeadActivity.lead_id == lead_id)
            .order_by(LeadActivity.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.all()

    async def create_activity(self, data: dict) -> LeadActivity:
        activity = LeadActivity(**data)
        self.db.add(activity)
        await self.db.flush()
        await self.db.refresh(activity)
        return activity
