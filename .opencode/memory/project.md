---
description: Project memory — architecture, decisions, and conventions for the backends NestJS API.
---

# Project Memory

## Architecture
- **Framework**: NestJS 11 with TypeScript 5
- **Database**: PostgreSQL 16 + Drizzle ORM (postgres.js driver)
- **Cache**: Redis 7 (ioredis)
- **Auth**: Passport JWT (access + refresh tokens)
- **Validation**: Zod v4 via custom `ZodValidationPipe`
- **Email**: Nodemailer
- **API Docs**: @nestjs/swagger
- **Runtime**: Bun / npm (dual lockfile)

## Key Decisions
- Single schema file (`src/database/schema.ts`) — all tables in one place
- Global JWT guard via `APP_GUARD` — opt out with `@Public()`
- `'DRIZZLE'` string token for DB injection (not class token)
- Repository pattern optional — only for non-trivial queries
- Zod schemas and DTOs in `src/packages/entities/{domain}/` per domain

## Agents
- `dev` — coding agent with full permissions. Follows NestJS module pattern: schema → entity → module/controller/service/repository. Handles DB migrations.
- `test` — creates Jest unit tests in `src/` and E2E tests in `test/`, reports failures.
- `code-reviewer` — read-only review. Checks types, lint, NestJS patterns, conventions, DB changes, tests.

## Current Focus
- REST API for finance tracker (personal income/expense)
- Drizzle ORM with PostgreSQL
- JWT authentication with refresh tokens
