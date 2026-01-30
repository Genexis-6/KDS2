from uuid import UUID
from fastapi import APIRouter, Depends, Query
from typing import Annotated

from fastapi.responses import JSONResponse
from app.repo import db_injection
from app.repo.schemas.default_server_res import DefaultServerApiRes
from app.repo.schemas.timer_schemas.all_timer_schemas import AddNewTimerSchemas
from app.repo.queries.exam_timer_queries.timer_queries import TimerQueries
from app.utils.enums.auth_enums import AuthEums
from app.security.token_generator import verify_token



timer_endpoint = APIRouter(
    prefix="/timer",
    tags=["timer"],
    responses={
        404:{
            "message":"not found"
        }
    }
)




@timer_endpoint.get("/get_exam_time", response_model=DefaultServerApiRes[AddNewTimerSchemas])
async def get_timer_by_id(db: db_injection, subject_id: Annotated[UUID, Query(..., description="subject id")], current_user: Annotated[dict, Depends(verify_token)],):
    timer = TimerQueries(db)
    get_timer = await timer.get_current_timer(subject_id)
    if get_timer is None:
        return JSONResponse(
            content={"message":"no timer set for this exam"},
            status_code = 404
        )
    return DefaultServerApiRes(
        message="timer for this subject",
        statusCode=200,
        data=get_timer
    )
    


@timer_endpoint.post("/set_timer", response_model=DefaultServerApiRes[AddNewTimerSchemas])
async def add_new_timer(db: db_injection, 
                        current_user:Annotated[dict, Depends(verify_token)] ,
                        add: AddNewTimerSchemas):
    timer = TimerQueries(db)
    add_timer = await timer.add_timer(add)

    if add_timer == AuthEums.OK:
       
        get_timer = await timer.get_current_timer(add.subjectId)

        return DefaultServerApiRes(
            message="Timer successfully created or updated",
            statusCode=200,
            data=get_timer,
        )

    return JSONResponse(
        content={"message": "Failed to create/update timer"},
        status_code=500
    )
