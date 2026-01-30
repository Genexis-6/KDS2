from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.repo.models import QuestionModel
from uuid import UUID, uuid4
from app.utils.enums.auth_enums import AuthEums
from app.repo.schemas.subject_schemas.all_questions_schemas import GetQuestionSchemas, SubmittedQ
from random import shuffle


from app.repo.models.subject.filter_qustion_model import FilterQuestionModel
from app.repo.schemas.subject_schemas.subject_score_schemas import GetFilterFormat, SaveSubjectFormat


class FilterQuestionQueries():
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_filtered_questions(self, subject_id: UUID):
        """
        Get limited number of random questions for a subject.
        Number of questions is read from question_format table.
        
        Args:
            subject_id: The subject UUID
        
        Returns:
            List of GetQuestionSchemas (limited to stored num_of_qa or available count)
        """
        try:
            # First, get the question format for this subject
            format_stmt = await self.session.execute(
                select(FilterQuestionModel)
                .where(FilterQuestionModel.subject_id == subject_id)
            )
            question_format = format_stmt.scalar_one_or_none()
            
            # If no format found, return all questions or handle as needed
            if not question_format:
                # Option 1: Return all questions
                num_of_qa = 0  # Will return all questions
                # Option 2: Return empty list if no format set
                # return []
            else:
                num_of_qa = question_format.num_of_qa
            
            # Fetch all questions for this subject
            stmt = await self.session.execute(
                select(QuestionModel).where(QuestionModel.subject_id == subject_id)
            )
            rows = stmt.scalars().all()
            
            # If no questions found, return empty list
            if not rows:
                return []
            
            # If num_of_qa is 0 or greater than available, return all questions
            if num_of_qa <= 0 or num_of_qa > len(rows):
                # Option: Return all questions shuffled
                from random import shuffle
                shuffle(rows)
                selected_questions = rows
            else:
                # Shuffle and take only num_of_qa questions
                from random import shuffle
                shuffle(rows)
                selected_questions = rows[:num_of_qa]
            
            return [
                GetQuestionSchemas(
                    id=row.id,
                    question=row.question,
                    a=row.a_,
                    b=row.b_,
                    c=row.c_,
                    d=row.d_,
                )
                for row in selected_questions
            ]
        except Exception as e:
            print("get_filtered_questions error:", e)
            return []
                
            
    async def check_format_exist(self, subject_id:UUID):
        res = await self.session.execute(select(FilterQuestionModel).where(FilterQuestionModel.subject_id == subject_id))
        output = res.scalar_one_or_none()
        return output
        
    async def get_question_format(self, subject_id):
        check =  await self.check_format_exist(subject_id)
        if check:
            return GetFilterFormat(
                score_per_qa=check.score_per_qa,
                number_of_qa=check.num_of_qa
            )
        return None
        
    async def save_question_format(self, save: SaveSubjectFormat):
        try:
            
            check = await self.check_format_exist(save.subject_id)

            if check:
                check.num_of_qa = save.number_of_qa if save.number_of_qa != 0 else check.num_of_qa
                check.score_per_qa = save.score_per_qa if save.score_per_qa != 0 else check.score_per_qa

            else:
                self.session.add(
                    FilterQuestionModel(
                        num_of_qa=save.number_of_qa,
                        score_per_qa=save.score_per_qa,
                        subject_id=save.subject_id 
                    )
                )

            await self.session.commit()
            return True
        
        except Exception as e:
            return False
    
