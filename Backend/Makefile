.PHONY: up down build logs restart clean

# Start all services
up:
	docker-compose up -d --build

# Stop all services
down:
	docker-compose down

# Build all services
build:
	docker-compose build

# View logs
logs:
	docker-compose logs -f

# Restart all
restart:
	docker-compose down && docker-compose up -d --build

# Clean volumes
clean:
	docker-compose down -v

# Individual service logs
auth-logs:
	docker-compose logs -f auth-service

user-logs:
	docker-compose logs -f user-service

driver-logs:
	docker-compose logs -f driver-service

vehicle-logs:
	docker-compose logs -f vehicle-service

notification-logs:
	docker-compose logs -f notification-service

gateway-logs:
	docker-compose logs -f gateway

# Database
db:
	docker exec -it gaslink_postgres psql -U gaslink -d gaslink_db
