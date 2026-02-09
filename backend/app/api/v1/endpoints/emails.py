from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import NotFoundException
from app.middleware.security import get_current_user
from app.models.Email import Email
from app.models.User import User
from app.repositories.EmailRepository import EmailRepository
from app.schemas.EmailSchema import EmailOut, EmailCreate, EmailUpdate

router = APIRouter()


@router.get("/")
async def list_emails(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = EmailRepository(db)
    filters = []
    if status:
        filters.append(Email.status == status)

    if user.role == "salesperson":
        filters.append(Email.owner_id == user.id)

    result = await repo.get_with_names(page=page, limit=limit, filters=filters or None)

    data = []
    for item in result["data"]:
        out = EmailOut.model_validate(item["email"]).model_dump(by_alias=True)
        out["ownerName"] = item["owner_name"]
        out["templateName"] = item["template_name"]
        data.append(out)

    return {"data": data, "pagination": result["pagination"]}


@router.get("/{email_id}")
async def get_email(
    email_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = EmailRepository(db)
    email = await repo.get_by_id(email_id)
    if not email:
        raise NotFoundException("Email not found")
    return EmailOut.model_validate(email).model_dump(by_alias=True)


@router.post("/")
async def create_email(
    body: EmailCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = EmailRepository(db)
    data = body.model_dump(exclude_unset=True)
    if "owner_id" not in data or data["owner_id"] is None:
        data["owner_id"] = user.id
    email = await repo.create(data)
    return EmailOut.model_validate(email).model_dump(by_alias=True)


@router.put("/{email_id}")
async def update_email(
    email_id: str,
    body: EmailUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = EmailRepository(db)
    email = await repo.update(email_id, body.model_dump(exclude_unset=True))
    if not email:
        raise NotFoundException("Email not found")
    return EmailOut.model_validate(email).model_dump(by_alias=True)


@router.post("/{email_id}/send")
async def send_email(
    email_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = EmailRepository(db)
    email = await repo.update(email_id, {
        "status": "sent",
        "sent_at": datetime.now(timezone.utc),
    })
    if not email:
        raise NotFoundException("Email not found")
    return EmailOut.model_validate(email).model_dump(by_alias=True)


@router.delete("/{email_id}")
async def delete_email(
    email_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = EmailRepository(db)
    deleted = await repo.delete(email_id)
    if not deleted:
        raise NotFoundException("Email not found")
    return {"success": True}
