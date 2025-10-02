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
        
        # For testing purposes, set a dummy key
        os.environ['OPENAI_API_KEY'] = 'sk-test-key-for-local-development'
        print("Using dummy key for local testing...")
    
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