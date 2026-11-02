from pydantic import BaseModel, Field
from datetime import datetime


class TaskCreate(BaseModel):

    title: str = Field(..., min_length=3, max_length=100, description="Task title")

    description: str | None = Field(
        default=None, min_length=5, max_length=500, description="Task description"
    )

    completed: bool = False


class TaskUpdate(BaseModel):

    title: str | None = Field(default=None, min_length=3, max_length=100)

    description: str | None = Field(default=None, min_length=5, max_length=500)

    completed: bool | None = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str | None
    completed: bool
    created_at: datetime
    updated_at: datetime
