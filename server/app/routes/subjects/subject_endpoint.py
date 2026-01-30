from uuid import UUID
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from app.repo.schemas.default_server_res import DefaultServerApiRes
from app.repo import db_injection
from app.repo.queries.subject_queries.all_subject_queries import AllSubjectQueries
from app.repo.schemas.subject_schemas.add_new_subject import AddNewSubjectSchemas, SubjectById, SubjectFullInfo, SubjectInfoSchemas, ParticularSubjectSchemas
from typing import Annotated, List
from datetime import datetime
from app.utils.enums.auth_enums import AuthEums
from app.security.token_generator import verify_token
from app.repo.schemas.subject_schemas.subject_score_schemas import GetFilterFormat, StudentScoreRecord, SaveSubjectFormat
from app.utils.helpers.generate_excel_record import generate_excel_record
from app.repo.queries.subject_queries.filter_question_queries import FilterQuestionQueries

subject_endpoint = APIRouter(
    tags=["subjects"],
    prefix="/subjects",
    responses={
        404:{
            "message":"not found"
        }
    }
)

# ========== SPECIFIC ROUTES FIRST ==========
@subject_endpoint.get("/get_all_subject", response_model=DefaultServerApiRes[SubjectInfoSchemas[ParticularSubjectSchemas]])
async def get_all_subject(
    db: db_injection,
    current_user: Annotated[dict, Depends(verify_token)],
    classId: UUID = Query(..., description="Class ID for filtering subjects"),
):
    sub_query = AllSubjectQueries(db)
    all_sub = await sub_query.get_all_subjects(classId)
    return DefaultServerApiRes(
        statusCode=200,
        message="All subjects available",
        data=all_sub
    )

@subject_endpoint.get("/get_subject_format/{subject_id}", response_model=DefaultServerApiRes[GetFilterFormat])  # <-- MOVED UP
async def get_subject_format(db: db_injection, subject_id: UUID):
    filter_q = FilterQuestionQueries(db)
    ft = await filter_q.get_question_format(subject_id)

    if ft:
        return DefaultServerApiRes(
            statusCode=200,
            message="subject format",
            data=ft
        )

    return JSONResponse(
        content={"message": "no subject format", "data": None},
        status_code=404
    )

@subject_endpoint.post("/add_subject", response_model=DefaultServerApiRes[str])
async def add_subject(db: db_injection, add: AddNewSubjectSchemas, current_user:Annotated[dict, Depends(verify_token)] ):
    sub_query = AllSubjectQueries(db)
    result = await sub_query.add_new_subject(add)

    if result == AuthEums.CREATED:
        return DefaultServerApiRes(
            statusCode=201,
            message="Subject created successfully",
            data="Subject created successfully",
        )
    elif result == AuthEums.EXISTS:
        return DefaultServerApiRes(
            statusCode=409,
            message="Subject already exists",
            data="Subject already exists",
        )
    else:
        return DefaultServerApiRes(
            statusCode=500,
            message="An unexpected error occurred while creating the subject",
            data=None,
        )

@subject_endpoint.post("/generate_record", response_model=DefaultServerApiRes[bool])
async def generate_record(gen:StudentScoreRecord, current_user:Annotated[dict, Depends(verify_token)] ):
    status = generate_excel_record(gen)
    if not status:
        return JSONResponse(
            content={"message":"error occured while creating the excel record", "data":False},
            status_code=400
        )
    return DefaultServerApiRes(
        statusCode=200,
        message="record generation was successful",
        data=True
    )

@subject_endpoint.post("/save_subject_format", response_model=DefaultServerApiRes[bool])
async def save_subject_format(db: db_injection, save: SaveSubjectFormat):
    filter_q = FilterQuestionQueries(db)
    ft = await filter_q.save_question_format(save)

    if ft:
        return DefaultServerApiRes(
            statusCode=200,
            message="format updated",
            data=ft
        )

    return JSONResponse(
        content={"message": "no format updated", "data": None},
        status_code=400
    )

# ========== GENERIC ROUTES LAST ==========
@subject_endpoint.get("/{subject_id}/{subject_title}", response_model=DefaultServerApiRes[SubjectFullInfo])  # <-- MOVED DOWN
async def get_full_subject_info(
    current_user:Annotated[dict, Depends(verify_token)] ,
    subject_id: UUID,
    subject_title: str,
    db: db_injection
):
    repo = AllSubjectQueries(db)
    subject_info = await repo.get_subject_full_info(subject_id=subject_id, subject_title=subject_title)

    if not subject_info:
        return JSONResponse(
            status_code=404,
            content={"message": "Subject not found or title mismatch"}
        )
        
    return DefaultServerApiRes(
        statusCode=200,
        message="subject full info",
        data=subject_info
    )