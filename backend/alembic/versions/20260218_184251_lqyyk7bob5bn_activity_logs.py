"""Create activity_logs table

Revision ID: lqyyk7bob5bn
Revises: 7q32csgkpwmu
Create Date: 2026-02-18 18:42:51

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'lqyyk7bob5bn'
down_revision = '7q32csgkpwmu'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'activity_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('user_name', sa.String(200), nullable=True),
        sa.Column('action', sa.String(20), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('entity_name', sa.String(255), nullable=True),
        sa.Column('changes', postgresql.JSONB, nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_activity_logs_user_id', 'activity_logs', ['user_id'])
    op.create_index('ix_activity_logs_entity_type', 'activity_logs', ['entity_type'])
    op.create_index('ix_activity_logs_created_at', 'activity_logs', ['created_at'])
    


def downgrade() -> None:

    op.drop_index('ix_activity_logs_created_at', 'activity_logs')
    op.drop_index('ix_activity_logs_entity_type', 'activity_logs')
    op.drop_index('ix_activity_logs_user_id', 'activity_logs')
    op.drop_table('activity_logs')
    
