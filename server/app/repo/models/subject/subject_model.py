from ...dependecy import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import UUID, String, Boolean, DateTime, ForeignKey
import uuid
from datetime import datetime

class SubJectModel(Base):
    __tablename__ = "subjects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(100), index=True)
    author: Mapped[str] = mapped_column(String(100), index=True)
    enable: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    class_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("classes.id", ondelete="CASCADE"),
        nullable=False
    )

    class_: Mapped["ClassModel"] = relationship("ClassModel", back_populates="subjects")


    question: Mapped[list["QuestionModel"]] = relationship(
        "QuestionModel",
        back_populates="subject",
        cascade="all, delete-orphan"
    )

    # One-to-one with TimerModel
    timer: Mapped["TimerModel"] = relationship(
        "TimerModel",
        back_populates="subject",
        uselist=False,
        cascade="all, delete-orphan"
    )


    filter_question: Mapped["FilterQuestionModel"] = relationship(
        "FilterQuestionModel",
        back_populates="subject",
        uselist=False,
        cascade="all, delete-orphan"
    )
    
    
    scores: Mapped[list["StudentScoreModel"]] = relationship(
        "StudentScoreModel",
        back_populates="subject",
        cascade="all, delete-orphan"
    )
