# Nexio API

> REST API + WebSocket backend for **Nexio**, a fitness coaching platform for LATAM.
> Serves a web dashboard (coaches) and a mobile app (clients).

## Tech Stack

| Layer          | Technology                        |
| -------------- | --------------------------------- |
| Framework      | NestJS 11 (TypeScript)            |
| ORM            | Prisma 5 (PostgreSQL)             |
| Auth           | Passport + JWT                    |
| Validation     | Zod                               |
| Real-time      | Socket.IO (WebSocket gateway)     |
| Email          | Nodemailer + Handlebars templates |
| Cache / Pub-Sub| Redis (ioredis)                   |
| Infra          | Docker Compose                    |

## Prerequisites

- Node.js 18+
- Docker Desktop (PostgreSQL + Redis)

## Getting Started

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

| Command                  | Description                        |
| ------------------------ | ---------------------------------- |
| `npm run start:dev`      | Dev server with hot reload         |
| `npm run start:debug`    | Dev server with debugger attached  |
| `npm run build`          | Compile to `/dist`                 |
| `npm run start:prod`     | Run compiled app                   |
| `npm run lint`           | Lint and auto-fix with ESLint      |
| `npm run test`           | Run unit tests                     |
| `npm run test:e2e`       | Run end-to-end tests               |
| `npm run test:cov`       | Run tests with coverage report     |
| `npx prisma studio`      | Visual database browser            |
| `npx prisma migrate dev` | Create / apply migrations          |

## API Reference

All routes are prefixed with `/api`. Protected routes require a valid JWT in the `Authorization: Bearer <token>` header.

### Auth (public)

| Method | Route                        | Description                             |
| ------ | ---------------------------- | --------------------------------------- |
| POST   | `/api/auth/register`         | Register organization + owner account   |
| POST   | `/api/auth/login`            | Login, returns JWT access token         |
| POST   | `/api/auth/forgot-password`  | Send password reset email               |
| POST   | `/api/auth/reset-password`   | Reset password with token               |

### Users (OWNER / ADMIN)

| Method | Route            | Description                  |
| ------ | ---------------- | ---------------------------- |
| GET    | `/api/users`     | List users (paginated)       |
| GET    | `/api/users/:id` | Get user by ID               |
| POST   | `/api/users`     | Create ADMIN or COACH in org |
| PATCH  | `/api/users/:id` | Update user                  |

### Clients (OWNER / ADMIN / COACH)

| Method | Route              | Description                                              |
| ------ | ------------------ | -------------------------------------------------------- |
| GET    | `/api/clients`     | List clients (paginated, filters: status/search/coachId) |
| GET    | `/api/clients/:id` | Get client with user info                                |
| POST   | `/api/clients`     | Create User (CLIENT) + Client profile                    |
| PATCH  | `/api/clients/:id` | Update status, tags, notes                               |
| DELETE | `/api/clients/:id` | Delete client + user                                     |

### Exercises (OWNER / ADMIN / COACH)

| Method | Route                          | Description                              |
| ------ | ------------------------------ | ---------------------------------------- |
| GET    | `/api/exercises`               | List exercises (global + org, paginated) |
| GET    | `/api/exercises/muscle-groups` | Distinct muscle groups                   |
| GET    | `/api/exercises/:id`           | Get exercise detail                      |
| POST   | `/api/exercises`               | Create exercise for org                  |
| PATCH  | `/api/exercises/:id`           | Update (org exercises only)              |
| DELETE | `/api/exercises/:id`           | Delete (org exercises only, OWNER/ADMIN) |

### Plans (OWNER / ADMIN / COACH)

| Method | Route                             | Description                               |
| ------ | --------------------------------- | ----------------------------------------- |
| GET    | `/api/plans/:id`                  | Get plan with days, blocks, and exercises |
| POST   | `/api/plans`                      | Create plan or template                   |
| PATCH  | `/api/plans/:id`                  | Update plan                               |
| DELETE | `/api/plans/:id`                  | Delete plan with cascade (OWNER/ADMIN)    |
| POST   | `/api/plans/:id/duplicate`        | Deep copy plan as new template            |
| POST   | `/api/plans/:id/assign/:clientId` | Assign template to client (pauses active) |

### Workout Days (OWNER / ADMIN / COACH)

| Method | Route                   | Description             |
| ------ | ----------------------- | ----------------------- |
| POST   | `/api/workout-days`     | Create day for a plan   |
| PATCH  | `/api/workout-days/:id` | Update day              |
| DELETE | `/api/workout-days/:id` | Delete day with cascade |

### Workout Blocks (OWNER / ADMIN / COACH)

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

### Messaging (authenticated)

| Method | Route                              | Description                           |
| ------ | ---------------------------------- | ------------------------------------- |
| GET    | `/api/conversations`               | List user's conversations             |
| POST   | `/api/conversations`               | Create a new conversation             |
| GET    | `/api/conversations/:id/messages`  | Get messages (paginated)              |
| POST   | `/api/conversations/:id/messages`  | Send a message                        |
| PATCH  | `/api/conversations/:id/read`      | Mark conversation as read             |

Real-time messaging is also available via the **Socket.IO** gateway (`MessagingGateway`), which broadcasts new messages and read receipts to conversation participants.

## Security

The API applies three layers of protection on every request:

1. **JwtAuthGuard** — Valid JWT required (global, except `@Public()` routes)
2. **RolesGuard + @Roles()** — Correct role required per endpoint
3. **OrganizationGuard** — Data isolated by `organizationId`

### Role Permissions

| Role          | Access Scope                          |
| ------------- | ------------------------------------- |
| OWNER / ADMIN | All data within their organization    |
| COACH         | Only their assigned clients (coachId) |
| CLIENT        | Only their own data (userId)          |

## Project Structure

```
src/
├── main.ts                    # Entry point (port 3001, prefix /api)
├── app.module.ts              # Root module
├── common/                    # Shared guards, decorators, DTOs
├── auth/                      # Authentication (login, register, password reset)
├── users/                     # User management (ADMIN/COACH)
├── clients/                   # Client profiles (coach-client relationship)
├── exercises/                 # Exercise catalog (global + per org)
├── plans/                     # Training plans (templates + assigned)
├── workout-days/              # Days within a plan (1-7)
├── workout-blocks/            # Exercise blocks within a day
├── today/                     # Today's workout endpoint
├── check-ins/                 # Check-in tracking + streaks + adherence
├── messaging/                 # Conversations, messages, WebSocket gateway
├── mailer/                    # Email service (password reset, notifications)
└── prisma/                    # Prisma service (global DB connection)
```

### Module Pattern

Each module follows: `module.ts` → `controller.ts` → `service.ts` → `repository.ts` → `dto/index.ts`

## Data Model

```
Organization ─┬─ User ─── Client ─┬─ Plan ─── WorkoutDay ─── WorkoutBlock ─── Exercise
              │                    ├─ CheckIn
              │                    └─ Achievement
              ├─ Exercise (org-specific)
              └─ Conversation ─── Message
```

### Enums

| Enum              | Values                                                   |
| ----------------- | -------------------------------------------------------- |
| `Role`            | `OWNER`, `ADMIN`, `COACH`, `CLIENT`                      |
| `PlanStatus`      | `TEMPLATE`, `ACTIVE`, `PAUSED`, `COMPLETED`              |
| `CheckInStatus`   | `COMPLETED`, `PARTIAL`, `SKIPPED`                        |
| `BlockType`       | `EXERCISE`, `SUPERSET`, `REST`, `NOTE`                   |
| `AchievementType` | `STREAK_7`, `STREAK_30`, `FIRST_CHECKIN`, `PERFECT_WEEK` |

### Key Models

| Model          | Description                                              |
| -------------- | -------------------------------------------------------- |
| Organization   | Tenant — all data is scoped to an organization           |
| User           | Any authenticated user (owner, admin, coach, or client)  |
| Client         | Extended profile for CLIENT users (streak, adherence)    |
| Plan           | Training plan (template or assigned to a client)         |
| WorkoutDay     | One day within a plan (dayOfWeek 1-7, ordered)           |
| WorkoutBlock   | One exercise/superset/rest within a day (ordered)        |
| Exercise       | Exercise definition (global or org-specific)             |
| CheckIn        | Daily workout completion record (unique per client+date) |
| Achievement    | Milestone earned by a client (unique per client+type)    |
| Conversation   | Chat thread between users within an organization         |
| Message        | Individual message within a conversation                 |

## Business Logic

### Plan Assignment

- `POST /plans/:id/assign/:clientId` deep copies a template into a client-specific plan
- Automatically pauses any existing ACTIVE plan for that client
- Duplication deep copies all days and blocks

### Check-in Flow

1. Client or coach creates a check-in via `POST /check-ins` or `POST /check-ins/:clientId`
2. Upsert by `[clientId, date]` unique constraint (one check-in per day)
3. After upsert, the system recalculates:
   - **Streak**: consecutive days with `COMPLETED` status going backwards from today
   - **Adherence**: `(completed / total) * 100` over the last 30 days
4. Updates `client.currentStreak` and `client.adherenceRate`
5. Awards achievements automatically (`FIRST_CHECKIN`, `STREAK_7`, `STREAK_30`, `PERFECT_WEEK`)

### Password Reset

1. Client or coach requests reset via `POST /auth/forgot-password` with their email
2. System generates a secure token, stores it with an expiration, and sends an email
3. User submits the token + new password via `POST /auth/reset-password`

### Real-time Messaging

- WebSocket gateway (`MessagingGateway`) uses Socket.IO for real-time communication
- Users join their conversation rooms automatically
- New messages and read receipts are broadcast to all participants in real time

## Seed Data

| Data                  | Description                                  |
| --------------------- | -------------------------------------------- |
| Organization          | `nexio-demo`                                 |
| Owner                 | `owner@nexio.dev` / `password123`            |
| Coach                 | `coach@nexio.dev` / `password123`            |
| Clients (5)           | Maria, Carlos, Ana, Jorge, Lucia             |
| Global exercises (29) | 8 muscle groups (Chest, Back, Legs, etc.)    |
| Template plan         | PPL — Push/Pull/Legs (3 days, 15 blocks)     |
| Active plan           | PPL assigned to first client (Maria)         |
| Check-ins (12)        | 12 days of mixed COMPLETED/PARTIAL/SKIPPED   |
| Achievements (2)      | FIRST_CHECKIN + STREAK_7 for Maria           |

## Environment Variables

See [.env.example](.env.example) for the full list. Key variables:

| Variable       | Description                          |
| -------------- | ------------------------------------ |
| `DATABASE_URL` | PostgreSQL connection string         |
| `JWT_SECRET`   | Secret key for signing JWTs          |
| `JWT_EXPIRATION` | Token expiration (e.g., `7d`)      |
| `REDIS_URL`    | Redis connection string              |
| `PORT`         | Server port (default: 3001)          |
| `MAIL_HOST`    | SMTP host for outgoing emails        |
| `MAIL_PORT`    | SMTP port                            |
| `MAIL_USER`    | SMTP username                        |
| `MAIL_PASS`    | SMTP password                        |
| `MAIL_FROM`    | Default sender address               |
| `FRONTEND_URL` | Frontend URL (used in email links)   |

## License

UNLICENSED — Private project.
