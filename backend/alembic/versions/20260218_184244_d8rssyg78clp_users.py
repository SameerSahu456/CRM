"""Create users table

Revision ID: d8rssyg78clp
Revises: iimukfaipc36
Create Date: 2026-02-18 18:42:44

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'd8rssyg78clp'
down_revision = 'iimukfaipc36'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, server_default='sales'),
        sa.Column('department', sa.String(100), nullable=True),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('employee_id', sa.String(50), nullable=True),
        sa.Column('manager_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_active', sa.Boolean, server_default='true'),
        sa.Column('must_change_password', sa.Boolean, server_default='false'),
        sa.Column('monthly_target', sa.Numeric(15, 2), nullable=True),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.Column('view_access', sa.String(50), nullable=False, server_default='presales'),
        sa.Column('tag', sa.String(50), nullable=True),
        sa.Column('dashboard_preferences', postgresql.JSONB, nullable=True,
                  server_default=sa.text("'{\"widgets\": [], \"lastModified\": null}'::jsonb")),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_role', 'users', ['role'])
    


def downgrade() -> None:

    op.drop_index('ix_users_role', 'users')
    op.drop_index('ix_users_email', 'users')
    op.drop_table('users')
    
