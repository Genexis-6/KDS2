from pydantic import BaseModel, UUID4
from typing import List, Optional

from app.repo.schemas.student_schemas.add_new_student_schemas import StudentInfoSchemas
from app.repo.schemas.subject_schemas.add_new_subject import AddNewSubjectSchemas, ParticularSubjectSchemas


class ClassSchemas(BaseModel):
    id:UUID4
    className:str
    teacherName:str
    
    
    
    

class ClassFullDetails(BaseModel):
    classId:UUID4
    className:str
    teacherName:str
    subjects:Optional[List[ParticularSubjectSchemas]] = None
    students:Optional[List[StudentInfoSchemas]] = None