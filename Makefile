.PHONY: help install frontend backend dev all build clean seed

# Default target
help:
	@echo "Contract Management System - Available Commands"
	@echo "=============================================="
	@echo ""
	@echo "Development:"
	@echo "  make frontend         Start frontend dev server (port 5173)"
	@echo "  make backend          Start backend dev server (port 3000)"
	@echo "  make dev              Start both frontend and backend (concurrent)"
	@echo "  make all              Alias for 'make dev'"
	@echo ""
	@echo "Setup:"
	@echo "  make install          Install dependencies for frontend and backend"
	@echo "  make seed             Seed database with sample data"
	@echo ""
	@echo "Build:"
	@echo "  make build            Build both frontend and backend for production"
	@echo "  make build-frontend   Build frontend only"
	@echo "  make build-backend    Build backend only"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean            Remove node_modules and build artifacts"
	@echo "  make help             Show this help message"
	@echo ""

# Install dependencies
install:
	@echo "Installing dependencies..."
	cd backend && npm install
	cd frontend && npm install
	@echo "✓ Dependencies installed"

# Frontend development server
frontend:
	@echo "Starting frontend dev server on http://localhost:5173..."
	cd frontend && npm run dev

# Backend development server
backend:
	@echo "Starting backend dev server on http://localhost:3000..."
	cd backend && npm run dev

# Run both concurrently
dev: 
	@echo "Starting frontend and backend concurrently..."
	@echo "Frontend: http://localhost:5173"
	@echo "Backend: http://localhost:3000"
	@echo ""
	@echo "Press Ctrl+C to stop both servers"
	@echo ""
	@(cd frontend && npm run dev) & \
	(cd backend && npm run dev) & \
	wait

# Alias for dev
all: dev

# Build for production
build: build-backend build-frontend
	@echo "✓ Both frontend and backend built successfully"

# Build backend only
build-backend:
	@echo "Building backend..."
	cd backend && npm run build
	@echo "✓ Backend built to backend/dist"

# Build frontend only
build-frontend:
	@echo "Building frontend..."
	cd frontend && npm run build
	@echo "✓ Frontend built to frontend/dist"

# Seed database
seed:
	@echo "Seeding database with sample data..."
	cd backend && npx ts-node src/seed.ts
	@echo "✓ Database seeded"

# Clean up
clean:
	@echo "Cleaning up..."
	rm -rf frontend/node_modules frontend/dist
	rm -rf backend/node_modules backend/dist
	@echo "✓ Cleanup complete"

# Run tests
test:
	@echo "Running tests..."
	cd backend && npm run test
	cd frontend && npm run test
	@echo "✓ Tests complete"

# Run linter
lint:
	@echo "Linting..."
	cd backend && npm run build
	cd frontend && npm run build
	@echo "✓ Linting complete"
