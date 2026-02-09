from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import NotFoundException
from app.middleware.security import get_current_user
from app.models.Task import Task
from app.models.User import User
from app.repositories.TaskRepository import TaskRepository
from app.schemas.TaskSchema import TaskOut, TaskCreate, TaskUpdate

router = APIRouter()


@router.get("/")
async def list_tasks(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    type: Optional[str] = None,
    assigned_to: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    filters = []
    if status:
        filters.append(Task.status == status)
    if priority:
        filters.append(Task.priority == priority)
    if type:
        filters.append(Task.type == type)
    if assigned_to:
        filters.append(Task.assigned_to == assigned_to)

    if user.role == "salesperson":
        filters.append(Task.assigned_to == user.id)

    result = await repo.get_with_names(page=page, limit=limit, filters=filters or None)

    data = []
    for item in result["data"]:
        out = TaskOut.model_validate(item["task"]).model_dump(by_alias=True)
        out["assignedToName"] = item["assigned_to_name"]
        out["createdByName"] = item["created_by_name"]
        data.append(out)

    return {"data": data, "pagination": result["pagination"]}


@router.get("/stats")
async def task_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    filters = []
    if user.role == "salesperson":
        filters.append(Task.assigned_to == user.id)
    return await repo.get_stats(filters=filters or None)


@router.get("/{task_id}")
async def get_task(
    task_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    task = await repo.get_by_id(task_id)
    if not task:
        raise NotFoundException("Task not found")
    return TaskOut.model_validate(task).model_dump(by_alias=True)


@router.post("/")
async def create_task(
    body: TaskCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    data = body.model_dump(exclude_unset=True)
    if "created_by" not in data or data["created_by"] is None:
        data["created_by"] = user.id
    if "assigned_to" not in data or data["assigned_to"] is None:
        data["assigned_to"] = user.id
    task = await repo.create(data)
    return TaskOut.model_validate(task).model_dump(by_alias=True)


@router.put("/{task_id}")
async def update_task(
    task_id: str,
    body: TaskUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    task = await repo.update(task_id, body.model_dump(exclude_unset=True))
    if not task:
        raise NotFoundException("Task not found")
    return TaskOut.model_validate(task).model_dump(by_alias=True)


@router.put("/{task_id}/complete")
async def complete_task(
    task_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    task = await repo.update(task_id, {
        "status": "completed",
        "completed_at": datetime.now(timezone.utc),
    })
    if not task:
        raise NotFoundException("Task not found")
    return TaskOut.model_validate(task).model_dump(by_alias=True)


@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    deleted = await repo.delete(task_id)
    if not deleted:
        raise NotFoundException("Task not found")
    return {"success": True}
