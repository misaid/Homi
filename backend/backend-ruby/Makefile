.PHONY: setup db-prepare db-migrate db-seed dev \
	docker-build docker-up docker-down docker-logs docker-ps docker-restart docker-shell \
	help docker-ip print-url

DOCKER_COMPOSE ?= docker compose
APP_SERVICE ?= api
APP_IMAGE ?= homi-backend-ruby
PORT ?= 3000
ENV_FILE ?= .env.local

setup:
	bundle install
	$(MAKE) db-prepare
	$(MAKE) db-migrate
	$(MAKE) db-seed

db-prepare:
	bundle exec rails db:prepare

db-migrate:
	bundle exec rails db:migrate

db-seed:
	bundle exec rails db:seed

dev:
	bundle exec rails server -p 3000

# --- Docker helpers ---

docker-build:
	$(DOCKER_COMPOSE) build

docker-up:
	@echo "Starting $(APP_SERVICE) on 0.0.0.0:$(PORT)"
	@if [ -f $(ENV_FILE) ]; then echo "Using env file: $(ENV_FILE)"; else echo "(tip) Create $(ENV_FILE) with CLERK_ISSUER=... (CLERK_AUDIENCE optional)."; fi
	$(DOCKER_COMPOSE) --env-file $(ENV_FILE) up -d --build
	@$(MAKE) print-url

docker-down:
	$(DOCKER_COMPOSE) down

docker-logs:
	$(DOCKER_COMPOSE) logs -f $(APP_SERVICE)

docker-ps:
	$(DOCKER_COMPOSE) ps

docker-restart:
	$(DOCKER_COMPOSE) restart $(APP_SERVICE)

docker-shell:
	$(DOCKER_COMPOSE) exec $(APP_SERVICE) /bin/bash || $(DOCKER_COMPOSE) run --rm $(APP_SERVICE) /bin/bash

docker-ip:
	@echo "LAN IPs:" && hostname -I || echo "Use: ip addr"

print-url:
	@IP=$$( \
		if command -v hostname >/dev/null 2>&1; then hostname -I 2>/dev/null | awk '{print $$1}'; \
		elif command -v ip >/dev/null 2>&1; then ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($$i=="src") {print $$(i+1); exit}}'; \
		elif command -v ifconfig >/dev/null 2>&1; then ifconfig 2>/dev/null | awk '/inet (addr:)?([0-9]{1,3}\.){3}[0-9]{1,3}/{ if ($$2 ~ /127\.0\.0\.1/) next; print ($$2 ~ /addr:/ ? substr($$2,6) : $$2); exit }'; \
		else echo 127.0.0.1; fi); \
	echo "Healthcheck: http://$$IP:${PORT}/api/healthz"; \
	echo "Android emulator hint: use http://10.0.2.2:${PORT}/api/healthz"

help:
	@echo "Make targets:"
	@echo "  make docker-build    Build the Docker image"
	@echo "  make docker-up       Start the API on port $(PORT) and print health URL"
	@echo "  make docker-down     Stop and remove containers"
	@echo "  make docker-logs     Tail logs"
	@echo "  make docker-ps       Show compose services"
	@echo "  make docker-shell    Open a shell in the container"
	@echo "Notes: Ensure env vars are set or a .env file exists (RAILS_MASTER_KEY, CLERK_ISSUER, optional CLERK_AUDIENCE)."
