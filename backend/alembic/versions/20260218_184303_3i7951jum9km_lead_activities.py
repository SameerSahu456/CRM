"""Create lead_activities table

Revision ID: 3i7951jum9km
Revises: 3wp1p96bv1ln
Create Date: 2026-02-18 18:43:03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '3i7951jum9km'
down_revision = '3wp1p96bv1ln'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'lead_activities',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('lead_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('leads.id', ondelete='CASCADE'), nullable=False),
        sa.Column('activity_type', sa.String(50), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_lead_activities_lead_id', 'lead_activities', ['lead_id'])
    


def downgrade() -> None:

    op.drop_index('ix_lead_activities_lead_id', 'lead_activities')
    op.drop_table('lead_activities')
    
