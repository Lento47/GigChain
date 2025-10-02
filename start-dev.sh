#!/bin/bash
# GigChain.io Local Development Startup Script

set -e

echo "🚀 Starting GigChain.io Development Environment"
echo "=============================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your OpenAI API key!"
    echo "   nano .env"
    echo ""
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Check if frontend node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo ""
echo "🎯 Development servers ready to start!"
echo ""
echo "To start the backend:"
echo "  source venv/bin/activate"
echo "  uvicorn main:app --reload --port 8000"
echo ""
echo "To start the frontend (in another terminal):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "🌐 URLs:"
echo "  Frontend: http://localhost:5173"
echo "  Backend API: http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo "  Health Check: http://localhost:8000/health"
echo ""

# Ask if user wants to start servers automatically
read -p "Do you want to start the backend server now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting backend server..."
    uvicorn main:app --reload --port 8000
fi
