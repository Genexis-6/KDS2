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
    SettingsConfigDict(env_file="../.env")
    
    



settings = Settings()
    