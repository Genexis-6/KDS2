from fastapi import APIRouter, Response, Depends, Request, Query, UploadFile, File, BackgroundTasks
from uuid import UUID
from fastapi.responses import JSONResponse
from app.repo.schemas.default_server_res import DefaultServerApiRes
from app.repo import db_injection
from app.repo.queries.class_room_queries.class_queries import ClassQueries
from app.repo.queries.auth.auth_queries import AuthQueries
from app.repo.schemas.student_schemas.add_new_student_schemas import AddNewStudentSchemas
from app.utils.enums.auth_enums import AuthEums
from app.repo.schemas.login_schemas import LoginSchemasRes, LoginUserSchemas
from app.security.token_generator import general_token_gen, generate_access_token, verify_token, oauth2_scheme
import datetime
from typing import Annotated
from app.utils.enums.user_type_enum import UserTypeEnum
from app.repo.schemas.current_user_schemas import CurrentUserSchemas



auth = APIRouter(
    tags=['auth'],
    prefix="/auth",
    responses={
        404:{
            "message": "not found"
        }
    }
)


@auth.post("/login", response_model=DefaultServerApiRes[LoginSchemasRes])
async def login_user(db: db_injection, login: LoginUserSchemas, response: Response):
    user =  AuthQueries(db)
    auth_user = await user.login_user(login)
    if auth_user == AuthEums.NOT_ALLOWED:
        return JSONResponse(
            content={"message": "incorrect password"},
            status_code=403
        )
    if auth_user == AuthEums.NOT_FOUND:
        return JSONResponse(
            content={"message": "no user found"},
            status_code=404
        )
        
    access_token, refresh_token = general_token_gen(
            id=auth_user.id,
            exp_time=datetime.timedelta(minutes=40),
            full_name=auth_user.full_name,
            identifier= auth_user.identifier,
            type=login.role,
    )
        
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="none",
        secure=True,
        path="/"
    )       
    return DefaultServerApiRes(
        statusCode=200,
        message="user logged in successfully",
        data={
            "accessToken": access_token
        }
    )
    


@auth.post("/register", response_model=DefaultServerApiRes, )
async def create_new_student(db: db_injection, add: AddNewStudentSchemas, current_user:Annotated[dict, Depends(verify_token)] ):
    user = AuthQueries(db)
    reg_user = await user.add_new_student(add)
    if reg_user == AuthEums.EXISTS:
        return JSONResponse(
            content={"message":"user with this identifier already exist"},
            status_code=403
        )
    return DefaultServerApiRes(
        statusCode=200,
        message="new students class",
    
    )
    
    
    

@auth.get("/current_user", response_model=DefaultServerApiRes[CurrentUserSchemas])
async def get_current_user(db: db_injection, current_user:Annotated[dict, Depends(verify_token)] ):
    return DefaultServerApiRes(
        statusCode=200,
        message="current user data",
        data=CurrentUserSchemas(
            
            id=current_user.get("id"),
            identifier=current_user.get("identifier"),
            fullName =current_user.get("username"),
            role = current_user.get("role")
        
        )
    )



@auth.get("/refresh_token", response_model=DefaultServerApiRes[LoginSchemasRes])
async def refresh_token(request:Request):
    try:
        refresh_token = request.cookies.get("refresh_token")
        
        if refresh_token is None:
            return JSONResponse(
                content={"message": "No refresh token found"},
                status_code=404
            )

        data:dict = await verify_token(refresh_token)


        access_token  = generate_access_token(
            
            full_name=data.get("username"),
            id=data.get("id"),
            identifier=data.get("sub"),
            exp_time= datetime.timedelta(minutes=10),
            role=data.get("role")
        )
        return DefaultServerApiRes(
            statusCode=200,
            message="new access token",
            data= {
            "accessToken": access_token,
        }
        )
    except Exception as e:
        return JSONResponse(
            content=f"error getting new token due to: {e}",
            status_code=500
        )
        
        
        
        

@auth.get("/logout", response_model=DefaultServerApiRes)
async def logout(response: Response):
    response.delete_cookie("refresh_token", path="/", samesite="none", secure=True, httponly=True)
    return DefaultServerApiRes(
        statusCode=200,
        message="user have successfully logged out"
    )


@auth.post("/register/bulk", response_model=DefaultServerApiRes)
async def bulk_register_students(
    db: db_injection,
    background_tasks: BackgroundTasks,
    class_id: str = Query(...),
    file: UploadFile = File(...),

):
    user =  AuthQueries(db)
    background_tasks.add_task(user.process_bulk_students, file, class_id)
    return DefaultServerApiRes(
        statusCode=202,
        message="Bulk student registration started in background"
    )
