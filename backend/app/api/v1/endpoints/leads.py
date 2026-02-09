from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import BadRequestException, NotFoundException
from app.middleware.security import get_current_user
from app.models.Lead import Lead
from app.models.SalesEntry import SalesEntry
from app.models.User import User
from app.repositories.LeadRepository import LeadRepository
from app.repositories.SalesEntryRepository import SalesEntryRepository
from app.schemas.LeadSchema import (
    LeadActivityCreate,
    LeadActivityOut,
    LeadConvertRequest,
    LeadCreate,
    LeadOut,
    LeadUpdate,
)

router = APIRouter()


@router.get("/")
async def list_leads(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    stage: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[str] = None,
    source: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = LeadRepository(db)
    filters = []
    if stage:
        filters.append(Lead.stage == stage)
    if priority:
        filters.append(Lead.priority == priority)
    if assigned_to:
        filters.append(Lead.assigned_to == assigned_to)
    if source:
        filters.append(Lead.source == source)

    if user.role == "salesperson":
        filters.append(Lead.assigned_to == user.id)

    result = await repo.get_with_assigned(page=page, limit=limit, filters=filters or None)

    data = []
    for item in result["data"]:
        out = LeadOut.model_validate(item["lead"]).model_dump(by_alias=True)
        out["assignedToName"] = item["assigned_to_name"]
        data.append(out)

    return {"data": data, "pagination": result["pagination"]}


@router.get("/stats")
async def lead_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = LeadRepository(db)
    filters = []
    if user.role == "salesperson":
        filters.append(Lead.assigned_to == user.id)
    return await repo.get_stats(filters=filters or None)


@router.get("/{lead_id}")
async def get_lead(
    lead_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = LeadRepository(db)
    lead = await repo.get_by_id(lead_id)
    if not lead:
        raise NotFoundException("Lead not found")
    return LeadOut.model_validate(lead).model_dump(by_alias=True)


@router.post("/")
async def create_lead(
    body: LeadCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = LeadRepository(db)
    data = body.model_dump(exclude_unset=True)
    if "assigned_to" not in data or data["assigned_to"] is None:
        data["assigned_to"] = user.id
    lead = await repo.create(data)
    return LeadOut.model_validate(lead).model_dump(by_alias=True)


@router.put("/{lead_id}")
async def update_lead(
    lead_id: str,
    body: LeadUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = LeadRepository(db)
    lead = await repo.update(lead_id, body.model_dump(exclude_unset=True))
    if not lead:
        raise NotFoundException("Lead not found")
    return LeadOut.model_validate(lead).model_dump(by_alias=True)


@router.delete("/{lead_id}")
async def delete_lead(
    lead_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = LeadRepository(db)
    deleted = await repo.delete(lead_id)
    if not deleted:
        raise NotFoundException("Lead not found")
    return {"success": True}


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
    if lead.stage == "Won":
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
    await lead_repo.update(lead_id, {
        "stage": "Won",
        "won_sale_id": sale.id,
    })

    # Add activity
    await lead_repo.create_activity({
        "lead_id": lead_id,
        "activity_type": "converted",
        "title": "Lead converted to sale",
        "description": f"Sale amount: {body.amount}",
        "created_by": user.id,
    })

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

    activity = await repo.create_activity({
        "lead_id": lead_id,
        "activity_type": body.activity_type,
        "title": body.title,
        "description": body.description,
        "created_by": user.id,
    })
    return LeadActivityOut.model_validate(activity).model_dump(by_alias=True)
