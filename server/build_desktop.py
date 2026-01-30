#!/usr/bin/env python3
import os
import subprocess
import sys
import shutil

def get_project_root():
    """Get project root (one level up from server)"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.dirname(current_dir)

def build_react():
    """Build React frontend"""
    print("📦 Building React frontend...")
    
    project_root = get_project_root()
    client_dir = os.path.join(project_root, "client")
    
    if not os.path.exists(client_dir):
        print("❌ Client directory not found!")
        return False
    
    # Check if node_modules exists
    node_modules = os.path.join(client_dir, "node_modules")
    if not os.path.exists(node_modules):
        print("Installing npm dependencies...")
        result = subprocess.run(["npm", "install"], cwd=client_dir, 
                              capture_output=True, text=True, shell=True)
        if result.returncode != 0:
            print(f"Failed to install dependencies: {result.stderr}")
            return False
    
    # Build React app
    print("Creating production build...")
    result = subprocess.run(["npm", "run", "build"], cwd=client_dir, 
                          capture_output=True, text=True, shell=True)
    if result.returncode != 0:
        print(f"❌ Failed to build React app: {result.stderr}")
        return False
    
    print("✅ React build completed")
    return True

def build_exe():
    """Build executable with PyInstaller"""
    print("\n🔨 Building executable with PyInstaller...")
    
    # Install PyInstaller if not present
    try:
        import PyInstaller
    except ImportError:
        print("Installing PyInstaller...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"], check=True)
    
    project_root = get_project_root()
    server_dir = os.path.join(project_root, "server")
    
    # Clean previous builds
    build_dir = os.path.join(server_dir, "build")
    dist_dir = os.path.join(server_dir, "dist")
    
    for dir_path in [build_dir, dist_dir]:
        if os.path.exists(dir_path):
            shutil.rmtree(dir_path)
            print(f"🧹 Cleaned {dir_path}")
    
    # Build using spec file
    spec_file = os.path.join(server_dir, "pyinstaller.spec")
    if not os.path.exists(spec_file):
        print(f"❌ Spec file not found: {spec_file}")
        return False
    
    print(f"Using spec file: {spec_file}")
    result = subprocess.run(
        [sys.executable, "-m", "PyInstaller", spec_file, "--clean"],
        cwd=server_dir,
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print(f"❌ PyInstaller failed: {result.stderr}")
        return False
    
    # Move output to project root for easier access
    final_dist = os.path.join(project_root, "dist")
    if os.path.exists(final_dist):
        shutil.rmtree(final_dist)
    
    if os.path.exists(dist_dir):
        shutil.move(dist_dir, final_dist)
        print(f"📁 Moved distribution to: {final_dist}")
    
    print("✅ Executable built successfully!")
    return True

def create_portable_package():
    """Create a portable package"""
    print("\n📁 Creating portable package...")
    
    project_root = get_project_root()
    dist_dir = os.path.join(project_root, "dist")
    portable_dir = os.path.join(project_root, "ExamManagement_Portable")
    
    # Clean previous portable package
    if os.path.exists(portable_dir):
        shutil.rmtree(portable_dir)
    
    # Check if distribution exists
    if not os.path.exists(dist_dir):
        print("❌ Distribution not found!")
        return False
    
    # Copy entire distribution
    print(f"Copying from {dist_dir} to {portable_dir}")
    shutil.copytree(dist_dir, portable_dir)
    
    # Create data directory
    data_dir = os.path.join(portable_dir, "data")
    os.makedirs(data_dir, exist_ok=True)
    
    # Copy database files from server directory
    server_dir = os.path.join(project_root, "server")
    for db_file in ["data.db", "kds.db"]:
        src_db = os.path.join(server_dir, db_file)
        if os.path.exists(src_db):
            shutil.copy(src_db, data_dir)
            print(f"📋 Copied {db_file} to portable package")
    
    # Create README
    readme_content = """# Exam Management System - Portable Edition

## How to use:
1. Navigate to the ExamManagement folder
2. Double-click ExamManagement.exe
3. The application will open in your default browser at http://localhost:8000
4. All data is stored in the 'data' folder within this portable package

## System Requirements:
- Windows 7, 8, 10, or 11
- 4GB RAM minimum
- 500MB free disk space

## Troubleshooting:
- If the app doesn't start, ensure no other application is using port 8000
- Check Windows Firewall settings
- Run as Administrator if you encounter permission issues
- For support, check the application logs in the console window

## Backup:
Regularly backup the 'data' folder to prevent data loss.

Enjoy your Exam Management System!
"""
    
    with open(os.path.join(portable_dir, "README.txt"), "w") as f:
        f.write(readme_content)
    
    # Create a simple launcher batch file for Windows
    batch_content = """@echo off
echo Starting Exam Management System...
echo.
echo The application will open in your default browser.
echo If it doesn't open automatically, go to: http://localhost:8000
echo.
echo Press Ctrl+C to stop the application.
echo.
ExamManagement.exe
pause
"""
    
    with open(os.path.join(portable_dir, "Start Exam Management.bat"), "w") as f:
        f.write(batch_content)
    
    print(f"✅ Portable package created in: {portable_dir}")
    
    # Calculate size
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(portable_dir):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            total_size += os.path.getsize(fp)
    
    print(f"📊 Package size: {total_size / (1024*1024):.2f} MB")
    return True

def main():
    """Main build process"""
    print("=" * 60)
    print("🚀 DESKTOP APP BUILDER - Exam Management System")
    print("=" * 60)
    
    project_root = get_project_root()
    print(f"📁 Project root: {project_root}")
    
    # Step 1: Build React
    print("\n" + "=" * 30)
    print("Step 1/3: Building React Frontend")
    print("=" * 30)
    if not build_react():
        return
    
    # Step 2: Build executable
    print("\n" + "=" * 30)
    print("Step 2/3: Building Executable")
    print("=" * 30)
    if not build_exe():
        return
    
    # Step 3: Create portable package
    print("\n" + "=" * 30)
    print("Step 3/3: Creating Portable Package")
    print("=" * 30)
    create_portable_package()
    
    print("\n" + "=" * 60)
    print("🎉 BUILD COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print("\n📦 OUTPUT FILES:")
    print(f"  📁 {os.path.join(project_root, 'dist')}")
    print(f"     └── ExamManagement/ (Contains the executable)")
    print(f"  📁 {os.path.join(project_root, 'ExamManagement_Portable')}")
    print(f"     ├── ExamManagement.exe")
    print(f"     ├── Start Exam Management.bat")
    print(f"     ├── README.txt")
    print(f"     └── data/ (Database files)")
    print("\n🚀 TO RUN THE APPLICATION:")
    print("  1. Open ExamManagement_Portable folder")
    print("  2. Double-click 'Start Exam Management.bat'")
    print("  3. Or double-click ExamManagement.exe directly")
    print("\n🌐 The app will open at: http://localhost:8000")
    print("\n💡 TIP: Run 'ExamManagement.exe' directly for no console window")
    print("=" * 60)

if __name__ == "__main__":
    main()