#!/usr/bin/env python3
"""
GigChain Setup Script
Addresses all Codex feedback and sets up the system automatically.
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def print_header(text):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")

def print_success(text):
    print(f"✅ {text}")

def print_error(text):
    print(f"❌ {text}")

def print_info(text):
    print(f"ℹ️  {text}")

def run_command(command, description):
    """Run a shell command and return success status."""
    print_info(f"Running: {description}")
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode == 0:
            print_success(description)
            return True
        else:
            print_error(f"{description} - Error: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print_error(f"{description} - Timeout")
        return False
    except Exception as e:
        print_error(f"{description} - Exception: {str(e)}")
        return False

def check_python_version():
    """Check Python version compatibility."""
    print_header("Checking Python Version")
    
    version = sys.version_info
    print_info(f"Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major == 3 and version.minor >= 10:
        print_success("Python version is compatible (3.10+)")
        return True
    else:
        print_error("Python 3.10+ is required")
        return False

def install_dependencies():
    """Install all required dependencies."""
    print_header("Installing Dependencies")
    
    dependencies = [
        # Core FastAPI
        "fastapi uvicorn openai pydantic python-dotenv pydantic-settings",
        # Web3 & Auth
        "web3 eth-account eth-utils eth-typing hexbytes mnemonic",
        # Crypto & JWT
        "cryptography PyJWT redis",
        # MFA & Security
        "pyotp qrcode pillow requests",
        # Database
        "psycopg2-binary",
        # Additional
        "python-multipart flask flask-cors werkzeug typing-extensions"
    ]
    
    for dep_group in dependencies:
        if not run_command(f"pip3 install {dep_group}", f"Installing {dep_group.split()[0]} group"):
            return False
    
    return True

def create_env_file():
    """Create .env file if it doesn't exist."""
    print_header("Configuring Environment")
    
    env_path = Path(".env")
    
    if env_path.exists():
        print_info(".env file already exists")
        return True
    
    env_content = """# GigChain Environment Configuration

# Server Configuration
PORT=5000
DEBUG=False

# OpenAI Configuration (REQUIRED - Set your real API key)
OPENAI_API_KEY=your_openai_api_key_here

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173

# W-CSAP Authentication
W_CSAP_SECRET_KEY=development_secret_key_minimum_32_characters_long_for_security

# Database Configuration (SQLite by default, PostgreSQL for production)
DATABASE_TYPE=sqlite

# ==================== OPTIONAL CONFIGURATIONS ====================

# SIEM Integration (Uncomment and configure when needed)

# Splunk HTTP Event Collector
# SPLUNK_HEC_URL=https://splunk.example.com:8088/services/collector
# SPLUNK_HEC_TOKEN=12345678-1234-1234-1234-123456789012

# Elasticsearch
# ELASTIC_URL=http://localhost:9200
# ELASTIC_INDEX=gigchain-security
# ELASTIC_API_KEY=your_api_key_here

# Datadog Logs
# DATADOG_API_KEY=your_32_char_api_key
# DATADOG_SITE=datadoghq.com

# PostgreSQL (for production scaling 10,000+ users)
# DATABASE_TYPE=postgresql
# DATABASE_URL=postgresql://user:password@localhost:5432/gigchain

# AI Anomaly Detection (Always enabled - no config needed)
"""
    
    try:
        with open(env_path, 'w') as f:
            f.write(env_content)
        print_success(".env file created")
        print_info("⚠️  Remember to set your real OPENAI_API_KEY")
        return True
    except Exception as e:
        print_error(f"Failed to create .env file: {str(e)}")
        return False

def test_imports():
    """Test that all modules can be imported."""
    print_header("Testing Module Imports")
    
    modules = [
        ("admin_mfa_system", "MFA System"),
        ("security_monitoring", "Security Monitoring"),
        ("database_manager", "Database Manager"),
        ("admin_export_system", "Export System"),
        ("admin_system", "Admin System")
    ]
    
    all_ok = True
    
    for module, description in modules:
        try:
            __import__(module)
            print_success(f"{description}")
        except Exception as e:
            print_error(f"{description} - Error: {str(e)}")
            all_ok = False
    
    return all_ok

def test_main_app():
    """Test that main.py can import and has all endpoints."""
    print_header("Testing Main Application")
    
    try:
        from main import app
        print_success("FastAPI app imported successfully")
        
        # Count routes
        routes = [route.path for route in app.routes if hasattr(route, 'path')]
        admin_routes = [r for r in routes if '/api/admin' in r]
        
        print_info(f"Total routes: {len(routes)}")
        print_info(f"Admin routes: {len(admin_routes)}")
        
        # Check critical endpoints
        critical_endpoints = [
            '/api/admin/mfa/setup',
            '/api/admin/export/kpis',
            '/api/admin/security/events',
            '/api/admin/troubleshoot/services'
        ]
        
        missing = [ep for ep in critical_endpoints if ep not in routes]
        
        if missing:
            print_error(f"Missing endpoints: {missing}")
            return False
        else:
            print_success("All critical endpoints are available")
            return True
        
    except Exception as e:
        print_error(f"Main app test failed: {str(e)}")
        return False

def run_mfa_tests():
    """Run MFA test suite."""
    print_header("Running MFA Tests")
    
    return run_command("python3 test_admin_mfa.py", "MFA Test Suite")

def display_next_steps():
    """Display next steps for the user."""
    print_header("Setup Complete - Next Steps")
    
    print("🎉 GigChain setup completed successfully!")
    print()
    print("📝 IMPORTANT: Update your .env file with real values:")
    print("   1. Set your real OPENAI_API_KEY")
    print("   2. Generate a secure W_CSAP_SECRET_KEY (32+ characters)")
    print()
    print("🚀 To start the server:")
    print("   python3 main.py")
    print()
    print("🔧 Access admin panel:")
    print("   http://localhost:5000/admin-panel/")
    print("   Login: admin / admin123")
    print("   ⚠️  CHANGE PASSWORD IMMEDIATELY")
    print()
    print("🔐 Setup MFA:")
    print("   1. Go to Security → MFA Setup")
    print("   2. Scan QR code with Google Authenticator")
    print("   3. Download backup codes")
    print()
    print("📊 Features available:")
    print("   • MFA Authentication (TOTP, wallet, email)")
    print("   • Troubleshooting Dashboard")  
    print("   • Data Export (9 time ranges)")
    print("   • Security Monitoring (AI + SIEM)")
    print("   • Database Scaling (to 1M+ users)")
    print()
    print("📚 Documentation:")
    print("   • FINAL_IMPLEMENTATION_SUMMARY.md")
    print("   • ADMIN_SECURITY_SUMMARY.md")
    print("   • SECURITY_SIEM_SUMMARY.md")
    print()

def main():
    """Main setup function."""
    print("\n" + "="*60)
    print("  🚀 GigChain Setup - Addressing Codex Feedback")
    print("="*60)
    
    # Steps
    steps = [
        ("Python Version Check", check_python_version),
        ("Install Dependencies", install_dependencies),
        ("Configure Environment", create_env_file),
        ("Test Module Imports", test_imports),
        ("Test Main Application", test_main_app),
        ("Run MFA Tests", run_mfa_tests)
    ]
    
    # Execute steps
    passed = 0
    for step_name, step_func in steps:
        if step_func():
            passed += 1
        else:
            print_error(f"Setup failed at: {step_name}")
            print("\n⚠️  Please check the error above and run setup again.")
            sys.exit(1)
    
    # Success
    print_header("Setup Results")
    print_success(f"All steps completed: {passed}/{len(steps)}")
    
    display_next_steps()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Setup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Setup failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)