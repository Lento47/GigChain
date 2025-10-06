"""
W-CSAP Setup Script
===================

Automated setup for W-CSAP authentication system.
"""

import os
import secrets
import subprocess
import sys

def print_header(text):
    """Print formatted header."""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70 + "\n")

def print_success(text):
    """Print success message."""
    print(f"✅ {text}")

def print_error(text):
    """Print error message."""
    print(f"❌ {text}")

def print_info(text):
    """Print info message."""
    print(f"ℹ️  {text}")

def check_python_version():
    """Check Python version."""
    print_header("Checking Python Version")
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        print_success(f"Python {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print_error(f"Python 3.8+ required (found {version.major}.{version.minor})")
        return False

def install_dependencies():
    """Install required packages."""
    print_header("Installing Dependencies")
    
    packages = [
        "web3",
        "eth-account",
        "fastapi",
        "uvicorn",
        "python-dotenv",
        "pydantic"
    ]
    
    for package in packages:
        print(f"Installing {package}...")
        try:
            subprocess.check_call(
                [sys.executable, "-m", "pip", "install", package, "-q"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            print_success(f"{package} installed")
        except subprocess.CalledProcessError:
            print_error(f"Failed to install {package}")
            return False
    
    return True

def generate_secret_key():
    """Generate cryptographically secure secret key."""
    return secrets.token_hex(32)

def setup_environment():
    """Setup environment variables."""
    print_header("Setting Up Environment")
    
    env_file = ".env"
    env_example = "env.example"
    
    # Check if .env exists
    if os.path.exists(env_file):
        print_info(f"{env_file} already exists")
        response = input("Do you want to add W-CSAP configuration? (y/n): ")
        if response.lower() != 'y':
            return True
    
    # Generate secret key
    secret_key = generate_secret_key()
    
    # W-CSAP configuration
    w_csap_config = f"""
# W-CSAP Authentication Configuration
W_CSAP_SECRET_KEY={secret_key}
W_CSAP_CHALLENGE_TTL=300
W_CSAP_SESSION_TTL=86400
W_CSAP_REFRESH_TTL=604800
W_CSAP_DB_PATH=data/w_csap.db
"""
    
    # Append to .env
    with open(env_file, 'a') as f:
        f.write(w_csap_config)
    
    print_success("Environment variables configured")
    print_info("Secret key generated and saved to .env")
    print(f"\nℹ️  Your secret key: {secret_key[:16]}...{secret_key[-16:]}")
    print("⚠️  Keep this key secure and never share it!")
    
    return True

def create_data_directory():
    """Create data directory for database."""
    print_header("Creating Data Directory")
    
    data_dir = "data"
    
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        print_success(f"Created {data_dir}/ directory")
    else:
        print_info(f"{data_dir}/ directory already exists")
    
    return True

def initialize_database():
    """Initialize W-CSAP database."""
    print_header("Initializing Database")
    
    try:
        from auth.database import get_database
        
        db = get_database()
        stats = db.get_statistics()
        
        print_success("Database initialized successfully")
        print(f"ℹ️  Active sessions: {stats.get('active_sessions', 0)}")
        print(f"ℹ️  Total users: {stats.get('total_users', 0)}")
        
        return True
        
    except Exception as e:
        print_error(f"Failed to initialize database: {str(e)}")
        return False

def run_tests():
    """Run authentication tests."""
    print_header("Running Tests")
    
    response = input("Do you want to run tests? (y/n): ")
    if response.lower() != 'y':
        print_info("Skipping tests")
        return True
    
    try:
        print("\nRunning W-CSAP test suite...\n")
        subprocess.check_call([sys.executable, "test_w_csap_auth.py"])
        print_success("All tests passed!")
        return True
        
    except subprocess.CalledProcessError:
        print_error("Some tests failed")
        return False
    except FileNotFoundError:
        print_info("Test file not found, skipping")
        return True

def print_usage_instructions():
    """Print usage instructions."""
    print_header("Setup Complete! 🎉")
    
    print("""
W-CSAP Authentication System is now ready to use!

📝 Next Steps:
───────────────

1. Start the backend server:
   $ python main.py

2. Test authentication endpoints:
   $ curl http://localhost:5000/api/auth/stats

3. Check documentation:
   $ cat W_CSAP_DOCUMENTATION.md

4. Frontend integration:
   - Import useWalletAuth hook
   - Use WalletAuthButton component
   - See examples in documentation

🔐 Security Reminders:
─────────────────────

• Keep W_CSAP_SECRET_KEY secure
• Use HTTPS in production
• Enable rate limiting
• Monitor auth events
• Rotate keys periodically

📚 Resources:
────────────

• Documentation: W_CSAP_DOCUMENTATION.md
• Test Suite: test_w_csap_auth.py
• API Docs: http://localhost:5000/docs

Happy coding! 🚀
""")

def main():
    """Main setup routine."""
    print("""
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   W-CSAP Setup Wizard                                            ║
║   Wallet-Based Cryptographic Session Assertion Protocol          ║
║                                                                   ║
║   A novel authentication system inspired by SAML                  ║
║   but using blockchain wallet signatures                         ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
""")
    
    steps = [
        ("Checking Python version", check_python_version),
        ("Installing dependencies", install_dependencies),
        ("Setting up environment", setup_environment),
        ("Creating data directory", create_data_directory),
        ("Initializing database", initialize_database),
        ("Running tests", run_tests)
    ]
    
    for step_name, step_func in steps:
        if not step_func():
            print_error(f"Setup failed at: {step_name}")
            print("\nℹ️  Please fix the error and run setup again.")
            return False
    
    print_usage_instructions()
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
