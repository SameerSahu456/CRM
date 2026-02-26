"""Add deal_id column to quotes table

Revision ID: add_deal_id_to_quotes
Revises: create_master_data_tables
Create Date: 2026-02-26
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'add_deal_id_to_quotes'
down_revision = 'create_master_data_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add deal_id column to quotes table
    op.add_column(
        'quotes',
        sa.Column('deal_id', postgresql.UUID(as_uuid=True), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('quotes', 'deal_id')
