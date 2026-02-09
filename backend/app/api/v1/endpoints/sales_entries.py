from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
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

router = APIRouter()


@router.get("/")
async def list_sales_entries(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    partner_id: Optional[str] = None,
    product_id: Optional[str] = None,
    salesperson_id: Optional[str] = None,
    payment_status: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = SalesEntryRepository(db)
    filters = []

    if partner_id:
        filters.append(SalesEntry.partner_id == partner_id)
    if product_id:
        filters.append(SalesEntry.product_id == product_id)
    if salesperson_id:
        filters.append(SalesEntry.salesperson_id == salesperson_id)
    if payment_status:
        filters.append(SalesEntry.payment_status == payment_status)

    # Non-admin users only see their own sales
    if user.role == "salesperson":
        filters.append(SalesEntry.salesperson_id == user.id)

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
    if user.role == "salesperson":
        filters.append(SalesEntry.salesperson_id == user.id)

    summary = await repo.get_summary(filters=filters or None)
    return SalesSummary(**summary).model_dump(by_alias=True)


@router.get("/breakdown")
async def sales_breakdown(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = SalesEntryRepository(db)
    filters = []
    if user.role == "salesperson":
        filters.append(SalesEntry.salesperson_id == user.id)
    return await repo.get_breakdown(filters=filters or None)


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
    entry = await repo.create(data)
    return SalesEntryOut.model_validate(entry).model_dump(by_alias=True)


@router.put("/{entry_id}")
async def update_sales_entry(
    entry_id: str,
    body: SalesEntryUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = SalesEntryRepository(db)
    entry = await repo.update(entry_id, body.model_dump(exclude_unset=True))
    if not entry:
        raise NotFoundException("Sales entry not found")
    return SalesEntryOut.model_validate(entry).model_dump(by_alias=True)


@router.delete("/{entry_id}")
async def delete_sales_entry(
    entry_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = SalesEntryRepository(db)
    deleted = await repo.delete(entry_id)
    if not deleted:
        raise NotFoundException("Sales entry not found")
    return {"success": True}
