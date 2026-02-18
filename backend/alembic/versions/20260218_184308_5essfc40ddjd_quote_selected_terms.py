"""Create quote_selected_terms table

Revision ID: 5essfc40ddjd
Revises: lyxeu564zkq9
Create Date: 2026-02-18 18:43:08

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '5essfc40ddjd'
down_revision = 'lyxeu564zkq9'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'quote_selected_terms',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('quote_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('quotes.id', ondelete='CASCADE'), nullable=False),
        sa.Column('term_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('quote_terms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_quote_selected_terms_quote_id', 'quote_selected_terms', ['quote_id'])
    op.create_index('ix_quote_selected_terms_term_id', 'quote_selected_terms', ['term_id'])
    


def downgrade() -> None:

    op.drop_index('ix_quote_selected_terms_term_id', 'quote_selected_terms')
    op.drop_index('ix_quote_selected_terms_quote_id', 'quote_selected_terms')
    op.drop_table('quote_selected_terms')
    
