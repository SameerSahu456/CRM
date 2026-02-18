from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sales_entry import SalesEntry
from app.models.partner import Partner
from app.models.product import Product
from app.models.user import User
from app.repositories.base import BaseRepository


class SalesEntryRepository(BaseRepository[SalesEntry]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, SalesEntry)

    async def get_with_names(
        self,
        page: int = 1,
        limit: int = 20,
        filters: list | None = None,
    ) -> dict:
        stmt = (
            select(
                SalesEntry,
                Partner.company_name.label("partner_name"),
                Product.name.label("product_name"),
                User.name.label("salesperson_name"),
            )
            .outerjoin(Partner, SalesEntry.partner_id == Partner.id)
            .outerjoin(Product, SalesEntry.product_id == Product.id)
            .outerjoin(User, SalesEntry.salesperson_id == User.id)
        )
        count_stmt = select(func.count()).select_from(SalesEntry)

        if filters:
            for f in filters:
                stmt = stmt.where(f)
                count_stmt = count_stmt.where(f)

        stmt = stmt.order_by(SalesEntry.sale_date.desc(), SalesEntry.created_at.desc())
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        rows = result.all()

        # Collect all product_ids from entries that have them
        all_product_ids: set[str] = set()
        for row in rows:
            entry = row[0]
            if entry.product_ids:
                for pid in entry.product_ids:
                    all_product_ids.add(str(pid))

        # Bulk-fetch product names for all referenced product_ids
        product_name_map: dict[str, str] = {}
        if all_product_ids:
            prod_stmt = select(Product.id, Product.name).where(
                Product.id.in_(list(all_product_ids))
            )
            prod_result = await self.db.execute(prod_stmt)
            for pid, pname in prod_result.all():
                product_name_map[str(pid)] = pname

        items = []
        for row in rows:
            entry = row[0]
            # Resolve product names from product_ids array
            resolved_names = None
            if entry.product_ids:
                resolved_names = [
                    product_name_map.get(str(pid), "Unknown")
                    for pid in entry.product_ids
                ]
            items.append({
                "entry": entry,
                "partner_name": row[1],
                "product_name": row[2],
                "product_names": resolved_names,
                "salesperson_name": row[3],
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

    async def get_summary(self, filters: list | None = None) -> dict:
        stmt = select(
            func.coalesce(func.sum(SalesEntry.amount), 0).label("total_amount"),
            func.count().label("total_count"),
            func.coalesce(func.sum(SalesEntry.commission_amount), 0).label("total_commission"),
        )
        if filters:
            for f in filters:
                stmt = stmt.where(f)

        result = await self.db.execute(stmt)
        row = result.one()

        # Pending payments count
        pending_stmt = select(func.count()).select_from(SalesEntry).where(
            SalesEntry.payment_status == "pending"
        )
        paid_stmt = select(func.count()).select_from(SalesEntry).where(
            SalesEntry.payment_status == "paid"
        )
        if filters:
            for f in filters:
                pending_stmt = pending_stmt.where(f)
                paid_stmt = paid_stmt.where(f)

        pending_result = await self.db.execute(pending_stmt)
        paid_result = await self.db.execute(paid_stmt)

        return {
            "total_amount": float(row.total_amount),
            "total_count": row.total_count,
            "total_commission": float(row.total_commission),
            "pending_payments": pending_result.scalar_one(),
            "paid_count": paid_result.scalar_one(),
        }

    async def get_breakdown(self, filters: list | None = None) -> dict:
        """Sales breakdown by product, partner, and salesperson."""

        def _apply(stmt):
            if filters:
                for f in filters:
                    stmt = stmt.where(f)
            return stmt

        # By product
        by_product_stmt = _apply(
            select(
                Product.name.label("name"),
                func.coalesce(func.sum(SalesEntry.amount), 0).label("total"),
                func.count().label("cnt"),
            )
            .join(Product, SalesEntry.product_id == Product.id)
            .group_by(Product.name)
            .order_by(func.sum(SalesEntry.amount).desc())
            .limit(10)
        )
        by_product = [
            {"productName": r.name or "Unknown", "totalAmount": float(r.total), "count": r.cnt}
            for r in (await self.db.execute(by_product_stmt)).all()
        ]

        # By partner
        by_partner_stmt = _apply(
            select(
                Partner.company_name.label("name"),
                func.coalesce(func.sum(SalesEntry.amount), 0).label("total"),
                func.count().label("cnt"),
            )
            .join(Partner, SalesEntry.partner_id == Partner.id)
            .group_by(Partner.company_name)
            .order_by(func.sum(SalesEntry.amount).desc())
            .limit(10)
        )
        by_partner = [
            {"partnerName": r.name or "Unknown", "totalAmount": float(r.total), "count": r.cnt}
            for r in (await self.db.execute(by_partner_stmt)).all()
        ]

        # By salesperson
        by_sp_stmt = _apply(
            select(
                User.name.label("name"),
                func.coalesce(func.sum(SalesEntry.amount), 0).label("total"),
                func.count().label("cnt"),
            )
            .join(User, SalesEntry.salesperson_id == User.id)
            .group_by(User.name)
            .order_by(func.sum(SalesEntry.amount).desc())
            .limit(10)
        )
        by_salesperson = [
            {"salespersonName": r.name or "Unknown", "totalAmount": float(r.total), "count": r.cnt}
            for r in (await self.db.execute(by_sp_stmt)).all()
        ]

        return {
            "byProduct": by_product,
            "byPartner": by_partner,
            "bySalesperson": by_salesperson,
        }
