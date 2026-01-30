from typing import List, TypeVar, Generic
from pydantic import UUID4, BaseModel


T = TypeVar('T')



class GetQuestionSchemas(BaseModel):
    id:UUID4
    question:str
    a:str
    b:str
    c:str
    d:str
    

class SubmittedQ(BaseModel):
    id:UUID4
    answer:str

class SubmittedQuestions(BaseModel, Generic[T]):
    subjectId:UUID4
    studentId:UUID4
    answers:List[T]
    
    
  
  
class QuestionLenght(BaseModel):
    count:int    