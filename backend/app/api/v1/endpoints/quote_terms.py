"""
Quote Terms API Endpoints

This module contains all HTTP endpoints for quote term management.
Controllers are thin and delegate business logic to the QuoteTermService.

Following SOLID principles:
- Single Responsibility: Controllers only handle HTTP request/response
- Dependency Inversion: Depends on service abstraction
"""

from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.security import get_current_user
from app.models.user import User
from app.schemas.quote_term_schema import QuoteTermCreate, QuoteTermUpdate
from app.services.quote_term_service import QuoteTermService

router = APIRouter()


@router.get("/")
async def list_terms(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[Dict[str, Any]]:
    """
    List all quote terms.

    Returns list of quote term dictionaries ordered by predefined status and sort order.
    """
    service = QuoteTermService(db)
    return await service.list_terms()


@router.post("/")
async def create_term(
    body: QuoteTermCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Create a new quote term.

    Returns created quote term data.
    """
    service = QuoteTermService(db)
    return await service.create_term(term_data=body)


@router.put("/{term_id}")
async def update_term(
    term_id: str,
    body: QuoteTermUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Update an existing quote term.

    Returns updated quote term data.
    """
    service = QuoteTermService(db)
    return await service.update_term(term_id=term_id, term_data=body)


@router.delete("/{term_id}")
async def delete_term(
    term_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Delete a quote term.

    Returns success status.
    """
    service = QuoteTermService(db)
    await service.delete_term(term_id=term_id)
    return {"success": True}
