# Makefile for Meeting Task Tool
# Production Docker deployment commands

.PHONY: help build up down logs clean rebuild prod-build prod-up prod-down prod-logs

# Default target
help:
	@echo "Meeting Task Tool - Docker Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev-up       - Start development containers"
	@echo "  make dev-down     - Stop development containers"
	@echo "  make dev-logs     - View development logs"
	@echo "  make dev-rebuild  - Rebuild and restart development containers"
	@echo ""
	@echo "Production:"
	@echo "  make prod-build   - Build production images"
	@echo "  make prod-up      - Start production containers"
	@echo "  make prod-down    - Stop production containers"
	@echo "  make prod-logs    - View production logs"
	@echo "  make prod-rebuild - Rebuild and restart production containers"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean        - Remove all containers, volumes, and images"
	@echo "  make db-migrate   - Run database migrations"
	@echo "  make db-studio    - Open Prisma Studio"
	@echo ""

# ============================================
# Development Commands
# ============================================

dev-up:
	docker compose up -d

dev-down:
	docker compose down

dev-logs:
	docker compose logs -f

dev-rebuild:
	docker compose down
	docker compose build --no-cache
	docker compose up -d

# ============================================
# Production Commands
# ============================================

prod-build:
	@if [ ! -f .env ]; then \
		echo "Error: .env file not found. Copy .env.example to .env and configure it."; \
		exit 1; \
	fi
	docker compose -f docker-compose.prod.yml build

prod-up:
	@if [ ! -f .env ]; then \
		echo "Error: .env file not found. Copy .env.example to .env and configure it."; \
		exit 1; \
	fi
	docker compose -f docker-compose.prod.yml up -d

prod-down:
	docker compose -f docker-compose.prod.yml down

prod-logs:
	docker compose -f docker-compose.prod.yml logs -f

prod-restart:
	docker compose -f docker-compose.prod.yml restart

prod-rebuild:
	@if [ ! -f .env ]; then \
		echo "Error: .env file not found. Copy .env.example to .env and configure it."; \
		exit 1; \
	fi
	docker compose -f docker-compose.prod.yml down
	docker compose -f docker-compose.prod.yml build --no-cache
	docker compose -f docker-compose.prod.yml up -d

# ============================================
# Utility Commands
# ============================================

clean:
	docker compose down -v --rmi all 2>/dev/null || true
	docker compose -f docker-compose.prod.yml down -v --rmi all 2>/dev/null || true
	docker system prune -f

db-migrate:
	cd apps/backend && npx prisma migrate deploy

db-studio:
	cd apps/backend && npx prisma studio

# Status check
status:
	@echo "Development containers:"
	@docker compose ps 2>/dev/null || echo "  Not running"
	@echo ""
	@echo "Production containers:"
	@docker compose -f docker-compose.prod.yml ps 2>/dev/null || echo "  Not running"
