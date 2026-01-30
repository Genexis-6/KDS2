import os
import sys
import uvicorn
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.main import app

# --- Detect running mode ---
if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# --- Frontend path ---
FRONTEND_DIR = os.path.join(BASE_DIR, "client", "dist")
assets_dir = os.path.join(FRONTEND_DIR, "assets")

# --- Mount static files ---
app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/{path:path}")
async def serve_frontend(path: str):
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


if __name__ == "__main__":
    print("🚀 Starting server at http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000)
