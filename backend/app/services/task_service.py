"""
Task Service Layer

This module contains all business logic for task management.
Following SOLID principles with clear separation of concerns.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundException
from app.models.task import Task
from app.models.user import User
from app.repositories.task_repository import TaskRepository
from app.schemas.task_schema import TaskCreate, TaskOut, TaskUpdate
from app.utils.activity_logger import compute_changes, log_activity, model_to_dict
from app.utils.scoping import enforce_scope, get_scoped_user_ids


class TaskService:
    """
    Service class for task business logic.

    Responsibilities:
    - Task CRUD operations with business rules
    - Access control and scoping
    - Activity logging and audit trails
    - Task statistics and analytics
    """

    def __init__(self, db: AsyncSession):
        """
        Initialize TaskService.

        Args:
            db: Database session
        """
        self.db = db
        self.task_repo = TaskRepository(db)

    async def list_tasks(
        self,
        page: int,
        limit: int,
        user: User,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        type: Optional[str] = None,
        assigned_to: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        List tasks with filtering, pagination, and access control.

        Args:
            page: Page number
            limit: Items per page
            user: Current authenticated user
            status: Optional filter by status
            priority: Optional filter by priority
            type: Optional filter by type
            assigned_to: Optional filter by assigned user

        Returns:
            Dictionary with 'data' and 'pagination'
        """
        # Build filters
        filters = []
        if status:
            filters.append(Task.status == status)
        if priority:
            filters.append(Task.priority == priority)
        if type:
            filters.append(Task.type == type)
        if assigned_to:
            filters.append(Task.assigned_to == assigned_to)

        # Apply access control scoping
        scoped_ids = await get_scoped_user_ids(user, self.db)
        if scoped_ids is not None:
            filters.append(Task.assigned_to.in_(scoped_ids))

        # Get data from repository
        result = await self.task_repo.get_with_names(
            page=page, limit=limit, filters=filters or None
        )

        # Transform data
        data = []
        for item in result["data"]:
            out = TaskOut.model_validate(item["task"]).model_dump(by_alias=True)
            out["assignedToName"] = item["assigned_to_name"]
            out["createdByName"] = item["created_by_name"]
            data.append(out)

        return {"data": data, "pagination": result["pagination"]}

    async def get_task_stats(self, user: User) -> Dict[str, Any]:
        """
        Get task statistics with access control.

        Args:
            user: Current authenticated user

        Returns:
            Task statistics
        """
        filters = []
        scoped_ids = await get_scoped_user_ids(user, self.db)
        if scoped_ids is not None:
            filters.append(Task.assigned_to.in_(scoped_ids))

        return await self.task_repo.get_stats(filters=filters or None)

    async def get_task_by_id(self, task_id: str, user: User) -> Dict[str, Any]:
        """
        Get a single task by ID with access control.

        Args:
            task_id: Task UUID
            user: Current authenticated user

        Returns:
            Task data

        Raises:
            NotFoundException: If task not found
        """
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise NotFoundException("Task not found")

        # Enforce access control
        await enforce_scope(task, "assigned_to", user, self.db, resource_name="task")

        return TaskOut.model_validate(task).model_dump(by_alias=True)

    async def create_task(self, task_data: TaskCreate, user: User) -> Dict[str, Any]:
        """
        Create a new task.

        Args:
            task_data: Task creation data
            user: Current authenticated user

        Returns:
            Created task data
        """
        # Prepare data
        data = task_data.model_dump(exclude_unset=True)

        # Set assigned_to and created_by to current user if not specified
        if "assigned_to" not in data or data["assigned_to"] is None:
            data["assigned_to"] = user.id
        if "created_by" not in data:
            data["created_by"] = user.id

        # Create task
        task = await self.task_repo.create(data)

        # Log activity
        await log_activity(self.db, user, "create", "task", str(task.id), task.title)

        return TaskOut.model_validate(task).model_dump(by_alias=True)

    async def update_task(self, task_id: str, task_data: TaskUpdate, user: User) -> Dict[str, Any]:
        """
        Update an existing task.

        Args:
            task_id: Task UUID
            task_data: Task update data
            user: Current authenticated user

        Returns:
            Updated task data

        Raises:
            NotFoundException: If task not found
        """
        # Get existing task
        old = await self.task_repo.get_by_id(task_id)
        if not old:
            raise NotFoundException("Task not found")

        # Enforce access control
        await enforce_scope(old, "assigned_to", user, self.db, resource_name="task")

        # Track changes for audit log
        old_data = model_to_dict(old)

        # Update task
        task = await self.task_repo.update(task_id, task_data.model_dump(exclude_unset=True))

        # Log activity with changes
        changes = compute_changes(old_data, model_to_dict(task))
        await log_activity(self.db, user, "update", "task", str(task.id), task.title, changes)

        return TaskOut.model_validate(task).model_dump(by_alias=True)

    async def delete_task(self, task_id: str, user: User) -> bool:
        """
        Delete a task.

        Args:
            task_id: Task UUID
            user: Current authenticated user

        Returns:
            True if successful

        Raises:
            NotFoundException: If task not found
        """
        # Get existing task
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise NotFoundException("Task not found")

        # Enforce access control
        await enforce_scope(task, "assigned_to", user, self.db, resource_name="task")

        # Store title before deletion
        task_title = task.title

        # Delete task
        await self.task_repo.delete(task_id)

        # Log activity
        await log_activity(self.db, user, "delete", "task", task_id, task_title)

        return True

    async def complete_task(self, task_id: str, user: User) -> Dict[str, Any]:
        """
        Mark a task as completed.

        Args:
            task_id: Task UUID
            user: Current authenticated user

        Returns:
            Updated task data

        Raises:
            NotFoundException: If task not found
        """
        old = await self.task_repo.get_by_id(task_id)
        if not old:
            raise NotFoundException("Task not found")

        await enforce_scope(old, "assigned_to", user, self.db, resource_name="task")
        old_data = model_to_dict(old)

        task = await self.task_repo.update(
            task_id,
            {
                "status": "completed",
                "completed_at": datetime.now(timezone.utc),
            },
        )

        changes = compute_changes(old_data, model_to_dict(task))
        await log_activity(self.db, user, "update", "task", str(task.id), task.title, changes)

        return TaskOut.model_validate(task).model_dump(by_alias=True)
