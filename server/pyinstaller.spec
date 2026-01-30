# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

import os
import sys

# Get the project root (one level up from server)
PROJECT_ROOT = os.path.dirname(os.path.abspath('.'))
SERVER_DIR = os.path.join(PROJECT_ROOT, 'server')
CLIENT_DIST = os.path.join(PROJECT_ROOT, 'client', 'dist')

# Collect data files
datas = []

# Add client/dist folder (from project root)
if os.path.exists(CLIENT_DIST):
    for root, dirs, files in os.walk(CLIENT_DIST):
        for file in files:
            file_path = os.path.join(root, file)
            # Get relative path from client/dist
            rel_path = os.path.relpath(file_path, CLIENT_DIST)
            target_dir = os.path.join('client', 'dist', os.path.dirname(rel_path))
            if target_dir == 'client/dist':
                datas.append((file_path, 'client/dist'))
            else:
                datas.append((file_path, target_dir))
    print(f"✅ Added client/dist files: {len([d for d in datas if 'client/dist' in d[1]])} files")
else:
    print(f"⚠️ Client dist not found at: {CLIENT_DIST}")

# Add server directory files
for root, dirs, files in os.walk(SERVER_DIR):
    # Skip __pycache__ directories
    dirs[:] = [d for d in dirs if '__pycache__' not in d]
    
    for file in files:
        file_path = os.path.join(root, file)
        # Get relative path from server directory
        rel_path = os.path.relpath(file_path, SERVER_DIR)
        target_dir = os.path.dirname(rel_path)
        
        # Skip .pyc files
        if file.endswith('.pyc'):
            continue
            
        if target_dir == '':
            datas.append((file_path, '.'))
        else:
            datas.append((file_path, target_dir))

print(f"✅ Added server files: {len([d for d in datas if d[1] != 'client/dist'])} files")

# Special handling for app directory
app_dir = os.path.join(SERVER_DIR, 'app')
for root, dirs, files in os.walk(app_dir):
    # Skip __pycache__
    dirs[:] = [d for d in dirs if '__pycache__' not in d]
    
    for file in files:
        if file.endswith('.py'):
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, SERVER_DIR)
            target_dir = os.path.dirname(rel_path)
            datas.append((file_path, target_dir))

a = Analysis(
    [os.path.join(SERVER_DIR, 'runner.py')],
    pathex=[SERVER_DIR, os.path.join(SERVER_DIR, 'app'), PROJECT_ROOT],
    binaries=[],
    datas=datas,
    hiddenimports=[
        # FastAPI/ASGI
        'uvicorn',
        'uvicorn.loops',
        'uvicorn.loops.asyncio',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.http.h11_impl',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.protocols.websockets.websockets_impl',
        
        # Database
        'aiosqlite',
        'asyncpg',
        'sqlalchemy',
        'sqlalchemy.ext',
        'sqlalchemy.ext.asyncio',
        'sqlalchemy.dialects',
        'sqlalchemy.dialects.postgresql',
        'sqlalchemy.dialects.sqlite',
        
        # Security
        'passlib',
        'passlib.handlers',
        'passlib.handlers.bcrypt',
        'jose',
        'jose.jwt',
        
        # Your app modules
        'app',
        'app.repo',
        'app.routes',
        'app.security',
        'app.utils',
        
        # Other
        'email_validator',
        'multipart',
        'typing_extensions',
        'anyio',
        'click',
        'pydantic',
        'pydantic.generics',
        'pydantic.json',
        'pydantic.types',
        'pydantic.fields',
        'pydantic.config',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'numpy',
        'pandas',
        'matplotlib',
        'tkinter',
        'PyQt5',
        'PySide2',
        'test',
        'tests',
        'testing',
    ],
    noarchive=False,
    optimize=0,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='ExamManagement',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # Set to False after testing
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=[os.path.join(SERVER_DIR, 'vite.ico')] if os.path.exists(os.path.join(SERVER_DIR, 'vite.ico')) else None,
)

# Create a folder distribution
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    a.zipfiles,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='ExamManagement',
)