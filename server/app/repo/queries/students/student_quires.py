from uuid import UUID

from app.repo.schemas.student_schemas.add_new_student_schemas import AddNewStudentSchemas, StudentInfoSchemas
from app.utils.enums.auth_enums import AuthEums
from app.security.password_hasher import generate_password
from ...dependecy import AsyncSession
from sqlalchemy import select, update
from ...models import StudentsModel

class StudentQueries:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    
    
    async def get_user_info(self, id:UUID):
        res = await self.session.execute(select(StudentsModel).where(StudentsModel.id == UUID(id)))
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