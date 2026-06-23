---
description: Project memory — architecture, decisions, and conventions for the backends NestJS API.
---

# Project Memory

## Architecture
- **Framework**: NestJS 11 with TypeScript 5 (`strictNullChecks: true`, `noImplicitAny: false`)
- **Database**: PostgreSQL 16 + Drizzle ORM (postgres.js driver)
- **Cache**: Redis 7 (ioredis)
- **Auth**: JWT access + refresh tokens via global `APP_GUARD`
- **Validation**: Zod v4 via custom `ZodValidationPipe`
- **Email**: Nodemailer (`@nestjs-modules/mailer`)
- **API Docs**: `@nestjs/swagger`
- **Runtime**: Bun (dev) / npm (CI) — dual lockfile
- **Test**: Jest 29 (all test commands)

## Key Decisions
- Single schema file (`src/database/schema.ts`) — all tables in one place
- Global JWT guard via `APP_GUARD` — opt out with `@Public()`
- `'DRIZZLE'` string token for DB injection (not class token)
- Repository pattern optional — only for non-trivial queries
- Zod schemas and DTOs in `src/packages/entities/{domain}/` per domain
- `@packages/*` single path alias (no others)

## Agents
- `dev` — coding agent with full permissions. Follows NestJS module pattern: schema → entity → module/controller/service/repository. Handles DB migrations.
- `test` — creates Jest unit tests co-located as `*.spec.ts`, E2E tests in `test/`, reports failures.
- `code-reviewer` — read-only review. Checks types, lint, NestJS patterns, conventions, DB changes, tests.
- `fixbug` — debug agent. Reproduces errors, traces stack, applies minimal fix, verifies with lint+test.

## Current Features
| Feature | Status | Notable |
|---------|--------|---------|
| Auth (register, login, refresh, forgot/reset password) | Done | JWT access + refresh, Redis token store |
| User CRUD | Done | Admin user management |
| Category CRUD | Done | Hierarchical (parentId), INCOME/EXPENSE |
| Wallet CRUD | Done | With repository, unique (userId, name), balance |
| Transaction CRUD | Done | With balance math, wallet balance update |
| Report (summary, by-category, trend, by-wallet) | Done | Aggregate SQL |
| Presence (real-time online/offline) | Planned | Socket.io + Redis, admin broadcast |
| Email (forgot password) | Done | Nodemailer, dev fallback to console log |
| Redis service | Done | Wraps ioredis, used for token store |

## Drizzle enums (actual)
| Enum | Values |
|------|--------|
| `user_role` | STUDENT, ADMIN, TUTOR, PARENT |
| `category_type` | INCOME, EXPENSE |
| `wallet_type` | CASH, BANK, E_WALLET, CREDIT |
| `transaction_type` | INCOME, EXPENSE |
| `transaction_status` | PENDING, COMPLETED, CANCELLED |
