from fastapi import APIRouter, BackgroundTasks, Query, UploadFile, File, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Annotated, List
from uuid import UUID
import pandas as pd
import asyncio
import io

from app.repo import db_injection, db_session_manager
from app.repo.schemas.default_server_res import DefaultServerApiRes
from app.utils.enums.auth_enums import AuthEums
from app.utils.executor import upload_executor
from app.utils.job_tracker import upload_job_tracker
from app.security.token_generator import verify_token
from app.repo.queries.subject_queries.all_question_queries import AllQuestionQueries
from app.repo.schemas.subject_schemas.all_questions_schemas import AdminQuestionSchemas, EditQuestionSchemas, GetQuestionSchemas, QuestionLenght, SubmittedQ, SubmittedQuestions
from app.repo.queries.subject_queries.filter_question_queries import FilterQuestionQueries


question_endpoint = APIRouter(
    prefix="/question",
    tags=["question"],
    responses={404: {"message": "Not found"}},
)

REQUIRED_COLUMNS = ["Questions", "a", "b", "c", "d", "answers"]


def _parse_and_validate_excel(contents: bytes) -> List[dict]:
    """Runs on a worker thread (via the shared upload_executor), never on the
    event loop: pandas' .xlsx parsing is CPU-bound and can take a while for
    a big question bank, which would otherwise stall every other request."""
    excel_data = pd.read_excel(io.BytesIO(contents))

    missing_cols = [col for col in REQUIRED_COLUMNS if col not in excel_data.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns: {', '.join(missing_cols)}")

    # Do the row -> plain-dict conversion here too, off the event loop, so the
    # async DB layer only has to build ORM objects and insert.
    return excel_data[REQUIRED_COLUMNS].to_dict(orient="records")


async def _run_question_upload(contents: bytes, subject_id: UUID, job_id: str):
    """
    Background job behind POST /add_question. Reports progress through
    `upload_job_tracker` (pushed to the browser over /ws/jobs/{job_id}).

    It opens its OWN database session instead of reusing the request's: the
    request has already finished by the time this runs.
    """
    def update(**fields):
        upload_job_tracker.update(job_id, **fields)

    try:
        update(status="parsing", message="Reading the Excel file...")
        loop = asyncio.get_running_loop()
        try:
            records = await loop.run_in_executor(upload_executor, _parse_and_validate_excel, contents)
        except ValueError as ve:  # e.g. missing required columns
            update(status="error", error=str(ve), message=str(ve))
            return
        except Exception as e:
            msg = f"Error reading Excel file: {e}"
            update(status="error", error=msg, message=msg)
            return

        if not records:
            update(status="error", error="No questions found in the file.", message="No questions found in the file.")
            return

        total = len(records)
        update(status="saving", total=total, processed=0, created=0, message=f"Saving {total} questions...")

        def on_progress(saved: int):
            update(processed=saved, created=saved, message=f"Saved {saved} of {total} questions...")

        async with db_session_manager.session() as session:
            result = await AllQuestionQueries(session).add_question(subject_id, records, on_progress=on_progress)

        if result == AuthEums.OK:
            update(status="done", processed=total, created=total, message=f"Done -- {total} questions added.")
        else:
            update(status="error", error="Error uploading questions", message="Error uploading questions. Nothing was saved.")

    except Exception as e:
        print("Upload error:", e)
        update(status="error", error=str(e), message="Something went wrong during the upload.")


@question_endpoint.post("/add_question", status_code=202, response_model=DefaultServerApiRes[dict])
async def upload_questions(
    current_user:Annotated[dict, Depends(verify_token)] ,
    subject_id: Annotated[UUID, Query(..., description="Subject ID")],
    background_tasks: BackgroundTasks,
    upload: UploadFile = File(...),
):
    """Accepts the file and returns a job id straight away; parsing and saving
    run in the background while progress is streamed over /ws/jobs/{job_id}."""
    print(f"file name {upload.filename}")
    if not upload.filename.endswith(".xlsx"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only .xlsx files are accepted.",
        )

    # Read the bytes now, while the upload is still open, and hand the job plain bytes.
    contents = await upload.read()

    job = upload_job_tracker.create(kind="questions", owner_id=str(current_user.get("id")))
    background_tasks.add_task(_run_question_upload, contents, subject_id, job.id)
    return DefaultServerApiRes(
        statusCode=202,
        message="Question upload started",
        data={"jobId": job.id},
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


@question_endpoint.get("/admin_questions/{subject_id}", response_model=DefaultServerApiRes[List[AdminQuestionSchemas]])
async def get_admin_questions(
    db: db_injection,
    current_user: Annotated[dict, Depends(verify_token)],
    subject_id: UUID,
):
    if current_user.get("role") != "admin":
        return JSONResponse(content={"message": "only an admin can view full question details"}, status_code=403)

    query = AllQuestionQueries(db)
    questions = await query.get_all_questions_for_admin(subject_id)
    return DefaultServerApiRes(
        statusCode=200,
        message="all questions for this subject",
        data=questions
    )


@question_endpoint.put("/edit_question", response_model=DefaultServerApiRes[bool])
async def edit_question(
    db: db_injection,
    current_user: Annotated[dict, Depends(verify_token)],
    edit: EditQuestionSchemas,
):
    query = AllQuestionQueries(db)
    result = await query.edit_question(edit)

    if result == AuthEums.NOT_FOUND:
        return JSONResponse(content={"message": "question not found", "data": False}, status_code=404)
    if result != AuthEums.OK:
        return JSONResponse(content={"message": "failed to update question", "data": False}, status_code=500)

    return DefaultServerApiRes(
        statusCode=200,
        message="Question updated successfully.",
        data=True
    )


@question_endpoint.delete("/delete_single_question/{question_id}", response_model=DefaultServerApiRes[bool])
async def delete_single_question(
    db: db_injection,
    current_user: Annotated[dict, Depends(verify_token)],
    question_id: UUID,
):
    query = AllQuestionQueries(db)
    result = await query.delete_single_question(question_id)

    if result == AuthEums.NOT_FOUND:
        return JSONResponse(content={"message": "question not found", "data": False}, status_code=404)
    if result != AuthEums.OK:
        return JSONResponse(content={"message": "failed to delete question", "data": False}, status_code=500)

    return DefaultServerApiRes(
        statusCode=200,
        message="Question deleted successfully.",
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