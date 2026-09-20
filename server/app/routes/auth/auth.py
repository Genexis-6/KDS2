from fastapi import APIRouter, Response, Depends, Request, Query, UploadFile, File, BackgroundTasks, HTTPException
from uuid import UUID
from fastapi.responses import JSONResponse
from app.repo.schemas.default_server_res import DefaultServerApiRes
from app.repo import db_injection
from app.repo.queries.class_room_queries.class_queries import ClassQueries
from app.repo.queries.auth.auth_queries import AuthQueries
from app.repo.schemas.student_schemas.add_new_student_schemas import AddNewStudentSchemas
from app.utils.enums.auth_enums import AuthEums
from app.repo.schemas.login_schemas import LoginSchemasRes, LoginUserSchemas
from app.security.token_generator import general_token_gen, verify_token, oauth2_scheme, refresh_access_token, refresh_ttl_for
from app.security.refresh_cookie import REFRESH_COOKIE, set_refresh_cookie, clear_refresh_cookie
import datetime
from typing import Annotated
from app.utils.enums.user_type_enum import UserTypeEnum
from app.repo.schemas.current_user_schemas import CurrentUserSchemas
from app.repo.queries.auth.session_queries import SessionQueries
from app.utils.job_tracker import upload_job_tracker



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

    # Grab what we need right away. SessionQueries below commits mid-request
    # (to record/refresh the student's session row), and even with
    # expire_on_commit=False we don't want auth_user's fields read after any
    # further DB writes on this same session -- copy them to plain locals now.
    user_id = auth_user.id
    user_full_name = auth_user.full_name
    user_identifier = auth_user.identifier

    sid = None
    if login.role == "student":
        session_repo = SessionQueries(db)
        if await session_repo.has_active_session(user_id):
            return JSONResponse(
                content={
                    "message": "This account already has an active session. "
                               "Log out on the other device first, or ask an admin to clear the session.",
                },
                status_code=409
            )
        # The session lives exactly as long as the refresh token (same TTL, one
        # source of truth), so the two expire together. It is also torn down
        # early on logout, admin clear, or when the refresh token is rejected.
        sid = await session_repo.start_session(user_id, ttl=refresh_ttl_for("student"))

    access_token, refresh_token = general_token_gen(
            id=str(user_id),
            full_name=user_full_name,
            identifier=user_identifier,
            type=login.role,
            sid=sid,
    )

    set_refresh_cookie(response, refresh_token)
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



def _bearer_token(request: Request):
    scheme, _, value = request.headers.get("authorization", "").partition(" ")
    if scheme.lower() != "bearer":
        return None
    return value.strip() or None


@auth.get("/refresh_token", response_model=DefaultServerApiRes[LoginSchemasRes])
async def refresh_token(request: Request, db: db_injection):
    try:
        # The client also sends its (expired) access token as a Bearer header.
        # It is only used to identify the session if the refresh cookie is gone.
        access_token = await refresh_access_token(
            db,
            refresh_token=request.cookies.get(REFRESH_COOKIE),
            stale_access_token=_bearer_token(request),
        )
        return DefaultServerApiRes(
            statusCode=200,
            message="new access token",
            data={
                "accessToken": access_token,
            }
        )
    except HTTPException as e:
        # refresh_access_token has already ended the student's session if this
        # is a 401. Also drop the dead cookie so the browser stops sending it.
        error_response = JSONResponse(
            content={"message": e.detail},
            status_code=e.status_code
        )
        if e.status_code == 401:
            clear_refresh_cookie(error_response)
        return error_response
    except Exception as e:
        return JSONResponse(
            content={"message": f"error getting new token due to: {e}"},
            status_code=500
        )


@auth.get("/logout", response_model=DefaultServerApiRes)
async def logout(response: Response, db: db_injection, current_user: Annotated[dict, Depends(verify_token)]):
    if current_user.get("role") == "student":
        session_repo = SessionQueries(db)
        await session_repo.end_session(current_user.get("id"))

    clear_refresh_cookie(response)
    return DefaultServerApiRes(
        statusCode=200,
        message="user have successfully logged out"
    )


@auth.delete("/session/{student_id}", response_model=DefaultServerApiRes[bool])
async def admin_clear_student_session(
    student_id: UUID,
    db: db_injection,
    current_user: Annotated[dict, Depends(verify_token)],
):
    """Admin-only escape hatch: force-clear a stuck session (e.g. crashed browser)
    so the student can log back in without waiting for natural expiry."""
    if current_user.get("role") != "admin":
        return JSONResponse(
            content={"message": "only an admin can clear a session"},
            status_code=403
        )

    session_repo = SessionQueries(db)
    cleared = await session_repo.end_session(student_id)
    return DefaultServerApiRes(
        statusCode=200,
        message="session cleared" if cleared else "no active session found for this student",
        data=cleared
    )


@auth.post("/register/bulk", status_code=202, response_model=DefaultServerApiRes[dict])
async def bulk_register_students(
    db: db_injection,
    background_tasks: BackgroundTasks,
    current_user: Annotated[dict, Depends(verify_token)],
    class_id: str = Query(...),
    file: UploadFile = File(...),

):
    if current_user.get("role") != "admin":
        return JSONResponse(content={"message": "only an admin can bulk-register students"}, status_code=403)

    user = AuthQueries(db)
    job = upload_job_tracker.create(kind="students", owner_id=str(current_user.get("id")))
    background_tasks.add_task(user.process_bulk_students, file, class_id, job.id)
    return DefaultServerApiRes(
        statusCode=202,
        message="Bulk student registration started",
        data={"jobId": job.id}
    )


@auth.get("/register/bulk/status/{job_id}", response_model=DefaultServerApiRes[dict])
async def bulk_register_status(job_id: str, current_user: Annotated[dict, Depends(verify_token)]):
    job = upload_job_tracker.get(job_id)
    if job is None:
        return JSONResponse(content={"message": "job not found or has expired"}, status_code=404)

    return DefaultServerApiRes(
        statusCode=200,
        message="job status",
        data=job.as_dict()
    )
