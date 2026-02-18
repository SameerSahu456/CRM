"""Create emails table

Revision ID: j3zjhx3tv5f4
Revises: qmkw4q3y3h22
Create Date: 2026-02-18 18:42:56

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'j3zjhx3tv5f4'
down_revision = 'qmkw4q3y3h22'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'emails',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('subject', sa.String(500), nullable=False),
        sa.Column('body', sa.Text, nullable=False),
        sa.Column('from_address', sa.String(255), nullable=False),
        sa.Column('to_addresses', sa.Text, nullable=False),
        sa.Column('cc_addresses', sa.Text, nullable=True),
        sa.Column('bcc_addresses', sa.Text, nullable=True),
        sa.Column('status', sa.String(50), server_default='draft'),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('related_to_type', sa.String(50), nullable=True),
        sa.Column('related_to_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_emails_status', 'emails', ['status'])
    op.create_index('ix_emails_created_by', 'emails', ['created_by'])
    


def downgrade() -> None:

    op.drop_index('ix_emails_created_by', 'emails')
    op.drop_index('ix_emails_status', 'emails')
    op.drop_table('emails')
    
