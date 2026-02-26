"""
Quote Service

This module contains business logic for quote management.
Follows SOLID principles and service layer architecture.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundException
from app.models.partner import Partner
from app.models.product import Product
from app.models.quote import Quote
from app.models.quote_line_item import QuoteLineItem
from app.models.quote_selected_term import QuoteSelectedTerm
from app.models.quote_term import QuoteTerm
from app.models.user import User
from app.repositories.base import BaseRepository
from app.schemas.quote_schema import (
    QuoteCreate,
    QuoteLineItemCreate,
    QuoteLineItemOut,
    QuoteOut,
    QuoteUpdate,
)

logger = logging.getLogger(__name__)


class QuoteService:
    """
    Service layer for quote business logic.

    Handles:
    - Quote listing with pagination and filtering
    - Quote retrieval with line items and terms
    - Quote creation with line items and terms
    - Quote updates
    - Quote deletion
    - PDF generation
    - Quote number generation
    - Terms and conditions management
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.quote_repo = BaseRepository(db, Quote)

    # ---------------------------------------------------------------------------
    # Helper Methods
    # ---------------------------------------------------------------------------

    async def _generate_quote_number(self) -> str:
        """Generate a unique quote number."""
        result = await self.db.execute(select(func.count()).select_from(Quote))
        count = result.scalar_one()
        return f"QT-{count + 1:04d}"

    def _calc_totals(
        self,
        line_items: List[QuoteLineItemCreate],
        tax_rate: float,
        discount_amount: float,
    ) -> Dict[str, float]:
        """Calculate quote totals from line items."""
        subtotal = sum(item.line_total for item in line_items)
        tax_amount = (subtotal - discount_amount) * (tax_rate / 100)
        total_amount = subtotal - discount_amount + tax_amount
        return {
            "subtotal": subtotal,
            "tax_amount": tax_amount,
            "total_amount": total_amount,
        }

    async def _save_selected_terms(self, quote: Quote, term_ids: List[str]) -> None:
        """Save selected term IDs and compile terms text onto the quote."""
        # Delete old selections
        await self.db.execute(
            delete(QuoteSelectedTerm).where(QuoteSelectedTerm.quote_id == quote.id)
        )

        if not term_ids:
            quote.terms = None
            return

        # Fetch the terms in order
        terms_stmt = (
            select(QuoteTerm)
            .where(QuoteTerm.id.in_(term_ids))
            .order_by(QuoteTerm.sort_order)
        )
        terms_result = await self.db.execute(terms_stmt)
        selected_terms = terms_result.scalars().all()

        # Create junction records
        for idx, term in enumerate(selected_terms):
            junction = QuoteSelectedTerm(
                quote_id=quote.id, term_id=term.id, sort_order=idx
            )
            self.db.add(junction)

        # Compile terms text
        compiled = "\n".join(
            f"{i + 1}. {t.content}" for i, t in enumerate(selected_terms)
        )
        quote.terms = compiled

    async def _generate_and_store_pdf(
        self, quote: Quote, quote_data: Dict[str, Any]
    ) -> Optional[str]:
        """Generate a PDF for a quote and store it locally. Returns the URL."""
        try:
            from app.utils.pdf_generator import generate_quote_pdf
            from app.utils.storage import upload_file

            pdf_bytes = generate_quote_pdf(quote_data)
            file_name = f"quotes/quote-{quote.id}.pdf"
            pdf_url = await upload_file(pdf_bytes, file_name, "application/pdf")
            quote.pdf_url = pdf_url
            await self.db.flush()
            return pdf_url
        except Exception:
            logger.exception("Failed to generate PDF for quote %s", quote.id)
            return None

    async def _get_quote_with_items(self, quote_id: str) -> Optional[Dict[str, Any]]:
        """Fetch quote with partner name, line items, and selected term IDs."""
        stmt = (
            select(Quote, Partner.company_name.label("partner_name"))
            .outerjoin(Partner, Quote.partner_id == Partner.id)
            .where(Quote.id == quote_id)
        )
        result = await self.db.execute(stmt)
        row = result.first()
        if not row:
            return None

        quote = row[0]
        partner_name = row[1]

        # Get line items with product names
        items_stmt = (
            select(QuoteLineItem, Product.name.label("product_name"))
            .outerjoin(Product, QuoteLineItem.product_id == Product.id)
            .where(QuoteLineItem.quote_id == quote_id)
            .order_by(QuoteLineItem.sort_order)
        )
        items_result = await self.db.execute(items_stmt)
        items = []
        for item_row in items_result.all():
            item_out = QuoteLineItemOut.model_validate(item_row[0]).model_dump(
                by_alias=True
            )
            item_out["productName"] = item_row[1]
            items.append(item_out)

        # Get selected term IDs
        terms_stmt = (
            select(QuoteSelectedTerm.term_id)
            .where(QuoteSelectedTerm.quote_id == quote_id)
            .order_by(QuoteSelectedTerm.sort_order)
        )
        terms_result = await self.db.execute(terms_stmt)
        selected_term_ids = [str(r[0]) for r in terms_result.all()]

        out = QuoteOut.model_validate(quote).model_dump(by_alias=True)
        out["partnerName"] = partner_name
        out["lineItems"] = items
        out["selectedTermIds"] = selected_term_ids
        return out

    # ---------------------------------------------------------------------------
    # Quote CRUD Operations
    # ---------------------------------------------------------------------------

    async def list_quotes(
        self,
        page: int,
        limit: int,
        status: Optional[str] = None,
        lead_id: Optional[str] = None,
        deal_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        List quotes with filtering and pagination.

        Args:
            page: Page number
            limit: Items per page
            status: Filter by status
            lead_id: Filter by lead ID
            deal_id: Filter by deal ID

        Returns:
            Dictionary with data and pagination info
        """
        filters = []
        if status:
            filters.append(Quote.status == status)
        if lead_id:
            filters.append(Quote.lead_id == lead_id)
        if deal_id:
            filters.append(Quote.deal_id == deal_id)

        stmt = select(Quote, Partner.company_name.label("partner_name")).outerjoin(
            Partner, Quote.partner_id == Partner.id
        )
        count_stmt = select(func.count()).select_from(Quote)

        if filters:
            for f in filters:
                stmt = stmt.where(f)
                count_stmt = count_stmt.where(f)

        stmt = stmt.order_by(Quote.created_at.desc())
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        rows = result.all()

        data = []
        for row in rows:
            out = QuoteOut.model_validate(row[0]).model_dump(by_alias=True)
            out["partnerName"] = row[1]
            data.append(out)

        total_result = await self.db.execute(count_stmt)
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

    async def get_quote_by_id(self, quote_id: str) -> Dict[str, Any]:
        """
        Get a single quote by ID with all details.

        Args:
            quote_id: Quote ID

        Returns:
            Quote dictionary with line items and terms

        Raises:
            NotFoundException: If quote not found
        """
        result = await self._get_quote_with_items(quote_id)
        if not result:
            raise NotFoundException("Quote not found")
        return result

    async def create_quote(
        self,
        quote_data: QuoteCreate,
        user: User,
    ) -> Dict[str, Any]:
        """
        Create a new quote with line items and terms.

        Args:
            quote_data: Quote creation data
            user: Current user

        Returns:
            Created quote dictionary with line items and terms
        """
        quote_number = await self._generate_quote_number()

        totals = self._calc_totals(
            quote_data.line_items, quote_data.tax_rate, quote_data.discount_amount
        )

        data = quote_data.model_dump(exclude={"line_items", "selected_term_ids"})
        data["quote_number"] = quote_number
        data["created_by"] = user.id
        data.update(totals)

        quote = Quote(**data)
        self.db.add(quote)
        await self.db.flush()
        await self.db.refresh(quote)

        # Create line items
        for item in quote_data.line_items:
            li = QuoteLineItem(**item.model_dump(), quote_id=quote.id)
            self.db.add(li)

        # Save selected T&C
        await self._save_selected_terms(quote, quote_data.selected_term_ids)

        await self.db.flush()

        result = await self._get_quote_with_items(str(quote.id))

        # Auto-generate PDF
        if result:
            pdf_url = await self._generate_and_store_pdf(quote, result)
            if pdf_url:
                result["pdfUrl"] = pdf_url

        return result

    async def update_quote(
        self,
        quote_id: str,
        quote_data: QuoteUpdate,
    ) -> Dict[str, Any]:
        """
        Update an existing quote.

        Args:
            quote_id: Quote ID
            quote_data: Quote update data

        Returns:
            Updated quote dictionary with line items and terms

        Raises:
            NotFoundException: If quote not found
        """
        quote = await self.quote_repo.get_by_id(quote_id)
        if not quote:
            raise NotFoundException("Quote not found")

        update_data = quote_data.model_dump(
            exclude_unset=True, exclude={"line_items", "selected_term_ids"}
        )

        # If line items provided, replace them all
        if quote_data.line_items is not None:
            # Delete old items
            await self.db.execute(
                delete(QuoteLineItem).where(QuoteLineItem.quote_id == quote_id)
            )
            # Create new items
            for item in quote_data.line_items:
                li = QuoteLineItem(**item.model_dump(), quote_id=quote.id)
                self.db.add(li)

            # Recalculate totals
            tax_rate = (
                quote_data.tax_rate
                if quote_data.tax_rate is not None
                else float(quote.tax_rate)
            )
            discount = (
                quote_data.discount_amount
                if quote_data.discount_amount is not None
                else float(quote.discount_amount)
            )
            totals = self._calc_totals(quote_data.line_items, tax_rate, discount)
            update_data.update(totals)

        # Update selected T&C if provided
        if quote_data.selected_term_ids is not None:
            await self._save_selected_terms(quote, quote_data.selected_term_ids)

        for key, value in update_data.items():
            if hasattr(quote, key):
                setattr(quote, key, value)

        await self.db.flush()
        result = await self._get_quote_with_items(quote_id)

        # Regenerate PDF when content changes
        if result and (
            quote_data.line_items is not None
            or quote_data.selected_term_ids is not None
        ):
            pdf_url = await self._generate_and_store_pdf(quote, result)
            if pdf_url:
                result["pdfUrl"] = pdf_url

        return result

    async def delete_quote(self, quote_id: str) -> bool:
        """
        Delete a quote.

        Args:
            quote_id: Quote ID

        Returns:
            True if deleted successfully

        Raises:
            NotFoundException: If quote not found
        """
        deleted = await self.quote_repo.delete(quote_id)
        if not deleted:
            raise NotFoundException("Quote not found")
        return True

    async def get_or_regenerate_pdf(
        self, quote_id: str, regenerate: bool = False
    ) -> str:
        """
        Get or regenerate the PDF for a quote.

        Args:
            quote_id: Quote ID
            regenerate: Whether to force regeneration

        Returns:
            PDF URL

        Raises:
            NotFoundException: If quote not found or PDF generation fails
        """
        quote = await self.quote_repo.get_by_id(quote_id)
        if not quote:
            raise NotFoundException("Quote not found")

        if not regenerate and quote.pdf_url:
            return quote.pdf_url

        quote_data = await self._get_quote_with_items(quote_id)
        if not quote_data:
            raise NotFoundException("Quote not found")

        pdf_url = await self._generate_and_store_pdf(quote, quote_data)
        if not pdf_url:
            raise NotFoundException("Failed to generate PDF")

        return pdf_url
