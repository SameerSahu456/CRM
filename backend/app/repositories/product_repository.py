from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.repositories.base import BaseRepository


class ProductRepository(BaseRepository[Product]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Product)

    async def get_active(self) -> list[Product]:
        result = await self.db.execute(
            select(Product).where(Product.is_active == True).order_by(Product.name)
        )
        return list(result.scalars().all())
