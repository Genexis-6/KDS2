import sys
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
import os

# base_path = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
# env_path = os.path.join(base_path, '.env')
# load_dotenv(env_path)
load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str
    APP_NAME:str
    PORT:int
    SK:str
    ALGO:str

    # Token / session lifetimes. All optional in .env -- these are the defaults.
    # A student's session lives exactly as long as their refresh token, so the
    # two can never drift apart (see token_generator.refresh_ttl_for).
    ACCESS_TOKEN_MINUTES: int = 15
    STUDENT_SESSION_HOURS: int = 12
    ADMIN_REFRESH_DAYS: int = 7

    SettingsConfigDict(env_file="../.env")
    
    



settings = Settings()
    