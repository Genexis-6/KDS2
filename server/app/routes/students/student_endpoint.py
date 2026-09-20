from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from app.security.token_generator import verify_token
from app.repo.schemas.default_server_res import DefaultServerApiRes
from app.repo import db_injection
from typing import Annotated
from uuid import UUID

from app.utils.enums.auth_enums import AuthEums
from app.repo.queries.students.student_quires import StudentQueries
from app.repo.queries.auth.session_queries import SessionQueries
from app.repo.schemas.student_schemas.add_new_student_schemas import ChangePasswordBody, StudentInfoSchemas, UpdateStudentSchemas


student_endpoint = APIRouter(
    tags=["student"],
    prefix="/students",
    responses={
        404:{
            "message":"not found"
        }
    }
)



@student_endpoint.get("/student_info", response_model=DefaultServerApiRes[StudentInfoSchemas])
async def get_student_info(db: db_injection, current_user:Annotated[dict, Depends(verify_token)]):
    user_role = current_user.get("role")
    if user_role == "admin":
        return JSONResponse(
            content={"message":"admin not alowed here"},
            status_code = 403
        )
    user_id = current_user.get("id")
    
    student = StudentQueries(db)
    student_info = await student.get_user_info(user_id)
    if student_info is None:
        return JSONResponse(
            content={"message":"no student found"},
            status_code=404
        )
        
    return DefaultServerApiRes(
        statusCode=200,
        message="student info",
        data=student_info
    )
    
    

@student_endpoint.put("/update_student", response_model=DefaultServerApiRes[bool])
async def update_student(body: UpdateStudentSchemas, db: db_injection, current_user: Annotated[dict, Depends(verify_token)]):
    if current_user.get("role") != "admin":
        return JSONResponse(content={"message": "only an admin can edit a student"}, status_code=403)

    query = StudentQueries(db)
    result = await query.update_student(body)

    if result == AuthEums.NOT_FOUND:
        return JSONResponse(content={"message": "student not found", "data": False}, status_code=404)
    if result == AuthEums.EXISTS:
        return JSONResponse(content={"message": "another student already uses this identifier", "data": False}, status_code=409)
    if result != AuthEums.OK:
        return JSONResponse(content={"message": "failed to update student", "data": False}, status_code=500)

    return DefaultServerApiRes(
        statusCode=200,
        message="Student updated successfully.",
        data=True
    )


@student_endpoint.delete("/delete_student/{student_id}", response_model=DefaultServerApiRes[bool])
async def delete_student(student_id: UUID, db: db_injection, current_user: Annotated[dict, Depends(verify_token)]):
    if current_user.get("role") != "admin":
        return JSONResponse(content={"message": "only an admin can delete a student"}, status_code=403)

    # Clean up any active session row too, so the id can be safely reused/removed.
    session_query = SessionQueries(db)
    await session_query.end_session(student_id)

    query = StudentQueries(db)
    result = await query.delete_student(student_id)

    if result == AuthEums.NOT_FOUND:
        return JSONResponse(content={"message": "student not found", "data": False}, status_code=404)
    if result != AuthEums.OK:
        return JSONResponse(content={"message": "failed to delete student", "data": False}, status_code=500)

    return DefaultServerApiRes(
        statusCode=200,
        message="Student deleted successfully.",
        data=True
    )


@student_endpoint.put("/change_password", response_model=DefaultServerApiRes[bool])
async def change_password(body: ChangePasswordBody, db: db_injection, current_user:Annotated[dict, Depends(verify_token)] ):
    query = StudentQueries(db)
    result = await query.update_password(body.studentId, body.newPassword)

    if result != AuthEums.OK:
        return JSONResponse(
            status_code=404,
            content="Failed to update password"
        )

    return DefaultServerApiRes(
        statusCode=200,
        message="Password updated successfully.",
        data=True
    )