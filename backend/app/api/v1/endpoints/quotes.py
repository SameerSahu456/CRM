from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import NotFoundException
from app.middleware.security import get_current_user
from app.models.Partner import Partner
from app.models.Product import Product
from app.models.Quote import Quote
from app.models.QuoteLineItem import QuoteLineItem
from app.models.QuoteSelectedTerm import QuoteSelectedTerm
from app.models.QuoteTerm import QuoteTerm
from app.models.User import User
from app.repositories.base import BaseRepository
from app.schemas.QuoteSchema import (
    QuoteCreate,
    QuoteLineItemOut,
    QuoteOut,
    QuoteUpdate,
)

router = APIRouter()


async def _generate_quote_number(db: AsyncSession) -> str:
    result = await db.execute(select(func.count()).select_from(Quote))
    count = result.scalar_one()
    return f"QT-{count + 1:04d}"


async def _get_quote_with_items(db: AsyncSession, quote_id) -> dict | None:
    """Fetch quote with partner name, line items, and selected term IDs."""
    stmt = (
        select(Quote, Partner.company_name.label("partner_name"))
        .outerjoin(Partner, Quote.partner_id == Partner.id)
        .where(Quote.id == quote_id)
    )
    result = await db.execute(stmt)
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
    items_result = await db.execute(items_stmt)
    items = []
    for item_row in items_result.all():
        item_out = QuoteLineItemOut.model_validate(item_row[0]).model_dump(by_alias=True)
        item_out["productName"] = item_row[1]
        items.append(item_out)

    # Get selected term IDs
    terms_stmt = (
        select(QuoteSelectedTerm.term_id)
        .where(QuoteSelectedTerm.quote_id == quote_id)
        .order_by(QuoteSelectedTerm.sort_order)
    )
    terms_result = await db.execute(terms_stmt)
    selected_term_ids = [str(r[0]) for r in terms_result.all()]

    out = QuoteOut.model_validate(quote).model_dump(by_alias=True)
    out["partnerName"] = partner_name
    out["lineItems"] = items
    out["selectedTermIds"] = selected_term_ids
    return out


async def _save_selected_terms(db: AsyncSession, quote: Quote, term_ids: list) -> None:
    """Save selected term IDs and compile terms text onto the quote."""
    # Delete old selections
    await db.execute(
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
    terms_result = await db.execute(terms_stmt)
    selected_terms = terms_result.scalars().all()

    # Create junction records
    for idx, term in enumerate(selected_terms):
        junction = QuoteSelectedTerm(
            quote_id=quote.id, term_id=term.id, sort_order=idx
        )
        db.add(junction)

    # Compile terms text
    compiled = "\n".join(
        f"{i + 1}. {t.content}" for i, t in enumerate(selected_terms)
    )
    quote.terms = compiled


def _calc_totals(line_items: list, tax_rate: float, discount_amount: float) -> dict:
    subtotal = sum(item.line_total for item in line_items)
    tax_amount = (subtotal - discount_amount) * (tax_rate / 100)
    total_amount = subtotal - discount_amount + tax_amount
    return {
        "subtotal": subtotal,
        "tax_amount": tax_amount,
        "total_amount": total_amount,
    }


logger = logging.getLogger(__name__)


async def _generate_and_store_pdf(db: AsyncSession, quote: Quote, quote_data: dict) -> str | None:
    """Generate a PDF for a quote and upload to Supabase Storage. Returns the URL."""
    try:
        from app.utils.pdf_generator import generate_quote_pdf
        from app.utils.storage import upload_to_supabase

        pdf_bytes = generate_quote_pdf(quote_data)
        file_name = f"quotes/quote-{quote.id}.pdf"
        pdf_url = await upload_to_supabase(pdf_bytes, file_name, "application/pdf")
        quote.pdf_url = pdf_url
        await db.flush()
        return pdf_url
    except Exception:
        logger.exception("Failed to generate PDF for quote %s", quote.id)
        return None


@router.get("/")
async def list_quotes(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    filters = []
    if status:
        filters.append(Quote.status == status)

    stmt = (
        select(Quote, Partner.company_name.label("partner_name"))
        .outerjoin(Partner, Quote.partner_id == Partner.id)
    )
    count_stmt = select(func.count()).select_from(Quote)

    if filters:
        for f in filters:
            stmt = stmt.where(f)
            count_stmt = count_stmt.where(f)

    stmt = stmt.order_by(Quote.created_at.desc())
    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit)

    result = await db.execute(stmt)
    rows = result.all()

    data = []
    for row in rows:
        out = QuoteOut.model_validate(row[0]).model_dump(by_alias=True)
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


@router.get("/{quote_id}")
async def get_quote(
    quote_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await _get_quote_with_items(db, quote_id)
    if not result:
        raise NotFoundException("Quote not found")
    return result


@router.post("/")
async def create_quote(
    body: QuoteCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    quote_number = await _generate_quote_number(db)

    totals = _calc_totals(body.line_items, body.tax_rate, body.discount_amount)

    quote_data = body.model_dump(exclude={"line_items", "selected_term_ids"})
    quote_data["quote_number"] = quote_number
    quote_data["created_by"] = user.id
    quote_data.update(totals)

    quote = Quote(**quote_data)
    db.add(quote)
    await db.flush()
    await db.refresh(quote)

    # Create line items
    for item in body.line_items:
        li = QuoteLineItem(**item.model_dump(), quote_id=quote.id)
        db.add(li)

    # Save selected T&C
    await _save_selected_terms(db, quote, body.selected_term_ids)

    await db.flush()

    result = await _get_quote_with_items(db, quote.id)

    # Auto-generate PDF
    if result:
        pdf_url = await _generate_and_store_pdf(db, quote, result)
        if pdf_url:
            result["pdfUrl"] = pdf_url

    return result


@router.put("/{quote_id}")
async def update_quote(
    quote_id: str,
    body: QuoteUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = BaseRepository(db, Quote)
    quote = await repo.get_by_id(quote_id)
    if not quote:
        raise NotFoundException("Quote not found")

    update_data = body.model_dump(exclude_unset=True, exclude={"line_items", "selected_term_ids"})

    # If line items provided, replace them all
    if body.line_items is not None:
        # Delete old items
        await db.execute(
            delete(QuoteLineItem).where(QuoteLineItem.quote_id == quote_id)
        )
        # Create new items
        for item in body.line_items:
            li = QuoteLineItem(**item.model_dump(), quote_id=quote.id)
            db.add(li)

        # Recalculate totals
        tax_rate = body.tax_rate if body.tax_rate is not None else float(quote.tax_rate)
        discount = body.discount_amount if body.discount_amount is not None else float(quote.discount_amount)
        totals = _calc_totals(body.line_items, tax_rate, discount)
        update_data.update(totals)

    # Update selected T&C if provided
    if body.selected_term_ids is not None:
        await _save_selected_terms(db, quote, body.selected_term_ids)

    for key, value in update_data.items():
        if hasattr(quote, key):
            setattr(quote, key, value)

    await db.flush()
    result = await _get_quote_with_items(db, quote_id)

    # Regenerate PDF when content changes
    if result and (body.line_items is not None or body.selected_term_ids is not None):
        pdf_url = await _generate_and_store_pdf(db, quote, result)
        if pdf_url:
            result["pdfUrl"] = pdf_url

    return result


@router.get("/{quote_id}/pdf")
async def get_quote_pdf(
    quote_id: str,
    regenerate: bool = Query(False),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get or regenerate the PDF for a quote."""
    repo = BaseRepository(db, Quote)
    quote = await repo.get_by_id(quote_id)
    if not quote:
        raise NotFoundException("Quote not found")

    if not regenerate and quote.pdf_url:
        return {"pdfUrl": quote.pdf_url}

    quote_data = await _get_quote_with_items(db, quote_id)
    if not quote_data:
        raise NotFoundException("Quote not found")

    pdf_url = await _generate_and_store_pdf(db, quote, quote_data)
    if not pdf_url:
        raise NotFoundException("Failed to generate PDF")

    return {"pdfUrl": pdf_url}


@router.delete("/{quote_id}")
async def delete_quote(
    quote_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = BaseRepository(db, Quote)
    deleted = await repo.delete(quote_id)
    if not deleted:
        raise NotFoundException("Quote not found")
    return {"success": True}
