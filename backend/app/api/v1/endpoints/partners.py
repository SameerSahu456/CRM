from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
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
from app.utils.activity_logger import compute_changes, log_activity, model_to_dict
from app.utils.scoping import get_scoped_user_ids, enforce_scope

router = APIRouter()


# ---------------------------------------------------------------------------
# Partner Tier Targets
# ---------------------------------------------------------------------------

TARGET_KEYS = ["partner_target_elite", "partner_target_growth", "partner_target_new"]


async def _ensure_settings_table(db: AsyncSession) -> None:
    """Create the settings table if it doesn't exist."""
    await db.execute(text(
        "CREATE TABLE IF NOT EXISTS settings ("
        "  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
        "  key VARCHAR(100) UNIQUE NOT NULL,"
        "  value TEXT,"
        "  category VARCHAR(50),"
        "  updated_by UUID,"
        "  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"
        ")"
    ))


@router.get("/targets")
async def get_targets(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return partner tier targets."""
    try:
        await _ensure_settings_table(db)
        result = await db.execute(
            text("SELECT key, value FROM settings WHERE key = ANY(:keys)"),
            {"keys": TARGET_KEYS},
        )
        rows = result.mappings().all()
        targets = {r["key"].replace("partner_target_", ""): (r["value"] or "") for r in rows}
        return {"elite": targets.get("elite", ""), "growth": targets.get("growth", ""), "new": targets.get("new", "")}
    except Exception:
        return {"elite": "", "growth": "", "new": ""}


@router.put("/targets")
async def save_targets(
    body: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save partner tier targets. Admin/superadmin only."""
    if user.role not in ("admin", "superadmin"):
        raise ForbiddenException("Only admin/superadmin can set targets")

    await _ensure_settings_table(db)

    for tier in ("elite", "growth", "new"):
        key = f"partner_target_{tier}"
        value = str(body.get(tier, ""))
        existing = await db.execute(
            text("SELECT id FROM settings WHERE key = :key"), {"key": key}
        )
        if existing.first():
            await db.execute(
                text("UPDATE settings SET value = :value, updated_by = :uid, updated_at = NOW() WHERE key = :key"),
                {"value": value, "uid": str(user.id), "key": key},
            )
        else:
            await db.execute(
                text(
                    "INSERT INTO settings (key, value, category, updated_by) "
                    "VALUES (:key, :value, 'partner_targets', :uid)"
                ),
                {"key": key, "value": value, "uid": str(user.id)},
            )

    return {"success": True}


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

    # Scope: non-admin users only see partners assigned to them/their team
    scoped_ids = await get_scoped_user_ids(user, db)
    if scoped_ids is not None:
        filters.append(Partner.assigned_to.in_(scoped_ids))

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
    # Scope: non-admin users only see pending partners assigned to them/their team
    scoped_ids = await get_scoped_user_ids(user, db)
    if scoped_ids is not None:
        partners = [p for p in partners if str(p.assigned_to) in scoped_ids]
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
    await enforce_scope(partner, "assigned_to", user, db, resource_name="partner")
    return PartnerOut.model_validate(partner).model_dump(by_alias=True)


@router.post("/")
async def create_partner(
    body: PartnerCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = PartnerRepository(db)
    data = body.model_dump(exclude_unset=True)
    # Admin/superadmin can assign to any user; others default to self
    if "assigned_to" not in data or not data["assigned_to"]:
        data["assigned_to"] = user.id
    elif user.role not in ("admin", "superadmin"):
        data["assigned_to"] = user.id
    data["status"] = "pending"
    partner = await repo.create(data)
    await log_activity(db, user, "create", "partner", str(partner.id), partner.company_name)
    return PartnerOut.model_validate(partner).model_dump(by_alias=True)


@router.put("/{partner_id}")
async def update_partner(
    partner_id: str,
    body: PartnerUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = PartnerRepository(db)
    old = await repo.get_by_id(partner_id)
    if not old:
        raise NotFoundException("Partner not found")
    await enforce_scope(old, "assigned_to", user, db, resource_name="partner")
    old_data = model_to_dict(old)
    partner = await repo.update(partner_id, body.model_dump(exclude_unset=True))
    changes = compute_changes(old_data, model_to_dict(partner))
    await log_activity(db, user, "update", "partner", str(partner.id), partner.company_name, changes)
    return PartnerOut.model_validate(partner).model_dump(by_alias=True)


@router.delete("/{partner_id}")
async def delete_partner(
    partner_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = PartnerRepository(db)
    partner = await repo.get_by_id(partner_id)
    if not partner:
        raise NotFoundException("Partner not found")
    await enforce_scope(partner, "assigned_to", user, db, resource_name="partner")
    partner_name = partner.company_name
    await repo.delete(partner_id)
    await log_activity(db, user, "delete", "partner", partner_id, partner_name)
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

    old_data = model_to_dict(partner)

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
    changes = compute_changes(old_data, model_to_dict(updated))
    action = "approve" if body.approved else "reject"
    await log_activity(db, user, action, "partner", partner_id, partner.company_name, changes)
    return PartnerOut.model_validate(updated).model_dump(by_alias=True)
