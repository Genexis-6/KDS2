
from app.config import settings
import uvicorn


if __name__ == "__main__":
    uvicorn.run(
        app=settings.APP_NAME,
        port=settings.PORT,
        reload="True"
    )