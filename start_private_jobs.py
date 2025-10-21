#!/usr/bin/env python3
"""
GigChain Private Jobs System - Startup Script
"""

import subprocess
import sys
import time
import os
import sqlite3
from pathlib import Path

def check_dependencies():
    """Check if all required dependencies are installed"""
    print("🔍 Checking dependencies...")
    
    try:
        import fastapi
        import uvicorn
        import sqlalchemy
        import websockets
        print("✅ Backend dependencies OK")
    except ImportError as e:
        print(f"❌ Missing backend dependency: {e}")
        print("Run: pip install -r requirements.txt")
        return False
    
    # Check if frontend dependencies exist
    frontend_path = Path("frontend/package.json")
    if frontend_path.exists():
        print("✅ Frontend directory found")
    else:
        print("❌ Frontend directory not found")
        return False
    
    return True

def setup_database():
    """Setup database for private jobs system"""
    print("🗄️ Setting up database...")
    
    try:
        # Import and run database setup
        from database_setup import create_private_jobs_tables, create_sample_data
        create_private_jobs_tables()
        create_sample_data()
        print("✅ Database setup complete")
        return True
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        return False

def start_backend():
    """Start the FastAPI backend server"""
    print("🚀 Starting backend server...")
    
    try:
        # Start the server in background
        process = subprocess.Popen([
            sys.executable, "main.py"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait a moment for server to start
        time.sleep(3)
        
        # Check if server is running
        if process.poll() is None:
            print("✅ Backend server started on http://localhost:5000")
            return process
        else:
            print("❌ Backend server failed to start")
            return None
    except Exception as e:
        print(f"❌ Error starting backend: {e}")
        return None

def start_frontend():
    """Start the React frontend development server"""
    print("🎨 Starting frontend server...")
    
    try:
        # Change to frontend directory
        os.chdir("frontend")
        
        # Start the development server
        process = subprocess.Popen([
            "npm", "run", "dev"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait a moment for server to start
        time.sleep(5)
        
        # Check if server is running
        if process.poll() is None:
            print("✅ Frontend server started on http://localhost:3000")
            return process
        else:
            print("❌ Frontend server failed to start")
            return None
    except Exception as e:
        print(f"❌ Error starting frontend: {e}")
        return None
    finally:
        # Change back to root directory
        os.chdir("..")

def run_tests():
    """Run the private jobs system tests"""
    print("🧪 Running tests...")
    
    try:
        result = subprocess.run([
            sys.executable, "test_private_jobs.py"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ All tests passed")
            return True
        else:
            print(f"❌ Tests failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error running tests: {e}")
        return False

def main():
    """Main startup function"""
    print("🚀 GigChain Private Jobs System Startup")
    print("=" * 50)
    
    # Check dependencies
    if not check_dependencies():
        print("\n❌ Dependency check failed. Please install required packages.")
        sys.exit(1)
    
    # Setup database
    if not setup_database():
        print("\n❌ Database setup failed. Please check your configuration.")
        sys.exit(1)
    
    # Start backend
    backend_process = start_backend()
    if not backend_process:
        print("\n❌ Backend startup failed.")
        sys.exit(1)
    
    # Start frontend
    frontend_process = start_frontend()
    if not frontend_process:
        print("\n❌ Frontend startup failed.")
        backend_process.terminate()
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("🎉 GigChain Private Jobs System is running!")
    print("=" * 50)
    print("📱 Frontend: http://localhost:3000")
    print("🔧 Backend API: http://localhost:5000")
    print("📚 API Docs: http://localhost:5000/docs")
    print("=" * 50)
    print("\nPress Ctrl+C to stop all services")
    
    try:
        # Keep the script running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping services...")
        
        # Terminate processes
        if backend_process:
            backend_process.terminate()
            print("✅ Backend stopped")
        
        if frontend_process:
            frontend_process.terminate()
            print("✅ Frontend stopped")
        
        print("👋 Goodbye!")

if __name__ == "__main__":
    main()