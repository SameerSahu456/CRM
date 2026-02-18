"""Create deal_activities table

Revision ID: zp5q8fjsn927
Revises: 4xk93kxhecro
Create Date: 2026-02-18 18:43:06

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'zp5q8fjsn927'
down_revision = '4xk93kxhecro'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'deal_activities',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('deal_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('deals.id', ondelete='CASCADE'), nullable=False),
        sa.Column('activity_type', sa.String(50), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_deal_activities_deal_id', 'deal_activities', ['deal_id'])
    


def downgrade() -> None:

    op.drop_index('ix_deal_activities_deal_id', 'deal_activities')
    op.drop_table('deal_activities')
    
