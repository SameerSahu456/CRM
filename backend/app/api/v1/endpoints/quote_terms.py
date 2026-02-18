from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import BadRequestException, NotFoundException
from app.middleware.security import get_current_user
from app.models.quote_term import QuoteTerm
from app.models.user import User
from app.repositories.base import BaseRepository
from app.schemas.quote_term_schema import QuoteTermCreate, QuoteTermOut, QuoteTermUpdate

router = APIRouter()


@router.get("/")
async def list_terms(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(QuoteTerm).order_by(
        QuoteTerm.is_predefined.desc(), QuoteTerm.sort_order
    )
    result = await db.execute(stmt)
    terms = result.scalars().all()
    return [QuoteTermOut.model_validate(t).model_dump(by_alias=True) for t in terms]


@router.post("/")
async def create_term(
    body: QuoteTermCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    term = QuoteTerm(
        content=body.content,
        is_predefined=False,
        sort_order=body.sort_order,
    )
    db.add(term)
    await db.flush()
    await db.refresh(term)
    return QuoteTermOut.model_validate(term).model_dump(by_alias=True)


@router.put("/{term_id}")
async def update_term(
    term_id: str,
    body: QuoteTermUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = BaseRepository(db, QuoteTerm)
    term = await repo.get_by_id(term_id)
    if not term:
        raise NotFoundException("Term not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if hasattr(term, key):
            setattr(term, key, value)

    await db.flush()
    await db.refresh(term)
    return QuoteTermOut.model_validate(term).model_dump(by_alias=True)


@router.delete("/{term_id}")
async def delete_term(
    term_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = BaseRepository(db, QuoteTerm)
    term = await repo.get_by_id(term_id)
    if not term:
        raise NotFoundException("Term not found")

    if term.is_predefined:
        raise BadRequestException("Cannot delete predefined terms")

    await repo.delete(term_id)
    return {"success": True}
