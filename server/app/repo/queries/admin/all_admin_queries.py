from uuid import uuid4
from sqlalchemy import select
from ...dependecy import AsyncSession
from ...models import AdminModel
from app.security.password_hasher import generate_password


class AllAdminQueries:
    def __init__(self, session: AsyncSession):
        self.session = session
        
    async def check_admin_exist(self, identifier: str):
        admin_exist = await self.session.execute(select(AdminModel).where(AdminModel.identifier == identifier))
        output = admin_exist.scalar_one_or_none()
        return output
    
    
    async def add_admin(self):
        admin_data = {
           "name":"Azudoni Victory chukwuneku",
           "identifier":"KDSADMIN101",
           "password":"admin123*"
            
        }
        admin_exist = await self.check_admin_exist(admin_data["identifier"])
        if admin_exist:
            return
        self.session.add(
            AdminModel(
                id=uuid4(),
                full_name=admin_data["name"],
                identifier=admin_data["identifier"],
                password=generate_password(admin_data["password"])
            )
        )
        await self.session.commit()
        return