NODE_VERSION := 20
NVM_USE := . "$${NVM_DIR}/nvm.sh" && nvm use $(NODE_VERSION)

.PHONY: install dev dev-backend dev-frontend build seed clean reset test docker docker-run docker-stop help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	$(NVM_USE) && cd backend && npm install
	$(NVM_USE) && cd frontend && npm install

dev: ## Run backend and frontend concurrently
	$(NVM_USE) && npx concurrently -n be,fe -c blue,green "cd backend && npm run dev" "cd frontend && npm run dev"

dev-backend: ## Run backend only
	$(NVM_USE) && cd backend && npm run dev

dev-frontend: ## Run frontend only
	$(NVM_USE) && cd frontend && npm run dev

build: ## Build frontend for production
	$(NVM_USE) && cd frontend && npm run build

seed: ## Re-seed the database (deletes existing data)
	rm -f backend/contracts.db
	$(NVM_USE) && cd backend && npm run seed

clean: ## Remove build artifacts and databases
	rm -f backend/contracts.db
	rm -rf backend/dist
	rm -rf frontend/dist

reset: clean install seed ## Clean, reinstall, and re-seed

test: ## Run backend type-check and frontend build check
	$(NVM_USE) && cd backend && npx tsc --noEmit
	$(NVM_USE) && cd frontend && npx vue-tsc --noEmit

docker: ## Build Docker image
	docker build -t contract-management .

docker-run: ## Run Docker container (pass ANTHROPIC_API_KEY)
	docker run -d --name contract-mgmt \
		-p 3001:3001 \
		-v contract-mgmt-data:/app/data \
		-v contract-mgmt-uploads:/app/backend/uploads \
		--env-file backend/.env \
		contract-management

docker-stop: ## Stop and remove Docker container
	docker stop contract-mgmt && docker rm contract-mgmt
