"""Create quote_terms table

Revision ID: sinm26rcbxjz
Revises: kw8dn7gssdzn
Create Date: 2026-02-18 18:42:58

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'sinm26rcbxjz'
down_revision = 'kw8dn7gssdzn'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'quote_terms',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('is_default', sa.Boolean, server_default='false'),
        sa.Column('display_order', sa.Integer, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_quote_terms_category', 'quote_terms', ['category'])
    


def downgrade() -> None:

    op.drop_index('ix_quote_terms_category', 'quote_terms')
    op.drop_table('quote_terms')
    
