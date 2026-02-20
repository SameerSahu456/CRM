"""
Dashboard Service

This module contains business logic for dashboard analytics and statistics.
Follows SOLID principles and service layer architecture.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Dict, List

from sqlalchemy import case, extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.deal import Deal
from app.models.lead import Lead
from app.models.partner import Partner
from app.models.product import Product
from app.models.sales_entry import SalesEntry
from app.models.task import Task
from app.models.user import User
from app.utils.scoping import get_scoped_user_ids


class DashboardService:
    """
    Service layer for dashboard analytics and statistics.

    Handles:
    - Dashboard statistics (sales, partners, leads, payments)
    - Monthly sales trends
    - Growth statistics and comparisons
    - Comprehensive dashboard data (all-in-one endpoint)
    - Assignee-specific analytics
    - Access control and scoping
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    def _apply_sales_scope(self, stmt, scoped_ids):
        """Apply sales scoping filter."""
        if scoped_ids is not None:
            return stmt.where(SalesEntry.salesperson_id.in_(scoped_ids))
        return stmt

    def _apply_lead_scope(self, stmt, scoped_ids):
        """Apply lead scoping filter."""
        if scoped_ids is not None:
            return stmt.where(Lead.assigned_to.in_(scoped_ids))
        return stmt

    def _apply_deal_scope(self, stmt, scoped_ids):
        """Apply deal scoping filter."""
        if scoped_ids is not None:
            return stmt.where(Deal.owner_id.in_(scoped_ids))
        return stmt

    def _apply_task_scope(self, stmt, scoped_ids):
        """Apply task scoping filter."""
        if scoped_ids is not None:
            return stmt.where(Task.assigned_to.in_(scoped_ids))
        return stmt

    def _apply_partner_scope(self, stmt, scoped_ids):
        """Apply partner scoping filter."""
        if scoped_ids is not None:
            return stmt.where(Partner.assigned_to.in_(scoped_ids))
        return stmt

    async def get_dashboard_stats(self, user: User) -> Dict[str, Any]:
        """
        Get main dashboard statistics.

        Args:
            user: Current user

        Returns:
            Dashboard statistics dictionary
        """
        today = date.today()
        month_start = today.replace(day=1)
        scoped_ids = await get_scoped_user_ids(user, self.db)

        # Total sales amount (all time, scoped)
        sales_stmt = select(func.coalesce(func.sum(SalesEntry.amount), 0))
        sales_stmt = self._apply_sales_scope(sales_stmt, scoped_ids)
        total_sales = (await self.db.execute(sales_stmt)).scalar_one()

        # Monthly revenue
        monthly_stmt = select(func.coalesce(func.sum(SalesEntry.amount), 0)).where(
            SalesEntry.sale_date >= month_start
        )
        monthly_stmt = self._apply_sales_scope(monthly_stmt, scoped_ids)
        monthly_revenue = (await self.db.execute(monthly_stmt)).scalar_one()

        # Total sales count
        count_stmt = select(func.count()).select_from(SalesEntry)
        count_stmt = self._apply_sales_scope(count_stmt, scoped_ids)
        total_count = (await self.db.execute(count_stmt)).scalar_one()

        # Total partners
        partner_stmt = (
            select(func.count())
            .select_from(Partner)
            .where(Partner.status == "approved")
        )
        partner_stmt = self._apply_partner_scope(partner_stmt, scoped_ids)
        total_partners = (await self.db.execute(partner_stmt)).scalar_one()

        # Pending partners
        pending_stmt = (
            select(func.count()).select_from(Partner).where(Partner.status == "pending")
        )
        pending_stmt = self._apply_partner_scope(pending_stmt, scoped_ids)
        pending_partners = (await self.db.execute(pending_stmt)).scalar_one()

        # Active leads
        lead_stmt = (
            select(func.count())
            .select_from(Lead)
            .where(Lead.stage.notin_(["Won", "Lost"]))
        )
        lead_stmt = self._apply_lead_scope(lead_stmt, scoped_ids)
        active_leads = (await self.db.execute(lead_stmt)).scalar_one()

        # Pending payments
        pending_pay_stmt = (
            select(func.count())
            .select_from(SalesEntry)
            .where(SalesEntry.payment_status == "pending")
        )
        pending_pay_stmt = self._apply_sales_scope(pending_pay_stmt, scoped_ids)
        pending_payments = (await self.db.execute(pending_pay_stmt)).scalar_one()

        return {
            "totalSales": float(total_sales),
            "totalCount": total_count,
            "monthlyRevenue": float(monthly_revenue),
            "totalPartners": total_partners,
            "pendingPartners": pending_partners,
            "activeLeads": active_leads,
            "pendingPayments": pending_payments,
        }

    async def get_monthly_stats(self, user: User) -> List[Dict[str, Any]]:
        """
        Get last 12 months of sales data.

        Args:
            user: Current user

        Returns:
            List of monthly statistics
        """
        today = date.today()
        twelve_months_ago = (today.replace(day=1) - timedelta(days=365)).replace(day=1)
        scoped_ids = await get_scoped_user_ids(user, self.db)

        stmt = (
            select(
                extract("year", SalesEntry.sale_date).label("year"),
                extract("month", SalesEntry.sale_date).label("month"),
                func.coalesce(func.sum(SalesEntry.amount), 0).label("revenue"),
                func.count().label("count"),
            )
            .where(SalesEntry.sale_date >= twelve_months_ago)
            .group_by("year", "month")
            .order_by("year", "month")
        )
        stmt = self._apply_sales_scope(stmt, scoped_ids)

        result = await self.db.execute(stmt)
        rows = result.all()

        month_names = [
            "",
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ]
        months = []
        for row in rows:
            months.append(
                {
                    "month": f"{month_names[int(row.month)]} {int(row.year)}",
                    "revenue": float(row.revenue),
                    "count": row.count,
                }
            )

        return months

    async def get_growth_stats(self, user: User) -> Dict[str, Any]:
        """
        Compare current month vs last month with recent sales.

        Args:
            user: Current user

        Returns:
            Growth statistics dictionary
        """
        today = date.today()
        this_month_start = today.replace(day=1)
        last_month_end = this_month_start - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        scoped_ids = await get_scoped_user_ids(user, self.db)

        async def _month_sum(start: date, end: date) -> float:
            stmt = (
                select(func.coalesce(func.sum(SalesEntry.amount), 0))
                .where(SalesEntry.sale_date >= start)
                .where(SalesEntry.sale_date <= end)
            )
            stmt = self._apply_sales_scope(stmt, scoped_ids)
            return float((await self.db.execute(stmt)).scalar_one())

        this_month = await _month_sum(this_month_start, today)
        last_month = await _month_sum(last_month_start, last_month_end)

        if last_month > 0:
            growth_pct = round(((this_month - last_month) / last_month) * 100, 1)
        else:
            growth_pct = 100.0 if this_month > 0 else 0.0

        # Recent sales (last 5)
        recent_stmt = (
            select(
                SalesEntry,
                Partner.company_name.label("partner_name"),
                User.name.label("salesperson_name"),
            )
            .outerjoin(Partner, SalesEntry.partner_id == Partner.id)
            .outerjoin(User, SalesEntry.salesperson_id == User.id)
            .order_by(SalesEntry.created_at.desc())
            .limit(5)
        )
        recent_stmt = self._apply_sales_scope(recent_stmt, scoped_ids)

        result = await self.db.execute(recent_stmt)
        recent_rows = result.all()

        recent_sales = []
        for row in recent_rows:
            sale = row[0]
            recent_sales.append(
                {
                    "id": str(sale.id),
                    "customerName": sale.customer_name,
                    "amount": float(sale.amount),
                    "saleDate": str(sale.sale_date) if sale.sale_date else None,
                    "partnerName": row[1],
                    "salespersonName": row[2],
                    "paymentStatus": sale.payment_status,
                }
            )

        return {
            "thisMonth": this_month,
            "lastMonth": last_month,
            "growthPct": growth_pct,
            "recentSales": recent_sales,
        }

    async def get_dashboard_all(self, user: User) -> Dict[str, Any]:
        """
        Single combined endpoint returning ALL dashboard data in one request.
        Optimized with minimal queries using aggregations.

        Args:
            user: Current user

        Returns:
            Comprehensive dashboard data dictionary
        """
        today = date.today()
        month_start = today.replace(day=1)
        last_month_end = month_start - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        twelve_months_ago = (month_start - timedelta(days=365)).replace(day=1)

        scoped_ids = await get_scoped_user_ids(user, self.db)

        # ── 1. Sales aggregates (single query) ──────────────────────
        sales_agg = select(
            func.coalesce(func.sum(SalesEntry.amount), 0).label("total_sales"),
            func.count().label("total_count"),
            func.coalesce(
                func.sum(
                    case(
                        (SalesEntry.sale_date >= month_start, SalesEntry.amount),
                        else_=0,
                    )
                ),
                0,
            ).label("monthly_revenue"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            SalesEntry.sale_date.between(
                                last_month_start, last_month_end
                            ),
                            SalesEntry.amount,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("last_month_revenue"),
            func.count()
            .filter(SalesEntry.payment_status == "pending")
            .label("pending_payments"),
        )
        sales_agg = self._apply_sales_scope(sales_agg, scoped_ids)
        sr = (await self.db.execute(sales_agg)).one()

        total_sales = float(sr.total_sales)
        total_count = sr.total_count
        monthly_revenue = float(sr.monthly_revenue)
        last_month_rev = float(sr.last_month_revenue)
        pending_payments = sr.pending_payments

        if last_month_rev > 0:
            growth_pct = round(
                ((monthly_revenue - last_month_rev) / last_month_rev) * 100, 1
            )
        else:
            growth_pct = 100.0 if monthly_revenue > 0 else 0.0

        # ── 2. Partner counts (single query) ────────────────────────
        partner_agg = select(
            func.count().filter(Partner.status == "approved").label("approved"),
            func.count().filter(Partner.status == "pending").label("pending"),
        ).select_from(Partner)
        partner_agg = self._apply_partner_scope(partner_agg, scoped_ids)
        pr = (await self.db.execute(partner_agg)).one()

        # ── 3. Active leads (single query) ──────────────────────────
        lead_count_stmt = (
            select(func.count())
            .select_from(Lead)
            .where(Lead.stage.notin_(["Closed Won", "Closed Lost"]))
        )
        lead_count_stmt = self._apply_lead_scope(lead_count_stmt, scoped_ids)
        active_leads = (await self.db.execute(lead_count_stmt)).scalar_one()

        # ── 4. Lead stats by stage (single query with CASE) ─────────
        lead_stages = ["Cold", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]
        lead_cases = [
            func.count().filter(Lead.stage == s).label(s.lower().replace(" ", "_"))
            for s in lead_stages
        ]
        lead_stmt = select(*lead_cases).select_from(Lead)
        lead_stmt = self._apply_lead_scope(lead_stmt, scoped_ids)
        lr = (await self.db.execute(lead_stmt)).one()
        lead_stats = {s: getattr(lr, s.lower().replace(" ", "_")) for s in lead_stages}

        # ── 5. Deal pipeline stats (single query with CASE) ─────────
        deal_stages = [
            "New",
            "Cold",
            "Proposal",
            "Negotiation",
            "Closed Won",
            "Closed Lost",
        ]
        deal_cases = []
        for ds in deal_stages:
            safe = ds.lower().replace(" ", "_")
            deal_cases.append(
                func.count().filter(Deal.stage == ds).label(f"{safe}_cnt")
            )
            deal_cases.append(
                func.coalesce(
                    func.sum(case((Deal.stage == ds, Deal.value), else_=0)), 0
                ).label(f"{safe}_val")
            )
        deal_stmt = select(*deal_cases).select_from(Deal)
        deal_stmt = self._apply_deal_scope(deal_stmt, scoped_ids)
        dr = (await self.db.execute(deal_stmt)).one()
        deal_stats = {}
        for ds in deal_stages:
            safe = ds.lower().replace(" ", "_")
            deal_stats[ds] = {
                "count": getattr(dr, f"{safe}_cnt"),
                "value": float(getattr(dr, f"{safe}_val")),
            }

        # ── 6. Task stats (single query with CASE) ─────────────────
        task_statuses = ["pending", "in_progress", "completed"]
        task_cases = [
            func.count().filter(Task.status == s).label(s) for s in task_statuses
        ]
        task_stmt = select(*task_cases).select_from(Task)
        task_stmt = self._apply_task_scope(task_stmt, scoped_ids)
        tr = (await self.db.execute(task_stmt)).one()
        task_stats = {s: getattr(tr, s) for s in task_statuses}

        # ── 7. Monthly stats (single grouped query) ────────────────
        monthly_stmt = (
            select(
                extract("year", SalesEntry.sale_date).label("year"),
                extract("month", SalesEntry.sale_date).label("month"),
                func.coalesce(func.sum(SalesEntry.amount), 0).label("revenue"),
                func.count().label("count"),
            )
            .where(SalesEntry.sale_date >= twelve_months_ago)
            .group_by("year", "month")
            .order_by("year", "month")
        )
        monthly_stmt = self._apply_sales_scope(monthly_stmt, scoped_ids)
        month_names = [
            "",
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ]
        monthly_data = [
            {
                "month": f"{month_names[int(r.month)]} {int(r.year)}",
                "revenue": float(r.revenue),
                "count": r.count,
            }
            for r in (await self.db.execute(monthly_stmt)).all()
        ]

        # ── 8. Recent sales (single query with joins) ──────────────
        recent_stmt = (
            select(
                SalesEntry,
                Partner.company_name.label("partner_name"),
                User.name.label("salesperson_name"),
            )
            .outerjoin(Partner, SalesEntry.partner_id == Partner.id)
            .outerjoin(User, SalesEntry.salesperson_id == User.id)
            .order_by(SalesEntry.created_at.desc())
            .limit(5)
        )
        recent_stmt = self._apply_sales_scope(recent_stmt, scoped_ids)
        recent_sales = []
        for row in (await self.db.execute(recent_stmt)).all():
            sale = row[0]
            recent_sales.append(
                {
                    "id": str(sale.id),
                    "customerName": sale.customer_name,
                    "amount": float(sale.amount),
                    "saleDate": str(sale.sale_date) if sale.sale_date else None,
                    "partnerName": row[1],
                    "salespersonName": row[2],
                    "paymentStatus": sale.payment_status,
                }
            )

        # ── 9. Breakdown: by product, partner, salesperson ─────────
        def _scope(stmt):
            return self._apply_sales_scope(stmt, scoped_ids)

        by_product = [
            {
                "productName": r.name or "Unknown",
                "totalAmount": float(r.total),
                "count": r.cnt,
            }
            for r in (
                await self.db.execute(
                    _scope(
                        select(
                            Product.name.label("name"),
                            func.coalesce(func.sum(SalesEntry.amount), 0).label(
                                "total"
                            ),
                            func.count().label("cnt"),
                        )
                        .join(Product, SalesEntry.product_id == Product.id)
                        .group_by(Product.name)
                        .order_by(func.sum(SalesEntry.amount).desc())
                        .limit(10)
                    )
                )
            ).all()
        ]
        by_partner = [
            {
                "partnerName": r.name or "Unknown",
                "totalAmount": float(r.total),
                "count": r.cnt,
            }
            for r in (
                await self.db.execute(
                    _scope(
                        select(
                            Partner.company_name.label("name"),
                            func.coalesce(func.sum(SalesEntry.amount), 0).label(
                                "total"
                            ),
                            func.count().label("cnt"),
                        )
                        .join(Partner, SalesEntry.partner_id == Partner.id)
                        .group_by(Partner.company_name)
                        .order_by(func.sum(SalesEntry.amount).desc())
                        .limit(10)
                    )
                )
            ).all()
        ]
        by_salesperson = [
            {
                "salespersonName": r.name or "Unknown",
                "totalAmount": float(r.total),
                "count": r.cnt,
            }
            for r in (
                await self.db.execute(
                    _scope(
                        select(
                            User.name.label("name"),
                            func.coalesce(func.sum(SalesEntry.amount), 0).label(
                                "total"
                            ),
                            func.count().label("cnt"),
                        )
                        .join(User, SalesEntry.salesperson_id == User.id)
                        .group_by(User.name)
                        .order_by(func.sum(SalesEntry.amount).desc())
                        .limit(10)
                    )
                )
            ).all()
        ]

        # ── Assignee Summary ────────────────────────────────────────
        # Partners per assignee
        assignee_partner_stmt = self._apply_partner_scope(
            select(
                Partner.assigned_to,
                func.count().label("cnt"),
            )
            .where(Partner.is_active.is_(True))
            .group_by(Partner.assigned_to),
            scoped_ids,
        )
        assignee_partners = {
            str(r[0]): r.cnt
            for r in (await self.db.execute(assignee_partner_stmt)).all()
            if r[0] is not None
        }

        # Leads per assignee
        assignee_lead_stmt = self._apply_lead_scope(
            select(
                Lead.assigned_to,
                func.count().label("cnt"),
            )
            .where(Lead.stage.notin_(["Won", "Lost"]))
            .group_by(Lead.assigned_to),
            scoped_ids,
        )
        assignee_leads = {
            str(r[0]): r.cnt
            for r in (await self.db.execute(assignee_lead_stmt)).all()
            if r[0] is not None
        }

        # Deals per assignee
        assignee_deal_stmt = self._apply_deal_scope(
            select(
                Deal.owner_id,
                func.count().label("cnt"),
                func.coalesce(func.sum(Deal.value), 0).label("val"),
            )
            .where(Deal.stage.notin_(["Closed Won", "Closed Lost"]))
            .group_by(Deal.owner_id),
            scoped_ids,
        )
        assignee_deals = {
            str(r[0]): {"count": r.cnt, "value": float(r.val)}
            for r in (await self.db.execute(assignee_deal_stmt)).all()
            if r[0] is not None
        }

        # Sales per assignee (salesperson)
        assignee_sales_stmt = self._apply_sales_scope(
            select(
                SalesEntry.salesperson_id,
                func.count().label("cnt"),
                func.coalesce(func.sum(SalesEntry.amount), 0).label("total"),
            ).group_by(SalesEntry.salesperson_id),
            scoped_ids,
        )
        assignee_sales = {
            str(r[0]): {"count": r.cnt, "amount": float(r.total)}
            for r in (await self.db.execute(assignee_sales_stmt)).all()
            if r[0] is not None
        }

        # Collect all user IDs and fetch names
        all_assignee_ids = (
            set(assignee_partners.keys())
            | set(assignee_leads.keys())
            | set(assignee_deals.keys())
            | set(assignee_sales.keys())
        )
        user_name_map = {}
        if all_assignee_ids:
            name_rows = (
                await self.db.execute(
                    select(User.id, User.name).where(
                        User.id.in_(list(all_assignee_ids))
                    )
                )
            ).all()
            user_name_map = {str(r[0]): r[1] for r in name_rows}

        assignee_summary = sorted(
            [
                {
                    "userId": uid,
                    "userName": user_name_map.get(uid, "Unknown"),
                    "partners": assignee_partners.get(uid, 0),
                    "leads": assignee_leads.get(uid, 0),
                    "deals": assignee_deals.get(uid, {}).get("count", 0),
                    "dealValue": assignee_deals.get(uid, {}).get("value", 0),
                    "salesCount": assignee_sales.get(uid, {}).get("count", 0),
                    "salesAmount": assignee_sales.get(uid, {}).get("amount", 0),
                }
                for uid in all_assignee_ids
            ],
            key=lambda x: x["salesAmount"],
            reverse=True,
        )

        # ── Return everything ──────────────────────────────────────
        return {
            "stats": {
                "totalSales": total_sales,
                "totalCount": total_count,
                "monthlyRevenue": monthly_revenue,
                "totalPartners": pr.approved,
                "pendingPartners": pr.pending,
                "activeLeads": active_leads,
                "pendingPayments": pending_payments,
            },
            "growth": {
                "thisMonth": monthly_revenue,
                "lastMonth": last_month_rev,
                "growthPct": growth_pct,
                "recentSales": recent_sales,
            },
            "monthlyStats": monthly_data,
            "leadStats": lead_stats,
            "dealStats": deal_stats,
            "taskStats": task_stats,
            "breakdown": {
                "byProduct": by_product,
                "byPartner": by_partner,
                "bySalesperson": by_salesperson,
            },
            "assigneeSummary": assignee_summary,
        }

    async def get_assignee_detail(self, user_id: str, user: User) -> Dict[str, Any]:
        """
        Get detailed analytics for a single assignee.

        Args:
            user_id: Target user ID
            user: Current user (for access control)

        Returns:
            Detailed assignee analytics dictionary

        Raises:
            HTTPException: If access denied
        """
        from fastapi import HTTPException

        scoped_ids = await get_scoped_user_ids(user, self.db)
        if scoped_ids is not None and user_id not in scoped_ids:
            raise HTTPException(status_code=403, detail="Access denied")

        # Fetch assignee name
        name_row = (
            await self.db.execute(select(User.name).where(User.id == user_id))
        ).first()
        user_name = name_row[0] if name_row else "Unknown"

        target_ids = [user_id]

        # ── Summary counts ────────────────────────────────────────
        partner_cnt = (
            await self.db.execute(
                select(func.count())
                .select_from(Partner)
                .where(Partner.assigned_to.in_(target_ids), Partner.is_active.is_(True))
            )
        ).scalar_one()

        lead_cnt = (
            await self.db.execute(
                select(func.count())
                .select_from(Lead)
                .where(
                    Lead.assigned_to.in_(target_ids), Lead.stage.notin_(["Won", "Lost"])
                )
            )
        ).scalar_one()

        deal_agg = (
            await self.db.execute(
                select(
                    func.count().label("cnt"),
                    func.coalesce(func.sum(Deal.value), 0).label("val"),
                )
                .select_from(Deal)
                .where(
                    Deal.owner_id.in_(target_ids),
                    Deal.stage.notin_(["Closed Won", "Closed Lost"]),
                )
            )
        ).one()

        sales_agg = (
            await self.db.execute(
                select(
                    func.count().label("cnt"),
                    func.coalesce(func.sum(SalesEntry.amount), 0).label("total"),
                )
                .select_from(SalesEntry)
                .where(SalesEntry.salesperson_id.in_(target_ids))
            )
        ).one()

        # ── Leads by stage ────────────────────────────────────────
        lead_stages = ["Cold", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]
        lead_cases = [
            func.count().filter(Lead.stage == s).label(s.lower().replace(" ", "_"))
            for s in lead_stages
        ]
        lr = (
            await self.db.execute(
                select(*lead_cases)
                .select_from(Lead)
                .where(Lead.assigned_to.in_(target_ids))
            )
        ).one()
        leads_by_stage = {
            s: getattr(lr, s.lower().replace(" ", "_")) for s in lead_stages
        }

        # ── Deals by stage ────────────────────────────────────────
        deal_stages = [
            "New",
            "Cold",
            "Proposal",
            "Negotiation",
            "Closed Won",
            "Closed Lost",
        ]
        deal_cases = []
        for ds in deal_stages:
            safe = ds.lower().replace(" ", "_")
            deal_cases.append(
                func.count().filter(Deal.stage == ds).label(f"{safe}_cnt")
            )
            deal_cases.append(
                func.coalesce(
                    func.sum(case((Deal.stage == ds, Deal.value), else_=0)), 0
                ).label(f"{safe}_val")
            )
        dr = (
            await self.db.execute(
                select(*deal_cases)
                .select_from(Deal)
                .where(Deal.owner_id.in_(target_ids))
            )
        ).one()
        deals_by_stage = {}
        for ds in deal_stages:
            safe = ds.lower().replace(" ", "_")
            cnt = getattr(dr, f"{safe}_cnt")
            val = float(getattr(dr, f"{safe}_val"))
            if cnt > 0:
                deals_by_stage[ds] = {"count": cnt, "value": val}

        # ── Monthly sales (last 12 months) ────────────────────────
        today = date.today()
        twelve_months_ago = (today.replace(day=1) - timedelta(days=365)).replace(day=1)
        month_names = [
            "",
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ]
        monthly_data = [
            {
                "month": f"{month_names[int(r.month)]} {int(r.year)}",
                "revenue": float(r.revenue),
                "count": r.count,
            }
            for r in (
                await self.db.execute(
                    select(
                        extract("year", SalesEntry.sale_date).label("year"),
                        extract("month", SalesEntry.sale_date).label("month"),
                        func.coalesce(func.sum(SalesEntry.amount), 0).label("revenue"),
                        func.count().label("count"),
                    )
                    .where(SalesEntry.salesperson_id.in_(target_ids))
                    .where(SalesEntry.sale_date >= twelve_months_ago)
                    .group_by("year", "month")
                    .order_by("year", "month")
                )
            ).all()
        ]

        # ── Recent sales (last 10) ────────────────────────────────
        recent_rows = (
            await self.db.execute(
                select(
                    SalesEntry,
                    Partner.company_name.label("partner_name"),
                )
                .outerjoin(Partner, SalesEntry.partner_id == Partner.id)
                .where(SalesEntry.salesperson_id.in_(target_ids))
                .order_by(SalesEntry.created_at.desc())
                .limit(10)
            )
        ).all()
        recent_sales = [
            {
                "id": str(row[0].id),
                "customerName": row[0].customer_name,
                "amount": float(row[0].amount),
                "saleDate": str(row[0].sale_date) if row[0].sale_date else None,
                "partnerName": row[1],
                "paymentStatus": row[0].payment_status,
            }
            for row in recent_rows
        ]

        return {
            "userId": user_id,
            "userName": user_name,
            "summary": {
                "partners": partner_cnt,
                "leads": lead_cnt,
                "deals": deal_agg.cnt,
                "dealValue": float(deal_agg.val),
                "salesCount": sales_agg.cnt,
                "salesAmount": float(sales_agg.total),
            },
            "leadsByStage": leads_by_stage,
            "dealsByStage": deals_by_stage,
            "monthlySales": monthly_data,
            "recentSales": recent_sales,
        }
