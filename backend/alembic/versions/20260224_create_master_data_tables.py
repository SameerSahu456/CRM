"""Create master data tables (locations, verticals, oems, partner_types, categories)

These tables are referenced by master_data_service.py ENTITY_MAP but were
never created via migration, causing CRUD operations to fail at runtime.

Revision ID: create_master_data_tables
Revises: add_type_of_order_deals
Create Date: 2026-02-24
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'create_master_data_tables'
down_revision = 'add_type_of_order_deals'
branch_labels = None
depends_on = None


def _table_exists(table: str) -> bool:
    from alembic import context
    bind = context.get_bind()
    result = bind.execute(
        sa.text(
            "SELECT 1 FROM information_schema.tables "
            "WHERE table_name = :table AND table_schema = 'public'"
        ),
        {"table": table},
    )
    return result.fetchone() is not None


def upgrade() -> None:
    # --- master_locations ---
    if not _table_exists("master_locations"):
        op.create_table(
            "master_locations",
            sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
            sa.Column("city", sa.String(100), nullable=False),
            sa.Column("state", sa.String(100), nullable=True),
            sa.Column("region", sa.String(50), nullable=True),
            sa.Column("is_active", sa.Boolean, server_default="true"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )

    # --- master_verticals ---
    if not _table_exists("master_verticals"):
        op.create_table(
            "master_verticals",
            sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
            sa.Column("name", sa.String(255), nullable=False, unique=True),
            sa.Column("is_active", sa.Boolean, server_default="true"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )

    # --- master_oems ---
    if not _table_exists("master_oems"):
        op.create_table(
            "master_oems",
            sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
            sa.Column("name", sa.String(255), nullable=False, unique=True),
            sa.Column("is_active", sa.Boolean, server_default="true"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )

    # --- master_partner_types ---
    if not _table_exists("master_partner_types"):
        op.create_table(
            "master_partner_types",
            sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
            sa.Column("name", sa.String(255), nullable=False, unique=True),
            sa.Column("is_active", sa.Boolean, server_default="true"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )

    # --- master_categories ---
    if not _table_exists("master_categories"):
        op.create_table(
            "master_categories",
            sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("oem_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("is_active", sa.Boolean, server_default="true"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )


def downgrade() -> None:
    for table in ["master_categories", "master_partner_types", "master_oems", "master_verticals", "master_locations"]:
        if _table_exists(table):
            op.drop_table(table)
