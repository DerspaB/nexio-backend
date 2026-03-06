# Quick Setup Guide

Guide to run the Nexio backend on any machine from scratch.

## Prerequisites

Install these before starting:

| Tool           | Version | Download                                      |
| -------------- | ------- | --------------------------------------------- |
| Node.js        | 18+     | https://nodejs.org                             |
| Docker Desktop | Latest  | https://www.docker.com/products/docker-desktop |
| Git            | Latest  | https://git-scm.com                            |

Verify installations:

```bash
node -v        # v18+ or v20+
npm -v         # 9+
docker -v      # Docker version 24+
docker compose version  # v2+
git --version
```

## Step-by-step Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd Backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

The defaults work for local development — no changes needed unless you want custom ports or mail.

### 4. Start infrastructure (PostgreSQL + Redis)

```bash
docker compose -f infra/docker-compose.yml up -d
```

Verify containers are running:

```bash
docker ps
# Should see: nexio-postgres (port 5432) and nexio-redis (port 6379)
```

### 5. Setup database

```bash
# Generate Prisma client
npx prisma generate

# Run all migrations
npx prisma migrate dev

# Load demo data (optional but recommended)
npx prisma db seed
```

### 6. Start the server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3001/api`.

### 7. Verify it works

```bash
# Health check — login with seed user
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@nexio.dev","password":"password123"}'
```

You should get a JSON response with an `accessToken`.

## Quick Reference

### Start everything (daily workflow)

```bash
# Start infra (if not already running)
docker compose -f infra/docker-compose.yml up -d

# Start dev server
npm run start:dev
```

### Stop everything

```bash
# Stop dev server: Ctrl+C

# Stop infra (keeps data)
docker compose -f infra/docker-compose.yml stop

# Stop infra AND delete data
docker compose -f infra/docker-compose.yml down -v
```

### Reset database

```bash
# Drop all tables and re-run migrations
npx prisma migrate reset

# This also runs the seed automatically if configured
```

### View database

```bash
npx prisma studio
# Opens a visual browser at http://localhost:5555
```

## Seed Users

| Role  | Email              | Password      |
| ----- | ------------------ | ------------- |
| OWNER | owner@nexio.dev    | password123   |
| COACH | coach@nexio.dev    | password123   |

5 demo clients are also created, assigned to the coach.

## Troubleshooting

### Port 5432 already in use

Another PostgreSQL instance is running. Either stop it or change the port in `infra/docker-compose.yml` and `DATABASE_URL` in `.env`.

```bash
# Check what's using port 5432
# Windows
netstat -ano | findstr :5432
# macOS/Linux
lsof -i :5432
```

### Docker containers won't start

```bash
# Check logs
docker logs nexio-postgres
docker logs nexio-redis

# Restart from scratch
docker compose -f infra/docker-compose.yml down -v
docker compose -f infra/docker-compose.yml up -d
```

### Prisma migrate fails

```bash
# Make sure postgres is running and accessible
docker ps | grep nexio-postgres

# Force reset if migrations are corrupted
npx prisma migrate reset
```

### node_modules issues

```bash
rm -rf node_modules package-lock.json
npm install
```

## Environment Variables

| Variable         | Default Value                        | Required | Notes                          |
| ---------------- | ------------------------------------ | -------- | ------------------------------ |
| `DATABASE_URL`   | postgresql://nexio:nexio_dev@...     | Yes      | Matches docker-compose config  |
| `JWT_SECRET`     | change-me-in-production              | Yes      | Any string, change in prod     |
| `JWT_EXPIRATION` | 7d                                   | No       | Token lifespan                 |
| `REDIS_URL`      | redis://localhost:6379               | Yes      | Matches docker-compose config  |
| `PORT`           | 3001                                 | No       | Server port                    |
| `MAIL_HOST`      | smtp.example.com                     | No       | Only needed for email features |
| `MAIL_PORT`      | 587                                  | No       | SMTP port                      |
| `MAIL_USER`      | -                                    | No       | SMTP username                  |
| `MAIL_PASS`      | -                                    | No       | SMTP password                  |
| `MAIL_FROM`      | "Nexio" <no-reply@example.com>       | No       | Sender address                 |
| `FRONTEND_URL`   | http://localhost:3000                | No       | Used in password reset emails  |
