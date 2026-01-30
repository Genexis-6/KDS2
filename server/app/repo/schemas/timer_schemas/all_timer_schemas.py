from pydantic import UUID4, BaseModel, field_validator, Field, model_validator

class AddNewTimerSchemas(BaseModel):
    hr: int = Field(..., ge=0, le=23, description="Hour must be between 0 and 23")
    mins: int = Field(..., ge=0, le=59, description="Minutes must be between 0 and 59")
    sec: int = Field(..., ge=0, le=59, description="Seconds must be between 0 and 59")
    subjectId: UUID4

    @model_validator(mode="after")
    def validate_total_time(self) -> "AddNewTimerSchemas":
        """Ensure that the total time is not zero."""
        total = self.hr * 3600 + self.mins * 60 + self.sec
        if total == 0:
            raise ValueError("Timer duration cannot be 0 seconds")
        return self
