from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import NotFoundException
from app.middleware.security import get_current_user
from app.models.User import User
from app.repositories.ProductRepository import ProductRepository
from app.schemas.ProductSchema import ProductCreate, ProductOut, ProductUpdate
from app.utils.activity_logger import compute_changes, log_activity, model_to_dict

router = APIRouter()


@router.get("/")
async def list_products(
    include_inactive: bool = False,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ProductRepository(db)
    if include_inactive:
        products = await repo.get_all(skip=0, limit=10000)
    else:
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
    await log_activity(db, user, "create", "product", str(product.id), product.name)
    return ProductOut.model_validate(product).model_dump(by_alias=True)


@router.put("/{product_id}")
async def update_product(
    product_id: str,
    body: ProductUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ProductRepository(db)
    old = await repo.get_by_id(product_id)
    if not old:
        raise NotFoundException("Product not found")
    old_data = model_to_dict(old)
    product = await repo.update(product_id, body.model_dump(exclude_unset=True))
    changes = compute_changes(old_data, model_to_dict(product))
    await log_activity(db, user, "update", "product", str(product.id), product.name, changes)
    return ProductOut.model_validate(product).model_dump(by_alias=True)


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ProductRepository(db)
    product = await repo.get_by_id(product_id)
    if not product:
        raise NotFoundException("Product not found")
    product_name = product.name
    await repo.delete(product_id)
    await log_activity(db, user, "delete", "product", product_id, product_name)
    return {"success": True}
