"""Create role_permissions table

Revision ID: urq3jqqxoo6a
Revises: c2zkz7gpala3
Create Date: 2026-02-18 18:42:49

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'urq3jqqxoo6a'
down_revision = 'c2zkz7gpala3'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'role_permissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('role_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('roles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('resource', sa.String(100), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_role_permissions_role_id', 'role_permissions', ['role_id'])
    


def downgrade() -> None:

    op.drop_index('ix_role_permissions_role_id', 'role_permissions')
    op.drop_table('role_permissions')
    
