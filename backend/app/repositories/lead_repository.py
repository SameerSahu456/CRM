from __future__ import annotations

from typing import Sequence

from sqlalchemy import case, func, select, update as sql_update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import Lead
from app.models.lead_activity import LeadActivity
from app.models.user import User
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
        stages = ["New", "Cold", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]
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

    # ------------------------------------------------------------------
    # Kanban helpers
    # ------------------------------------------------------------------

    async def get_kanban_page(
        self,
        stage: str,
        page: int = 1,
        limit: int = 5,
        filters: list | None = None,
    ) -> dict:
        """Return a page of leads for a single stage, ordered by kanban_order."""
        base_filters = [Lead.stage == stage]
        if filters:
            base_filters.extend(filters)

        # Data query – join user for assignedToName
        stmt = (
            select(Lead, User.name.label("assigned_to_name"))
            .outerjoin(User, Lead.assigned_to == User.id)
        )
        for f in base_filters:
            stmt = stmt.where(f)
        stmt = stmt.order_by(Lead.kanban_order.asc(), Lead.created_at.desc())
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        rows = result.all()
        items = [{"lead": row[0], "assigned_to_name": row[1]} for row in rows]

        # Count query
        count_stmt = select(func.count()).select_from(Lead)
        for f in base_filters:
            count_stmt = count_stmt.where(f)
        total = (await self.db.execute(count_stmt)).scalar_one()

        has_next = (page * limit) < total

        return {
            "data": items,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "hasNext": has_next,
            },
        }

    async def get_stage_counts(self, filters: list | None = None) -> dict:
        """Return {stage: count} for all stages in one query."""
        stmt = (
            select(Lead.stage, func.count())
            .select_from(Lead)
            .group_by(Lead.stage)
        )
        if filters:
            for f in filters:
                stmt = stmt.where(f)

        result = await self.db.execute(stmt)
        rows = result.all()
        return {row[0]: row[1] for row in rows}

    async def bulk_update_order(self, stage: str, ordered_ids: Sequence[str]) -> None:
        """Set kanban_order for a list of lead IDs (position = index)."""
        if not ordered_ids:
            return
        case_stmt = case(
            {lead_id: idx for idx, lead_id in enumerate(ordered_ids)},
            value=Lead.id,
        )
        await self.db.execute(
            sql_update(Lead)
            .where(Lead.id.in_(ordered_ids), Lead.stage == stage)
            .values(kanban_order=case_stmt)
        )
        await self.db.flush()
