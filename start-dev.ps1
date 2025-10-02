# GigChain.io Local Development Startup Script for Windows PowerShell

Write-Host "🚀 Starting GigChain.io Development Environment" -ForegroundColor Blue
Write-Host "==============================================" -ForegroundColor Blue

# Check if .env exists
if (!(Test-Path ".env")) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "⚠️  Please edit .env file with your OpenAI API key!" -ForegroundColor Yellow
    Write-Host "   notepad .env"
    Write-Host ""
}

# Check if virtual environment exists
if (!(Test-Path "venv")) {
    Write-Host "🐍 Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "🔧 Activating virtual environment..." -ForegroundColor Blue
& ".\venv\Scripts\Activate.ps1"

# Install Python dependencies
Write-Host "📦 Installing Python dependencies..." -ForegroundColor Blue
pip install -r requirements.txt

# Check if frontend node_modules exists
if (!(Test-Path "frontend\node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location "frontend"
    npm install
    Set-Location ".."
}

Write-Host ""
Write-Host "🎯 Development servers ready to start!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the backend:" -ForegroundColor Yellow
Write-Host "  .\venv\Scripts\Activate.ps1"
Write-Host "  uvicorn main:app --reload --port 8000"
Write-Host ""
Write-Host "To start the frontend (in another terminal):" -ForegroundColor Yellow
Write-Host "  cd frontend"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "🌐 URLs:" -ForegroundColor Blue
Write-Host "  Frontend: http://localhost:5173"
Write-Host "  Backend API: http://localhost:8000"
Write-Host "  API Docs: http://localhost:8000/docs"
Write-Host "  Health Check: http://localhost:8000/health"
Write-Host ""

# Ask if user wants to start servers automatically
$response = Read-Host "Do you want to start the backend server now? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    Write-Host "🚀 Starting backend server..." -ForegroundColor Green
    uvicorn main:app --reload --port 8000
}
