from typing import TypeVar, Generic, Optional, List
import datetime
from pydantic import BaseModel, UUID4

from app.repo.schemas.subject_schemas.all_questions_schemas import GetQuestionSchemas
from app.repo.schemas.timer_schemas.all_timer_schemas import AddNewTimerSchemas


T = TypeVar("T")

class AddNewSubjectSchemas(BaseModel):
    title: str
    author: str
    enable: bool
    classId: UUID4


class ParticularSubjectSchemas(BaseModel):
    id: UUID4
    title: str
    author: str
    enable: bool
    classId: UUID4



class SubjectInfoSchemas(BaseModel, Generic[T]):
    className: str
    teacherName: str
    classId: UUID4
    subjects: Optional[List[T]] = None


class SubjectById(BaseModel):
    classId: UUID4


class TotalQuestions(BaseModel):
    title:str
    available:bool

class StudentSubInfo(BaseModel):
    id:UUID4
    studentName: str
    identifier: str
    score: float
    total:int

class SubjectFullInfo(BaseModel):
    timer: Optional["AddNewTimerSchemas"] = None
    question: Optional[TotalQuestions] = None
    students: Optional[List[StudentSubInfo]] = None