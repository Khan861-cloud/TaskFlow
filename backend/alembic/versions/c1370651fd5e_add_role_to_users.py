"""add role to users

Revision ID: c1370651fd5e
Revises: 102a7defc5f7
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "c1370651fd5e"
down_revision: Union[str, Sequence[str], None] = "102a7defc5f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("role", sa.String(length=20), nullable=False, server_default="user"),
    )

    op.alter_column("users", "role", server_default=None)


def downgrade() -> None:
    op.drop_column("users", "role")
