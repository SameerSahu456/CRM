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
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.security import get_current_user
from app.models.user import User
from app.schemas.deal_schema import (
    DealActivityCreate,
    DealCreate,
    DealUpdate,
)
from app.services.deal_service import DealService
from app.utils.response_utils import (
    created_response,
    deleted_response,
    filter_fields,
    paginated_response,
    success_response,
)

router = APIRouter()


@router.get("/")
async def list_deals(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    stage: Optional[str] = Query(None, description="Filter by stage"),
    account_id: Optional[str] = Query(None, description="Filter by account"),
    owner: Optional[str] = Query(None, description="Filter by owner"),
    fields: Optional[str] = Query(None, description="Comma-separated camelCase field names to return"),
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

    data = filter_fields(result["data"], fields) if fields else result["data"]
    return paginated_response(
        data=data,
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
    fields: Optional[str] = Query(None, description="Comma-separated camelCase field names to return"),
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

    data = filter_fields(result["data"], fields) if fields else result["data"]
    return paginated_response(
        data=data,
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
    service = DealService(db)
    deal = await service.get_deal_with_line_items(deal_id=deal_id, user=user)

    return success_response(data=deal, message="Deal retrieved successfully")


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
    service = DealService(db)
    deal = await service.create_deal_with_line_items(deal_data=body, user=user)

    return created_response(data=deal, message="Deal created successfully")


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
    service = DealService(db)
    deal = await service.update_deal_with_line_items(deal_id=deal_id, deal_data=body, user=user)

    return success_response(data=deal, message="Deal updated successfully")


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
    """
    Get activities for a deal.

    Returns list of activity dictionaries.
    """
    service = DealService(db)
    return await service.get_activities(deal_id=deal_id)


@router.post("/{deal_id}/activities")
async def add_deal_activity(
    deal_id: str,
    body: DealActivityCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Add an activity to a deal.

    Returns created activity data.
    """
    service = DealService(db)
    return await service.add_activity(deal_id=deal_id, activity_data=body, user=user)


@router.get("/{deal_id}/audit-log")
async def get_deal_audit_log(
    deal_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get audit log for a deal.

    Returns list of audit log entries.
    """
    service = DealService(db)
    return await service.get_audit_log(deal_id=deal_id)
