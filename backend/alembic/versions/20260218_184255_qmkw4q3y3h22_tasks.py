"""Create tasks table

Revision ID: qmkw4q3y3h22
Revises: 5hqnp1zprabv
Create Date: 2026-02-18 18:42:55

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'qmkw4q3y3h22'
down_revision = '5hqnp1zprabv'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'tasks',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('status', sa.String(50), server_default='pending'),
        sa.Column('priority', sa.String(20), server_default='medium'),
        sa.Column('assigned_to', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('related_to_type', sa.String(50), nullable=True),
        sa.Column('related_to_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_tasks_status', 'tasks', ['status'])
    op.create_index('ix_tasks_assigned_to', 'tasks', ['assigned_to'])
    op.create_index('ix_tasks_due_date', 'tasks', ['due_date'])
    


def downgrade() -> None:

    op.drop_index('ix_tasks_due_date', 'tasks')
    op.drop_index('ix_tasks_assigned_to', 'tasks')
    op.drop_index('ix_tasks_status', 'tasks')
    op.drop_table('tasks')
    
