from pydantic import BaseModel, UUID4
from typing import List, Optional


class UpdateStudentSchemas(BaseModel):
    id: UUID4
    fullName: Optional[str] = None
    identifier: Optional[str] = None
    classId: Optional[UUID4] = None


class AddNewStudentSchemas(BaseModel):
    full_name:str
    identifier:str
    class_id:UUID4
    password:str
    
    

class StudentInfoSchemas(BaseModel):
    fullName:str
    identifier:str
    classId:UUID4
    id:UUID4
    hasActiveSession: Optional[bool] = False


class PaginatedStudents(BaseModel):
    items: List[StudentInfoSchemas]
    total: int
    page: int
    pageSize: int
    totalPages: int


class ChangePasswordBody(BaseModel):
    studentId: UUID4
    newPassword: str

