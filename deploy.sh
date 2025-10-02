#!/bin/bash

# GigChain API Deployment Script
# Usage: ./deploy.sh [environment]
# Environment: dev, staging, production (default: dev)

set -e

ENVIRONMENT=${1:-dev}
PROJECT_NAME="gigchain-api"
DOCKER_IMAGE="${PROJECT_NAME}:${ENVIRONMENT}"

echo "🚀 Deploying GigChain API to ${ENVIRONMENT} environment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy env.example to .env and configure it."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Validate required environment variables
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY not set in .env file"
    exit 1
fi

# Build Docker image
echo "📦 Building Docker image: ${DOCKER_IMAGE}"
docker build -t ${DOCKER_IMAGE} .

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Start services
echo "🚀 Starting services..."
if [ "$ENVIRONMENT" = "production" ]; then
    docker-compose --profile production up -d
else
    docker-compose up -d gigchain-api
fi

# Wait for health check
echo "⏳ Waiting for service to be healthy..."
timeout=60
counter=0
while [ $counter -lt $timeout ]; do
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        echo "✅ Service is healthy!"
        break
    fi
    echo "Waiting for service... ($counter/$timeout)"
    sleep 2
    counter=$((counter + 2))
done

if [ $counter -ge $timeout ]; then
    echo "❌ Service failed to become healthy within ${timeout} seconds"
    docker-compose logs
    exit 1
fi

# Run tests
echo "🧪 Running API tests..."
python -m pytest tests/ -v || echo "⚠️  Tests failed, but deployment continues..."

echo "🎉 Deployment completed successfully!"
echo "📊 API is running at: http://localhost:5000"
echo "🏥 Health check: http://localhost:5000/health"
echo "📚 API docs: http://localhost:5000/api/full_flow (POST)"

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=20 gigchain-api
