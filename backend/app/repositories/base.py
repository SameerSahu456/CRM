from __future__ import annotations

from typing import Any, Generic, TypeVar, Sequence

from sqlalchemy import func, select, delete as sql_delete, update as sql_update
from sqlalchemy.ext.asyncio import AsyncSession

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    """
    Base repository providing common CRUD operations for all entities.

    All entity-specific repositories should inherit from this class.
    Follows async SQLAlchemy best practices.
    """

    def __init__(self, db: AsyncSession, model: type[ModelType]):
        self.db = db
        self.model = model

    async def get_by_id(self, id: Any) -> ModelType | None:
        """
        Get a single entity by ID.

        Args:
            id: Entity ID

        Returns:
            Entity instance or None if not found
        """
        result = await self.db.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_by_ids(self, ids: Sequence[Any]) -> list[ModelType]:
        """
        Get multiple entities by IDs (bulk fetch).

        Args:
            ids: List of entity IDs

        Returns:
            List of entity instances
        """
        if not ids:
            return []
        result = await self.db.execute(select(self.model).where(self.model.id.in_(ids)))
        return list(result.scalars().all())

    async def exists(self, id: Any) -> bool:
        """
        Check if an entity exists by ID without fetching it.

        Args:
            id: Entity ID

        Returns:
            True if entity exists, False otherwise
        """
        result = await self.db.execute(
            select(func.count()).select_from(self.model).where(self.model.id == id)
        )
        return result.scalar_one() > 0

    async def find_one(self, filters: list | None = None) -> ModelType | None:
        """
        Find a single entity by arbitrary criteria.

        Args:
            filters: List of SQLAlchemy filter expressions

        Returns:
            Entity instance or None if not found
        """
        stmt = select(self.model)
        if filters:
            for f in filters:
                stmt = stmt.where(f)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def find_many(
        self,
        filters: list | None = None,
        order_by: str = "created_at",
        descending: bool = True,
        limit: int | None = None,
    ) -> list[ModelType]:
        """
        Find multiple entities by arbitrary criteria.

        Args:
            filters: List of SQLAlchemy filter expressions
            order_by: Column name to order by
            descending: Sort in descending order
            limit: Maximum number of results

        Returns:
            List of entity instances
        """
        stmt = select(self.model)
        if filters:
            for f in filters:
                stmt = stmt.where(f)

        col = getattr(self.model, order_by, None)
        if col is not None:
            stmt = stmt.order_by(col.desc() if descending else col)

        if limit is not None:
            stmt = stmt.limit(limit)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        order_by: str = "created_at",
        descending: bool = True,
    ) -> list[ModelType]:
        """
        Get all entities with pagination and ordering.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            order_by: Column name to order by
            descending: Sort in descending order

        Returns:
            List of entity instances
        """
        stmt = select(self.model)
        col = getattr(self.model, order_by, None)
        if col is not None:
            stmt = stmt.order_by(col.desc() if descending else col)
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_paginated(
        self,
        page: int = 1,
        limit: int = 20,
        order_by: str = "created_at",
        descending: bool = True,
        filters: list | None = None,
    ) -> dict:
        """
        Get paginated results with total count.

        Args:
            page: Page number (1-based)
            limit: Number of items per page
            order_by: Column name to order by
            descending: Sort in descending order
            filters: List of SQLAlchemy filter expressions

        Returns:
            Dictionary with 'data' and 'pagination' keys
        """
        stmt = select(self.model)
        count_stmt = select(func.count()).select_from(self.model)

        if filters:
            for f in filters:
                stmt = stmt.where(f)
                count_stmt = count_stmt.where(f)

        col = getattr(self.model, order_by, None)
        if col is not None:
            stmt = stmt.order_by(col.desc() if descending else col)

        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        items = list(result.scalars().all())

        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar_one()
        total_pages = (total + limit - 1) // limit

        return {
            "data": items,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": total_pages,
            },
        }

    async def create(self, obj_data: dict) -> ModelType:
        """
        Create a new entity.

        Args:
            obj_data: Dictionary of entity attributes

        Returns:
            Created entity instance
        """
        db_obj = self.model(**obj_data)
        self.db.add(db_obj)
        await self.db.flush()
        await self.db.refresh(db_obj)
        return db_obj

    async def bulk_create(self, items: list[dict]) -> list[ModelType]:
        """
        Bulk create multiple entities.

        Args:
            items: List of dictionaries with entity attributes

        Returns:
            List of created entity instances
        """
        if not items:
            return []

        db_objs = [self.model(**item) for item in items]
        self.db.add_all(db_objs)
        await self.db.flush()

        # Refresh all objects to get generated IDs and defaults
        for obj in db_objs:
            await self.db.refresh(obj)

        return db_objs

    async def update(self, id: Any, obj_data: dict) -> ModelType | None:
        """
        Update an existing entity.

        Args:
            id: Entity ID
            obj_data: Dictionary of attributes to update

        Returns:
            Updated entity instance or None if not found
        """
        db_obj = await self.get_by_id(id)
        if not db_obj:
            return None
        for key, value in obj_data.items():
            if hasattr(db_obj, key):
                setattr(db_obj, key, value)
        await self.db.flush()
        await self.db.refresh(db_obj)
        return db_obj

    async def bulk_update(self, updates: list[dict]) -> int:
        """
        Bulk update multiple entities.

        Args:
            updates: List of dicts with 'id' and fields to update

        Returns:
            Number of entities updated
        """
        if not updates:
            return 0

        count = 0
        for update_data in updates:
            entity_id = update_data.pop("id", None)
            if entity_id and update_data:
                result = await self.db.execute(
                    sql_update(self.model)
                    .where(self.model.id == entity_id)
                    .values(**update_data)
                )
                count += result.rowcount

        await self.db.flush()
        return count

    async def delete(self, id: Any) -> bool:
        """
        Hard delete an entity by ID.

        Args:
            id: Entity ID

        Returns:
            True if deleted, False if not found
        """
        db_obj = await self.get_by_id(id)
        if not db_obj:
            return False
        await self.db.delete(db_obj)
        await self.db.flush()
        return True

    async def bulk_delete(self, ids: Sequence[Any]) -> int:
        """
        Bulk delete multiple entities by IDs.

        Args:
            ids: List of entity IDs

        Returns:
            Number of entities deleted
        """
        if not ids:
            return 0

        result = await self.db.execute(
            sql_delete(self.model).where(self.model.id.in_(ids))
        )
        await self.db.flush()
        return result.rowcount

    async def soft_delete(self, id: Any) -> bool:
        """
        Soft delete an entity (sets deleted_at timestamp).

        Note: Only works if the model has a 'deleted_at' column.

        Args:
            id: Entity ID

        Returns:
            True if soft deleted, False if not found or no deleted_at column
        """
        if not hasattr(self.model, "deleted_at"):
            return False

        db_obj = await self.get_by_id(id)
        if not db_obj:
            return False

        from datetime import datetime

        db_obj.deleted_at = datetime.utcnow()
        await self.db.flush()
        return True

    async def get_or_create(
        self, filters: list, defaults: dict | None = None
    ) -> tuple[ModelType, bool]:
        """
        Get an existing entity or create a new one.

        Args:
            filters: List of SQLAlchemy filter expressions to find entity
            defaults: Dictionary of attributes for creation (if not found)

        Returns:
            Tuple of (entity, created) where created is True if newly created
        """
        # Try to find existing
        existing = await self.find_one(filters)
        if existing:
            return existing, False

        # Create new
        create_data = defaults or {}
        new_obj = await self.create(create_data)
        return new_obj, True

    async def count(self, filters: list | None = None) -> int:
        """
        Count entities matching filters.

        Args:
            filters: List of SQLAlchemy filter expressions

        Returns:
            Count of matching entities
        """
        stmt = select(func.count()).select_from(self.model)
        if filters:
            for f in filters:
                stmt = stmt.where(f)
        result = await self.db.execute(stmt)
        return result.scalar_one()
