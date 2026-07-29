# CLAUDE.md — Backends

## Project Overview

Backend API server for the **My Finance Tracker** application (quản lý thu chi cá nhân).
Built with **NestJS 11** + **TypeScript**, using **PostgreSQL** (Drizzle ORM) and **Redis**.
Frontend repository: `d:\my-finance-tracker`.

## Tech Stack

| Layer            | Technology                                  |
| ---------------- | ------------------------------------------- |
| Framework        | NestJS 11                                   |
| Language         | TypeScript 5 (strictNullChecks only)        |
| Database         | PostgreSQL 16 via Drizzle ORM + postgres.js |
| Cache / Queue    | Redis 7 (ioredis)                           |
| Authentication   | Passport JWT (access + refresh tokens)      |
| Validation       | Zod v4 (via custom `ZodValidationPipe`)     |
| Email            | Nodemailer                                  |
| API Docs         | @nestjs/swagger                             |
| Package Manager  | Bun (runtime) / npm (lock file present)     |
| Testing          | Jest (unit) + Supertest (e2e)               |
| Formatting       | Prettier (single quotes, trailing commas)   |
| Linting          | ESLint + typescript-eslint                  |
| Containerization | Docker Compose / Podman Compose             |

## Commands

```bash
# Development
bun start:dev             # Start dev server with watch (port 8888)
bun start:debug           # Start with debug + watch
bun run build             # Production build
bun run start:prod        # Run compiled JS

# Code Quality
bun run lint              # ESLint with --fix
bun run lint:check        # ESLint without fix (CI-friendly)
bun run format            # Prettier write
bun run format:check      # Prettier check

# Testing
bun run test              # Unit tests (Jest)
bun run test:watch        # Unit tests in watch mode
bun run test:cov          # Unit tests with coverage
bun run test:e2e          # E2E tests
bun run test:debug        # Debug tests with inspect

# Database (Drizzle)
bun run db:generate       # Generate migration SQL from schema changes
bun run db:migrate        # Run pending migrations
bun run db:push           # Push schema directly (dev only)
bun run db:studio         # Open Drizzle Studio

# Database Seeds
bun run db:seed:user      # Seed a single user
bun run db:seed:users-bulk # Bulk seed users

# Containers
bun compose:up            # Docker Compose up -d (Postgres + Redis)
bun compose:down          # Docker Compose down
bun podman:up             # Podman Compose up -d
bun podman:down           # Podman Compose down
bun podman:logs           # Podman Compose logs -f postgres
```

## Project Structure

```
src/
├── main.ts                       # Bootstrap: CORS, interceptors, filters, listen
├── app.module.ts                 # Root module (imports all feature modules)
├── app.controller.ts             # Health-check controller
├── app.service.ts                # Health-check service
├── database/
│   ├── database.module.ts        # Global Drizzle ORM provider (postgres.js)
│   └── schema.ts                 # All table definitions (users, categories, wallets, transactions)
├── features/                     # Feature modules (NestJS pattern)
│   ├── auth/                     # Authentication (login, register, refresh, forgot/reset password)
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── user/                     # User CRUD
│   ├── category/                 # Category CRUD (with repository)
│   ├── wallet/                   # Wallet management (with repository)
│   ├── transaction/              # Transaction management (with repository)
│   ├── email/                    # Email service (Nodemailer + MailerModule)
│   └── redis/                    # Redis service wrapper
└── packages/                     # Shared utilities (import via @packages/*)
    ├── configs/                  # JWT sign config
    ├── decorators/               # @ApiResponse, @Public, @User decorators
    ├── entities/                 # DTOs + Zod schemas per domain
    │   ├── auth/                 # auth.dto.ts + auth.schema.ts
    │   ├── user/
    │   ├── category/
    │   ├── wallet/
    │   └── transactions/
    ├── filters/                  # HttpExceptionFilter (global)
    ├── guards/                   # JwtAuthGuard (global), AdminRoleGuard
    ├── helpers/                  # hashing, JWT, query list helpers
    ├── interceptor/              # ResponseInterceptor, ErrorInterceptor, LoggerInterceptor
    ├── interfaces/               # ApiResponseInterface, UserInterface
    ├── pipes/                    # ZodValidationPipe
    └── strategy/                 # JwtUserStrategy (Passport)

drizzle/                          # Auto-generated SQL migrations
scripts/                          # Seed scripts (Bun runtime)
test/
├── jest-e2e.json                 # E2E test config
└── app.e2e-spec.ts               # E2E tests
```

## Code Conventions

### Path Alias

- `@packages/*` → `src/packages/*` (configured in `tsconfig.json` and Jest `moduleNameMapper`)
- Example: `import { Public } from '@packages/decorators'`

### Feature Module Pattern

Each feature follows the NestJS module pattern:

```
features/{name}/
├── {name}.module.ts     # Module definition (imports, providers, controllers)
├── {name}.controller.ts # Route handlers (uses @Body with ZodValidationPipe)
├── {name}.service.ts    # Business logic
└── {name}.repository.ts # Database queries (optional, used by category/wallet/transaction)
```

### Entity / DTO Pattern

Entities live in `src/packages/entities/{domain}/`:

- `{domain}.schema.ts` — Zod validation schemas (used in controllers via `ZodValidationPipe`)
- `{domain}.dto.ts` — TypeScript interfaces/types derived from schemas
- `index.ts` — Re-exports everything

### Request/Response Flow

1. Request → Global `JwtAuthGuard` (unless `@Public()` decorator)
2. Controller validates body via `ZodValidationPipe` (Zod schema)
3. Service → Repository → Drizzle ORM → PostgreSQL
4. `ResponseInterceptor` wraps response:
   ```json
   {
     "statusCode": 200,
     "message": "Success",
     "data": { ... },
     "timestamp": "2024-01-01T00:00:00.000Z",
     "method": "POST",
     "path": "/api/auth/login"
   }
   ```
5. Errors handled by `ErrorInterceptor` + `HttpExceptionFilter`

### Authentication

- **Global guard**: `JwtAuthGuard` applied via `APP_GUARD` in `AppModule`
- **Public routes**: Use `@Public()` decorator to skip JWT verification
- **Admin routes**: Use `@Admin()` guard for role-based access
- **Token flow**: Access token (3h default) + Refresh token (7d default)
- **Refresh**: POST `/auth/refresh` with `{ refreshToken }` → new pair
- **401 handling**: Automatic token refresh on frontend via Axios interceptors

### Validation

- All request bodies validated with **Zod v4** schemas via custom `ZodValidationPipe`
- Schemas defined in `src/packages/entities/{domain}/{domain}.schema.ts`
- DTOs are TypeScript types inferred from schemas

### Database

- **ORM**: Drizzle ORM with `postgres.js` driver
- **Schema**: Single file `src/database/schema.ts` (all tables)
- **Migrations**: Generated to `drizzle/` directory via `drizzle-kit generate`
- **Global provider**: `DRIZZLE` injection token available in all modules
- **Tables**: users, categories, wallets, transactions (UUID primary keys)
- **Enums**: user_role, category_type, wallet_type, transaction_type, transaction_status

### Code Style

- **Prettier**: Single quotes, trailing commas (all), 100 print width, semicolons
- **ESLint**: With typescript-eslint and prettier plugin
- **Import style**: `import { X } from '@packages/...'` using path alias
- **Decorator order**: `@Controller` → `@Public` → `@HttpCode` → `@ApiResponse` → method

## Environment Variables

| Variable                      | Description                    | Default                              |
| ----------------------------- | ------------------------------ | ------------------------------------ |
| `NODE_ENV`                    | Environment mode               | `development`                        |
| `PORT`                        | Server port                    | `8888`                               |
| `POSTGRES_HOST`               | PostgreSQL host                | `localhost`                          |
| `POSTGRES_PORT`               | PostgreSQL port                | `5433`                               |
| `POSTGRES_DB`                 | Database name                  | `backends_db`                        |
| `POSTGRES_USER`               | Database user                  | `postgres`                           |
| `POSTGRES_PASSWORD`           | Database password              | `postgres`                           |
| `DATABASE_URL`                | Full PostgreSQL connection URL | Built from POSTGRES\_\* vars         |
| `JWT_ACCESS_SECRET`           | Access token secret (UUID v4)  | Required                             |
| `JWT_REFRESH_SECRET`          | Refresh token secret (UUID v4) | Required                             |
| `JWT_ACCESS_EXPIRES_SECONDS`  | Access token TTL               | `10800` (3h)                         |
| `JWT_REFRESH_EXPIRES_SECONDS` | Refresh token TTL              | `604800` (7d)                        |
| `REDIS_HOST`                  | Redis host                     | `localhost`                          |
| `REDIS_PORT`                  | Redis port                     | `6380`                               |
| `REDIS_PASSWORD`              | Redis password                 | Optional                             |
| `REDIS_URL`                   | Full Redis connection URL      | Optional (overrides REDIS_HOST/PORT) |
| `MAIL_HOST`                   | SMTP host                      | `smtp.gmail.com`                     |
| `MAIL_PORT`                   | SMTP port                      | `587`                                |
| `MAIL_SECURE`                 | SMTP TLS                       | `true`                               |
| `MAIL_USER`                   | SMTP username                  | Required in production               |
| `MAIL_PASS`                   | SMTP password                  | Required in production               |
| `MAIL_FROM`                   | Sender email address           | Required in production               |
| `PASSWORD_RESET_URL_BASE`     | Frontend reset password URL    | `http://localhost:3000`              |
| `RABBITMQ_URL`                | RabbitMQ connection URL        | Required                             |
| `RABBITMQ_EXCHANGE`           | Topic exchange name            | `app.events`                         |

## Docker Services

The `docker-compose.yml` provides:

- **PostgreSQL 16 Alpine** — maps to host port `5433` (avoids conflict with local `5432`)
- **Redis 7 Alpine** — maps to host port `6380` (avoids conflict with local `6379`)

Data persisted in `postgres_data` named volume.

## Git Remote

```
origin: https://gitlab.com/finance_tracker_phandanghai/backends.git
```

## Key Files to Know

- `src/main.ts` — Bootstrap with CORS, interceptors, filters
- `src/app.module.ts` — Root module with all imports + global JWT guard
- `src/database/schema.ts` — All Drizzle table definitions
- `src/database/database.module.ts` — Global DB provider
- `src/packages/interceptor/response.interceptor.ts` — Standard response wrapper
- `src/packages/pipes/zod-validation.pipe.ts` — Zod validation pipe
- `src/packages/guards/jwt-auth.guard.ts` — Global JWT auth guard
- `src/packages/decorators/public.decorator.ts` — `@Public()` decorator
- `src/packages/entities/` — All DTOs and validation schemas

## Project Rules

The following rule files are loaded as part of these instructions and must be followed:

@.claude/rules/nestjs-feature-pattern.md
@.claude/rules/database.md
@.claude/rules/conventions.md

## Automated Hooks

Configured in `.claude/settings.json` (scripts in `.claude/hooks/`):

- **PreToolUse (Write|Edit)** → `guard-paths.mjs` blocks edits to `.env*` and generated
  `drizzle/**` files.
- **PostToolUse (Write|Edit)** → `format-ts.mjs` runs prettier + eslint `--fix` on the
  touched `.ts/.js` file.
- **Stop** → `review-skills.mjs` runs after each task that changed `src/`, and asks Claude to
  review/update `.claude/rules/**`, `.claude/skills/**`, and memory (`MEMORY.md` + memory
  files) so they stay in sync with new or changed patterns/facts. Fires once per distinct
  `src/` change state (loop-safe: the review turn edits only skill/rule/memory files, not
  `src/`); the last-reviewed state is cached in `.claude/.cache/skill-review-state` (gitignored).
