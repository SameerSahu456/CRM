from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import case, extract, func, literal, select, union_all
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.security import get_current_user
from app.models.Deal import Deal
from app.models.Lead import Lead
from app.models.Partner import Partner
from app.models.Product import Product
from app.models.SalesEntry import SalesEntry
from app.models.Task import Task
from app.models.User import User

router = APIRouter()


def _scope_filters(user: User) -> list:
    """Return data-scope filters based on role."""
    if user.role == "salesperson":
        return [SalesEntry.salesperson_id == user.id]
    return []


@router.get("/")
async def dashboard_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    month_start = today.replace(day=1)

    # Total sales amount (all time, scoped)
    sales_stmt = select(func.coalesce(func.sum(SalesEntry.amount), 0))
    if user.role == "salesperson":
        sales_stmt = sales_stmt.where(SalesEntry.salesperson_id == user.id)
    total_sales = (await db.execute(sales_stmt)).scalar_one()

    # Monthly revenue
    monthly_stmt = (
        select(func.coalesce(func.sum(SalesEntry.amount), 0))
        .where(SalesEntry.sale_date >= month_start)
    )
    if user.role == "salesperson":
        monthly_stmt = monthly_stmt.where(SalesEntry.salesperson_id == user.id)
    monthly_revenue = (await db.execute(monthly_stmt)).scalar_one()

    # Total sales count
    count_stmt = select(func.count()).select_from(SalesEntry)
    if user.role == "salesperson":
        count_stmt = count_stmt.where(SalesEntry.salesperson_id == user.id)
    total_count = (await db.execute(count_stmt)).scalar_one()

    # Total partners
    partner_stmt = select(func.count()).select_from(Partner).where(Partner.status == "approved")
    total_partners = (await db.execute(partner_stmt)).scalar_one()

    # Pending partners
    pending_stmt = select(func.count()).select_from(Partner).where(Partner.status == "pending")
    pending_partners = (await db.execute(pending_stmt)).scalar_one()

    # Active leads
    lead_stmt = select(func.count()).select_from(Lead).where(
        Lead.stage.notin_(["Won", "Lost"])
    )
    if user.role == "salesperson":
        lead_stmt = lead_stmt.where(Lead.assigned_to == user.id)
    active_leads = (await db.execute(lead_stmt)).scalar_one()

    # Pending payments
    pending_pay_stmt = (
        select(func.count())
        .select_from(SalesEntry)
        .where(SalesEntry.payment_status == "pending")
    )
    if user.role == "salesperson":
        pending_pay_stmt = pending_pay_stmt.where(SalesEntry.salesperson_id == user.id)
    pending_payments = (await db.execute(pending_pay_stmt)).scalar_one()

    return {
        "totalSales": float(total_sales),
        "totalCount": total_count,
        "monthlyRevenue": float(monthly_revenue),
        "totalPartners": total_partners,
        "pendingPartners": pending_partners,
        "activeLeads": active_leads,
        "pendingPayments": pending_payments,
    }


@router.get("/monthly-stats")
async def monthly_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return last 12 months of sales data."""
    today = date.today()
    twelve_months_ago = (today.replace(day=1) - timedelta(days=365)).replace(day=1)

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

    if user.role == "salesperson":
        stmt = stmt.where(SalesEntry.salesperson_id == user.id)

    result = await db.execute(stmt)
    rows = result.all()

    months = []
    for row in rows:
        month_names = [
            "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ]
        months.append({
            "month": f"{month_names[int(row.month)]} {int(row.year)}",
            "revenue": float(row.revenue),
            "count": row.count,
        })

    return months


@router.get("/growth-stats")
async def growth_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Compare current month vs last month."""
    today = date.today()
    this_month_start = today.replace(day=1)
    last_month_end = this_month_start - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)

    async def _month_sum(start: date, end: date) -> float:
        stmt = (
            select(func.coalesce(func.sum(SalesEntry.amount), 0))
            .where(SalesEntry.sale_date >= start)
            .where(SalesEntry.sale_date <= end)
        )
        if user.role == "salesperson":
            stmt = stmt.where(SalesEntry.salesperson_id == user.id)
        return float((await db.execute(stmt)).scalar_one())

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
    if user.role == "salesperson":
        recent_stmt = recent_stmt.where(SalesEntry.salesperson_id == user.id)

    result = await db.execute(recent_stmt)
    recent_rows = result.all()

    recent_sales = []
    for row in recent_rows:
        sale = row[0]
        recent_sales.append({
            "id": str(sale.id),
            "customerName": sale.customer_name,
            "amount": float(sale.amount),
            "saleDate": str(sale.sale_date) if sale.sale_date else None,
            "partnerName": row[1],
            "salespersonName": row[2],
            "paymentStatus": sale.payment_status,
        })

    return {
        "thisMonth": this_month,
        "lastMonth": last_month,
        "growthPct": growth_pct,
        "recentSales": recent_sales,
    }


@router.get("/all")
async def dashboard_all(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Single combined endpoint returning ALL dashboard data in one request.

    Replaces 7 separate API calls (stats, growth, monthly, leads, deals, tasks, breakdown)
    with a single round-trip — critical for serverless cold-start performance.
    """
    today = date.today()
    month_start = today.replace(day=1)
    last_month_end = month_start - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)
    twelve_months_ago = (month_start - timedelta(days=365)).replace(day=1)

    is_sp = user.role == "salesperson"

    # ── 1. Sales aggregates (single query) ──────────────────────
    sales_agg = select(
        func.coalesce(func.sum(SalesEntry.amount), 0).label("total_sales"),
        func.count().label("total_count"),
        func.coalesce(
            func.sum(case((SalesEntry.sale_date >= month_start, SalesEntry.amount), else_=0)), 0
        ).label("monthly_revenue"),
        func.coalesce(
            func.sum(
                case(
                    (
                        SalesEntry.sale_date.between(last_month_start, last_month_end),
                        SalesEntry.amount,
                    ),
                    else_=0,
                )
            ),
            0,
        ).label("last_month_revenue"),
        func.count().filter(SalesEntry.payment_status == "pending").label("pending_payments"),
    )
    if is_sp:
        sales_agg = sales_agg.where(SalesEntry.salesperson_id == user.id)
    sr = (await db.execute(sales_agg)).one()

    total_sales = float(sr.total_sales)
    total_count = sr.total_count
    monthly_revenue = float(sr.monthly_revenue)
    last_month_rev = float(sr.last_month_revenue)
    pending_payments = sr.pending_payments

    if last_month_rev > 0:
        growth_pct = round(((monthly_revenue - last_month_rev) / last_month_rev) * 100, 1)
    else:
        growth_pct = 100.0 if monthly_revenue > 0 else 0.0

    # ── 2. Partner counts (single query) ────────────────────────
    partner_agg = select(
        func.count().filter(Partner.status == "approved").label("approved"),
        func.count().filter(Partner.status == "pending").label("pending"),
    ).select_from(Partner)
    pr = (await db.execute(partner_agg)).one()

    # ── 3. Active leads (single query) ──────────────────────────
    lead_count_stmt = select(func.count()).select_from(Lead).where(
        Lead.stage.notin_(["Won", "Lost"])
    )
    if is_sp:
        lead_count_stmt = lead_count_stmt.where(Lead.assigned_to == user.id)
    active_leads = (await db.execute(lead_count_stmt)).scalar_one()

    # ── 4. Lead stats by stage (single query with CASE) ─────────
    lead_stages = ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"]
    lead_cases = [
        func.count().filter(Lead.stage == s).label(s.lower())
        for s in lead_stages
    ]
    lead_stmt = select(*lead_cases).select_from(Lead)
    if is_sp:
        lead_stmt = lead_stmt.where(Lead.assigned_to == user.id)
    lr = (await db.execute(lead_stmt)).one()
    lead_stats = {s: getattr(lr, s.lower()) for s in lead_stages}

    # ── 5. Deal pipeline stats (single query with CASE) ─────────
    deal_stages = [
        "Qualification", "Needs Analysis", "Proposal",
        "Negotiation", "Closed Won", "Closed Lost",
    ]
    deal_cases = []
    for ds in deal_stages:
        safe = ds.lower().replace(" ", "_")
        deal_cases.append(func.count().filter(Deal.stage == ds).label(f"{safe}_cnt"))
        deal_cases.append(
            func.coalesce(func.sum(case((Deal.stage == ds, Deal.value), else_=0)), 0).label(
                f"{safe}_val"
            )
        )
    deal_stmt = select(*deal_cases).select_from(Deal)
    if is_sp:
        deal_stmt = deal_stmt.where(Deal.owner_id == user.id)
    dr = (await db.execute(deal_stmt)).one()
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
    if is_sp:
        task_stmt = task_stmt.where(Task.assigned_to == user.id)
    tr = (await db.execute(task_stmt)).one()
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
    if is_sp:
        monthly_stmt = monthly_stmt.where(SalesEntry.salesperson_id == user.id)
    month_names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_data = [
        {"month": f"{month_names[int(r.month)]} {int(r.year)}", "revenue": float(r.revenue), "count": r.count}
        for r in (await db.execute(monthly_stmt)).all()
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
    if is_sp:
        recent_stmt = recent_stmt.where(SalesEntry.salesperson_id == user.id)
    recent_sales = []
    for row in (await db.execute(recent_stmt)).all():
        sale = row[0]
        recent_sales.append({
            "id": str(sale.id),
            "customerName": sale.customer_name,
            "amount": float(sale.amount),
            "saleDate": str(sale.sale_date) if sale.sale_date else None,
            "partnerName": row[1],
            "salespersonName": row[2],
            "paymentStatus": sale.payment_status,
        })

    # ── 9. Breakdown: by product, partner, salesperson ─────────
    def _scope(stmt):
        if is_sp:
            return stmt.where(SalesEntry.salesperson_id == user.id)
        return stmt

    by_product = [
        {"productName": r.name or "Unknown", "totalAmount": float(r.total), "count": r.cnt}
        for r in (await db.execute(_scope(
            select(
                Product.name.label("name"),
                func.coalesce(func.sum(SalesEntry.amount), 0).label("total"),
                func.count().label("cnt"),
            ).join(Product, SalesEntry.product_id == Product.id)
            .group_by(Product.name)
            .order_by(func.sum(SalesEntry.amount).desc())
            .limit(10)
        ))).all()
    ]
    by_partner = [
        {"partnerName": r.name or "Unknown", "totalAmount": float(r.total), "count": r.cnt}
        for r in (await db.execute(_scope(
            select(
                Partner.company_name.label("name"),
                func.coalesce(func.sum(SalesEntry.amount), 0).label("total"),
                func.count().label("cnt"),
            ).join(Partner, SalesEntry.partner_id == Partner.id)
            .group_by(Partner.company_name)
            .order_by(func.sum(SalesEntry.amount).desc())
            .limit(10)
        ))).all()
    ]
    by_salesperson = [
        {"salespersonName": r.name or "Unknown", "totalAmount": float(r.total), "count": r.cnt}
        for r in (await db.execute(_scope(
            select(
                User.name.label("name"),
                func.coalesce(func.sum(SalesEntry.amount), 0).label("total"),
                func.count().label("cnt"),
            ).join(User, SalesEntry.salesperson_id == User.id)
            .group_by(User.name)
            .order_by(func.sum(SalesEntry.amount).desc())
            .limit(10)
        ))).all()
    ]

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
    }
