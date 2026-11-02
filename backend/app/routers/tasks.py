from fastapi import APIRouter, Depends, HTTPException, status, Query

from sqlalchemy.orm import Session

from app.database import get_db
from app.models.task import Task
from app.models.user import User

from typing import Literal
from sqlalchemy import asc, desc

from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.core.logger import logger

from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


# CREATE TASK
@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_task = Task(
        title=task_data.title,
        description=task_data.description,
        completed=task_data.completed,
        user_id=current_user.id,
    )

    try:
        db.add(new_task)
        db.commit()
        db.refresh(new_task)

        logger.info(
            "Task created successfully. Task ID: %s, User ID: %s",
            new_task.id,
            current_user.id,
        )
        return new_task

    except Exception:
        db.rollback()

    logger.exception("Failed to create task")

    raise HTTPException(status_code=500, detail="Failed to create task")


# GET ALL USER TASKS
@router.get("/", response_model=list[TaskResponse])
def get_tasks(
    search: str | None = Query(default=None, min_length=1),
    completed: bool | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    sort_by: Literal["id", "title", "completed"] = "id",
    sort_order: Literal["asc", "desc"] = "asc",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Task).filter(Task.user_id == current_user.id)

    # SEARCH
    if search:
        query = query.filter(
            Task.title.ilike(f"%{search}%") | Task.description.ilike(f"%{search}%")
        )

    # FILTER
    if completed is not None:
        query = query.filter(Task.completed == completed)

    # SORT
    sort_columns = {"id": Task.id, "title": Task.title, "completed": Task.completed}

    selected_column = sort_columns[sort_by]

    if sort_order == "asc":
        query = query.order_by(asc(selected_column))
    else:
        query = query.order_by(desc(selected_column))

    # PAGINATION
    tasks = query.offset(skip).limit(limit).all()

    return tasks


# GET ONE TASK
@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == current_user.id)
        .first()
    )

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    return task


# UPDATE TASK
@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == current_user.id)
        .first()
    )

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    task.title = task_data.title
    task.description = task_data.description
    task.completed = task_data.completed

    db.commit()
    db.refresh(task)

    return task


# PARTIAL UPDATE TASK
@router.patch("/{task_id}", response_model=TaskResponse)
def patch_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == current_user.id)
        .first()
    )

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    updated_data = task_data.model_dump(exclude_unset=True)

    for field, value in updated_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)

    return task


# DELETE TASK
@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == current_user.id)
        .first()
    )

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()

    return {"message": "Task deleted successfully"}
