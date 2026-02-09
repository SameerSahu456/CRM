from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import NotFoundException
from app.middleware.security import get_current_user
from app.models.Account import Account
from app.models.User import User
from app.repositories.AccountRepository import AccountRepository
from app.repositories.ContactRepository import ContactRepository
from app.repositories.DealRepository import DealRepository
from app.schemas.AccountSchema import AccountOut, AccountCreate, AccountUpdate
from app.schemas.ContactSchema import ContactOut
from app.schemas.DealSchema import DealOut

router = APIRouter()


@router.get("/")
async def list_accounts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    industry: Optional[str] = None,
    search: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = AccountRepository(db)
    filters = []
    if status:
        filters.append(Account.status == status)
    if industry:
        filters.append(Account.industry == industry)
    if search:
        filters.append(Account.name.ilike(f"%{search}%"))

    if user.role == "salesperson":
        filters.append(Account.owner_id == user.id)

    result = await repo.get_with_owner(page=page, limit=limit, filters=filters or None)

    data = []
    for item in result["data"]:
        out = AccountOut.model_validate(item["account"]).model_dump(by_alias=True)
        out["ownerName"] = item["owner_name"]
        data.append(out)

    return {"data": data, "pagination": result["pagination"]}


@router.get("/{account_id}")
async def get_account(
    account_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = AccountRepository(db)
    account = await repo.get_by_id(account_id)
    if not account:
        raise NotFoundException("Account not found")
    return AccountOut.model_validate(account).model_dump(by_alias=True)


@router.post("/")
async def create_account(
    body: AccountCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = AccountRepository(db)
    data = body.model_dump(exclude_unset=True)
    if "owner_id" not in data or data["owner_id"] is None:
        data["owner_id"] = user.id
    account = await repo.create(data)
    return AccountOut.model_validate(account).model_dump(by_alias=True)


@router.put("/{account_id}")
async def update_account(
    account_id: str,
    body: AccountUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = AccountRepository(db)
    account = await repo.update(account_id, body.model_dump(exclude_unset=True))
    if not account:
        raise NotFoundException("Account not found")
    return AccountOut.model_validate(account).model_dump(by_alias=True)


@router.delete("/{account_id}")
async def delete_account(
    account_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = AccountRepository(db)
    deleted = await repo.delete(account_id)
    if not deleted:
        raise NotFoundException("Account not found")
    return {"success": True}


@router.get("/{account_id}/contacts")
async def list_account_contacts(
    account_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ContactRepository(db)
    result = await repo.get_by_account(account_id=account_id, page=page, limit=limit)

    data = []
    for item in result["data"]:
        out = ContactOut.model_validate(item["contact"]).model_dump(by_alias=True)
        out["accountName"] = item["account_name"]
        out["ownerName"] = item["owner_name"]
        data.append(out)

    return {"data": data, "pagination": result["pagination"]}


@router.get("/{account_id}/deals")
async def list_account_deals(
    account_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = DealRepository(db)
    items = await repo.get_by_account(account_id=account_id)

    data = []
    for item in items:
        out = DealOut.model_validate(item["deal"]).model_dump(by_alias=True)
        out["accountName"] = item["account_name"]
        out["contactName"] = item["contact_name"]
        out["ownerName"] = item["owner_name"]
        data.append(out)

    return data
