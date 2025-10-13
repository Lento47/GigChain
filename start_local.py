#!/usr/bin/env python3
"""Local development server for GigChain API without Docker."""

import os
import sys
from app import app

def main():
    """Start the Flask development server."""
    
    # Set default environment variables for local development
    if not os.getenv('OPENAI_API_KEY'):
        print("WARNING: OPENAI_API_KEY not set!")
        print("   Set your OpenAI API key as environment variable:")
        print("   $env:OPENAI_API_KEY='sk-your-key-here'  # PowerShell")
        print("   export OPENAI_API_KEY='sk-your-key-here'  # Bash")
        print("")
        print("   Or create a .env file with:")
        print("   OPENAI_API_KEY=sk-your-key-here")
        print("")
        
        # Check if OpenAI API key is set
        if not os.environ.get('OPENAI_API_KEY'):
            print("⚠️  WARNING: OPENAI_API_KEY not set!")
            print("   Please set your OpenAI API key in .env file or environment variable")
            print("   Example: export OPENAI_API_KEY='your-api-key-here'")
            print("   Or add OPENAI_API_KEY=your-api-key-here to .env file")
            print("")
            print("   Some features may not work without a valid API key.")
            print("   Continuing with limited functionality...")
            print("")
    
    # Set other defaults
    os.environ.setdefault('SECRET_KEY', 'dev-secret-key-local')
    os.environ.setdefault('DEBUG', 'true')
    os.environ.setdefault('PORT', '5000')
    
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'true').lower() == 'true'
    
    print("Starting GigChain API server...")
    print(f"URL: http://localhost:{port}")
    print(f"Health: http://localhost:{port}/health")
    print(f"API: http://localhost:{port}/api/full_flow")
    print(f"Debug mode: {debug}")
    print("")
    print("Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        app.run(
            host='0.0.0.0',
            port=port,
            debug=debug
        )
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"\nError starting server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()