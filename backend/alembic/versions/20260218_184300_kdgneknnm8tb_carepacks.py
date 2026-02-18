"""Create carepacks table

Revision ID: kdgneknnm8tb
Revises: sinm26rcbxjz
Create Date: 2026-02-18 18:43:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'kdgneknnm8tb'
down_revision = 'sinm26rcbxjz'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'carepacks',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('duration_months', sa.Integer, nullable=True),
        sa.Column('price', sa.Numeric(15, 2), nullable=True),
        sa.Column('features', postgresql.JSONB, nullable=True),
        sa.Column('is_active', sa.Boolean, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    


def downgrade() -> None:

    op.drop_table('carepacks')
    
