from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import delete, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import NotFoundException
from app.middleware.security import get_current_user
from app.models.Deal import Deal
from app.models.DealLineItem import DealLineItem
from app.models.User import User
from app.repositories.DealRepository import DealRepository
from app.schemas.DealSchema import DealOut, DealCreate, DealUpdate, DealActivityOut, DealActivityCreate
from app.schemas.ActivityLogSchema import ActivityLogOut
from app.schemas.DealLineItemSchema import DealLineItemOut
from app.models.Notification import Notification
from app.utils.activity_logger import compute_changes, log_activity, model_to_dict
from app.utils.scoping import get_scoped_user_ids, enforce_scope

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

    # Scope: non-admin users only see deals owned by them/their team
    scoped_ids = await get_scoped_user_ids(user, db)
    if scoped_ids is not None:
        filters.append(Deal.owner_id.in_(scoped_ids))

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
    scoped_ids = await get_scoped_user_ids(user, db)
    if scoped_ids is not None:
        filters.append(Deal.owner_id.in_(scoped_ids))
    return await repo.get_pipeline_stats(filters=filters or None)


@router.get("/pipeline")
async def deal_pipeline(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = DealRepository(db)
    filters = []
    scoped_ids = await get_scoped_user_ids(user, db)
    if scoped_ids is not None:
        filters.append(Deal.owner_id.in_(scoped_ids))

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
    result = await repo.get_with_line_items(deal_id)
    if not result:
        raise NotFoundException("Deal not found")
    await enforce_scope(result["deal"], "owner_id", user, db, resource_name="deal")

    out = DealOut.model_validate(result["deal"]).model_dump(by_alias=True)
    out["accountName"] = result["account_name"]
    out["contactName"] = result["contact_name"]
    out["ownerName"] = result["owner_name"]
    out["lineItems"] = [
        DealLineItemOut.model_validate(item).model_dump(by_alias=True)
        for item in result["line_items"]
    ]
    return out


@router.post("/")
async def create_deal(
    body: DealCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = DealRepository(db)

    # Extract line items
    line_items = body.line_items
    data = body.model_dump(exclude_unset=True, exclude={"line_items"})

    if "owner_id" not in data or data["owner_id"] is None:
        data["owner_id"] = user.id

    # Create deal
    deal = await repo.create(data)

    # Create line items
    for item in line_items:
        li = DealLineItem(**item.model_dump(), deal_id=deal.id)
        db.add(li)
    await db.flush()

    await log_activity(db, user, "create", "deal", str(deal.id), deal.title)

    # Return with line items
    result = await repo.get_with_line_items(deal.id)
    out = DealOut.model_validate(result["deal"]).model_dump(by_alias=True)
    out["lineItems"] = [
        DealLineItemOut.model_validate(item).model_dump(by_alias=True)
        for item in result["line_items"]
    ]
    return out


@router.put("/{deal_id}")
async def update_deal(
    deal_id: str,
    body: DealUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = DealRepository(db)

    old = await repo.get_by_id(deal_id)
    if not old:
        raise NotFoundException("Deal not found")
    await enforce_scope(old, "owner_id", user, db, resource_name="deal")
    old_data = model_to_dict(old)

    # Update deal (exclude line items)
    update_data = body.model_dump(exclude_unset=True, exclude={"line_items"})
    deal = await repo.update(deal_id, update_data)

    # Replace line items if provided
    if body.line_items is not None:
        await db.execute(
            delete(DealLineItem).where(DealLineItem.deal_id == deal_id)
        )
        for item in body.line_items:
            li = DealLineItem(**item.model_dump(), deal_id=deal.id)
            db.add(li)
        await db.flush()

    changes = compute_changes(old_data, model_to_dict(deal))
    await log_activity(db, user, "update", "deal", str(deal.id), deal.title, changes)

    # Notify Product Managers when deal moves to Negotiation stage
    if update_data.get("stage") == "Negotiation":
        result = await db.execute(text("SELECT id FROM users WHERE role = 'productmanager'"))
        pm_users = result.fetchall()
        entity_name = deal.title
        for pm in pm_users:
            notif = Notification(
                user_id=pm[0],
                type="stage_change",
                title="Deal moved to Negotiation",
                message=f"Deal '{entity_name}' has moved to Negotiation stage",
                is_read=False,
            )
            db.add(notif)
        await db.flush()

    # Return with line items
    result = await repo.get_with_line_items(deal.id)
    out = DealOut.model_validate(result["deal"]).model_dump(by_alias=True)
    out["lineItems"] = [
        DealLineItemOut.model_validate(item).model_dump(by_alias=True)
        for item in result["line_items"]
    ]
    return out


@router.delete("/{deal_id}")
async def delete_deal(
    deal_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = DealRepository(db)
    deal = await repo.get_by_id(deal_id)
    if not deal:
        raise NotFoundException("Deal not found")
    await enforce_scope(deal, "owner_id", user, db, resource_name="deal")
    deal_title = deal.title
    await repo.delete(deal_id)
    await log_activity(db, user, "delete", "deal", deal_id, deal_title)
    return {"success": True}


@router.get("/{deal_id}/activities")
async def get_deal_activities(
    deal_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = DealRepository(db)
    rows = await repo.get_activities(deal_id)
    activities = []
    for row in rows:
        out = DealActivityOut.model_validate(row[0]).model_dump(by_alias=True)
        out["createdByName"] = row[1]
        activities.append(out)
    return activities


@router.post("/{deal_id}/activities")
async def add_deal_activity(
    deal_id: str,
    body: DealActivityCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = DealRepository(db)
    deal = await repo.get_by_id(deal_id)
    if not deal:
        raise NotFoundException("Deal not found")

    activity = await repo.create_activity({
        "deal_id": deal_id,
        "activity_type": body.activity_type,
        "title": body.title,
        "description": body.description,
        "created_by": user.id,
    })
    return DealActivityOut.model_validate(activity).model_dump(by_alias=True)


@router.get("/{deal_id}/audit-log")
async def get_deal_audit_log(
    deal_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = DealRepository(db)
    logs = await repo.get_audit_logs(deal_id)
    return [ActivityLogOut.model_validate(log).model_dump(by_alias=True) for log in logs]
