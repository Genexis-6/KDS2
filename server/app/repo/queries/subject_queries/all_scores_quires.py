from sqlalchemy import select, delete
from app.repo.models.subject.student_scores_model import StudentScoreModel
from app.repo.schemas.subject_schemas.all_questions_schemas import SubmittedQuestions, SubmittedQ
from app.repo.queries.subject_queries.all_question_queries import AllQuestionQueries
from uuid import UUID
from datetime import datetime
from app.repo.schemas.subject_schemas.subject_score_schemas import AddScoreSchemas
from app.repo.queries.subject_queries.filter_question_queries import FilterQuestionQueries
from app.utils.helpers.answer_checker import is_correct_answer

class AllScoresQueries:
    def __init__(self, session):
        self.session = session
        self.qa_query = AllQuestionQueries(session)
        self.filter_query = FilterQuestionQueries(session)  # Add filter queries
        
    async def check_score_exist(self, student_id: UUID, subject_id: UUID):
        res = await self.session.execute(
            select(StudentScoreModel)
            .where(StudentScoreModel.student_id == student_id)
            .where(StudentScoreModel.subject_id == subject_id)
        )
        return res.scalar_one_or_none()

    # ✅ NEW METHOD: Delete scores by student ID (all subjects)
    async def delete_scores_by_student_id(self, student_id: UUID):
        """Delete all scores for a specific student across all subjects"""
        try:
            # First, check if any scores exist
            res = await self.session.execute(
                select(StudentScoreModel)
                .where(StudentScoreModel.student_id == student_id)
            )
            scores = res.scalars().all()
            
            if not scores:
                return {"deleted": False, "message": "No scores found for this student", "count": 0}
            
            # Delete the scores
            delete_stmt = delete(StudentScoreModel).where(
                StudentScoreModel.student_id == student_id
            )
            result = await self.session.execute(delete_stmt)
            await self.session.commit()
            
            return {
                "deleted": True,
                "message": f"Successfully deleted {result.rowcount} score(s) for student {student_id}",
                "count": result.rowcount
            }
            
        except Exception as e:
            await self.session.rollback()
            return {"deleted": False, "message": f"Error deleting scores: {str(e)}", "count": 0}

    # ✅ NEW METHOD: Delete scores by student ID and subject ID
    async def delete_score_by_student_and_subject(self, student_id: UUID, subject_id: UUID):
        """Delete a specific score for a student in a specific subject"""
        try:
            delete_stmt = delete(StudentScoreModel).where(
                StudentScoreModel.student_id == student_id,
                StudentScoreModel.subject_id == subject_id
            )
            result = await self.session.execute(delete_stmt)
            await self.session.commit()
            
            return {
                "deleted": result.rowcount > 0,
                "message": f"Deleted {result.rowcount} score(s) for student {student_id} in subject {subject_id}",
                "count": result.rowcount
            }
            
        except Exception as e:
            await self.session.rollback()
            return {"deleted": False, "message": f"Error deleting score: {str(e)}", "count": 0}

    # ✅ NEW METHOD: Get all scores for a student
    async def get_scores_by_student_id(self, student_id: UUID):
        """Get all scores for a specific student"""
        res = await self.session.execute(
            select(StudentScoreModel)
            .where(StudentScoreModel.student_id == student_id)
            .order_by(StudentScoreModel.created_at.desc())
        )
        return res.scalars().all()

    # ✅ NEW METHOD: Drop all scores (for all students) - USE WITH CAUTION!
    async def drop_all_scores(self):
        """Delete ALL scores from the database - Use with extreme caution!"""
        try:
            # First get count for reporting
            res = await self.session.execute(select(StudentScoreModel))
            count_before = len(res.scalars().all())
            
            # Delete all records
            delete_stmt = delete(StudentScoreModel)
            result = await self.session.execute(delete_stmt)
            await self.session.commit()
            
            return {
                "deleted": True,
                "message": f"Dropped all {result.rowcount} scores from database",
                "count": result.rowcount,
                "previous_count": count_before
            }
            
        except Exception as e:
            await self.session.rollback()
            return {"deleted": False, "message": f"Error dropping scores: {str(e)}", "count": 0}

    async def process_score(self, submission: SubmittedQuestions[SubmittedQ]):
        existing = await self.check_score_exist(
            student_id=submission.studentId,
            subject_id=submission.subjectId
        )
        if existing:
            # Option: You could update existing score instead of returning False
            # await self.delete_score_by_student_and_subject(submission.studentId, submission.subjectId)
            return False

        # ✅ Get filter settings for this subject
        filter_settings = await self.filter_query.get_question_format(submission.subjectId)
        
        # Get the answer key (answer + option texts) for every question
        answer_key = await self.qa_query.get_answer_key(subject_id=submission.subjectId)
        actual_total_questions = len(answer_key)
        
        # ✅ Determine scoring parameters based on filter existence
        if filter_settings:
            # Use filter settings
            score_per_question = filter_settings.score_per_qa
            total_questions_for_scoring = filter_settings.number_of_qa
            
            print(f"Using filter settings: {score_per_question} points per question, {total_questions_for_scoring} total questions")
        else:
            # Default: 1 mark per question, use actual question count
            score_per_question = 1
            total_questions_for_scoring = actual_total_questions
            
            print(f"No filter settings found. Using defaults: 1 point per question, {actual_total_questions} total questions")
        
        # One answer per question (the last one wins), so a tampered request
        # can't repeat a correct question to inflate the score.
        submitted_by_id = {str(ans.id): ans.answer for ans in submission.answers}

        # Validate: Ensure we don't have more submitted answers than expected
        total_submitted = len(submitted_by_id)
        
        if total_submitted > total_questions_for_scoring:
            print(f"Warning: Submitted {total_submitted} answers, but only {total_questions_for_scoring} expected. Using submitted count.")
            total_questions_for_scoring = total_submitted
        
        # ✅ Count correct answers. The exam UI submits the option letter ("A".."D")
        # while banks may store either the letter or the option text as the answer;
        # is_correct_answer understands both.
        key_by_id = {str(q.id): q for q in answer_key}
        correct_answers = sum(
            1
            for question_id, chosen in submitted_by_id.items()
            if question_id in key_by_id
            and is_correct_answer(chosen, key_by_id[question_id].answer, key_by_id[question_id].options)
        )

        # ✅ Calculate scores
        # Percentage score (0-100)
        score_percentage = (correct_answers / total_questions_for_scoring) * 100 if total_questions_for_scoring > 0 else 0
        
        # ✅ Create score entry
        new_score = StudentScoreModel(
            score=score_percentage,  # Store as percentage
            total_questions=total_questions_for_scoring,  # Store scoring total
            correct_answers=correct_answers,
            attempt_number=1,
            exam_status="submitted",
            created_at=datetime.now(),
            student_id=submission.studentId,
            subject_id=submission.subjectId,
            # Add custom fields if your model supports them
            # raw_score=raw_score,
            # max_possible_score=max_possible_score,
            # score_per_question=score_per_question,
            # uses_filter=filter_settings is not None
        )

        self.session.add(new_score)
        await self.session.commit()

        # ✅ Prepare response
        response_data = AddScoreSchemas(
            score=int(score_percentage),
            total_questions=total_questions_for_scoring,
            correct_answers=correct_answers,
            attempt_number=1,
            exam_status="submitted",
            student_id=submission.studentId,
            subject_id=submission.subjectId
        )
        
        return response_data