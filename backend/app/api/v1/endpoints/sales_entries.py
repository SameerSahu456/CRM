from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import NotFoundException
from app.middleware.security import get_current_user
from app.models.SalesEntry import SalesEntry
from app.models.User import User
from app.repositories.SalesEntryRepository import SalesEntryRepository
from app.schemas.SalesEntrySchema import (
    SalesEntryCreate,
    SalesEntryOut,
    SalesEntryUpdate,
    SalesSummary,
)
from app.utils.activity_logger import compute_changes, log_activity, model_to_dict
from app.utils.scoping import get_scoped_user_ids, enforce_scope

router = APIRouter()


@router.get("/")
async def list_sales_entries(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    partner_id: Optional[str] = None,
    product_id: Optional[str] = None,
    salesperson_id: Optional[str] = None,
    payment_status: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    location_id: Optional[str] = None,
    vertical_id: Optional[str] = None,
    deal_id: Optional[str] = None,
    search: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = SalesEntryRepository(db)
    filters = []

    if partner_id:
        filters.append(SalesEntry.partner_id == partner_id)
    if deal_id:
        filters.append(SalesEntry.deal_id == deal_id)
    if product_id:
        filters.append(SalesEntry.product_id == product_id)
    if salesperson_id:
        filters.append(SalesEntry.salesperson_id == salesperson_id)
    if payment_status:
        filters.append(SalesEntry.payment_status == payment_status)
    if from_date:
        filters.append(SalesEntry.sale_date >= from_date)
    if to_date:
        filters.append(SalesEntry.sale_date <= to_date)
    if location_id:
        filters.append(SalesEntry.location_id == location_id)
    if vertical_id:
        filters.append(SalesEntry.vertical_id == vertical_id)
    if search:
        filters.append(SalesEntry.customer_name.ilike(f"%{search}%"))

    # Scope: non-admin users only see their own / team sales
    scoped_ids = await get_scoped_user_ids(user, db)
    if scoped_ids is not None:
        filters.append(SalesEntry.salesperson_id.in_(scoped_ids))

    result = await repo.get_with_names(page=page, limit=limit, filters=filters or None)

    data = []
    for item in result["data"]:
        entry = item["entry"]
        out = SalesEntryOut.model_validate(entry).model_dump(by_alias=True)
        out["partnerName"] = item["partner_name"]
        out["productName"] = item["product_name"]
        out["salespersonName"] = item["salesperson_name"]
        data.append(out)

    return {"data": data, "pagination": result["pagination"]}


@router.get("/summary")
async def sales_summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = SalesEntryRepository(db)
    filters = []
    scoped_ids = await get_scoped_user_ids(user, db)
    if scoped_ids is not None:
        filters.append(SalesEntry.salesperson_id.in_(scoped_ids))

    summary = await repo.get_summary(filters=filters or None)
    return SalesSummary(**summary).model_dump(by_alias=True)


@router.get("/breakdown")
async def sales_breakdown(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = SalesEntryRepository(db)
    filters = []
    scoped_ids = await get_scoped_user_ids(user, db)
    if scoped_ids is not None:
        filters.append(SalesEntry.salesperson_id.in_(scoped_ids))
    return await repo.get_breakdown(filters=filters or None)


@router.get("/collections")
async def sales_collections(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    scoped_ids = await get_scoped_user_ids(user, db)
    stmt = (
        select(
            SalesEntry.customer_name,
            SalesEntry.payment_status,
            func.sum(SalesEntry.amount).label("total_amount"),
            func.count().label("entry_count"),
        )
        .group_by(SalesEntry.customer_name, SalesEntry.payment_status)
        .order_by(SalesEntry.customer_name)
    )
    if scoped_ids is not None:
        stmt = stmt.where(SalesEntry.salesperson_id.in_(scoped_ids))
    result = await db.execute(stmt)
    rows = result.all()
    pending, partial, paid = [], [], []
    for row in rows:
        item = {
            "customerName": row.customer_name or "Unknown",
            "totalAmount": float(row.total_amount),
            "entryCount": row.entry_count,
        }
        if row.payment_status in ("pending", "overdue"):
            pending.append(item)
        elif row.payment_status == "partial":
            partial.append(item)
        elif row.payment_status == "paid":
            paid.append(item)
    return {"pending": pending, "partialPending": partial, "paid": paid}


@router.post("/")
async def create_sales_entry(
    body: SalesEntryCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = SalesEntryRepository(db)
    data = body.model_dump(exclude_unset=True)
    if "salesperson_id" not in data or data["salesperson_id"] is None:
        data["salesperson_id"] = user.id
    # Convert UUID objects to strings for JSONB column
    if "product_ids" in data and data["product_ids"]:
        data["product_ids"] = [str(pid) for pid in data["product_ids"]]
    entry = await repo.create(data)
    await log_activity(db, user, "create", "sales_entry", str(entry.id), entry.customer_name)
    return SalesEntryOut.model_validate(entry).model_dump(by_alias=True)


@router.put("/{entry_id}")
async def update_sales_entry(
    entry_id: str,
    body: SalesEntryUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = SalesEntryRepository(db)
    old = await repo.get_by_id(entry_id)
    if not old:
        raise NotFoundException("Sales entry not found")
    await enforce_scope(old, "salesperson_id", user, db, resource_name="sales entry")
    old_data = model_to_dict(old)
    update_data = body.model_dump(exclude_unset=True)
    # Convert UUID objects to strings for JSONB column
    if "product_ids" in update_data and update_data["product_ids"]:
        update_data["product_ids"] = [str(pid) for pid in update_data["product_ids"]]
    entry = await repo.update(entry_id, update_data)
    changes = compute_changes(old_data, model_to_dict(entry))
    await log_activity(db, user, "update", "sales_entry", str(entry.id), entry.customer_name, changes)
    return SalesEntryOut.model_validate(entry).model_dump(by_alias=True)


@router.delete("/{entry_id}")
async def delete_sales_entry(
    entry_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = SalesEntryRepository(db)
    entry = await repo.get_by_id(entry_id)
    if not entry:
        raise NotFoundException("Sales entry not found")
    await enforce_scope(entry, "salesperson_id", user, db, resource_name="sales entry")
    entry_name = entry.customer_name
    await repo.delete(entry_id)
    await log_activity(db, user, "delete", "sales_entry", entry_id, entry_name)
    return {"success": True}
