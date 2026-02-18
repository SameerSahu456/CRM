"""Create roles table

Revision ID: q2sieczfy5f3
Revises: d8rssyg78clp
Create Date: 2026-02-18 18:42:45

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'q2sieczfy5f3'
down_revision = 'd8rssyg78clp'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'roles',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('name', sa.String(100), unique=True, nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_roles_name', 'roles', ['name'])
    


def downgrade() -> None:

    op.drop_index('ix_roles_name', 'roles')
    op.drop_table('roles')
    
