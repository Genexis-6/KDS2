from pydantic import BaseModel
from typing import Generic, TypeVar, Optional

T = TypeVar('T')


class DefaultServerApiRes(BaseModel,Generic[T]):
    statusCode:int
    message: str
    data:Optional[T] = None
    
    
    