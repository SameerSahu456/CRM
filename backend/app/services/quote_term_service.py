"""
Quote Term Service Layer

This module contains all business logic for quote term management.
Following SOLID principles with clear separation of concerns.
"""

from __future__ import annotations

from typing import Any, Dict, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import BadRequestException, NotFoundException
from app.models.quote_term import QuoteTerm
from app.repositories.base import BaseRepository
from app.schemas.quote_term_schema import QuoteTermCreate, QuoteTermOut, QuoteTermUpdate


class QuoteTermService:
    """
    Service class for quote term business logic.

    Responsibilities:
    - Quote term CRUD operations with business rules
    - Validation for predefined terms
    """

    def __init__(self, db: AsyncSession):
        """
        Initialize QuoteTermService.

        Args:
            db: Database session
        """
        self.db = db
        self.repo = BaseRepository(db, QuoteTerm)

    async def list_terms(self) -> List[Dict[str, Any]]:
        """
        List all quote terms ordered by predefined status and sort order.

        Returns:
            List of quote term dictionaries
        """
        stmt = select(QuoteTerm).order_by(
            QuoteTerm.is_predefined.desc(), QuoteTerm.sort_order
        )
        result = await self.db.execute(stmt)
        terms = result.scalars().all()
        return [QuoteTermOut.model_validate(t).model_dump(by_alias=True) for t in terms]

    async def create_term(self, term_data: QuoteTermCreate) -> Dict[str, Any]:
        """
        Create a new quote term.

        Args:
            term_data: Quote term creation data

        Returns:
            Created quote term data
        """
        term = QuoteTerm(
            content=term_data.content,
            is_predefined=False,
            sort_order=term_data.sort_order,
        )
        self.db.add(term)
        await self.db.flush()
        await self.db.refresh(term)
        return QuoteTermOut.model_validate(term).model_dump(by_alias=True)

    async def update_term(
        self, term_id: str, term_data: QuoteTermUpdate
    ) -> Dict[str, Any]:
        """
        Update an existing quote term.

        Args:
            term_id: Quote term UUID
            term_data: Quote term update data

        Returns:
            Updated quote term data

        Raises:
            NotFoundException: If term not found
        """
        term = await self.repo.get_by_id(term_id)
        if not term:
            raise NotFoundException("Term not found")

        update_data = term_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if hasattr(term, key):
                setattr(term, key, value)

        await self.db.flush()
        await self.db.refresh(term)
        return QuoteTermOut.model_validate(term).model_dump(by_alias=True)

    async def delete_term(self, term_id: str) -> bool:
        """
        Delete a quote term.

        Args:
            term_id: Quote term UUID

        Returns:
            True if successful

        Raises:
            NotFoundException: If term not found
            BadRequestException: If trying to delete a predefined term
        """
        term = await self.repo.get_by_id(term_id)
        if not term:
            raise NotFoundException("Term not found")

        if term.is_predefined:
            raise BadRequestException("Cannot delete predefined terms")

        await self.repo.delete(term_id)
        return True

