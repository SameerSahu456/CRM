"""Enable UUID extension

Revision ID: iimukfaipc36
Revises: 
Create Date: 2026-02-18 18:42:43

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'iimukfaipc36'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:

    # Enable UUID extension for PostgreSQL
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    


def downgrade() -> None:

    # Note: We don't drop the extension as other tables may depend on it
    pass
    
