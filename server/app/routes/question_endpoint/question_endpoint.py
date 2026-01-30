from fastapi import APIRouter, Query, UploadFile, File, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Annotated, List
from uuid import UUID
import pandas as pd
import io

from app.repo import db_injection
from app.repo.schemas.default_server_res import DefaultServerApiRes
from app.utils.enums.auth_enums import AuthEums
from app.security.token_generator import verify_token
from app.repo.queries.subject_queries.all_question_queries import AllQuestionQueries
from app.repo.schemas.subject_schemas.all_questions_schemas import GetQuestionSchemas, QuestionLenght, SubmittedQ, SubmittedQuestions
from app.repo.queries.subject_queries.filter_question_queries import FilterQuestionQueries


question_endpoint = APIRouter(
    prefix="/question",
    tags=["question"],
    responses={404: {"message": "Not found"}},
)

REQUIRED_COLUMNS = ["Questions", "a", "b", "c", "d", "answers"]


@question_endpoint.post("/add_question", response_model=DefaultServerApiRes[str])
async def upload_questions(
    db: db_injection,
    current_user:Annotated[dict, Depends(verify_token)] ,
    subject_id: Annotated[UUID, Query(..., description="Subject ID")],
    upload: UploadFile = File(...),
    
):
    print(f"file name {upload.filename}")
    if not upload.filename.endswith(".xlsx"):
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only .xlsx files are accepted.",
        )

    try:
        contents = await upload.read()
        excel_data = pd.read_excel(io.BytesIO(contents))

        missing_cols = [col for col in REQUIRED_COLUMNS if col not in excel_data.columns]
        if missing_cols:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {', '.join(missing_cols)}",
            )


        query = AllQuestionQueries(db)
        result = await query.add_question(subject_id, excel_data)

        if result == AuthEums.OK:
            return DefaultServerApiRes(
                message="Questions uploaded successfully.",
                statusCode=200,
                data="success"
            )
        else:
            return JSONResponse(
                content={"message": "Error uploading questions"},
                status_code=500
            )

    except Exception as e:
        print("Upload error:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading Excel file: {str(e)}",
        )





@question_endpoint.get("/get_questions", response_model=DefaultServerApiRes[List[GetQuestionSchemas]])
async def get_questions(
     db: db_injection,
    current_user: Annotated[dict, Depends(verify_token)],
    subject_id: UUID = Query(..., description="Subject ID to fetch questions for"),
   
):
    try:
        # repo = AllQuestionQueries(db)
        filter_qa = FilterQuestionQueries(db)
        # questions = await repo.get_questions(subject_id)
        questions = await filter_qa.get_filtered_questions(subject_id)
        
        return DefaultServerApiRes(
            statusCode=200,
            message="all available questions",
            data=questions
        )
    except Exception as e:
        print("Error fetching questions:", e)
        return JSONResponse(
            content={"message":"error while getting questions"},
            status_code=500,
        )
        

@question_endpoint.delete("/delete_questions", response_model=DefaultServerApiRes[bool])
async def delete_questions(db:db_injection, 
                           current_user:Annotated[dict, Depends(verify_token)] ,
                           subjectId:Annotated[UUID, Query(..., description="delete subject by id")]):
    repo = AllQuestionQueries(db)
    delete_all = await repo.clear_old_question(subjectId)
    if delete_all == AuthEums.ERROR:
        return JSONResponse(
            content={"message":"an error occured while deleting question", "data":False},
            status_code=400
        )
    return DefaultServerApiRes(
        statusCode=200,
        message="deleted all questions",
        data=True
    )


@question_endpoint.get("/total-question/{subject_id}", response_model=DefaultServerApiRes[QuestionLenght])
async def total_question_length(db: db_injection, subject_id: UUID):
    repo = AllQuestionQueries(db)
    questions = await repo.get_questions(subject_id)
    count = len(questions) if questions else 0
    print(f"Returning question count: {count}")  # Debug log
    return DefaultServerApiRes(
        statusCode=200,
        message="Total question count",
        data=QuestionLenght(count=count)
    )