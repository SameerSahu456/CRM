"""
Product Service

This module contains business logic for product management.
Follows SOLID principles and service layer architecture.
"""

from __future__ import annotations

from typing import Any, Dict

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundException
from app.models.user import User
from app.repositories.product_repository import ProductRepository
from app.schemas.product_schema import ProductCreate, ProductOut, ProductUpdate
from app.utils.activity_logger import compute_changes, log_activity, model_to_dict


class ProductService:
    """
    Service layer for product business logic.

    Handles:
    - Product listing (active/all)
    - Product retrieval
    - Product creation
    - Product updates
    - Product deletion
    - Activity logging
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.product_repo = ProductRepository(db)

    async def list_products(
        self,
        include_inactive: bool = False,
    ) -> list[Dict[str, Any]]:
        """
        List all products or only active products.

        Args:
            include_inactive: If True, return all products including inactive ones

        Returns:
            List of product dictionaries
        """
        if include_inactive:
            products = await self.product_repo.get_all(skip=0, limit=10000)
        else:
            products = await self.product_repo.get_active()

        return [
            ProductOut.model_validate(p).model_dump(by_alias=True) for p in products
        ]

    async def get_product_by_id(
        self,
        product_id: str,
    ) -> Dict[str, Any]:
        """
        Get a single product by ID.

        Args:
            product_id: Product ID

        Returns:
            Product dictionary

        Raises:
            NotFoundException: If product not found
        """
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise NotFoundException("Product not found")

        return ProductOut.model_validate(product).model_dump(by_alias=True)

    async def create_product(
        self,
        product_data: ProductCreate,
        user: User,
    ) -> Dict[str, Any]:
        """
        Create a new product.

        Args:
            product_data: Product creation data
            user: Current user

        Returns:
            Created product dictionary
        """
        data = product_data.model_dump(exclude_unset=True)
        product = await self.product_repo.create(data)

        # Log activity
        await log_activity(
            self.db, user, "create", "product", str(product.id), product.name
        )

        return ProductOut.model_validate(product).model_dump(by_alias=True)

    async def update_product(
        self,
        product_id: str,
        product_data: ProductUpdate,
        user: User,
    ) -> Dict[str, Any]:
        """
        Update an existing product.

        Args:
            product_id: Product ID
            product_data: Product update data
            user: Current user

        Returns:
            Updated product dictionary

        Raises:
            NotFoundException: If product not found
        """
        # Get existing product
        old = await self.product_repo.get_by_id(product_id)
        if not old:
            raise NotFoundException("Product not found")

        # Track changes
        old_data = model_to_dict(old)

        # Update product
        update_data = product_data.model_dump(exclude_unset=True)
        product = await self.product_repo.update(product_id, update_data)

        # Compute and log changes
        changes = compute_changes(old_data, model_to_dict(product))
        await log_activity(
            self.db,
            user,
            "update",
            "product",
            str(product.id),
            product.name,
            changes,
        )

        return ProductOut.model_validate(product).model_dump(by_alias=True)

    async def delete_product(
        self,
        product_id: str,
        user: User,
    ) -> bool:
        """
        Delete a product.

        Args:
            product_id: Product ID
            user: Current user

        Returns:
            True if deleted successfully

        Raises:
            NotFoundException: If product not found
        """
        # Get existing product
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise NotFoundException("Product not found")

        product_name = product.name

        # Delete product
        await self.product_repo.delete(product_id)

        # Log activity
        await log_activity(self.db, user, "delete", "product", product_id, product_name)

        return True
