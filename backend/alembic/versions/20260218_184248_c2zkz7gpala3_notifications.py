"""Create notifications table

Revision ID: c2zkz7gpala3
Revises: hnsye45jlwyt
Create Date: 2026-02-18 18:42:48

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c2zkz7gpala3'
down_revision = 'hnsye45jlwyt'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('type', sa.String(50), nullable=True),
        sa.Column('is_read', sa.Boolean, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('ix_notifications_is_read', 'notifications', ['is_read'])
    


def downgrade() -> None:

    op.drop_index('ix_notifications_is_read', 'notifications')
    op.drop_index('ix_notifications_user_id', 'notifications')
    op.drop_table('notifications')
    
