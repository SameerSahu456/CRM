from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import NotFoundException
from app.middleware.security import get_current_user
from app.models.Contact import Contact
from app.models.User import User
from app.repositories.ContactRepository import ContactRepository
from app.schemas.ContactSchema import ContactOut, ContactCreate, ContactUpdate

router = APIRouter()


@router.get("/")
async def list_contacts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    account_id: Optional[str] = None,
    status: Optional[str] = None,
    type: Optional[str] = None,
    search: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ContactRepository(db)
    filters = []
    if account_id:
        filters.append(Contact.account_id == account_id)
    if status:
        filters.append(Contact.status == status)
    if type:
        filters.append(Contact.type == type)
    if search:
        filters.append(
            or_(
                Contact.first_name.ilike(f"%{search}%"),
                Contact.last_name.ilike(f"%{search}%"),
            )
        )

    if user.role == "salesperson":
        filters.append(Contact.owner_id == user.id)

    result = await repo.get_with_names(page=page, limit=limit, filters=filters or None)

    data = []
    for item in result["data"]:
        out = ContactOut.model_validate(item["contact"]).model_dump(by_alias=True)
        out["accountName"] = item["account_name"]
        out["ownerName"] = item["owner_name"]
        data.append(out)

    return {"data": data, "pagination": result["pagination"]}


@router.get("/{contact_id}")
async def get_contact(
    contact_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ContactRepository(db)
    contact = await repo.get_by_id(contact_id)
    if not contact:
        raise NotFoundException("Contact not found")
    return ContactOut.model_validate(contact).model_dump(by_alias=True)


@router.post("/")
async def create_contact(
    body: ContactCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ContactRepository(db)
    data = body.model_dump(exclude_unset=True)
    if "owner_id" not in data or data["owner_id"] is None:
        data["owner_id"] = user.id
    contact = await repo.create(data)
    return ContactOut.model_validate(contact).model_dump(by_alias=True)


@router.put("/{contact_id}")
async def update_contact(
    contact_id: str,
    body: ContactUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ContactRepository(db)
    contact = await repo.update(contact_id, body.model_dump(exclude_unset=True))
    if not contact:
        raise NotFoundException("Contact not found")
    return ContactOut.model_validate(contact).model_dump(by_alias=True)


@router.delete("/{contact_id}")
async def delete_contact(
    contact_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ContactRepository(db)
    deleted = await repo.delete(contact_id)
    if not deleted:
        raise NotFoundException("Contact not found")
    return {"success": True}
