import os
import sys
from fastapi import FastAPI
import contextlib
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.repo import db_session_manager
from app.routes import register_all_routes
from app.repo.queries.admin.all_admin_queries import AllAdminQueries


@contextlib.asynccontextmanager
async def life_span(app):
    await db_session_manager.start()
    
    async with db_session_manager.session() as session:
        admin = AllAdminQueries(session)
        await admin.add_admin()
        
    yield
    await db_session_manager.end()


app = FastAPI(title="KDS", lifespan=life_span)

all_origins = ["http://localhost:5173"]

register_all_routes(app)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_headers=["*"],
    allow_origins=all_origins,
    allow_methods=["*"]
)

# # Determine base directory (works both for dev and when frozen)
# if getattr(sys, 'frozen', False):
#     BASE_DIR = sys._MEIPASS  # When bundled by PyInstaller
# else:
#     BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# # Path to React build
# FRONTEND_DIST = os.path.join(BASE_DIR, "client", "dist")

# # Debug check
# if not os.path.exists(FRONTEND_DIST):
#     print("React dist folder not found at:", FRONTEND_DIST)

# # Serve static assets (JS, CSS, etc.)
# app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

# # Serve React index.html for all routes
# @app.get("/{full_path:path}")
# async def serve_react(full_path: str):
#     index_path = os.path.join(FRONTEND_DIST, "index.html")
#     return FileResponse(index_path)
