"""Add type_of_order column to deals table

Revision ID: add_type_of_order_deals
Revises: fix_deals_leads_schema
Create Date: 2026-02-23
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_type_of_order_deals'
down_revision = 'fix_deals_leads_schema'
branch_labels = None
depends_on = None


def _column_exists(table: str, column: str) -> bool:
    from alembic import context
    bind = context.get_bind()
    result = bind.execute(
        sa.text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name = :table AND column_name = :column"
        ),
        {"table": table, "column": column},
    )
    return result.fetchone() is not None


def upgrade() -> None:
    if not _column_exists("deals", "type_of_order"):
        op.add_column("deals", sa.Column("type_of_order", sa.String(100), nullable=True))


def downgrade() -> None:
    if _column_exists("deals", "type_of_order"):
        op.drop_column("deals", "type_of_order")
