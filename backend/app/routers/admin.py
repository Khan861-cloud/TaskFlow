from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.user import User
from app.models.task import Task

from app.schemas.user import UserResponse
from app.core.permissions import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# GET ALL USERS - ADMIN ONLY
@router.get("/users", response_model=list[UserResponse])
def get_all_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    users = (
        db.query(User)
        .options(selectinload(User.tasks))
        .order_by(User.id)
        .offset(skip)
        .limit(limit)
        .all()
    )

    return users


# GET ALL TASKS - ADMIN ONLY
@router.get("/tasks")
def get_all_tasks(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    tasks = db.query(Task).order_by(Task.id).offset(skip).limit(limit).all()

    return tasks
