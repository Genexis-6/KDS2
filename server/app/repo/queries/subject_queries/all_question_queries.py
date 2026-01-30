from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.repo.models import QuestionModel
from uuid import UUID, uuid4
from app.utils.enums.auth_enums import AuthEums
from app.repo.schemas.subject_schemas.all_questions_schemas import GetQuestionSchemas, SubmittedQ
from random import shuffle
from sqlalchemy import delete

from app.repo.models.subject.student_scores_model import StudentScoreModel

class AllQuestionQueries:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def add_question(self, subject_id: UUID, data):
        try:
            questions = [
                QuestionModel(
                    id=uuid4(),
                    question=str(row["Questions"]).strip(),
                    a_=str(row["a"]).strip(),
                    b_=str(row["b"]).strip(),
                    c_=str(row["c"]).strip(),
                    d_=str(row["d"]).strip(),
                    answer=str(row["answers"]).strip(),
                    subject_id=subject_id,
                )
                for _, row in data.iterrows()
            ]

         
            self.session.add_all(questions)
            await self.session.commit()
            return AuthEums.OK

        except Exception as e:
            await self.session.rollback()
            print(" add_question error:", e)
            return AuthEums.ERROR
        
    async def get_only_id_and_answer(self, subject_id:UUID):
            stmt = await self.session.execute(select(QuestionModel).where(QuestionModel.subject_id == subject_id))
            rows = stmt.scalars().all()
            return [
                SubmittedQ(
                    id=row.id,
                    answer=row.answer
                )
                  
                for row in rows
            ]
              
    async def get_questions(self, subject_id: UUID):
            stmt = await self.session.execute(select(QuestionModel).where(QuestionModel.subject_id == subject_id))
            rows = stmt.scalars().all()
            dt = [
                GetQuestionSchemas(
                    id=row.id,
                    question=row.question,
                    a=row.a_,
                    b=row.b_,
                    c=row.c_,
                    d=row.d_)
                  
                for row in rows
            ]
            shuffle(dt)
            return dt
            
    async def clear_old_question(self, subject_id: UUID):
        try:
            # Perform bulk delete for all questions tied to that subject
            await self.session.execute(
                delete(QuestionModel).where(QuestionModel.subject_id == subject_id)
            )
            await self.session.execute(
                delete(StudentScoreModel).where(StudentScoreModel.subject_id == subject_id)
            )
            await self.session.commit()
            return AuthEums.OK
        except Exception as e:
            await self.session.rollback()
            print(" clear_old_question error:", e)
            return AuthEums.ERROR