.PHONY: help install dev test lint format clean docker-up docker-down deploy-local deploy-prod

# Default target
help:
	@echo "🚀 GigChain.io - Available Commands"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make install        - Install all dependencies (Python + Frontend + Contracts)"
	@echo "  make install-backend - Install Python dependencies only"
	@echo "  make install-frontend - Install frontend dependencies only"
	@echo "  make install-contracts - Install smart contract dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make dev            - Start all services (backend + frontend)"
	@echo "  make dev-backend    - Start FastAPI backend only"
	@echo "  make dev-frontend   - Start React frontend only"
	@echo "  make dev-contracts  - Start Hardhat local node"
	@echo ""
	@echo "Testing:"
	@echo "  make test           - Run all tests (backend + frontend + contracts)"
	@echo "  make test-backend   - Run Python tests"
	@echo "  make test-frontend  - Run frontend tests"
	@echo "  make test-contracts - Run smart contract tests"
	@echo "  make test-coverage  - Run tests with coverage report"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint           - Run all linters"
	@echo "  make format         - Format all code (Black, Prettier)"
	@echo "  make type-check     - Run type checkers (MyPy, TypeScript)"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up      - Start all Docker services (dev)"
	@echo "  make docker-down    - Stop all Docker services"
	@echo "  make docker-logs    - View Docker logs"
	@echo "  make docker-prod    - Start production Docker stack"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy-local   - Deploy locally (FastAPI server)"
	@echo "  make deploy-contracts - Deploy smart contracts to testnet"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean          - Clean all build artifacts"
	@echo "  make clean-cache    - Clean Python cache files"
	@echo "  make health         - Check service health"
	@echo ""

# Installation
install: install-backend install-frontend install-contracts
	@echo "✅ All dependencies installed"

install-backend:
	@echo "📦 Installing Python dependencies..."
	pip install -r requirements.txt

install-frontend:
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install

install-contracts:
	@echo "📦 Installing smart contract dependencies..."
	cd contracts && npm install

# Development
dev:
	@echo "🚀 Starting all development services..."
	@echo "Backend: http://localhost:5000"
	@echo "Frontend: http://localhost:5173"
	@make -j2 dev-backend dev-frontend

dev-backend:
	@echo "🔧 Starting FastAPI backend..."
	python main.py

dev-frontend:
	@echo "⚛️  Starting React frontend..."
	cd frontend && npm run dev

dev-contracts:
	@echo "⛓️  Starting Hardhat local node..."
	cd contracts && npm run node

# Testing
test: test-backend test-contracts
	@echo "✅ All tests passed"

test-backend:
	@echo "🧪 Running Python tests..."
	pytest tests/ -v

test-frontend:
	@echo "🧪 Running frontend tests..."
	cd frontend && npm test

test-contracts:
	@echo "🧪 Running smart contract tests..."
	cd contracts && npm test

test-coverage:
	@echo "📊 Running tests with coverage..."
	pytest tests/ -v --cov=. --cov-config=.coveragerc --cov-report=html --cov-report=term
	@echo "📄 Coverage report: htmlcov/index.html"
	@echo "📊 Current threshold: 15% (configurable in CI)"

# Code Quality
lint: lint-backend lint-frontend

lint-backend:
	@echo "🔍 Linting Python code..."
	-ruff check .
	-black --check .

lint-frontend:
	@echo "🔍 Linting frontend code..."
	cd frontend && npm run lint

format:
	@echo "✨ Formatting all code..."
	black .
	cd frontend && npm run format

type-check:
	@echo "🔎 Running type checkers..."
	mypy . --ignore-missing-imports
	cd frontend && npm run type-check

# Docker
docker-up:
	@echo "🐳 Starting Docker services (dev)..."
	docker-compose up -d
	@echo "✅ Services started"
	@echo "API: http://localhost:5000"

docker-down:
	@echo "🛑 Stopping Docker services..."
	docker-compose down

docker-logs:
	@echo "📋 Docker logs (Ctrl+C to exit)..."
	docker-compose logs -f

docker-prod:
	@echo "🐳 Starting production Docker stack..."
	docker-compose -f docker-compose.prod.yml up -d
	@echo "✅ Production services started"

docker-rebuild:
	@echo "🔨 Rebuilding Docker images..."
	docker-compose build --no-cache

# Deployment
deploy-local: install-backend
	@echo "🚀 Starting local deployment..."
	python main.py

deploy-contracts:
	@echo "⛓️  Deploying smart contracts to Polygon Amoy..."
	cd contracts && npm run deploy:amoy

deploy-contracts-prod:
	@echo "⛓️  Deploying smart contracts to Polygon Mainnet..."
	@read -p "Are you sure? This will deploy to MAINNET (y/N): " confirm && [ $$confirm = y ]
	cd contracts && npm run deploy:polygon

# Utilities
clean: clean-cache clean-build
	@echo "🧹 Cleaned all artifacts"

clean-cache:
	@echo "🧹 Cleaning Python cache..."
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true

clean-build:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf htmlcov/ .coverage coverage.xml
	rm -rf frontend/dist/ frontend/node_modules/.vite
	rm -rf contracts/artifacts/ contracts/cache/ contracts/typechain-types/

health:
	@echo "🏥 Checking service health..."
	@curl -f http://localhost:5000/health 2>/dev/null && echo "✅ Backend is healthy" || echo "❌ Backend is not responding"

# Pre-commit hooks setup
pre-commit:
	@echo "🪝 Setting up pre-commit hooks..."
	pip install pre-commit
	pre-commit install
	@echo "✅ Pre-commit hooks installed"

# Environment setup
env:
	@echo "🔧 Setting up environment..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ .env file created from .env.example"; \
		echo "⚠️  Please edit .env and add your API keys"; \
	else \
		echo "ℹ️  .env file already exists"; \
	fi
