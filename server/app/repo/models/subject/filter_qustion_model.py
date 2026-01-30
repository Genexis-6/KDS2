from ...dependecy import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import UUID, String, Boolean, DateTime, ForeignKey, Integer
import uuid
from datetime import datetime


class FilterQuestionModel(Base):
    __tablename__ = "filter_questions"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    
    num_of_qa: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        comment="Number of questions/answers in the filter"
    )
    
    score_per_qa: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        comment="Score per question/answer"
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.now
    )
    
    # ForeignKey to SubjectModel - 1:1 relationship
    subject_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("subjects.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # Ensures 1:1 relationship
        index=True
    )
    
    # Relationship to SubjectModel
    subject: Mapped["SubJectModel"] = relationship(
        "SubJectModel",
        back_populates="filter_question",
        uselist=False  # Ensures 1:1 relationship
    )