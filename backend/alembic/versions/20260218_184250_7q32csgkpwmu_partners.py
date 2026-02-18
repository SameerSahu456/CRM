"""Create partners table

Revision ID: 7q32csgkpwmu
Revises: urq3jqqxoo6a
Create Date: 2026-02-18 18:42:50

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '7q32csgkpwmu'
down_revision = 'urq3jqqxoo6a'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'partners',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('type', sa.String(100), nullable=True),
        sa.Column('status', sa.String(50), server_default='active'),
        sa.Column('contact_person', sa.String(255), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('website', sa.String(500), nullable=True),
        sa.Column('address', sa.Text, nullable=True),
        sa.Column('commission_rate', sa.Numeric(5, 2), nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_partners_status', 'partners', ['status'])
    


def downgrade() -> None:

    op.drop_index('ix_partners_status', 'partners')
    op.drop_table('partners')
    
