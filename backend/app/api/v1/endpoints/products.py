from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import NotFoundException
from app.middleware.security import get_current_user
from app.models.User import User
from app.repositories.ProductRepository import ProductRepository
from app.schemas.ProductSchema import ProductCreate, ProductOut, ProductUpdate

router = APIRouter()


@router.get("/")
async def list_products(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ProductRepository(db)
    products = await repo.get_active()
    return [ProductOut.model_validate(p).model_dump(by_alias=True) for p in products]


@router.get("/{product_id}")
async def get_product(
    product_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ProductRepository(db)
    product = await repo.get_by_id(product_id)
    if not product:
        raise NotFoundException("Product not found")
    return ProductOut.model_validate(product).model_dump(by_alias=True)


@router.post("/")
async def create_product(
    body: ProductCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ProductRepository(db)
    product = await repo.create(body.model_dump(exclude_unset=True))
    return ProductOut.model_validate(product).model_dump(by_alias=True)


@router.put("/{product_id}")
async def update_product(
    product_id: str,
    body: ProductUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ProductRepository(db)
    product = await repo.update(product_id, body.model_dump(exclude_unset=True))
    if not product:
        raise NotFoundException("Product not found")
    return ProductOut.model_validate(product).model_dump(by_alias=True)


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ProductRepository(db)
    deleted = await repo.delete(product_id)
    if not deleted:
        raise NotFoundException("Product not found")
    return {"success": True}
