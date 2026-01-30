from uuid import UUID, uuid4
from sqlalchemy import select
from app.repo.schemas.timer_schemas.all_timer_schemas import AddNewTimerSchemas
from ...models import TimerModel
from ...dependecy import AsyncSession
from app.utils.enums.auth_enums import AuthEums


class TimerQueries:
    def __init__(self, session: AsyncSession):
        self.session = session
        
    
    async def check_timer_exist(self, subject_id: UUID):
        res = await self.session.execute(
            select(TimerModel).where(TimerModel.subject_id == subject_id)
        )
        output = res.scalar_one_or_none()
        return output
 
    async def get_current_timer(self, subject_id: UUID) -> AddNewTimerSchemas | None:
        timer = await self.check_timer_exist(subject_id)
        if timer is None:
            return None

       
        return AddNewTimerSchemas(
            hr=timer.hr,
            mins=timer.mins,
            sec=timer.sec,
            subjectId=timer.subject_id
        )

    
    async def add_timer(self, add: AddNewTimerSchemas):

        existing_timer =await self.check_timer_exist(add.subjectId)
        try:
            if existing_timer:
                existing_timer.hr = add.hr
                existing_timer.mins = add.mins
                existing_timer.sec = add.sec
            else:
             
                new_timer = TimerModel(
                    id=uuid4(),
                    hr=add.hr,
                    mins=add.mins,
                    sec=add.sec,
                    subject_id=add.subjectId,
                )
                self.session.add(new_timer)

            await self.session.commit()
            return AuthEums.OK

        except Exception as e:
            await self.session.rollback()
            return AuthEums.ERROR
