# GigChain API Deployment Script for Windows PowerShell
# Usage: .\deploy.ps1 [environment]
# Environment: dev, staging, production (default: dev)

param(
    [string]$Environment = "dev"
)

$ErrorActionPreference = "Stop"

$ProjectName = "gigchain-api"
$DockerImage = "${ProjectName}:${Environment}"

Write-Host "🚀 Deploying GigChain API to $Environment environment..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "❌ .env file not found. Please copy env.example to .env and configure it." -ForegroundColor Red
    exit 1
}

# Load environment variables
Get-Content .env | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
    }
}

# Validate required environment variables
if (-not $env:OPENAI_API_KEY) {
    Write-Host "❌ OPENAI_API_KEY not set in .env file" -ForegroundColor Red
    exit 1
}

# Build Docker image
Write-Host "📦 Building Docker image: $DockerImage" -ForegroundColor Yellow
docker build -t $DockerImage .

# Stop existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>$null

# Start services
Write-Host "🚀 Starting services..." -ForegroundColor Yellow
if ($Environment -eq "production") {
    docker-compose --profile production up -d
} else {
    docker-compose up -d gigchain-api
}

# Wait for health check
Write-Host "⏳ Waiting for service to be healthy..." -ForegroundColor Yellow
$timeout = 60
$counter = 0
do {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Service is healthy!" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "Waiting for service... ($counter/$timeout)" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        $counter += 2
    }
} while ($counter -lt $timeout)

if ($counter -ge $timeout) {
    Write-Host "❌ Service failed to become healthy within $timeout seconds" -ForegroundColor Red
    docker-compose logs
    exit 1
}

# Run tests
Write-Host "🧪 Running API tests..." -ForegroundColor Yellow
python -m pytest tests/ -v
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Tests failed, but deployment continues..." -ForegroundColor Yellow
}

Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "📊 API is running at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🏥 Health check: http://localhost:5000/health" -ForegroundColor Cyan
Write-Host "📚 API docs: http://localhost:5000/api/full_flow (POST)" -ForegroundColor Cyan

# Show logs
Write-Host "📋 Recent logs:" -ForegroundColor Yellow
docker-compose logs --tail=20 gigchain-api
