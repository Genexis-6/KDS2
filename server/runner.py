import os
import sys
import threading
import webbrowser
import uvicorn
import time
import asyncio

# --- Detect running mode (source vs frozen exe) ---
if getattr(sys, 'frozen', False):
    # Running as PyInstaller executable
    BASE_DIR = sys._MEIPASS
    print(f"📦 Running as executable, BASE_DIR: {BASE_DIR}")
else:
    # Running from source - runner.py is in server directory
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    print(f"🔧 Running from source, BASE_DIR: {BASE_DIR}")

# Add server/app to Python path (already in server directory)
app_dir = os.path.join(BASE_DIR, "app")
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

# Set environment variable for desktop mode
os.environ["APP_MODE"] = "desktop"

# Check and set database path for desktop mode
if getattr(sys, 'frozen', False):
    # When running as executable, use executable directory for data
    exe_dir = os.path.dirname(sys.executable)
    data_dir = os.path.join(exe_dir, "data")
    os.makedirs(data_dir, exist_ok=True)
    
    # Copy database files if they don't exist
    for db_file in ["data.db", "kds.db"]:
        src_db = os.path.join(BASE_DIR, db_file)
        dst_db = os.path.join(data_dir, db_file)
        if os.path.exists(src_db) and not os.path.exists(dst_db):
            import shutil
            shutil.copy(src_db, dst_db)
            print(f"📋 Copied {db_file} to {dst_db}")
    
    db_path = os.path.join(data_dir, "data.db")
    os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{db_path}"
    print(f"💾 Database path: {db_path}")
else:
    # Development mode - use files in server directory
    db_path = os.path.join(BASE_DIR, "data.db")
    os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{db_path}"

# Import app AFTER setting up paths and environment
try:
    from app.main import app
    print("✅ Successfully imported FastAPI app")
except ImportError as e:
    print(f"❌ Failed to import app: {e}")
    print(f"Python path: {sys.path}")
    sys.exit(1)

# Check if React build exists (client is one level up from server)
PROJECT_ROOT = os.path.dirname(BASE_DIR)  # Go up from server to project root
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "client", "dist")
if os.path.exists(FRONTEND_DIR):
    print(f"✅ React build found at: {FRONTEND_DIR}")
    
    # Serve static files from React build
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse
    
    # Mount the entire dist folder
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="static")
    print(f"📁 Mounted frontend from: {FRONTEND_DIR}")
    
    # Fallback route - serve index.html for SPA routing
    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        index_path = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"message": "React app not found", "mode": "desktop"}
else:
    print(f"⚠️ React build not found at: {FRONTEND_DIR}")

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "mode": os.environ.get("APP_MODE", "unknown"),
        "database": os.environ.get("DATABASE_URL", "not set"),
        "frontend": "available" if os.path.exists(FRONTEND_DIR) else "not found"
    }

# --- Run FastAPI server ---
def start_server():
    """Start the FastAPI server"""
    print("🚀 Starting FastAPI server on http://127.0.0.1:8000")
    
    # Configure uvicorn
    config = uvicorn.Config(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="info",
        reload=False,
        loop="asyncio",
        access_log=True,
    )
    
    server = uvicorn.Server(config)
    
    # Run the server
    try:
        asyncio.run(server.serve())
    except KeyboardInterrupt:
        print("\nServer shutting down...")
    except Exception as e:
        print(f"Server error: {e}")

def open_browser():
    """Open default browser after server starts"""
    time.sleep(2)  # Wait for server to start
    url = "http://127.0.0.1:8000"
    print(f"🌐 Opening browser: {url}")
    try:
        webbrowser.open_new(url)
    except Exception as e:
        print(f"Failed to open browser: {e}")

if __name__ == "__main__":
    print("=" * 50)
    print("📊 Exam Management System - Desktop Edition")
    print("=" * 50)
    
    # Start server in background thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Open browser
    browser_thread = threading.Thread(target=open_browser, daemon=True)
    browser_thread.start()
    
    # Keep the application running
    try:
        while server_thread.is_alive():
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\n👋 Shutting down application...")
    except Exception as e:
        print(f"Unexpected error: {e}")