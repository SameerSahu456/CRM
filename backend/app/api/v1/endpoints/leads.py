"""
Lead API Endpoints

This module contains all HTTP endpoints for lead management.
Controllers are thin and delegate business logic to the LeadService.

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
from app.schemas.lead_schema import (
    LeadActivityCreate,
    LeadConvertRequest,
    LeadCreate,
    LeadUpdate,
)
from app.services.lead_service import LeadService
from app.utils.response_utils import (
    created_response,
    deleted_response,
    filter_fields,
    paginated_response,
    success_response,
)

router = APIRouter()


@router.get("/")
async def list_leads(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    stage: Optional[str] = Query(None, description="Filter by stage"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    assigned_to: Optional[str] = Query(None, description="Filter by assigned user"),
    source: Optional[str] = Query(None, description="Filter by source"),
    fields: Optional[str] = Query(None, description="Comma-separated camelCase field names to return"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    List leads with filtering and pagination.

    Returns standardized response:
    {
        "code": 200,
        "data": [...],
        "message": "Success",
        "pagination": {...}
    }
    """
    service = LeadService(db)
    result = await service.list_leads(
        page=page,
        limit=limit,
        user=user,
        stage=stage,
        priority=priority,
        assigned_to=assigned_to,
        source=source,
    )

    data = filter_fields(result["data"], fields) if fields else result["data"]
    return paginated_response(
        data=data,
        page=page,
        limit=limit,
        total=result["pagination"]["total"],
        message="Leads retrieved successfully",
    )


@router.get("/stats")
async def lead_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get lead statistics.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = LeadService(db)
    stats = await service.get_lead_stats(user=user)

    return success_response(data=stats, message="Lead stats retrieved successfully")


@router.get("/{lead_id}")
async def get_lead(
    lead_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get a single lead by ID.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = LeadService(db)
    lead = await service.get_lead_by_id(lead_id=lead_id, user=user)

    return success_response(data=lead, message="Lead retrieved successfully")


@router.post("/")
async def create_lead(
    body: LeadCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Create a new lead.

    Returns standardized response:
    {
        "code": 201,
        "data": {...},
        "message": "Created successfully"
    }
    """
    service = LeadService(db)
    lead = await service.create_lead(lead_data=body, user=user)

    return created_response(data=lead, message="Lead created successfully")


@router.put("/{lead_id}")
async def update_lead(
    lead_id: str,
    body: LeadUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Update an existing lead.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = LeadService(db)
    lead = await service.update_lead_with_notifications(lead_id=lead_id, lead_data=body, user=user)

    return success_response(data=lead, message="Lead updated successfully")


@router.delete("/{lead_id}")
async def delete_lead(
    lead_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Delete a lead.

    Returns standardized response:
    {
        "code": 200,
        "data": null,
        "message": "Deleted successfully"
    }
    """
    service = LeadService(db)
    await service.delete_lead(lead_id=lead_id, user=user)

    return deleted_response(message="Lead deleted successfully")


@router.post("/{lead_id}/convert")
async def convert_lead(
    lead_id: str,
    body: LeadConvertRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Convert a lead to a sale.

    Returns dictionary with success status and sale_id.
    """
    service = LeadService(db)
    result = await service.convert_lead(lead_id=lead_id, convert_data=body, user=user)
    return result


@router.get("/{lead_id}/activities")
async def get_lead_activities(
    lead_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get activities for a lead.

    Returns list of activity dictionaries.
    """
    service = LeadService(db)
    return await service.get_activities(lead_id=lead_id)


@router.post("/{lead_id}/activities")
async def add_lead_activity(
    lead_id: str,
    body: LeadActivityCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Add an activity to a lead.

    Returns created activity data.
    """
    service = LeadService(db)
    return await service.add_activity(lead_id=lead_id, activity_data=body, user=user)


@router.get("/{lead_id}/audit-log")
async def get_lead_audit_log(
    lead_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get audit log for a lead.

    Returns list of audit log entries.
    """
    service = LeadService(db)
    return await service.get_audit_log(lead_id=lead_id)
