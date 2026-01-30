from typing import Optional
from app.repo.schemas.class_schemas.add_new_class_schemas import AddNewClassSchemas
from app.utils.enums.class_room_enums import ClassRoomEnums
from app.repo.schemas.class_schemas.class_schemas import ClassFullDetails, ClassSchemas
from app.repo.schemas.student_schemas.add_new_student_schemas import StudentInfoSchemas
from app.repo.schemas.subject_schemas.add_new_subject import AddNewSubjectSchemas, ParticularSubjectSchemas
from ...dependecy import AsyncSession
from sqlalchemy import UUID, select
from sqlalchemy.orm import selectinload
from ...models import ClassModel
from uuid import uuid4



class ClassQueries:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def check_class_exist(self, class_name: str):
        res = await self.session.execute(select(ClassModel).where(ClassModel.class_name == class_name))
        output = res.scalar_one_or_none()
        return output
    
    async def get_class_by_id(self, id: UUID):
        res = await self.session.execute(select(ClassModel).where(ClassModel.id == id))
        output = res.scalar_one_or_none()
        if output is None:
            return None
        return ClassSchemas(
            id=output.id,
            className=output.class_name,
            teacherName=output.teacher_name
        )
        
    async def get_all_classes(self):
        res = await self.session.execute(select(ClassModel))
        output = res.scalars().all()
        return [
            ClassSchemas(
                className=dt.class_name,
                teacherName=dt.teacher_name,
                id=dt.id
            )
            for dt in output
            
            ] if not None else []
    
    
    async def add_new_class(self, add:AddNewClassSchemas):
        check = await self.check_class_exist(add.className)
        if check:
            return ClassRoomEnums.EXIST
        self.session.add(
            ClassModel(
                id = uuid4(),
                class_name= add.className,
                teacher_name= add.teacherName
            )
        )
        await self.session.commit()
        return ClassRoomEnums.CREATED
    
    async def delete_class(self, className:UUID):
        chcck = await self.check_class_exist(className)
        if not chcck:
            return ClassRoomEnums.NOT_FOUND
        await self.session.delete(chcck)
        await self.session.commit()
        return ClassRoomEnums.OK
    
    
    
    async def get_class_full_info(self, class_name: str) -> Optional[ClassFullDetails]:
            stmt = (
                select(ClassModel)
                .where(ClassModel.class_name == class_name)
                .options(
                    selectinload(ClassModel.subjects),
                    selectinload(ClassModel.students),
                )
            )
    
            result = await self.session.execute(stmt)
            class_instance: Optional[ClassModel] = result.scalars().first()
    
            if not class_instance:
                return None
    
            subjects_data = [
                ParticularSubjectSchemas(
                    id=sub.id,
                    title=sub.title,
                    author=sub.author,
                    enable=sub.enable,
                    classId=sub.class_id,
                )
                for sub in class_instance.subjects
            ]
    
            students_data = [
                StudentInfoSchemas(
                    id=student.id,
                    fullName=student.full_name,
                    identifier=student.identifier,
                    classId=student.class_id,
                )
                for student in class_instance.students
            ]
    
            return ClassFullDetails(
                classId=class_instance.id,
                className=class_instance.class_name,
                teacherName=class_instance.teacher_name,
                subjects=subjects_data,
                students=students_data,
            )