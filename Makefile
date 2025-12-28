SHELL := /bin/bash

PNPM=npx -y pnpm@9.12.2

.PHONY: setup setup-docker dev up api web db migrate seed lint typecheck test logs-web logs-api restart-web restart-api

setup:
	node ./scripts/setup.cjs

setup-docker:
	node ./scripts/setup-docker.cjs

dev:
	$(PNPM) -r --parallel dev

up:
	docker compose up web api

api:
	$(PNPM) --filter api start:dev

web:
	$(PNPM) --filter web dev

db:
	docker compose up -d db

migrate:
	$(PNPM) --filter api prisma:migrate

seed:
	$(PNPM) --filter api prisma:seed

lint:
	$(PNPM) -r lint

typecheck:
	$(PNPM) -r typecheck

test:
	$(PNPM) -r test

logs-web:
	docker compose logs -f web

logs-api:
	docker compose logs -f api

restart-web:
	docker compose restart web

restart-api:
	docker compose restart api
