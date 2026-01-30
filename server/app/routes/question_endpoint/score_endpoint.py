from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import JSONResponse
from app.repo.schemas.subject_schemas.all_questions_schemas import SubmittedQuestions, SubmittedQ
from app.repo.queries.subject_queries.all_scores_quires import AllScoresQueries
from app.repo.schemas.default_server_res import DefaultServerApiRes
from app.repo.schemas.subject_schemas.subject_score_schemas import AddScoreSchemas, ScoreIdInfo
from app.repo import db_injection
from typing import Annotated
from app.security.token_generator import verify_token
from uuid import UUID


score_endpoint = APIRouter(prefix="/score", tags=["Exam Scoring"])

@score_endpoint.post("/submit_exam_result", response_model=DefaultServerApiRes[AddScoreSchemas])
async def submit_exam_result(
    db: db_injection,
    current_user: Annotated[dict, Depends(verify_token)],
    submission: SubmittedQuestions[SubmittedQ]
):
    score_query = AllScoresQueries(db)
    result = await score_query.process_score(submission)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Score already exists for this student and subject."
        )

    return DefaultServerApiRes(
        statusCode=200,
        message="Exam graded successfully.",
        data=result
    )

@score_endpoint.post("/check_proceed_exam", response_model=DefaultServerApiRes[bool])
async def check_proceed_exam(
    db: db_injection, 
    current_user: Annotated[dict, Depends(verify_token)], 
    details: ScoreIdInfo
):
    score_query = AllScoresQueries(db)
    status = await score_query.check_score_exist(student_id=details.studentId, subject_id=details.subjectId)
    if status:
        return JSONResponse(
            status_code=400,
            content={"message": "you have already taken this exam", "data": False},
        )
    return DefaultServerApiRes(
        statusCode=200,
        message="you can proceed with the exam",
        data=True
    )

@score_endpoint.delete("/delete_student_score", response_model=DefaultServerApiRes[dict])
async def delete_student_score(
    db: db_injection,
    current_user: Annotated[dict, Depends(verify_token)],
    student_id: UUID = Query(..., description="Student ID", alias="studentId"),  
    subject_id: UUID = Query(..., description="Subject ID", alias="subjectId")   
):
    """
    Delete a specific student's score for a specific subject.
    Accepts 'studentId' and 'subjectId' as query parameters.
    """
    print(f"Received student_id: {student_id}, subject_id: {subject_id}")  # Debug
    
    score_query = AllScoresQueries(db)
    result = await score_query.delete_score_by_student_and_subject(
        student_id=student_id,
        subject_id=subject_id
    )
    
    if not result["deleted"]:
        raise JSONResponse(
            status_code=400,
            content={"message": result['message'], "data": result},
        )
    
    return DefaultServerApiRes(
        statusCode=200,
        message=result["message"],
        data={"deleted_count": result["count"]}
    )