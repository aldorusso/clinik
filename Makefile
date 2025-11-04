.PHONY: help build up down restart logs clean shell-backend shell-frontend shell-db migrate migration

help:
	@echo "Comandos disponibles:"
	@echo "  make build          - Construir los contenedores"
	@echo "  make up             - Levantar los servicios"
	@echo "  make down           - Detener los servicios"
	@echo "  make restart        - Reiniciar los servicios"
	@echo "  make logs           - Ver logs de todos los servicios"
	@echo "  make clean          - Limpiar contenedores y volúmenes"
	@echo "  make shell-backend  - Acceder al shell del backend"
	@echo "  make shell-frontend - Acceder al shell del frontend"
	@echo "  make shell-db       - Acceder al shell de PostgreSQL"
	@echo "  make migrate        - Aplicar migraciones"
	@echo "  make migration      - Crear nueva migración"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	docker system prune -f

shell-backend:
	docker-compose exec backend sh

shell-frontend:
	docker-compose exec frontend sh

shell-db:
	docker-compose exec db psql -U scraper_user -d scraper_db

migrate:
	docker-compose exec backend alembic upgrade head

migration:
	@read -p "Nombre de la migración: " name; \
	docker-compose exec backend alembic revision --autogenerate -m "$$name"
