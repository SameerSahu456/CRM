"""add ipn column to products

Revision ID: add_ipn_to_products
Revises: 2a29ace8ebc7
Create Date: 2026-03-04

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_ipn_to_products'
down_revision = '2a29ace8ebc7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('products', sa.Column('ipn', sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column('products', 'ipn')
