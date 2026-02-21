"""
Account API Endpoints

This module contains all HTTP endpoints for account management.
Controllers are thin and delegate business logic to the AccountService.

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
from app.schemas.account_schema import AccountCreate, AccountUpdate
from app.services.account_service import AccountService
from app.utils.response_utils import (
    created_response,
    deleted_response,
    paginated_response,
    success_response,
)

router = APIRouter()


@router.get("/")
async def list_accounts(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=1000, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    industry: Optional[str] = Query(None, description="Filter by industry"),
    search: Optional[str] = Query(None, description="Search by account name"),
    account_type: Optional[str] = Query(None, description="Filter by account type"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    type: Optional[str] = Query(None, description="Filter by type (Hunting/Farming/Cold)"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    List accounts with filtering and pagination.

    Returns standardized response:
    {
        "code": 200,
        "data": [...],
        "message": "Success",
        "pagination": {...}
    }
    """
    service = AccountService(db)
    result = await service.list_accounts(
        page=page,
        limit=limit,
        user=user,
        status=status,
        industry=industry,
        search=search,
        account_type=account_type,
        tag=tag,
        type_filter=type,
    )

    return paginated_response(
        data=result["data"],
        page=page,
        limit=limit,
        total=result["pagination"]["total"],
        message="Accounts retrieved successfully",
    )


@router.post("/with-contact")
async def create_account_with_contact(
    body: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Create an account with an associated contact.

    Returns standardized response:
    {
        "code": 201,
        "data": {...},
        "message": "Created successfully"
    }
    """
    account_data = body.get("account", {})
    contact_data = body.get("contact", {})

    service = AccountService(db)
    account = await service.create_account_with_contact(
        account_data=account_data, contact_data=contact_data, user=user
    )

    return created_response(
        data=account, message="Account and contact created successfully"
    )


@router.get("/{account_id}")
async def get_account(
    account_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get a single account by ID.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = AccountService(db)
    account = await service.get_account_by_id(account_id=account_id, user=user)

    return success_response(data=account, message="Account retrieved successfully")


@router.post("/")
async def create_account(
    body: AccountCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Create a new account.

    Returns standardized response:
    {
        "code": 201,
        "data": {...},
        "message": "Created successfully"
    }
    """
    service = AccountService(db)
    account = await service.create_account(account_data=body, user=user)

    return created_response(data=account, message="Account created successfully")


@router.put("/{account_id}")
async def update_account(
    account_id: str,
    body: AccountUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Update an existing account.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = AccountService(db)
    account = await service.update_account(
        account_id=account_id, account_data=body, user=user
    )

    return success_response(data=account, message="Account updated successfully")


@router.delete("/{account_id}")
async def delete_account(
    account_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Delete an account.

    Returns standardized response:
    {
        "code": 200,
        "data": null,
        "message": "Deleted successfully"
    }
    """
    service = AccountService(db)
    await service.delete_account(account_id=account_id, user=user)

    return deleted_response(message="Account deleted successfully")


@router.get("/{account_id}/contacts")
async def list_account_contacts(
    account_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    List all contacts for a specific account.

    Returns standardized response:
    {
        "code": 200,
        "data": [...],
        "message": "Success",
        "pagination": {...}
    }
    """
    service = AccountService(db)
    result = await service.list_account_contacts(
        account_id=account_id, page=page, limit=limit, user=user
    )

    return paginated_response(
        data=result["data"],
        page=page,
        limit=limit,
        total=result["pagination"]["total"],
        message="Account contacts retrieved successfully",
    )


@router.get("/{account_id}/deals")
async def list_account_deals(
    account_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    List all deals for a specific account.

    Returns standardized response:
    {
        "code": 200,
        "data": [...],
        "message": "Success"
    }
    """
    service = AccountService(db)
    deals = await service.list_account_deals(account_id=account_id, user=user)

    return success_response(data=deals, message="Account deals retrieved successfully")
