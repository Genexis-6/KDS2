from uuid import UUID

from app.repo.schemas.student_schemas.add_new_student_schemas import AddNewStudentSchemas, StudentInfoSchemas, UpdateStudentSchemas
from app.utils.enums.auth_enums import AuthEums
from app.security.password_hasher import generate_password
from ...dependecy import AsyncSession
from sqlalchemy import select, update
from ...models import StudentsModel

class StudentQueries:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_raw_student_by_id(self, id: UUID):
        res = await self.session.execute(select(StudentsModel).where(StudentsModel.id == id))
        return res.scalar_one_or_none()

    async def check_identifier_taken(self, identifier: str, exclude_id: UUID):
        res = await self.session.execute(
            select(StudentsModel).where(
                StudentsModel.identifier == identifier,
                StudentsModel.id != exclude_id,
            )
        )
        return res.scalar_one_or_none() is not None

    async def update_student(self, update_data: UpdateStudentSchemas):
        student = await self.get_raw_student_by_id(update_data.id)
        if student is None:
            return AuthEums.NOT_FOUND

        if update_data.identifier is not None and update_data.identifier != student.identifier:
            if await self.check_identifier_taken(update_data.identifier, update_data.id):
                return AuthEums.EXISTS
            student.identifier = update_data.identifier

        if update_data.fullName is not None:
            student.full_name = update_data.fullName
        if update_data.classId is not None:
            student.class_id = update_data.classId

        try:
            await self.session.commit()
            return AuthEums.OK
        except Exception as e:
            await self.session.rollback()
            print(f"error updating student: {e}")
            return AuthEums.ERROR

    async def delete_student(self, student_id: UUID):
        student = await self.get_raw_student_by_id(student_id)
        if student is None:
            return AuthEums.NOT_FOUND

        try:
            await self.session.delete(student)
            await self.session.commit()
            return AuthEums.OK
        except Exception as e:
            await self.session.rollback()
            print(f"error deleting student: {e}")
            return AuthEums.ERROR

    async def get_user_info(self, id:UUID):
        res  = await self.session.execute(select(StudentsModel).where(StudentsModel.id == id))
        output = res.scalar_one_or_none()
        
        if not output:
            return None
        
        return StudentInfoSchemas(
            fullName=output.full_name,
            identifier=output.identifier,
            classId=output.class_id,
            id = output.id
        )
        
    async def update_password(self, student_id: UUID, new_password: str):
        try:
            hashed_pwd = generate_password(new_password)


            stmt = (
                update(StudentsModel)
                .where(StudentsModel.id == student_id)
                .values(password=hashed_pwd)
            )
            await self.session.execute(stmt)
            await self.session.commit()
            return AuthEums.OK

        except Exception as e:
            await self.session.rollback()
            
            return AuthEums.ERROR