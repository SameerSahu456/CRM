from __future__ import annotations

from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import NotFoundException
from app.middleware.security import get_current_user
from app.models.Carepack import Carepack
from app.models.Partner import Partner
from app.models.User import User
from app.repositories.base import BaseRepository
from app.schemas.CarepackSchema import CarepackCreate, CarepackOut, CarepackUpdate

router = APIRouter()


@router.get("/")
async def list_carepacks(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    partner_id: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Carepack, Partner.company_name.label("partner_name"))
        .outerjoin(Partner, Carepack.partner_id == Partner.id)
    )
    count_stmt = select(func.count()).select_from(Carepack)

    filters = []
    if status:
        filters.append(Carepack.status == status)
    if partner_id:
        filters.append(Carepack.partner_id == partner_id)

    for f in filters:
        stmt = stmt.where(f)
        count_stmt = count_stmt.where(f)

    stmt = stmt.order_by(Carepack.created_at.desc())
    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit)

    result = await db.execute(stmt)
    rows = result.all()

    data = []
    for row in rows:
        out = CarepackOut.model_validate(row[0]).model_dump(by_alias=True)
        out["partnerName"] = row[1]
        data.append(out)

    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()
    total_pages = (total + limit - 1) // limit

    return {
        "data": data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": total_pages,
        },
    }


@router.get("/expiring")
async def expiring_carepacks(
    days: int = Query(30, ge=1, le=365),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get carepacks expiring within the next N days."""
    cutoff = date.today() + timedelta(days=days)

    stmt = (
        select(Carepack, Partner.company_name.label("partner_name"))
        .outerjoin(Partner, Carepack.partner_id == Partner.id)
        .where(Carepack.status == "active")
        .where(Carepack.end_date <= cutoff)
        .where(Carepack.end_date >= date.today())
        .order_by(Carepack.end_date)
    )

    result = await db.execute(stmt)
    rows = result.all()

    data = []
    for row in rows:
        out = CarepackOut.model_validate(row[0]).model_dump(by_alias=True)
        out["partnerName"] = row[1]
        data.append(out)

    return data


@router.get("/{carepack_id}")
async def get_carepack(
    carepack_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = BaseRepository(db, Carepack)
    carepack = await repo.get_by_id(carepack_id)
    if not carepack:
        raise NotFoundException("Carepack not found")
    return CarepackOut.model_validate(carepack).model_dump(by_alias=True)


@router.post("/")
async def create_carepack(
    body: CarepackCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = BaseRepository(db, Carepack)
    data = body.model_dump(exclude_unset=True)
    data["created_by"] = user.id
    carepack = await repo.create(data)
    return CarepackOut.model_validate(carepack).model_dump(by_alias=True)


@router.put("/{carepack_id}")
async def update_carepack(
    carepack_id: str,
    body: CarepackUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = BaseRepository(db, Carepack)
    carepack = await repo.update(carepack_id, body.model_dump(exclude_unset=True))
    if not carepack:
        raise NotFoundException("Carepack not found")
    return CarepackOut.model_validate(carepack).model_dump(by_alias=True)


@router.delete("/{carepack_id}")
async def delete_carepack(
    carepack_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = BaseRepository(db, Carepack)
    deleted = await repo.delete(carepack_id)
    if not deleted:
        raise NotFoundException("Carepack not found")
    return {"success": True}
