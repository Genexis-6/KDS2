from uuid import UUID
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from app.repo.schemas.default_server_res import DefaultServerApiRes
from app.repo import db_injection
from app.repo.queries.class_room_queries.class_queries import ClassQueries
from app.repo.schemas.class_schemas.add_new_class_schemas import AddNewClassSchemas
from app.utils.enums.class_room_enums import ClassRoomEnums
from typing import Annotated, List
from app.repo.schemas.class_schemas.class_schemas import ClassFullDetails, ClassSchemas
from app.security.token_generator import verify_token



room = APIRouter(
    tags=['class'],
    prefix="/class",
    responses={
        404:{
            "message": "not found"
        }
    }
)


@room.get("/all_classess", response_model=DefaultServerApiRes[List[ClassSchemas]])
async def get_all_available_class(db: db_injection, current_user:Annotated[dict, Depends(verify_token)] ):
    class_ =  ClassQueries(db)
    all_classes = await class_.get_all_classes()
    return DefaultServerApiRes(
        statusCode=200,
        message="all available class",
        data=all_classes
    )
    
  

@room.post("/add_class", response_model=DefaultServerApiRes)
async def add_new_class(db: db_injection, add:AddNewClassSchemas, current_user:Annotated[dict, Depends(verify_token)] ):
    class_ =  ClassQueries(db)
    add_class = await class_.add_new_class(add)
    if add_class == ClassRoomEnums.EXIST:
        return JSONResponse(
            content={"message":"class room already exist"},
            status_code= 400
        )
    return DefaultServerApiRes(
        statusCode=200,
        message=f"{add.className} has been created"
    )
    
    
@room.delete("/delete_class", response_model=DefaultServerApiRes)
async def delete_class(db: db_injection, className: Annotated[str, Query(..., description="class id")], current_user:Annotated[dict, Depends(verify_token)] ):
    class_ =  ClassQueries(db)
    delete_class = await class_.delete_class(className)
    if delete_class == ClassRoomEnums.NOT_FOUND:
        return JSONResponse(
            content={"message":"no class with this id exsited"},
            status_code= 400
        )
    return DefaultServerApiRes(
        statusCode=200,
        message="class was deleted successfully"
    )
    
    

@room.get("/get_class_full_info", response_model=DefaultServerApiRes[ClassFullDetails])
async def get_class_full_info(db:db_injection, className: Annotated[str, Query(..., description="class id")], current_user:Annotated[dict, Depends(verify_token)] ):
    class_ = ClassQueries(db)
    full_info = await class_.get_class_full_info(className)
    
    if full_info is None:
        return JSONResponse(
            content={"message":"no class Info had been added yet"}, status_code=404
        )
    return DefaultServerApiRes(
        statusCode=200,
        message="class full infomation",
        data=full_info
    )