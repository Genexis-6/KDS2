from ...dependecy import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import UUID, Integer, DateTime, ForeignKey
import uuid
from datetime import datetime

class TimerModel(Base):
    __tablename__ = "timer"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hr: Mapped[int] = mapped_column(Integer, index=True)
    mins: Mapped[int] = mapped_column(Integer, index=True)
    sec: Mapped[int] = mapped_column(Integer, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    # One-to-one relationship → link each timer to one subject
    subject_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("subjects.id", ondelete="CASCADE"),
        unique=True,     
        nullable=False
    )

    subject: Mapped["SubJectModel"] = relationship(
        "SubJectModel",
        back_populates="timer",
        uselist=False
    )
