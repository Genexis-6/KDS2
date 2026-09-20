from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.repo.models import QuestionModel
from uuid import UUID, uuid4
from app.utils.enums.auth_enums import AuthEums
from app.repo.schemas.subject_schemas.all_questions_schemas import AdminQuestionSchemas, EditQuestionSchemas, GetQuestionSchemas, SubmittedQ
from random import shuffle
from sqlalchemy import delete

from app.repo.models.subject.student_scores_model import StudentScoreModel
from app.utils.helpers.answer_checker import AnswerKey

# How many questions are flushed to the DB between progress updates.
ADD_QUESTION_BATCH_SIZE = 50

class AllQuestionQueries:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def add_question(self, subject_id: UUID, data: list, on_progress=None):
        """`data` is a list of plain dicts (already parsed + validated on a
        worker thread by the endpoint) with keys: Questions, a, b, c, d, answers.

        Rows are flushed in batches so `on_progress(rows_so_far)` can report real
        progress, but everything is still ONE transaction: it is committed at the
        end, or rolled back completely if anything fails."""
        try:
            done = 0
            for start in range(0, len(data), ADD_QUESTION_BATCH_SIZE):
                batch = data[start:start + ADD_QUESTION_BATCH_SIZE]
                self.session.add_all([
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
                    for row in batch
                ])
                await self.session.flush()
                done += len(batch)
                if on_progress:
                    on_progress(done)

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
              
    async def get_answer_key(self, subject_id: UUID):
        """Answer + option texts for every question in a subject, for scoring."""
        stmt = await self.session.execute(select(QuestionModel).where(QuestionModel.subject_id == subject_id))
        return [
            AnswerKey(
                id=row.id,
                answer=row.answer,
                options={"a": row.a_, "b": row.b_, "c": row.c_, "d": row.d_},
            )
            for row in stmt.scalars().all()
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
            
    async def get_all_questions_for_admin(self, subject_id: UUID):
        """Full, unfiltered, un-shuffled list with answers included -- for the
        admin question-management UI (unlike FilterQuestionQueries, which
        hides answers and randomly limits the set for exam-taking)."""
        res = await self.session.execute(select(QuestionModel).where(QuestionModel.subject_id == subject_id))
        rows = res.scalars().all()
        return [
            AdminQuestionSchemas(
                id=row.id,
                question=row.question,
                a=row.a_,
                b=row.b_,
                c=row.c_,
                d=row.d_,
                answer=row.answer,
            )
            for row in rows
        ]

    async def get_question_by_id(self, question_id: UUID):
        res = await self.session.execute(select(QuestionModel).where(QuestionModel.id == question_id))
        return res.scalar_one_or_none()

    async def edit_question(self, edit: EditQuestionSchemas):
        question = await self.get_question_by_id(edit.id)
        if question is None:
            return AuthEums.NOT_FOUND

        if edit.question is not None:
            question.question = edit.question.strip()
        if edit.a is not None:
            question.a_ = edit.a.strip()
        if edit.b is not None:
            question.b_ = edit.b.strip()
        if edit.c is not None:
            question.c_ = edit.c.strip()
        if edit.d is not None:
            question.d_ = edit.d.strip()
        if edit.answer is not None:
            question.answer = edit.answer.strip()

        try:
            await self.session.commit()
            return AuthEums.OK
        except Exception as e:
            await self.session.rollback()
            print(" edit_question error:", e)
            return AuthEums.ERROR

    async def delete_single_question(self, question_id: UUID):
        question = await self.get_question_by_id(question_id)
        if question is None:
            return AuthEums.NOT_FOUND

        try:
            await self.session.delete(question)
            await self.session.commit()
            return AuthEums.OK
        except Exception as e:
            await self.session.rollback()
            print(" delete_single_question error:", e)
            return AuthEums.ERROR

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