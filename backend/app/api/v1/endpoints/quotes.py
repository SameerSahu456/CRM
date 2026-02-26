from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.security import get_current_user
from app.models.user import User
from app.schemas.quote_schema import QuoteCreate, QuoteUpdate
from app.services.quote_service import QuoteService
from app.utils.response_utils import (
    created_response,
    deleted_response,
    paginated_response,
    success_response,
)

router = APIRouter()


@router.get("/", response_model=Dict[str, Any])
async def list_quotes(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    status: str = Query(None, description="Filter by status"),
    lead_id: str = Query(None, description="Filter by lead ID"),
    deal_id: str = Query(None, description="Filter by deal ID"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    List quotes with filtering and pagination.

    Args:
        page: Page number
        limit: Items per page
        status: Filter by status (draft, sent, accepted, rejected)
        lead_id: Filter by lead ID
        deal_id: Filter by deal ID
        user: Current user
        db: Database session

    Returns:
        Paginated list of quotes with partner names
    """
    service = QuoteService(db)
    result = await service.list_quotes(
        page=page, limit=limit, status=status, lead_id=lead_id, deal_id=deal_id
    )

    return paginated_response(
        data=result["data"],
        page=page,
        limit=limit,
        total=result["pagination"]["total"],
        message="Quotes retrieved successfully",
    )


@router.get("/{quote_id}", response_model=Dict[str, Any])
async def get_quote(
    quote_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get a single quote by ID with line items and terms.

    Args:
        quote_id: Quote ID
        user: Current user
        db: Database session

    Returns:
        Quote with line items and selected term IDs
    """
    service = QuoteService(db)
    quote = await service.get_quote_by_id(quote_id)

    return success_response(data=quote, message="Quote retrieved successfully")


@router.post("/", response_model=Dict[str, Any])
async def create_quote(
    body: QuoteCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Create a new quote with line items and terms.

    Args:
        body: Quote creation data
        user: Current user
        db: Database session

    Returns:
        Created quote with line items and PDF URL
    """
    service = QuoteService(db)
    quote = await service.create_quote(quote_data=body, user=user)

    return created_response(data=quote, message="Quote created successfully")


@router.put("/{quote_id}", response_model=Dict[str, Any])
async def update_quote(
    quote_id: str,
    body: QuoteUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Update an existing quote.

    Args:
        quote_id: Quote ID
        body: Quote update data
        user: Current user
        db: Database session

    Returns:
        Updated quote with line items and PDF URL
    """
    service = QuoteService(db)
    quote = await service.update_quote(quote_id=quote_id, quote_data=body)

    return success_response(data=quote, message="Quote updated successfully")


@router.get("/{quote_id}/pdf", response_model=Dict[str, Any])
async def get_quote_pdf(
    quote_id: str,
    regenerate: bool = Query(False, description="Force PDF regeneration"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get or regenerate the PDF for a quote.

    Args:
        quote_id: Quote ID
        regenerate: Whether to force regeneration
        user: Current user
        db: Database session

    Returns:
        PDF URL
    """
    service = QuoteService(db)
    pdf_url = await service.get_or_regenerate_pdf(
        quote_id=quote_id, regenerate=regenerate
    )

    return success_response(
        data={"pdfUrl": pdf_url}, message="PDF retrieved successfully"
    )


@router.delete("/{quote_id}", response_model=Dict[str, Any])
async def delete_quote(
    quote_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Delete a quote.

    Args:
        quote_id: Quote ID
        user: Current user
        db: Database session

    Returns:
        Success confirmation
    """
    service = QuoteService(db)
    await service.delete_quote(quote_id)

    return deleted_response(message="Quote deleted successfully")
