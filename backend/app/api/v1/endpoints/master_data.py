from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_admin
from app.middleware.security import get_current_user
from app.models.user import User
from app.services.master_data_service import MasterDataService
from app.utils.response_utils import (
    created_response,
    deleted_response,
    success_response,
)

router = APIRouter()


@router.get("/dropdowns/all")
async def list_all_dropdowns(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return all dropdown entities in a single request.

    Returns:
        Dictionary with entity names as keys and lists of dropdown items as values
    """
    service = MasterDataService(db)
    data = await service.list_all_dropdowns()
    return success_response(data, "Dropdowns retrieved successfully")


@router.get("/{entity}")
async def list_master_data(
    entity: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get master data for a specific entity.

    Returns:
        List of master data items
    """
    service = MasterDataService(db)
    data = await service.list_master_data(entity)
    return success_response(data, f"{entity} retrieved successfully")


@router.post("/{entity}")
async def create_master_data(
    entity: str,
    body: dict,
    admin: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new master data item (admin only).

    Returns:
        Created item
    """
    service = MasterDataService(db)
    data = await service.create_master_data(entity, body, admin)
    return created_response(data, f"{entity} item created successfully")


@router.put("/{entity}/{item_id}")
async def update_master_data(
    entity: str,
    item_id: str,
    body: dict,
    admin: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a master data item (admin only).

    Returns:
        Updated item
    """
    service = MasterDataService(db)
    data = await service.update_master_data(entity, item_id, body, admin)
    return success_response(data, f"{entity} item updated successfully")


@router.delete("/{entity}/{item_id}")
async def delete_master_data(
    entity: str,
    item_id: str,
    admin: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a master data item (admin only).

    Returns:
        Success status
    """
    service = MasterDataService(db)
    await service.delete_master_data(entity, item_id, admin)
    return deleted_response(f"{entity} item deleted successfully")
