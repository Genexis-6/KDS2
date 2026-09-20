from typing import Optional
from app.repo.schemas.class_schemas.add_new_class_schemas import AddNewClassSchemas, UpdateClassSchemas
from app.utils.enums.class_room_enums import ClassRoomEnums
from app.repo.schemas.class_schemas.class_schemas import ClassFullDetails, ClassSchemas
from app.repo.schemas.student_schemas.add_new_student_schemas import PaginatedStudents, StudentInfoSchemas
from app.repo.schemas.subject_schemas.add_new_subject import AddNewSubjectSchemas, ParticularSubjectSchemas
from ...dependecy import AsyncSession
from sqlalchemy import UUID, func, or_, select
from sqlalchemy.orm import selectinload
from ...models import ClassModel, SessionModel, StudentsModel
from datetime import datetime
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
    
    async def get_raw_class_by_id(self, id: UUID) -> Optional[ClassModel]:
        res = await self.session.execute(select(ClassModel).where(ClassModel.id == id))
        return res.scalar_one_or_none()

    async def update_class(self, update: UpdateClassSchemas):
        class_ = await self.get_raw_class_by_id(update.id)
        if class_ is None:
            return ClassRoomEnums.NOT_FOUND

        if update.className is not None:
            class_.class_name = update.className
        if update.teacherName is not None:
            class_.teacher_name = update.teacherName

        await self.session.commit()
        return ClassRoomEnums.OK

    async def delete_class(self, className:UUID):
        chcck = await self.check_class_exist(className)
        if not chcck:
            return ClassRoomEnums.NOT_FOUND
        await self.session.delete(chcck)
        await self.session.commit()
        return ClassRoomEnums.OK
    
    
    
    async def get_class_full_info(self, class_name: str) -> Optional[ClassFullDetails]:
            # Students are intentionally NOT eager-loaded here anymore -- a class
            # with hundreds of students would mean loading all of them just to
            # show the class header. Use get_class_students_paginated for the
            # actual student table; here we only need a cheap count.
            stmt = (
                select(ClassModel)
                .where(ClassModel.class_name == class_name)
                .options(
                    selectinload(ClassModel.subjects),
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

            count_stmt = select(func.count()).select_from(StudentsModel).where(
                StudentsModel.class_id == class_instance.id
            )
            student_count = (await self.session.execute(count_stmt)).scalar_one()

            return ClassFullDetails(
                classId=class_instance.id,
                className=class_instance.class_name,
                teacherName=class_instance.teacher_name,
                subjects=subjects_data,
                studentCount=student_count,
            )

    async def get_class_students_paginated(
        self,
        class_id: UUID,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
    ) -> PaginatedStudents:
        page = max(page, 1)
        page_size = max(1, min(page_size, 100))
        offset = (page - 1) * page_size

        filters = [StudentsModel.class_id == class_id]
        if search:
            like = f"%{search.strip()}%"
            filters.append(or_(StudentsModel.full_name.ilike(like), StudentsModel.identifier.ilike(like)))

        count_stmt = select(func.count()).select_from(StudentsModel).where(*filters)
        total = (await self.session.execute(count_stmt)).scalar_one()

        stmt = (
            select(StudentsModel)
            .where(*filters)
            .order_by(StudentsModel.full_name)
            .offset(offset)
            .limit(page_size)
        )
        rows = (await self.session.execute(stmt)).scalars().all()

        # A single follow-up query for just this page's session status, rather
        # than a join fetching every student's row twice or, worse, one query
        # per student.
        active_ids = set()
        if rows:
            page_ids = [s.id for s in rows]
            now = datetime.utcnow()
            session_stmt = select(SessionModel.student_id).where(
                SessionModel.student_id.in_(page_ids),
                SessionModel.is_active == True,  # noqa: E712
                SessionModel.expires_at > now,
            )
            active_ids = {row[0] for row in (await self.session.execute(session_stmt)).all()}

        items = [
            StudentInfoSchemas(
                id=s.id,
                fullName=s.full_name,
                identifier=s.identifier,
                classId=s.class_id,
                hasActiveSession=s.id in active_ids,
            )
            for s in rows
        ]

        total_pages = (total + page_size - 1) // page_size if total else 0

        return PaginatedStudents(
            items=items,
            total=total,
            page=page,
            pageSize=page_size,
            totalPages=total_pages,
        )