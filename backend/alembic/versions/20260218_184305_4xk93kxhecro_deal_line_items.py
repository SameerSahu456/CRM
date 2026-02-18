"""Create deal_line_items table

Revision ID: 4xk93kxhecro
Revises: qv03u53t048j
Create Date: 2026-02-18 18:43:05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '4xk93kxhecro'
down_revision = 'qv03u53t048j'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'deal_line_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('deal_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('deals.id', ondelete='CASCADE'), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('products.id', ondelete='SET NULL'), nullable=True),
        sa.Column('product_name', sa.String(255), nullable=False),
        sa.Column('quantity', sa.Integer, nullable=False, server_default='1'),
        sa.Column('unit_price', sa.Numeric(15, 2), nullable=False),
        sa.Column('discount', sa.Numeric(15, 2), nullable=True),
        sa.Column('total_price', sa.Numeric(15, 2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_deal_line_items_deal_id', 'deal_line_items', ['deal_id'])
    


def downgrade() -> None:

    op.drop_index('ix_deal_line_items_deal_id', 'deal_line_items')
    op.drop_table('deal_line_items')
    
