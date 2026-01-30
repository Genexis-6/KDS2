from ...dependecy import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import UUID, String, Boolean, DateTime, ForeignKey
import uuid
from datetime import datetime


class ClassModel(Base):
    __tablename__ = "classes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_name: Mapped[str] = mapped_column(String(100), index=True, unique=True)
    teacher_name:Mapped[str] = mapped_column(String(200), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    # One-to-many relationship
    subjects: Mapped[list["SubJectModel"]] = relationship("SubJectModel",
        back_populates="class_", cascade="all, delete-orphan"
    )
    students:Mapped[list["StudentsModel"]] =  relationship("StudentsModel",
        back_populates="class_", cascade="all, delete-orphan"
    )
