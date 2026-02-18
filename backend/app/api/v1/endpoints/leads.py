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
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import BadRequestException, NotFoundException
from app.middleware.security import get_current_user
from app.models.lead import Lead
from app.models.notification import Notification
from app.models.sales_entry import SalesEntry
from app.models.user import User
from app.repositories.lead_repository import LeadRepository
from app.repositories.sales_entry_repository import SalesEntryRepository
from app.schemas.lead_schema import (
    LeadActivityCreate,
    LeadActivityOut,
    LeadConvertRequest,
    LeadCreate,
    LeadOut,
    LeadUpdate,
)
from app.services.lead_service import LeadService
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
async def list_leads(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    stage: Optional[str] = Query(None, description="Filter by stage"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    assigned_to: Optional[str] = Query(None, description="Filter by assigned user"),
    source: Optional[str] = Query(None, description="Filter by source"),
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

    return paginated_response(
        data=result["data"],
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
    # Note: This endpoint has special notification logic
    # Using repository directly for now
    repo = LeadRepository(db)
    old = await repo.get_by_id(lead_id)
    if not old:
        raise NotFoundException("Lead not found")
    await enforce_scope(old, "assigned_to", user, db, resource_name="lead")
    old_data = model_to_dict(old)
    update_data = body.model_dump(exclude_unset=True)
    lead = await repo.update(lead_id, update_data)
    changes = compute_changes(old_data, model_to_dict(lead))
    await log_activity(db, user, "update", "lead", str(lead.id), lead.company, changes)

    # Notify Product Managers when lead moves to Negotiation stage
    if update_data.get("stage") == "Negotiation":
        result = await db.execute(
            text("SELECT id FROM users WHERE role = 'productmanager'")
        )
        pm_users = result.fetchall()
        entity_name = lead.company
        for pm in pm_users:
            notif = Notification(
                user_id=pm[0],
                type="stage_change",
                title="Lead moved to Negotiation",
                message=f"Lead '{entity_name}' has moved to Negotiation stage",
                is_read=False,
            )
            db.add(notif)
        await db.flush()

    lead_out = LeadOut.model_validate(lead).model_dump(by_alias=True)
    return success_response(data=lead_out, message="Lead updated successfully")


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
    lead_repo = LeadRepository(db)
    lead = await lead_repo.get_by_id(lead_id)
    if not lead:
        raise NotFoundException("Lead not found")
    await enforce_scope(lead, "assigned_to", user, db, resource_name="lead")
    if lead.stage == "Closed Won":
        raise BadRequestException("Lead already converted")

    # Create sales entry
    sales_repo = SalesEntryRepository(db)
    sale_data = {
        "partner_id": body.partner_id,
        "product_id": body.product_id,
        "salesperson_id": user.id,
        "customer_name": body.customer_name or lead.company_name,
        "amount": body.amount,
        "sale_date": body.sale_date,
    }
    sale = await sales_repo.create(sale_data)

    # Update lead
    await lead_repo.update(
        lead_id,
        {
            "stage": "Closed Won",
            "won_sale_id": sale.id,
        },
    )

    # Add activity
    await lead_repo.create_activity(
        {
            "lead_id": lead_id,
            "activity_type": "converted",
            "title": "Lead converted to sale",
            "description": f"Sale amount: {body.amount}",
            "created_by": user.id,
        }
    )

    return {"success": True, "sale_id": str(sale.id)}


@router.get("/{lead_id}/activities")
async def get_lead_activities(
    lead_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = LeadRepository(db)
    rows = await repo.get_activities(lead_id)
    activities = []
    for row in rows:
        out = LeadActivityOut.model_validate(row[0]).model_dump(by_alias=True)
        out["createdByName"] = row[1]
        activities.append(out)
    return activities


@router.post("/{lead_id}/activities")
async def add_lead_activity(
    lead_id: str,
    body: LeadActivityCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = LeadRepository(db)
    lead = await repo.get_by_id(lead_id)
    if not lead:
        raise NotFoundException("Lead not found")

    activity = await repo.create_activity(
        {
            "lead_id": lead_id,
            "activity_type": body.activity_type,
            "title": body.title,
            "description": body.description,
            "created_by": user.id,
        }
    )
    return LeadActivityOut.model_validate(activity).model_dump(by_alias=True)


@router.get("/{lead_id}/audit-log")
async def get_lead_audit_log(
    lead_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select as sa_select
    from app.models.activity_log import ActivityLog
    from app.schemas.activity_log_schema import ActivityLogOut

    stmt = (
        sa_select(ActivityLog)
        .where(ActivityLog.entity_type == "lead")
        .where(ActivityLog.entity_id == str(lead_id))
        .order_by(ActivityLog.created_at.desc())
    )
    result = await db.execute(stmt)
    logs = list(result.scalars().all())
    return [
        ActivityLogOut.model_validate(log).model_dump(by_alias=True) for log in logs
    ]
