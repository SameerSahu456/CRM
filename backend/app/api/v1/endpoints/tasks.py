"""
Task API Endpoints

This module contains all HTTP endpoints for task management.
Controllers are thin and delegate business logic to the TaskService.

Following SOLID principles:
- Single Responsibility: Controllers only handle HTTP request/response
- Dependency Inversion: Depends on service abstraction
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.security import get_current_user
from app.models.user import User
from app.schemas.task_schema import TaskCreate, TaskUpdate
from app.services.task_service import TaskService
from app.utils.response_utils import (
    created_response,
    deleted_response,
    paginated_response,
    success_response,
)

router = APIRouter()


@router.get("/")
async def list_tasks(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    type: Optional[str] = Query(None, description="Filter by type"),
    assigned_to: Optional[str] = Query(None, description="Filter by assigned user"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    List tasks with filtering and pagination.

    Returns standardized response:
    {
        "code": 200,
        "data": [...],
        "message": "Success",
        "pagination": {...}
    }
    """
    service = TaskService(db)
    result = await service.list_tasks(
        page=page,
        limit=limit,
        user=user,
        status=status,
        priority=priority,
        type=type,
        assigned_to=assigned_to,
    )

    return paginated_response(
        data=result["data"],
        page=page,
        limit=limit,
        total=result["pagination"]["total"],
        message="Tasks retrieved successfully",
    )


@router.get("/stats")
async def task_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get task statistics.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = TaskService(db)
    stats = await service.get_task_stats(user=user)

    return success_response(data=stats, message="Task stats retrieved successfully")


@router.get("/{task_id}")
async def get_task(
    task_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get a single task by ID.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = TaskService(db)
    task = await service.get_task_by_id(task_id=task_id, user=user)

    return success_response(data=task, message="Task retrieved successfully")


@router.post("/")
async def create_task(
    body: TaskCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Create a new task.

    Returns standardized response:
    {
        "code": 201,
        "data": {...},
        "message": "Created successfully"
    }
    """
    service = TaskService(db)
    task = await service.create_task(task_data=body, user=user)

    return created_response(data=task, message="Task created successfully")


@router.put("/{task_id}")
async def update_task(
    task_id: str,
    body: TaskUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Update an existing task.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = TaskService(db)
    task = await service.update_task(task_id=task_id, task_data=body, user=user)

    return success_response(data=task, message="Task updated successfully")


@router.put("/{task_id}/complete")
async def complete_task(
    task_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Mark a task as completed.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = TaskService(db)
    task = await service.complete_task(task_id=task_id, user=user)

    return success_response(data=task, message="Task marked as completed")


@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Delete a task.

    Returns standardized response:
    {
        "code": 200,
        "data": null,
        "message": "Deleted successfully"
    }
    """
    service = TaskService(db)
    await service.delete_task(task_id=task_id, user=user)

    return deleted_response(message="Task deleted successfully")
