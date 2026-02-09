from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import NotFoundException
from app.middleware.security import get_current_user
from app.models.Deal import Deal
from app.models.User import User
from app.repositories.DealRepository import DealRepository
from app.schemas.DealSchema import DealOut, DealCreate, DealUpdate

router = APIRouter()


@router.get("/")
async def list_deals(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    stage: Optional[str] = None,
    account_id: Optional[str] = None,
    owner: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = DealRepository(db)
    filters = []
    if stage:
        filters.append(Deal.stage == stage)
    if account_id:
        filters.append(Deal.account_id == account_id)
    if owner:
        filters.append(Deal.owner_id == owner)

    if user.role == "salesperson":
        filters.append(Deal.owner_id == user.id)

    result = await repo.get_with_names(page=page, limit=limit, filters=filters or None)

    data = []
    for item in result["data"]:
        out = DealOut.model_validate(item["deal"]).model_dump(by_alias=True)
        out["accountName"] = item["account_name"]
        out["contactName"] = item["contact_name"]
        out["ownerName"] = item["owner_name"]
        data.append(out)

    return {"data": data, "pagination": result["pagination"]}


@router.get("/stats")
async def deal_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = DealRepository(db)
    filters = []
    if user.role == "salesperson":
        filters.append(Deal.owner_id == user.id)
    return await repo.get_pipeline_stats(filters=filters or None)


@router.get("/pipeline")
async def deal_pipeline(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = DealRepository(db)
    filters = []
    if user.role == "salesperson":
        filters.append(Deal.owner_id == user.id)

    result = await repo.get_with_names(page=1, limit=1000, filters=filters or None)

    data = []
    for item in result["data"]:
        out = DealOut.model_validate(item["deal"]).model_dump(by_alias=True)
        out["accountName"] = item["account_name"]
        out["contactName"] = item["contact_name"]
        out["ownerName"] = item["owner_name"]
        data.append(out)

    return {"data": data, "pagination": result["pagination"]}


@router.get("/{deal_id}")
async def get_deal(
    deal_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = DealRepository(db)
    deal = await repo.get_by_id(deal_id)
    if not deal:
        raise NotFoundException("Deal not found")
    return DealOut.model_validate(deal).model_dump(by_alias=True)


@router.post("/")
async def create_deal(
    body: DealCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = DealRepository(db)
    data = body.model_dump(exclude_unset=True)
    if "owner_id" not in data or data["owner_id"] is None:
        data["owner_id"] = user.id
    deal = await repo.create(data)
    return DealOut.model_validate(deal).model_dump(by_alias=True)


@router.put("/{deal_id}")
async def update_deal(
    deal_id: str,
    body: DealUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = DealRepository(db)
    deal = await repo.update(deal_id, body.model_dump(exclude_unset=True))
    if not deal:
        raise NotFoundException("Deal not found")
    return DealOut.model_validate(deal).model_dump(by_alias=True)


@router.delete("/{deal_id}")
async def delete_deal(
    deal_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = DealRepository(db)
    deleted = await repo.delete(deal_id)
    if not deleted:
        raise NotFoundException("Deal not found")
    return {"success": True}
