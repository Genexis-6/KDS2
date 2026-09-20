from typing import List, Optional, TypeVar, Generic
from pydantic import UUID4, BaseModel


T = TypeVar('T')



class AdminQuestionSchemas(BaseModel):
    id: UUID4
    question: str
    a: str
    b: str
    c: str
    d: str
    answer: str


class GetQuestionSchemas(BaseModel):
    id:UUID4
    question:str
    a:str
    b:str
    c:str
    d:str
    

class EditQuestionSchemas(BaseModel):
    id: UUID4
    question: Optional[str] = None
    a: Optional[str] = None
    b: Optional[str] = None
    c: Optional[str] = None
    d: Optional[str] = None
    answer: Optional[str] = None


class SubmittedQ(BaseModel):
    id:UUID4
    answer:str

class SubmittedQuestions(BaseModel, Generic[T]):
    subjectId:UUID4
    studentId:UUID4
    answers:List[T]
    
    
  
  
class QuestionLenght(BaseModel):
    count:int    