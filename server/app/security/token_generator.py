from fastapi.security import OAuth2PasswordBearer
from typing_extensions import Optional
from datetime import timedelta, datetime
from app.config import settings
import jwt
from jwt.exceptions import DecodeError, ExpiredSignatureError, InvalidSignatureError
from fastapi.exceptions import HTTPException
from fastapi import Depends
from typing_extensions import Annotated, Literal
from app.utils.enums.user_type_enum import UserTypeEnum





oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
SK = settings.SK
ALGO = settings.ALGO


def generate_access_token(id: str,identifier: str, full_name: str, role:Literal["student", "admin"]  , exp_time:Optional[timedelta] = None):
    to_ecode = {
        "id":str(id),
        "sub":str(identifier),
        "username": full_name,
        "role": role,
    }
    
    if exp_time:
        exp = datetime.utcnow() + exp_time
    else:
        exp = datetime.utcnow() + timedelta(minutes=10)
    to_ecode.update({"exp": exp})
    return jwt.encode(to_ecode, SK, algorithm=ALGO)



def generate_refresh_token(id: str,identifier: str, full_name: str, role:Literal["student", "admin"] ):
    to_ecode = {
        "id":str(id),
        "sub":str(identifier),
        "username": full_name,
        "role": role,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(to_ecode, SK, algorithm=ALGO)




def general_token_gen(id: str,identifier: str, full_name: str,  exp_time:Optional[timedelta] = None, type:Literal["student", "admin"] = "student"):
    return generate_access_token(
        id=id,
        exp_time=exp_time,
        full_name=full_name,
        identifier=identifier,
        role=type
        
        ), generate_refresh_token(
        id=id,

        full_name=full_name,
        identifier=identifier,
        role=type
        )



async def verify_token(token: Annotated[str, Depends(oauth2_scheme)]):
    try:
        payload: dict = jwt.decode(token, SK, algorithms=[ALGO])
        user_id:str = payload.get("id")
        identifier: str = payload.get("sub")
        user_name: str = payload.get("username")
        role = payload.get("role")
        exp = payload.get("exp")
        
        return {
            "id": user_id,
            "identifier": identifier,
            "username": user_name,
            "role": role,
            "exp": exp
        }
    except ExpiredSignatureError as e:
        print(f"error due to: {e}")
        raise HTTPException(detail="token has expired", status_code= 401)
    except DecodeError as e:
        print(f"error due to: {e}")
        raise HTTPException(detail="error decoding token", status_code= 401)  
    except InvalidSignatureError as e:
        print(f"error due to: {e}")
        raise HTTPException(detail="invalid token", status_code= 403) 
    except Exception as e:
        print(f"error due to: {e}")
        raise HTTPException(detail="server error in decoding token", status_code= 500)
        
        
        
        
    