from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import NotFoundException
from app.middleware.security import get_current_user
from app.models.EmailTemplate import EmailTemplate
from app.models.User import User
from app.repositories.EmailTemplateRepository import EmailTemplateRepository
from app.schemas.EmailTemplateSchema import (
    EmailTemplateOut,
    EmailTemplateCreate,
    EmailTemplateUpdate,
)

router = APIRouter()


@router.get("/")
async def list_email_templates(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = EmailTemplateRepository(db)
    filters = []

    if user.role == "sales":
        filters.append(EmailTemplate.owner_id == user.id)

    result = await repo.get_with_owner(page=page, limit=limit, filters=filters or None)

    data = []
    for item in result["data"]:
        out = EmailTemplateOut.model_validate(item["template"]).model_dump(by_alias=True)
        out["ownerName"] = item["owner_name"]
        data.append(out)

    return {"data": data, "pagination": result["pagination"]}


@router.get("/{template_id}")
async def get_email_template(
    template_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = EmailTemplateRepository(db)
    template = await repo.get_by_id(template_id)
    if not template:
        raise NotFoundException("Email template not found")
    return EmailTemplateOut.model_validate(template).model_dump(by_alias=True)


@router.post("/")
async def create_email_template(
    body: EmailTemplateCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = EmailTemplateRepository(db)
    data = body.model_dump(exclude_unset=True)
    if "owner_id" not in data or data["owner_id"] is None:
        data["owner_id"] = user.id
    template = await repo.create(data)
    return EmailTemplateOut.model_validate(template).model_dump(by_alias=True)


@router.put("/{template_id}")
async def update_email_template(
    template_id: str,
    body: EmailTemplateUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = EmailTemplateRepository(db)
    template = await repo.update(template_id, body.model_dump(exclude_unset=True))
    if not template:
        raise NotFoundException("Email template not found")
    return EmailTemplateOut.model_validate(template).model_dump(by_alias=True)


@router.delete("/{template_id}")
async def delete_email_template(
    template_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = EmailTemplateRepository(db)
    deleted = await repo.delete(template_id)
    if not deleted:
        raise NotFoundException("Email template not found")
    return {"success": True}
