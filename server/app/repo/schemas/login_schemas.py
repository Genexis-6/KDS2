from pydantic import BaseModel
from typing import Literal




class LoginUserSchemas(BaseModel):
    identifier: str 
    password:str
    role:Literal["student", "admin"]
    
    
    
class LoginSchemasRes(BaseModel):
    accessToken:str