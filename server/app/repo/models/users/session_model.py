from ...dependecy import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import UUID, String, Boolean, DateTime, ForeignKey
import uuid
from datetime import datetime


class SessionModel(Base):
    """
    Tracks a single active exam/login session per student.
    A student can only have ONE active row (student_id is unique).
    The row is deactivated (is_active=False) on manual logout,
    on exam submission, on natural expiry, or when an admin force-clears it.
    """
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("students.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    session_token: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
