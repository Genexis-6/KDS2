from ...dependecy import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import UUID, String, Boolean, DateTime, ForeignKey
import uuid
from datetime import datetime

class StudentsModel(Base):
    __tablename__ = "students"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(100), index=True)
    identifier:Mapped[str] = mapped_column(String(100), index=True, unique=True)
    password: Mapped[str] = mapped_column(String(255), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    
    # Foreign key to ClassModel
    class_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False
    )

    # Many-to-one relationship
    class_: Mapped["ClassModel"] = relationship("ClassModel", back_populates="students")
    
    
    scores: Mapped[list["StudentScoreModel"]] = relationship(
        "StudentScoreModel",
        back_populates="student",
        cascade="all, delete-orphan"
    )
