"""Create products table

Revision ID: 952qs98dj1h2
Revises: q2sieczfy5f3
Create Date: 2026-02-18 18:42:46

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '952qs98dj1h2'
down_revision = 'q2sieczfy5f3'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'products',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('sku', sa.String(100), unique=True, nullable=True),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('unit_price', sa.Numeric(15, 2), nullable=True),
        sa.Column('cost_price', sa.Numeric(15, 2), nullable=True),
        sa.Column('is_active', sa.Boolean, server_default='true'),
        sa.Column('stock_quantity', sa.Integer, nullable=True),
        sa.Column('reorder_level', sa.Integer, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_products_sku', 'products', ['sku'])
    op.create_index('ix_products_category', 'products', ['category'])
    


def downgrade() -> None:

    op.drop_index('ix_products_category', 'products')
    op.drop_index('ix_products_sku', 'products')
    op.drop_table('products')
    
