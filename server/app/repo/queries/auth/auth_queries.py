
from app.utils.enums.class_room_enums import ClassRoomEnums
from app.repo.schemas.student_schemas.add_new_student_schemas import AddNewStudentSchemas
from app.utils.enums.auth_enums import AuthEums
from app.security.password_hasher import generate_password, verify_hash_password
from app.repo.schemas.login_schemas import LoginUserSchemas
from app.repo import db_session_manager
import openpyxl
from ...dependecy import AsyncSession
from sqlalchemy import select
from ...models import StudentsModel, AdminModel

from uuid import uuid4



class AuthQueries:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def check_student_exist(self, identifier: str):
        res = await self.session.execute(select(StudentsModel).where(StudentsModel.identifier == identifier))
        output = res.scalar_one_or_none()
        return output
        
    async def check_admin_exist(self, identifier: str):
        res = await self.session.execute(select(AdminModel).where(AdminModel.identifier == identifier))
        output = res.scalar_one_or_none()
        return output

    
    async def add_new_student(self, add:AddNewStudentSchemas):
        check = await self.check_student_exist(add.identifier)
        if check:
            return AuthEums.EXISTS
        self.session.add(
            StudentsModel(
               id=uuid4(),
               class_id=add.class_id,
               full_name=add.full_name,
               identifier=add.identifier,
               password = generate_password(add.password)
            )
        )
        await self.session.commit()
        return AuthEums.CREATED
    
    
    
    async def login_user(self, login: LoginUserSchemas):
        if login.role == "admin":
            user = await self.check_admin_exist(identifier=login.identifier)
        else:
            user = await self.check_student_exist(login.identifier)
        if user:
            if verify_hash_password(login.password, hash_pass=user.password):
                return user
            return AuthEums.NOT_ALLOWED
        return AuthEums.NOT_FOUND

    async def process_bulk_students(self, file, class_id: str):

        workbook = openpyxl.load_workbook(file.file)  # ✅ correct
        sheet = workbook.active

        async with db_session_manager.session() as session:
            repo = AuthQueries(session)

            for row in sheet.iter_rows(min_row=2, values_only=True):
                full_name, identifier = row
                if not full_name or not identifier:
                    continue

                password = full_name.split(" ")[0]
                payload = AddNewStudentSchemas(
                    full_name=full_name.strip(),
                    identifier=str(identifier).strip(),
                    class_id=class_id,
                    password=password
                )
                await repo.add_new_student(payload)
