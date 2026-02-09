from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import ForbiddenException, NotFoundException
from app.middleware.security import get_current_user
from app.models.Partner import Partner
from app.models.User import User
from app.repositories.PartnerRepository import PartnerRepository
from app.schemas.PartnerSchema import (
    PartnerApproveRequest,
    PartnerCreate,
    PartnerOut,
    PartnerUpdate,
)

router = APIRouter()


@router.get("/")
async def list_partners(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    tier: Optional[str] = None,
    city: Optional[str] = None,
    assigned_to: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = PartnerRepository(db)
    filters = []
    if status:
        filters.append(Partner.status == status)
    if tier:
        filters.append(Partner.tier == tier)
    if city:
        filters.append(Partner.city == city)
    if assigned_to:
        filters.append(Partner.assigned_to == assigned_to)

    result = await repo.get_with_assigned(page=page, limit=limit, filters=filters or None)

    data = []
    for item in result["data"]:
        out = PartnerOut.model_validate(item["partner"]).model_dump(by_alias=True)
        out["assignedToName"] = item["assigned_to_name"]
        data.append(out)

    return {"data": data, "pagination": result["pagination"]}


@router.get("/my")
async def my_partners(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = PartnerRepository(db)
    partners = await repo.get_by_assigned(user.id)
    return [PartnerOut.model_validate(p).model_dump(by_alias=True) for p in partners]


@router.get("/pending")
async def pending_partners(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = PartnerRepository(db)
    partners = await repo.get_pending()
    return [PartnerOut.model_validate(p).model_dump(by_alias=True) for p in partners]


@router.get("/{partner_id}")
async def get_partner(
    partner_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = PartnerRepository(db)
    partner = await repo.get_by_id(partner_id)
    if not partner:
        raise NotFoundException("Partner not found")
    return PartnerOut.model_validate(partner).model_dump(by_alias=True)


@router.post("/")
async def create_partner(
    body: PartnerCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = PartnerRepository(db)
    data = body.model_dump(exclude_unset=True)
    data["assigned_to"] = user.id
    data["status"] = "pending"
    partner = await repo.create(data)
    return PartnerOut.model_validate(partner).model_dump(by_alias=True)


@router.put("/{partner_id}")
async def update_partner(
    partner_id: str,
    body: PartnerUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = PartnerRepository(db)
    partner = await repo.update(partner_id, body.model_dump(exclude_unset=True))
    if not partner:
        raise NotFoundException("Partner not found")
    return PartnerOut.model_validate(partner).model_dump(by_alias=True)


@router.delete("/{partner_id}")
async def delete_partner(
    partner_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = PartnerRepository(db)
    deleted = await repo.delete(partner_id)
    if not deleted:
        raise NotFoundException("Partner not found")
    return {"success": True}


@router.post("/{partner_id}/approve")
async def approve_partner(
    partner_id: str,
    body: PartnerApproveRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    allowed_roles = ["admin", "superadmin", "businesshead"]
    if user.role not in allowed_roles:
        raise ForbiddenException("Only admin/businesshead can approve partners")

    repo = PartnerRepository(db)
    partner = await repo.get_by_id(partner_id)
    if not partner:
        raise NotFoundException("Partner not found")

    if body.approved:
        update_data = {
            "status": "approved",
            "approved_by": user.id,
            "approved_at": datetime.utcnow(),
        }
    else:
        update_data = {
            "status": "rejected",
            "rejection_reason": body.rejection_reason or "Rejected",
        }

    updated = await repo.update(partner_id, update_data)
    return PartnerOut.model_validate(updated).model_dump(by_alias=True)
