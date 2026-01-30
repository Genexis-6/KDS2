from pydantic import BaseModel, field_validator

class AddNewClassSchemas(BaseModel):
    className: str
    teacherName: str

    @field_validator("className")
    def class_name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Class name cannot be empty")
        if len(v) < 3:
            raise ValueError("Class name must be at least 3 characters long")
        return v

    @field_validator("teacherName")
    def teacher_name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Teacher name cannot be empty")
        if len(v) < 3:
            raise ValueError("Teacher name must be at least 3 characters long")
        return v
