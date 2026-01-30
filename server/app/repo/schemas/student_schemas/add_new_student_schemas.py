from pydantic import BaseModel, UUID4


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
    
    

class ChangePasswordBody(BaseModel):
    studentId: UUID4
    newPassword: str

