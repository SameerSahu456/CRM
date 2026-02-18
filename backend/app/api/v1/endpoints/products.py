"""
Product API Endpoints

This module contains all HTTP endpoints for product management.
Controllers are thin and delegate business logic to the ProductService.

Following SOLID principles:
- Single Responsibility: Controllers only handle HTTP request/response
- Dependency Inversion: Depends on service abstraction
"""

from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.security import get_current_user
from app.models.user import User
from app.schemas.product_schema import ProductCreate, ProductOut, ProductUpdate
from app.services.product_service import ProductService
from app.utils.response_utils import (
    created_response,
    deleted_response,
    success_response,
)

router = APIRouter()


@router.get("/")
async def list_products(
    include_inactive: bool = Query(
        False, description="Include inactive products in the list"
    ),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    List all products or only active products.

    Returns standardized response:
    {
        "code": 200,
        "data": [...],
        "message": "Success"
    }
    """
    service = ProductService(db)
    products = await service.list_products(include_inactive=include_inactive)

    return success_response(data=products, message="Products retrieved successfully")


@router.get("/{product_id}")
async def get_product(
    product_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get a single product by ID.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = ProductService(db)
    product = await service.get_product_by_id(product_id=product_id)

    return success_response(data=product, message="Product retrieved successfully")


@router.post("/")
async def create_product(
    body: ProductCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Create a new product.

    Returns standardized response:
    {
        "code": 201,
        "data": {...},
        "message": "Created successfully"
    }
    """
    service = ProductService(db)
    product = await service.create_product(product_data=body, user=user)

    return created_response(data=product, message="Product created successfully")


@router.put("/{product_id}")
async def update_product(
    product_id: str,
    body: ProductUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Update an existing product.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = ProductService(db)
    product = await service.update_product(
        product_id=product_id, product_data=body, user=user
    )

    return success_response(data=product, message="Product updated successfully")


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Delete a product.

    Returns standardized response:
    {
        "code": 200,
        "data": null,
        "message": "Deleted successfully"
    }
    """
    service = ProductService(db)
    await service.delete_product(product_id=product_id, user=user)

    return deleted_response(message="Product deleted successfully")
