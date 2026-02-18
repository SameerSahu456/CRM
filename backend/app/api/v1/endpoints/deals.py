"""
Deal API Endpoints

This module contains all HTTP endpoints for deal management.
Controllers are thin and delegate business logic to the DealService.

Following SOLID principles:
- Single Responsibility: Controllers only handle HTTP request/response
- Dependency Inversion: Depends on service abstraction
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import delete, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import NotFoundException
from app.middleware.security import get_current_user
from app.models.deal import Deal
from app.models.deal_line_item import DealLineItem
from app.models.notification import Notification
from app.models.user import User
from app.repositories.deal_repository import DealRepository
from app.schemas.activity_log_schema import ActivityLogOut
from app.schemas.deal_line_item_schema import DealLineItemOut
from app.schemas.deal_schema import (
    DealActivityCreate,
    DealActivityOut,
    DealCreate,
    DealOut,
    DealUpdate,
)
from app.services.deal_service import DealService
from app.utils.activity_logger import compute_changes, log_activity, model_to_dict
from app.utils.response_utils import (
    created_response,
    deleted_response,
    paginated_response,
    success_response,
)
from app.utils.scoping import enforce_scope, get_scoped_user_ids

router = APIRouter()


@router.get("/")
async def list_deals(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    stage: Optional[str] = Query(None, description="Filter by stage"),
    account_id: Optional[str] = Query(None, description="Filter by account"),
    owner: Optional[str] = Query(None, description="Filter by owner"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    List deals with filtering and pagination.

    Returns standardized response:
    {
        "code": 200,
        "data": [...],
        "message": "Success",
        "pagination": {...}
    }
    """
    service = DealService(db)
    result = await service.list_deals(
        page=page,
        limit=limit,
        user=user,
        stage=stage,
        account_id=account_id,
        owner=owner,
    )

    return paginated_response(
        data=result["data"],
        page=page,
        limit=limit,
        total=result["pagination"]["total"],
        message="Deals retrieved successfully",
    )


@router.get("/stats")
async def deal_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get pipeline statistics.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = DealService(db)
    stats = await service.get_pipeline_stats(user=user)

    return success_response(data=stats, message="Pipeline stats retrieved successfully")


@router.get("/pipeline")
async def deal_pipeline(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get pipeline data.

    Returns standardized response:
    {
        "code": 200,
        "data": [...],
        "message": "Success",
        "pagination": {...}
    }
    """
    service = DealService(db)
    result = await service.get_pipeline_data(user=user)

    return paginated_response(
        data=result["data"],
        page=1,
        limit=1000,
        total=result["pagination"]["total"],
        message="Pipeline data retrieved successfully",
    )


@router.get("/{deal_id}")
async def get_deal(
    deal_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get a single deal by ID with line items.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    # Note: This endpoint has special logic for line items
    # Using repository directly for now
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

    return success_response(data=out, message="Deal retrieved successfully")


@router.post("/")
async def create_deal(
    body: DealCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Create a new deal with line items.

    Returns standardized response:
    {
        "code": 201,
        "data": {...},
        "message": "Created successfully"
    }
    """
    # Note: This endpoint has special logic for line items
    # Using repository directly for now
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

    await log_activity(db, user, "create", "deal", str(deal.id), deal.name)

    # Return with line items
    result = await repo.get_with_line_items(deal.id)
    out = DealOut.model_validate(result["deal"]).model_dump(by_alias=True)
    out["lineItems"] = [
        DealLineItemOut.model_validate(item).model_dump(by_alias=True)
        for item in result["line_items"]
    ]

    return created_response(data=out, message="Deal created successfully")


@router.put("/{deal_id}")
async def update_deal(
    deal_id: str,
    body: DealUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Update an existing deal with line items.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    # Note: This endpoint has special logic for line items and notifications
    # Using repository directly for now
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
        await db.execute(delete(DealLineItem).where(DealLineItem.deal_id == deal_id))
        for item in body.line_items:
            li = DealLineItem(**item.model_dump(), deal_id=deal.id)
            db.add(li)
        await db.flush()

    changes = compute_changes(old_data, model_to_dict(deal))
    await log_activity(db, user, "update", "deal", str(deal.id), deal.name, changes)

    # Notify Product Managers when deal moves to Negotiation stage
    if update_data.get("stage") == "Negotiation":
        result = await db.execute(
            text("SELECT id FROM users WHERE role = 'productmanager'")
        )
        pm_users = result.fetchall()
        entity_name = deal.name
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

    return success_response(data=out, message="Deal updated successfully")


@router.delete("/{deal_id}")
async def delete_deal(
    deal_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Delete a deal.

    Returns standardized response:
    {
        "code": 200,
        "data": null,
        "message": "Deleted successfully"
    }
    """
    service = DealService(db)
    await service.delete_deal(deal_id=deal_id, user=user)

    return deleted_response(message="Deal deleted successfully")


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

    activity = await repo.create_activity(
        {
            "deal_id": deal_id,
            "activity_type": body.activity_type,
            "title": body.title,
            "description": body.description,
            "created_by": user.id,
        }
    )
    return DealActivityOut.model_validate(activity).model_dump(by_alias=True)


@router.get("/{deal_id}/audit-log")
async def get_deal_audit_log(
    deal_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = DealRepository(db)
    logs = await repo.get_audit_logs(deal_id)
    return [
        ActivityLogOut.model_validate(log).model_dump(by_alias=True) for log in logs
    ]
