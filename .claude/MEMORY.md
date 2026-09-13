# Backend Memory — third-service (infra/utility microservice)

## Project Structure

```
third-service/
├── src/
│   ├── main.ts                    # Bootstrap: CORS, interceptors, filters, RMQ listener (third_queue), listen (port 8888)
│   ├── app.module.ts              # Root module
│   ├── app.controller.ts          # Health-check controller (+ /rmq pub/sub demo route)
│   ├── app.service.ts             # Health check + subscribes health.check and auth.login.session (from `user`)
│   ├── database/
│   │   ├── database.module.ts     # Global Drizzle ORM provider (postgres.js)
│   │   └── schema.ts              # Mostly vestigial — see database.md; only `notifications`+`users` are used
│   ├── features/                  # 5 modules — NOT a class/schedule/session domain (that's tutor-service)
│   │   ├── email/                 # Stateless service wrapping Resend, no repository; + email.rpc.controller.ts
│   │   ├── notification/          # Full controller→service→repository→module, Postgres-backed;
│   │   │                          # + notification.rpc.controller.ts; NotificationModule is registered
│   │   ├── uploads/                # Provider/interface pattern, Cloudflare R2 (S3-compatible) + Sharp;
│   │   │                           # + upload.rpc.controller.ts
│   │   ├── redis/                  # Redis service wrapper (ioredis); + redis.rpc.controller.ts
│   │   └── rabbitmq/                # Pub/sub (amqplib) — RabbitMQProducer/Consumer
│   └── packages/                  # Shared utilities
│       ├── decorators/            # @ApiResponse, @Public, @CurrentUser, @Roles
│       ├── entities/
│       │   └── notification/      # The only Zod schema/DTO domain in this repo
│       ├── filters/                # HttpExceptionFilter (global) + RpcExceptionFilter (per-controller,
│       │                           # bound on each *.rpc.controller.ts)
│       ├── guards/                 # JwtAuthGuard, RolesGuard, AdminRoleGuard, LanguageGuard, TokenBucketGuard
│       ├── helpers/                 # checkUuidValid, validateRequiredEnvs, etc.
│       ├── interceptor/             # ResponseInterceptor, ErrorInterceptor, LoggerInterceptor
│       ├── interfaces/               # SendMailOptions, ApiResponseInterface
│       └── pipes/                    # ZodValidationPipe
├── drizzle/                       # 5 generated SQL migrations (reflect the full vestigial schema)
└── test/                          # Jest + Supertest tests
```

## Feature Shapes (there is no single canonical pattern — see nestjs-feature-pattern.md)

1. **Full layered** (`notification` only): `{name}.controller.ts` → `{name}.service.ts` →
   `{name}.repository.ts` + `{name}.module.ts`.
2. **Stateless service** (`email`): controller + service, no repository, no Zod entities.
3. **Provider/interface** (`uploads`): service + `.provider.ts` (external SDK client factory) +
   `.interface.ts` (plain TS interfaces), no repository, no Zod entities.

## Entity / DTO Pattern

Only `notification` has one, under `src/packages/entities/notification/`:
- `notification.schema.ts` — Zod validation schemas
- `notification.dto.ts` — TypeScript types derived from schemas
- `index.ts` — Re-exports everything

## Request/Response Flow

1. Request → global guards: `JwtAuthGuard` (unless `@Public()`), `LanguageGuard`, `TokenBucketGuard`
2. Controller validates body via `ZodValidationPipe` (only `notification` has schemas)
3. Service → (Repository → Drizzle ORM → PostgreSQL, `notification` only)
4. `ResponseInterceptor` wraps response: `{ statusCode, message, data, timestamp, method, path }`
5. Errors handled by `ErrorInterceptor` + `HttpExceptionFilter`

## Cross-service RabbitMQ

- **Pub/sub consumer** (working reference): `AppService.onModuleInit` subscribes `health.check`
  and `auth.login.session` (published by `user` on login; cached into Redis here).
- **RPC**: `main.ts` binds an RMQ microservice listener to `third_queue`, and `gateway` reaches
  it via its `THIRD_SERVICE` client token. All 4 features have a `@MessagePattern` responder
  now (`email`/`notification`/`upload`/`redis` `.rpc.controller.ts`), each
  `@UseFilters(RpcExceptionFilter)` delegating to the same `*Service` its HTTP controller uses.
  See `../.claude/rules/architecture.md` for the contract and the `add-rpc-endpoint` skill (one
  level up) for adding a new pattern.

## Key Files

- `src/main.ts` — Bootstrap, RMQ listener setup, Swagger tags (stale, see conventions.md)
- `src/app.service.ts` — Reference RabbitMQ pub/sub consumer implementation
- `src/features/notification/*` — Reference for the full layered feature shape
- `src/features/uploads/upload.provider.ts` — S3Client factory for Cloudflare R2
- `src/features/email/email.service.ts` — Resend wrapper
- `src/database/database.module.ts` — Global DB provider (DRIZZLE token)

## Commands

```bash
bun start:dev / start:debug / run build / run start:prod
bun run lint / lint:check / format / format:check
bun run test / test:watch / test:cov / test:e2e / test:debug   # Jest only, no Bun-native test runner
bun run db:generate / db:migrate / db:push / db:studio
bun compose:up / compose:down / podman:up / podman:down
```

## Environment Variables

See `CLAUDE.md`'s Environment Variables table for the full, current list (Postgres, Redis,
RabbitMQ + `THIRD_QUEUE`, `RESEND_API_KEY`/`MAIL_FROM`/`PASSWORD_RESET_URL_BASE`,
`CLOUDFLARE_R2_*`, plus JWT verification vars shared with `user`). Several OAuth-related vars
(`GOOGLE_*`, `FACEBOOK_*`, `BACKEND_URL`) are read by shared `@packages` code but not wired to
any actual route in this repo.

## Code Conventions

- **Path Alias**: `@packages/*` → `src/packages/*`
- **Prettier/ESLint**: single quotes, trailing commas, 100-char width, semicolons (auto-applied
  by a PostToolUse hook)
- **List response shape**: `{ data, pagination }` — key is `data`, not the resource name (this
  repo's own convention, differs from `tutor-service`/`user`)
- **No `buildListWhereClause`** — list queries build `and()`/`eq()`/`ilike()` conditions inline

## Testing

- **One test runner: Jest.** No Bun-native test runner exists in this repo — every test script
  in `package.json` shells out to `jest`.
- Unit tests: `*.spec.ts`. E2E tests: `*.e2e-spec.ts` (Jest + Supertest). Both in `test/`.

## Available Skills

- `generate-feature` — Orchestrates the layer skills below (with a check for which of the 3
  feature shapes actually applies before scaffolding a full 4-layer feature)
- `generate-controller`, `generate-service`, `generate-repository`, `generate-entity`,
  `generate-module` — Per-layer skills, now referencing `notification` (not `class`, which
  doesn't exist in this repo) as the canonical full-layer example
- `generate-db-table` — Generate a Drizzle table, with a warning about the vestigial tables
  already in `schema.ts`

## Available Agents

- `dev.md` — Development agent (aware of the 3 feature shapes)
- `review.md` — Code review agent
- `security.md` — Security review agent (file-upload safety, RMQ payload trust)
- `test.md` — Test agent (Jest only)

## Rules

- `conventions.md` — What's specific to this repo (list-response `data` key, unused helpers,
  stale Swagger tags, unused `cloudinary` dep) — points to `../.claude/rules/shared-conventions.md`
  for the cross-service baseline
- `database.md` — **Read this before touching `schema.ts`** — most of it is vestigial
- `nestjs-feature-pattern.md` — The 3 real feature shapes + the RabbitMQ pub/sub consumer pattern

Cross-service rules (RPC contract, shared conventions) live one level up in `api/.claude/rules/`.

## Selective File Reading Guideline (IMPORTANT)

**Do NOT read entire source code.** Only read files necessary for the task — see `CLAUDE.md`'s
"IMPORTANT: Selective File Reading" section for the full breakdown.
