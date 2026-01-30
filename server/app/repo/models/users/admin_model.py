from ...dependecy import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import UUID, String, Boolean, DateTime, ForeignKey
import uuid
from datetime import datetime



class AdminModel(Base):
    __tablename__ = "admin"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(100), index=True, unique=True)
    identifier:Mapped[str] = mapped_column(String(100), index=True, unique=True)
    password: Mapped[str] = mapped_column(String(100), index=True)