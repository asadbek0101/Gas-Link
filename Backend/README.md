# 🚛 GasLink Backend — Go Microservices

Fleet Management System backend built with Go microservices architecture.

## 📐 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    React Frontend (:3000)                     │
└────────────────────────┬─────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│              API Gateway (:8080)                              │
│         Swagger UI  ·  JWT Middleware  ·  CORS                │
│         Role-based Access  ·  Reverse Proxy                   │
└──┬──────────┬──────────┬──────────┬──────────┬───────────────┘
   │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼
┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────────┐
│ Auth │  │ User │  │Driver│  │Vehic.│  │ Notific. │
│:8081 │  │:8082 │  │:8083 │  │:8084 │  │  :8085   │
└──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘  └────┬─────┘
   │         │         │         │            │
   └─────────┴─────────┴────┬────┴────────────┘
                             │
                    ┌────────▼────────┐
                    │  PostgreSQL 16  │
                    │    (:5432)      │
                    └─────────────────┘
```

## 🚀 Quick Start

```bash
# 1. Clone & start
docker-compose up -d --build

# 2. Wait for services (~30 sec)
docker-compose logs -f gateway

# 3. Open Swagger UI
open http://localhost:8080/swagger/
```

## 📡 Services

| Service       | Port  | Description              |
|---------------|-------|--------------------------|
| **Gateway**   | 8080  | API Gateway + Swagger    |
| **Auth**      | 8081  | Login, Register, JWT     |
| **User**      | 8082  | Users CRUD               |
| **Driver**    | 8083  | Drivers CRUD             |
| **Vehicle**   | 8084  | Vehicles, Trips, Stats   |
| **Notify**    | 8085  | Notifications            |
| **Postgres**  | 5432  | Database                 |

## 🔐 Authentication

### Login (get JWT token)
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fleetcommand.com","password":"admin123"}'
```

### Use token in requests
```bash
curl http://localhost:8080/api/v1/vehicles \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

## 📖 API Endpoints

### Auth (Public)
- `POST /api/v1/auth/login` — Login
- `POST /api/v1/auth/register` — Register

### Users (Protected)
- `GET /api/v1/users` — List users
- `GET /api/v1/users/:id` — Get user
- `POST /api/v1/users` — Create (admin only)
- `PUT /api/v1/users/:id` — Update (admin/manager)
- `DELETE /api/v1/users/:id` — Delete (admin only)

### Drivers (Protected)
- `GET /api/v1/drivers` — List drivers
- `GET /api/v1/drivers/:id` — Get driver
- `POST /api/v1/drivers` — Create driver
- `PUT /api/v1/drivers/:id` — Update driver
- `DELETE /api/v1/drivers/:id` — Delete (admin/manager)

### Vehicles (Protected)
- `GET /api/v1/vehicles` — List vehicles
- `GET /api/v1/vehicles/:id` — Get vehicle
- `POST /api/v1/vehicles` — Create vehicle
- `PUT /api/v1/vehicles/:id` — Update vehicle
- `DELETE /api/v1/vehicles/:id` — Delete (admin/manager)

### Trips (Protected)
- `GET /api/v1/trips` — List trips
- `POST /api/v1/trips` — Create trip

### Dashboard (Protected)
- `GET /api/v1/dashboard/stats` — Statistics

### Notifications (Protected)
- `GET /api/v1/notifications` — List all
- `POST /api/v1/notifications` — Create
- `PUT /api/v1/notifications/:id/read` — Mark read
- `PUT /api/v1/notifications/read-all` — Mark all read
- `DELETE /api/v1/notifications/:id` — Delete

## 🔑 Default Credentials

| Email                      | Password  | Role   |
|---------------------------|-----------|--------|
| admin@fleetcommand.com    | admin123  | admin  |

## 🛠 Commands

```bash
make up          # Start all
make down        # Stop all
make logs        # View logs
make restart     # Rebuild & restart
make clean       # Remove volumes
make db          # Open psql
```

## 🔗 Frontend Integration

Update your React frontend to point to `http://localhost:8080`:

```typescript
// src/api/config.ts
export const API_BASE_URL = 'http://localhost:8080/api/v1';

// Login example
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const { token, user } = await response.json();
localStorage.setItem('token', token);

// Authenticated request example
const vehicles = await fetch(`${API_BASE_URL}/vehicles`, {
  headers: { 'Authorization': `Bearer ${token}` },
});
```

## 📁 Project Structure

```
gaslink-backend/
├── docker-compose.yml
├── Makefile
├── migrations/
│   └── init.sql              # Database schema + seed data
├── gateway/                   # API Gateway (port 8080)
│   ├── cmd/main.go
│   ├── internal/
│   │   ├── config/
│   │   ├── handler/proxy.go
│   │   └── middleware/auth.go # JWT + Role middleware
│   └── docs/swagger.json
├── auth-service/              # Auth (port 8081)
│   ├── cmd/main.go
│   └── internal/
│       ├── handler/
│       ├── model/
│       ├── repository/
│       └── service/          # JWT generation & validation
├── user-service/              # Users (port 8082)
├── driver-service/            # Drivers (port 8083)
├── vehicle-service/           # Vehicles + Trips (port 8084)
└── notification-service/      # Notifications (port 8085)
```

## Tech Stack

- **Language:** Go 1.22
- **Framework:** Gin
- **Database:** PostgreSQL 16
- **Auth:** JWT (HS256)
- **Docs:** Swagger/OpenAPI 3.0
- **Containers:** Docker & Docker Compose
