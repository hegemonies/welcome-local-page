.PHONY: install dev build start lint typecheck build-docker push-docker build-push-docker up down logs

install:
	bun install

dev:
	bun run dev

build:
	bun run build

start:
	bun run start

lint:
	bun run lint

typecheck:
	bun run typecheck

build-docker:
	docker build --tag lt:5000/welcome-local-page:latest .

push-docker:
	docker push lt:5000/welcome-local-page:latest

build-push-docker: build-docker push-docker

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f wlp
