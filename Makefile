# Financial Analysis Makefile

.PHONY: help install dev build test lint format typecheck clean deploy setup

# Default target
help: ## Show this help message
	@echo "Financial Analysis Development Makefile"
	@echo ""
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

install: ## Install all dependencies
	pnpm install

setup: install ## Setup development environment
	pnpm run prepare

dev: ## Start development servers
	pnpm run dev

build: ## Build all packages
	pnpm run build

test: ## Run all tests
	pnpm run test

test-watch: ## Run tests in watch mode
	pnpm run test -- --watch

lint: ## Run linting
	pnpm run lint

format: ## Format code
	pnpm run format

typecheck: ## Run TypeScript type checking
	pnpm run typecheck

clean: ## Clean build artifacts
	pnpm run clean

deploy: ## Deploy all services
	pnpm run deploy:all

deploy-api: ## Deploy API to Cloudflare Workers
	pnpm run deploy:api

deploy-web: ## Deploy web app to Cloudflare Pages
	pnpm run deploy:web

ci: lint typecheck test build ## Run CI checks locally

release: ## Create a new release (requires release commit message)
	pnpm run release