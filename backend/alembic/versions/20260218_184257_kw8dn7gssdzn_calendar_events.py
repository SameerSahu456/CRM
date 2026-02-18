"""Create calendar_events table

Revision ID: kw8dn7gssdzn
Revises: j3zjhx3tv5f4
Create Date: 2026-02-18 18:42:57

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'kw8dn7gssdzn'
down_revision = 'j3zjhx3tv5f4'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'calendar_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('location', sa.String(500), nullable=True),
        sa.Column('event_type', sa.String(50), nullable=True),
        sa.Column('attendees', postgresql.ARRAY(sa.String), nullable=True),
        sa.Column('related_to_type', sa.String(50), nullable=True),
        sa.Column('related_to_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_calendar_events_start_time', 'calendar_events', ['start_time'])
    op.create_index('ix_calendar_events_created_by', 'calendar_events', ['created_by'])
    


def downgrade() -> None:

    op.drop_index('ix_calendar_events_created_by', 'calendar_events')
    op.drop_index('ix_calendar_events_start_time', 'calendar_events')
    op.drop_table('calendar_events')
    
