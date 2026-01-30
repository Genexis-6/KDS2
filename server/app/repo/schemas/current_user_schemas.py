from pydantic import BaseModel, UUID4
from typing import Literal




class CurrentUserSchemas(BaseModel):
    id:UUID4
    identifier:str
    fullName:str
    role:Literal["student", "admin"]