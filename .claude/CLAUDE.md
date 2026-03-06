# Nexio Backend — Project Context

Nexio is a fitness coaching platform for LATAM. This backend serves:
- **Web dashboard** for coaches (OWNER/ADMIN/COACH roles)
- **Mobile app** for clients (CLIENT role)

## Stack

| Layer           | Technology                                  |
| --------------- | ------------------------------------------- |
| Framework       | NestJS 11 (TypeScript, ES2023)              |
| ORM             | Prisma 5 (PostgreSQL 16)                    |
| Validation      | Zod 4 + nestjs-zod (manual `.parse()`)      |
| Auth            | Passport + JWT (@nestjs/jwt)                |
| Password hash   | bcrypt (salt rounds: 10)                    |
| Real-time       | Socket.IO via @nestjs/websockets            |
| Email           | @nestjs-modules/mailer + Handlebars         |
| Cache / Pub-Sub | Redis 7 (ioredis)                           |
| Infra           | Docker Compose (PostgreSQL + Redis)         |
| Testing         | Jest + Supertest                            |
| Linting         | ESLint 9 + Prettier                         |

## Project Structure

```
src/
├── main.ts                          # Entry point (port 3001, prefix /api, CORS, LoggerInterceptor)
├── app.module.ts                    # Root module (global JwtAuthGuard via APP_GUARD)
├── common/
│   ├── decorators/
│   │   ├── public.decorator.ts      # @Public() — bypass JWT guard
│   │   ├── current-user.decorator.ts# @CurrentUser() — extract user from request
│   │   └── roles.decorator.ts       # @Roles(Role.OWNER, ...) — role metadata
│   ├── guards/
│   │   ├── jwt-auth.guard.ts        # Global JWT guard (respects @Public)
│   │   ├── roles.guard.ts           # Role-based access (reads @Roles metadata)
│   │   └── organization.guard.ts    # Org-scoped data isolation
│   ├── interceptors/
│   │   └── logger.interceptor.ts    # Logs METHOD URL STATUS DURATION
│   ├── dto/
│   │   └── pagination.dto.ts        # PaginationQuerySchema (page, limit)
│   └── interfaces/
│       └── paginated-response.interface.ts  # PaginatedResponse<T>
├── auth/                            # Register, login, forgot/reset password
├── users/                           # User CRUD (ADMIN/COACH management)
├── clients/                         # Client profiles + coach assignment
├── exercises/                       # Exercise catalog (global + org-specific)
├── plans/                           # Training plans (templates + assigned)
├── workout-days/                    # Days within a plan (dayOfWeek 1-7)
├── workout-blocks/                  # Exercise blocks within a day (ordered)
├── today/                           # Today's workout for client
├── check-ins/                       # Daily check-in tracking + streaks
├── messaging/                       # Conversations + messages + WebSocket gateway
├── mailer/                          # Email service (Handlebars templates)
└── prisma/                          # PrismaService (global module)
```

## Module Pattern

Every feature module follows this structure:

```
src/<module>/
├── <module>.module.ts               # NestJS module definition
├── <module>.controller.ts           # Route handlers
├── <module>.service.ts              # Business logic + authorization
├── <module>.repository.ts           # Prisma data access (SELECT constants, pagination)
└── dto/
    └── index.ts                     # Zod schemas + inferred TypeScript types
```

## Modules and Endpoints

All routes prefixed with `/api`. JWT required unless marked `@Public()`.

### Auth — `src/auth/` (all @Public)

| Method | Route                       | Description                       |
| ------ | --------------------------- | --------------------------------- |
| POST   | `/api/auth/register`        | Register org + owner              |
| POST   | `/api/auth/login`           | Login, returns JWT                |
| POST   | `/api/auth/forgot-password` | Send password reset email         |
| POST   | `/api/auth/reset-password`  | Reset password with token         |

### Users — `src/users/` (OWNER, ADMIN)

| Method | Route            | Description                  |
| ------ | ---------------- | ---------------------------- |
| GET    | `/api/users`     | List users (paginated)       |
| GET    | `/api/users/:id` | Get user by ID               |
| POST   | `/api/users`     | Create ADMIN or COACH in org |
| PATCH  | `/api/users/:id` | Update user                  |

Guards: `@UseGuards(RolesGuard, OrganizationGuard)` at controller level.

### Clients — `src/clients/` (OWNER, ADMIN, COACH)

| Method | Route              | Description                                              |
| ------ | ------------------ | -------------------------------------------------------- |
| GET    | `/api/clients`     | List clients (paginated, filters: status/search/coachId) |
| GET    | `/api/clients/:id` | Get client with user info                                |
| POST   | `/api/clients`     | Create User (CLIENT) + Client profile                    |
| PATCH  | `/api/clients/:id` | Update status, tags, notes                               |
| DELETE | `/api/clients/:id` | Delete client + user                                     |

Guards: `@UseGuards(RolesGuard, OrganizationGuard)` at controller level. COACHs filtered to own clients in service.

### Exercises — `src/exercises/` (OWNER, ADMIN, COACH)

| Method | Route                          | Description                              |
| ------ | ------------------------------ | ---------------------------------------- |
| GET    | `/api/exercises`               | List exercises (global + org, paginated) |
| GET    | `/api/exercises/muscle-groups` | Distinct muscle groups                   |
| GET    | `/api/exercises/:id`           | Get exercise detail                      |
| POST   | `/api/exercises`               | Create exercise for org                  |
| PATCH  | `/api/exercises/:id`           | Update (org exercises only)              |
| DELETE | `/api/exercises/:id`           | Delete (org only, OWNER/ADMIN)           |

Global exercises (organizationId: null) cannot be modified or deleted.

### Plans — `src/plans/` (OWNER, ADMIN, COACH)

| Method | Route                             | Description                               |
| ------ | --------------------------------- | ----------------------------------------- |
| GET    | `/api/plans`                      | List plans (paginated, filter by status)  |
| GET    | `/api/plans/:id`                  | Get plan with days, blocks, exercises     |
| POST   | `/api/plans`                      | Create plan or template                   |
| PATCH  | `/api/plans/:id`                  | Update plan                               |
| DELETE | `/api/plans/:id`                  | Delete plan with cascade (OWNER/ADMIN)    |
| POST   | `/api/plans/:id/duplicate`        | Deep copy as new template                 |
| POST   | `/api/plans/:id/assign/:clientId` | Assign template to client (pauses active) |

COACHs can only access plans they created (createdById check in service).

### Workout Days — `src/workout-days/` (OWNER, ADMIN, COACH)

| Method | Route                   | Description             |
| ------ | ----------------------- | ----------------------- |
| POST   | `/api/workout-days`     | Create day for a plan   |
| PATCH  | `/api/workout-days/:id` | Update day              |
| DELETE | `/api/workout-days/:id` | Delete day with cascade |

### Workout Blocks — `src/workout-blocks/` (OWNER, ADMIN, COACH)

| Method | Route                         | Description                   |
| ------ | ----------------------------- | ----------------------------- |
| POST   | `/api/workout-blocks`         | Create block for a day        |
| PATCH  | `/api/workout-blocks/:id`     | Update block                  |
| DELETE | `/api/workout-blocks/:id`     | Delete block                  |
| POST   | `/api/workout-blocks/reorder` | Batch reorder blocks in a day |

### Today — `src/today/`

| Method | Route                  | Roles             | Description                    |
| ------ | ---------------------- | ----------------- | ------------------------------ |
| GET    | `/api/today`           | CLIENT            | Get own workout for today      |
| GET    | `/api/today/:clientId` | OWNER/ADMIN/COACH | Preview client's today workout |

### Check-ins — `src/check-ins/`

| Method | Route                      | Roles             | Description                               |
| ------ | -------------------------- | ----------------- | ----------------------------------------- |
| POST   | `/api/check-ins`           | CLIENT            | Create/upsert own check-in                |
| POST   | `/api/check-ins/:clientId` | OWNER/ADMIN/COACH | Create check-in for a client              |
| GET    | `/api/check-ins/:clientId` | OWNER/ADMIN/COACH | Get check-in history (paginated)          |

### Messaging — `src/messaging/` (all authenticated)

| Method | Route                             | Description               |
| ------ | --------------------------------- | ------------------------- |
| GET    | `/api/conversations`              | List user's conversations |
| POST   | `/api/conversations`              | Create conversation       |
| GET    | `/api/conversations/:id/messages` | Get messages (paginated)  |
| POST   | `/api/conversations/:id/messages` | Send message              |
| PATCH  | `/api/conversations/:id/read`     | Mark as read              |

**WebSocket Gateway** (`/messaging` namespace): Events — `message:send`, `message:read`, `typing:start`, `typing:stop`. JWT validated from handshake. Room-based broadcasting per conversation.

## Security — 3 Layers

1. **JwtAuthGuard** (global via APP_GUARD) — All routes require valid JWT unless `@Public()`
2. **RolesGuard** + `@Roles()` — Applied per controller/route, reads role metadata
3. **OrganizationGuard** — Validates organizationId matches user's org

### Role Permissions

| Role    | Access                                         |
| ------- | ---------------------------------------------- |
| OWNER   | All data within their organization             |
| ADMIN   | All data within their organization             |
| COACH   | Only their assigned clients and created plans  |
| CLIENT  | Only their own data (check-ins, today workout) |

## Prisma Enums

| Enum              | Values                                                   |
| ----------------- | -------------------------------------------------------- |
| `Role`            | `OWNER`, `ADMIN`, `COACH`, `CLIENT`                      |
| `PlanStatus`      | `TEMPLATE`, `ACTIVE`, `PAUSED`, `COMPLETED`              |
| `CheckInStatus`   | `COMPLETED`, `PARTIAL`, `SKIPPED`                        |
| `BlockType`       | `EXERCISE`, `SUPERSET`, `REST`, `NOTE`                   |
| `AchievementType` | `STREAK_7`, `STREAK_30`, `FIRST_CHECKIN`, `PERFECT_WEEK` |

## Data Model

```
Organization ─┬─ User ─── Client ─┬─ Plan ─── WorkoutDay ─── WorkoutBlock ─── Exercise
              │                    ├─ CheckIn
              │                    └─ Achievement
              ├─ Exercise (org-specific, null = global)
              └─ Conversation ─── ConversationParticipant
                              └── Message
```

Key composite unique constraints:
- `CheckIn`: [clientId, date]
- `Achievement`: [clientId, type]
- `ConversationParticipant`: [conversationId, userId]

## Code Conventions

### DTOs — Zod manual parsing

```typescript
// dto/index.ts
export const CreateThingSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});
export type CreateThingDto = z.infer<typeof CreateThingSchema>;

// controller.ts — manual parse in each handler
@Post()
create(@Body() body: any) {
  const dto: CreateThingDto = CreateThingSchema.parse(body);
  return this.service.create(dto);
}
```

### Repository — SELECT constants + pagination

```typescript
const THING_SELECT = {
  id: true,
  name: true,
  createdAt: true,
  // explicit fields, never select all
};

async findAll(orgId: string, query: PaginationQueryDto): Promise<PaginatedResponse<any>> {
  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const where = { organizationId: orgId };
  const [data, total] = await Promise.all([
    this.prisma.thing.findMany({ where, select: THING_SELECT, skip, take: limit }),
    this.prisma.thing.count({ where }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
```

### Services — authorization + NestJS exceptions

- Inject repository (or PrismaService for auth)
- Private `Logger` instance per service
- Role-based filtering: COACHs scoped to own clients/plans
- Throw: `NotFoundException`, `ForbiddenException`, `ConflictException`, `BadRequestException`
- Transactions via `this.prisma.$transaction(async (tx) => { ... })`

### Guards — applied at controller level

```typescript
@Controller('things')
@UseGuards(RolesGuard, OrganizationGuard)
@Roles(Role.OWNER, Role.ADMIN)
export class ThingsController { ... }
```

### Logging

- Services log important operations: `Entity action: details`
- LoggerInterceptor globally logs: `METHOD URL STATUS_CODE DURATION`

## Commands

| Command                  | Description                  |
| ------------------------ | ---------------------------- |
| `npm run start:dev`      | Dev server with hot reload   |
| `npm run start:debug`    | Dev server with debugger     |
| `npm run build`          | Compile to /dist             |
| `npm run start:prod`     | Run compiled app             |
| `npm run lint`           | ESLint auto-fix              |
| `npm run test`           | Unit tests (Jest)            |
| `npm run test:e2e`       | E2E tests                    |
| `npm run test:cov`       | Tests with coverage          |
| `npx prisma generate`    | Generate Prisma client       |
| `npx prisma migrate dev` | Create/apply migrations      |
| `npx prisma studio`      | Visual DB browser            |
| `npx prisma db seed`     | Seed demo data               |

## Environment Variables

```
DATABASE_URL=postgresql://nexio:nexio_dev@localhost:5432/nexio_db?schema=public
JWT_SECRET=change-me-in-production
JWT_EXPIRATION=7d
REDIS_URL=redis://localhost:6379
PORT=3001
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your-email@example.com
MAIL_PASS=your-email-password
MAIL_FROM="Nexio" <no-reply@example.com>
FRONTEND_URL=http://localhost:3000
```

## Business Logic

### Plan assignment
- `assign()` deep copies template → client plan (all days + blocks)
- Automatically pauses any existing ACTIVE plan for client
- `duplicate()` creates template copy with "(copia)" suffix

### Check-in flow
1. Upsert by [clientId, date] (one per day)
2. Recalculates streak (consecutive COMPLETED days backwards)
3. Recalculates adherence (30-day completion %)
4. Updates client.currentStreak and client.adherenceRate
5. Awards achievements: FIRST_CHECKIN, STREAK_7, STREAK_30, PERFECT_WEEK

### Password reset
1. `forgot-password` generates crypto.randomBytes token (1h expiry), sends email
2. `reset-password` validates token, updates password, clears reset fields

### Messaging (WebSocket)
- Gateway at `/messaging` namespace, JWT from handshake
- Room-based: `conversation:${id}`
- Events: message:send, message:read, typing:start, typing:stop
- Unread count tracked per participant

## Frontend Relationship

The frontend (Next.js web dashboard + React Native mobile app) consumes this API. Shared types can be mirrored in a `@nexio/types` package from the Zod schemas and Prisma enums exported here. DTOs define the contract — any backend DTO change must be reflected in frontend types.

## Infrastructure

Docker Compose at `infra/docker-compose.yml`:
- PostgreSQL 16 (port 5432, container: nexio-postgres)
- Redis 7 (port 6379, container: nexio-redis)
- Named volumes: pgdata, redisdata

## Seed Data

Demo org `nexio-demo` with owner (`owner@nexio.dev`), coach (`coach@nexio.dev`), 5 clients, 29 global exercises (Spanish), PPL template plan (3 days, 15 blocks), 12 check-ins, 2 achievements. All passwords: `password123`. Seed uses upsert for idempotency.
