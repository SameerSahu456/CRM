"""Add kanban_order column to leads and deals

Revision ID: add_kanban_order
Revises: add_deal_id_to_quotes
Create Date: 2026-02-27
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_kanban_order'
down_revision = 'add_deal_id_to_quotes'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add kanban_order to leads
    op.add_column('leads', sa.Column('kanban_order', sa.Integer(), server_default='0', nullable=False))
    op.create_index('ix_leads_stage_kanban_order', 'leads', ['stage', 'kanban_order'])

    # Add kanban_order to deals
    op.add_column('deals', sa.Column('kanban_order', sa.Integer(), server_default='0', nullable=False))
    op.create_index('ix_deals_stage_kanban_order', 'deals', ['stage', 'kanban_order'])


def downgrade() -> None:
    op.drop_index('ix_deals_stage_kanban_order', table_name='deals')
    op.drop_column('deals', 'kanban_order')
    op.drop_index('ix_leads_stage_kanban_order', table_name='leads')
    op.drop_column('leads', 'kanban_order')
