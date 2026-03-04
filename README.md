# nexio-api

API REST + WebSocket for Nexio, a fitness coaching platform for LATAM.
Serves: web dashboard (coaches) and mobile app (clients).

## Stack

- **NestJS 11** — TypeScript framework
- **Prisma 5** — ORM + migrations (PostgreSQL)
- **Passport + JWT** — Authentication
- **Zod** — DTO validation
- **Socket.IO** — WebSocket (ready)
- **Docker Compose** — Local infrastructure

## Prerequisites

- Node.js 18+
- Docker Desktop (for PostgreSQL + Redis)

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env

# 3. Start PostgreSQL + Redis
docker compose -f infra/docker-compose.yml up -d

# 4. Generate Prisma client
npx prisma generate

# 5. Run migrations
npx prisma migrate dev

# 6. Seed demo data (optional)
npx prisma db seed

# 7. Start dev server (port 3001)
npm run start:dev
```

## Scripts

| Command                  | Description                |
| ------------------------ | -------------------------- |
| `npm run start:dev`      | Dev server with watch mode |
| `npm run build`          | Compile to /dist           |
| `npm run start:prod`     | Run compiled app           |
| `npx prisma studio`      | Visual DB browser          |
| `npx prisma migrate dev` | Create/apply migrations    |

## API Endpoints

### Auth (public)

| Method | Route                | Description          |
| ------ | -------------------- | -------------------- |
| POST   | `/api/auth/register` | Register org + owner |
| POST   | `/api/auth/login`    | Login, returns JWT   |

### Users (OWNER/ADMIN)

| Method | Route            | Description                  |
| ------ | ---------------- | ---------------------------- |
| GET    | `/api/users`     | List users (paginated)       |
| GET    | `/api/users/:id` | Get user by ID               |
| POST   | `/api/users`     | Create ADMIN or COACH in org |
| PATCH  | `/api/users/:id` | Update user                  |

### Clients (OWNER/ADMIN/COACH)

| Method | Route              | Description                                              |
| ------ | ------------------ | -------------------------------------------------------- |
| GET    | `/api/clients`     | List clients (paginated, filters: status/search/coachId) |
| GET    | `/api/clients/:id` | Get client with user info                                |
| POST   | `/api/clients`     | Create User (CLIENT) + Client profile                    |
| PATCH  | `/api/clients/:id` | Update status, tags, notes                               |
| DELETE | `/api/clients/:id` | Delete client + user                                     |

### Exercises (OWNER/ADMIN/COACH)

| Method | Route                          | Description                              |
| ------ | ------------------------------ | ---------------------------------------- |
| GET    | `/api/exercises`               | List exercises (global + org, paginated) |
| GET    | `/api/exercises/muscle-groups` | Distinct muscle groups                   |
| GET    | `/api/exercises/:id`           | Get exercise detail                      |
| POST   | `/api/exercises`               | Create exercise for org                  |
| PATCH  | `/api/exercises/:id`           | Update (org exercises only)              |
| DELETE | `/api/exercises/:id`           | Delete (org exercises only, OWNER/ADMIN) |

### Plans (OWNER/ADMIN/COACH)

| Method | Route                             | Description                               |
| ------ | --------------------------------- | ----------------------------------------- |
| GET    | `/api/plans/:id`                  | Get plan with days, blocks, and exercises |
| POST   | `/api/plans`                      | Create plan or template                   |
| PATCH  | `/api/plans/:id`                  | Update plan                               |
| DELETE | `/api/plans/:id`                  | Delete plan with cascade (OWNER/ADMIN)    |
| POST   | `/api/plans/:id/duplicate`        | Deep copy plan as new template            |
| POST   | `/api/plans/:id/assign/:clientId` | Assign template to client (pauses active) |

### Workout Days (OWNER/ADMIN/COACH)

| Method | Route                   | Description             |
| ------ | ----------------------- | ----------------------- |
| POST   | `/api/workout-days`     | Create day for a plan   |
| PATCH  | `/api/workout-days/:id` | Update day              |
| DELETE | `/api/workout-days/:id` | Delete day with cascade |

### Workout Blocks (OWNER/ADMIN/COACH)

| Method | Route                         | Description                   |
| ------ | ----------------------------- | ----------------------------- |
| POST   | `/api/workout-blocks`         | Create block for a day        |
| PATCH  | `/api/workout-blocks/:id`     | Update block                  |
| DELETE | `/api/workout-blocks/:id`     | Delete block                  |
| POST   | `/api/workout-blocks/reorder` | Batch reorder blocks in a day |

### Today

| Method | Route                  | Roles             | Description                    |
| ------ | ---------------------- | ----------------- | ------------------------------ |
| GET    | `/api/today`           | CLIENT            | Get own workout for today      |
| GET    | `/api/today/:clientId` | OWNER/ADMIN/COACH | Preview client's today workout |

### Check-ins

| Method | Route                      | Roles             | Description                               |
| ------ | -------------------------- | ----------------- | ----------------------------------------- |
| POST   | `/api/check-ins`           | CLIENT            | Create/upsert own check-in                |
| POST   | `/api/check-ins/:clientId` | OWNER/ADMIN/COACH | Create check-in for a client              |
| GET    | `/api/check-ins/:clientId` | OWNER/ADMIN/COACH | Get client's check-in history (paginated) |

## Security (3 layers)

1. **JwtAuthGuard** — Valid JWT required (global, except `@Public()` routes)
2. **RolesGuard + @Roles()** — Correct role required
3. **OrganizationGuard** — Data isolated by organizationId

## Role isolation

| Role          | Access                                |
| ------------- | ------------------------------------- |
| OWNER / ADMIN | All data within their organization    |
| COACH         | Only their assigned clients (coachId) |
| CLIENT        | Only their own data (userId)          |

## Project structure

```
src/
├── main.ts                    # Entry point (port 3001, prefix /api)
├── app.module.ts              # Root module
├── common/                    # Shared (guards, decorators, DTOs)
├── auth/                      # Authentication module
├── users/                     # Users CRUD (ADMIN/COACH)
├── clients/                   # Clients module (coach-client relationship)
├── exercises/                 # Exercises catalog (global + per org)
├── plans/                     # Training plans (templates + assigned)
├── workout-days/              # Days within a plan (1-7)
├── workout-blocks/            # Exercise blocks within a day
├── today/                     # Today's workout endpoint
├── check-ins/                 # Check-in tracking + streak/adherence
└── prisma/                    # Database connection (global)
```

## Module pattern

Each module follows: `module.ts` → `controller.ts` → `service.ts` → `repository.ts` → `dto/index.ts`

## Data model

```
Organization ─┬─ User ─── Client ─┬─ Plan ─── WorkoutDay ─── WorkoutBlock ─── Exercise
              │                    ├─ CheckIn
              │                    └─ Achievement
              └─ Exercise (org-specific)
```

### Prisma enums

| Enum              | Values                                                   |
| ----------------- | -------------------------------------------------------- |
| `Role`            | `OWNER`, `ADMIN`, `COACH`, `CLIENT`                      |
| `PlanStatus`      | `TEMPLATE`, `ACTIVE`, `PAUSED`, `COMPLETED`              |
| `CheckInStatus`   | `COMPLETED`, `PARTIAL`, `SKIPPED`                        |
| `AchievementType` | `STREAK_7`, `STREAK_30`, `FIRST_CHECKIN`, `PERFECT_WEEK` |

### Key models

| Model          | Description                                              |
| -------------- | -------------------------------------------------------- |
| `Plan`         | Training plan (template or assigned to client)           |
| `WorkoutDay`   | One day within a plan (dayOfWeek 1-7, ordered)           |
| `WorkoutBlock` | One exercise within a day (sets, reps, rest, ordered)    |
| `CheckIn`      | Daily workout completion record (unique per client+date) |
| `Achievement`  | Milestone earned by client (unique per client+type)      |

## Business logic

### Plan assignment

- `POST /plans/:id/assign/:clientId` deep copies template → client plan
- Automatically pauses any existing ACTIVE plan for that client
- Duplication also deep copies all days and blocks

### Check-in flow

1. Client or coach creates check-in via `POST /check-ins` or `POST /check-ins/:clientId`
2. Upsert by `[clientId, date]` unique constraint (one check-in per day)
3. After upsert, recalculates:
   - **Streak**: consecutive days with COMPLETED status going backwards from today
   - **Adherence**: `(completed / total) * 100` over last 30 days
4. Updates `client.currentStreak` and `client.adherenceRate`
5. Awards achievements automatically (FIRST_CHECKIN, STREAK_7, STREAK_30, PERFECT_WEEK)

### Today endpoint

- Finds client's active plan (status=ACTIVE)
- Maps current day of week to a WorkoutDay
- Returns workout with blocks + exercises, plus existing check-in if any

## Seed data

| Data                  | Description                                  |
| --------------------- | -------------------------------------------- |
| Organization          | `nexio-demo`                                 |
| Owner                 | `owner@nexio.dev` / `password123`            |
| Coach                 | `coach@nexio.dev` / `password123`            |
| Clients (5)           | María, Carlos, Ana, Jorge, Lucía             |
| Global exercises (29) | 8 muscle groups (Pecho, Espalda, Piernas...) |
| Template plan         | PPL - Push/Pull/Legs (3 days, 15 blocks)     |
| Active plan           | PPL assigned to first client (María)         |
| Check-ins (12)        | 12 days of mixed COMPLETED/PARTIAL/SKIPPED   |
| Achievements (2)      | FIRST_CHECKIN + STREAK_7 for María           |

## Environment variables

See [.env.example](.env.example) for required variables.
