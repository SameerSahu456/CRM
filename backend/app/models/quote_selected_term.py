import uuid

from sqlalchemy import Integer, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class QuoteSelectedTerm(Base):
    __tablename__ = "quote_selected_terms"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()")
    )
    quote_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    term_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, server_default="0")
