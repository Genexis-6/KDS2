from typing import Optional
from app.repo.schemas.subject_schemas.add_new_subject import  AddNewSubjectSchemas, ParticularSubjectSchemas, StudentSubInfo, SubjectById, SubjectFullInfo, SubjectInfoSchemas, TotalQuestions
from app.utils.enums.auth_enums import AuthEums
from app.repo.queries.class_room_queries.class_queries import ClassQueries
from app.repo.models.subject.student_scores_model import StudentScoreModel
from sqlalchemy.orm import selectinload

from app.repo.schemas.timer_schemas.all_timer_schemas import AddNewTimerSchemas
from ...dependecy import AsyncSession
from ...models import SubJectModel
from sqlalchemy import select
from uuid import UUID, uuid4

class AllSubjectQueries:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.class_query = ClassQueries(session)
        
    
    async def check_subject_exist(self, title: str, class_id: UUID):
        res = await self.session.execute(
            select(SubJectModel)
            .where(
                SubJectModel.title == title,
                SubJectModel.class_id == class_id
            )
        )
        output = res.scalar_one_or_none()
        return output

    async def get_all_subjects(self, class_id: UUID):
        sub = await self.session.execute(
            select(SubJectModel).where(SubJectModel.class_id == class_id)
        )
        class_ = await self.class_query.get_class_by_id(id=class_id)
        all_sub = sub.scalars().all()
        if class_ is None and all_sub == [] :
            return None
        
        return SubjectInfoSchemas(
            className= class_.className,
            teacherName=class_.teacherName,
            classId=class_.id,
            subjects=[
                ParticularSubjectSchemas(
                id=sub.id,
                title=sub.title,
                author=sub.author,
                enable=sub.enable,
                classId=sub.class_id
            )
            for sub in all_sub 
            ]
        )
    
    

   
    async def add_new_subject(self, add:AddNewSubjectSchemas):
        check = await self.check_subject_exist(class_id=add.classId, title=add.title)
        if check is None:
            self.session.add(
                SubJectModel(
                    id = uuid4(),
                    title = add.title,
                    author = add.author,
                    enable = add.enable,
                    class_id = add.classId,
                )
            )
            await self.session.commit()
            return AuthEums.CREATED
        return AuthEums.EXISTS
    
    
    async def get_subject_full_info(
            self, subject_id: UUID, subject_title: str
        ) -> Optional[SubjectFullInfo]:
            # Fetch subject + relationships
            stmt = (
                select(SubJectModel)
                .options(
                    selectinload(SubJectModel.timer),
                    selectinload(SubJectModel.question),
                    selectinload(SubJectModel.scores).selectinload(StudentScoreModel.student)
                )
                .where(SubJectModel.id == subject_id, SubJectModel.title == subject_title)
            )
    
            result = await self.session.execute(stmt)
            subject = result.scalar_one_or_none()
    
            if not subject:
                return None
    
            # Convert student scores
            student_list = [
                StudentSubInfo(
                    studentName=score.student.full_name,
                    identifier=score.student.identifier,
                    score=score.correct_answers,
                    total=score.total_questions,
                    id=score.student_id
                )
                for score in subject.scores
            ]
            
            
            timer_model = subject.timer  # or however you fetch it

            timer_schema = None
            if timer_model:
                timer_schema = AddNewTimerSchemas(
                    hr=timer_model.hr,
                    mins=timer_model.mins,
                    sec=timer_model.sec,
                    subjectId=timer_model.subject_id
                )
            
            questions = None
            if subject.question:
                questions = TotalQuestions(
                    title=subject_title,
                    available= subject.question is not None
                )
            return SubjectFullInfo(
                timer=timer_schema,
                question=questions,
                students=student_list,
            )