"""merge kanban_order and fix_view_access

Revision ID: 2a29ace8ebc7
Revises: add_kanban_order, fix_view_access_values
Create Date: 2026-02-27 13:31:00.722877

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2a29ace8ebc7'
down_revision = ('add_kanban_order', 'fix_view_access_values')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

