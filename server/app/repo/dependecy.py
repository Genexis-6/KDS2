import contextlib
from typing import AsyncIterable
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

DATABASE_URL = settings.DATABASE_URL
Base = declarative_base()




class DBSessionManager:
    def __init__(self, host: str):
        self.__engine = create_async_engine(url=host)
        self.__session_manager = async_sessionmaker(
            bind=self.__engine, autoflush=True, autocommit = False
        )
        
    async def start(self):
        if self.__engine is None:
            raise Exception("no host provided")
        async with self.__engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
    
    async def end(self):
        if self.__engine is None or self.__session_manager is None:
            raise Exception("No need closing nothig was initialized")
        
        await self.__engine.dispose()
        self.__engine = None
        self.__session_manager = None
        
        
    @contextlib.asynccontextmanager
    async def session(self) -> AsyncIterable[AsyncSession]:
        if self.__session_manager is None:
            raise Exception("Host was not initiaized")
        
        conn = self.__session_manager()
        try:
            yield conn
        except Exception as e:
            print(f"error occured due to: {e}")
            await conn.rollback()
            raise
        finally:
            await conn.close()
        
        


db_session_manager = DBSessionManager(host=DATABASE_URL)

    