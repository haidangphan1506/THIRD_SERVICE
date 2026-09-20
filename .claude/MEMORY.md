# Backend Memory — third-service (infra/utility microservice)

## Project Structure

```
third-service/
├── src/
│   ├── main.ts                    # Bootstrap: ensureKafkaTopics() pre-create, Kafka microservice
│   │                              # (deferred init, its own RpcExceptionFilter/TraceContextInterceptor),
│   │                              # CORS, HTTP interceptors/filters, listen (port 8888)
│   ├── app.module.ts              # Root module
│   ├── app.controller.ts          # Health-check controller only
│   ├── app.service.ts             # Health check only — the old RabbitMQ pub/sub consumer
│   │                              # (health.check / auth.login.session) was removed 2026-09-19,
│   │                              # see "Kafka RPC Plumbing" below
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
│   │   │                           # (generic redis.get/set/del — reused by `user` for session
│   │   │                           # + reset-token storage, see "Kafka RPC Plumbing" below)
│   │   └── kafka/                   # KafkaProducer (send/emit + trace headers, though
│   │                                # KAFKA_REQUEST_TOPICS is empty — this repo only responds
│   │                                # today) + kafka.constants.ts topic lists + kafka.admin.ts
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

## Kafka RPC Plumbing

Referenced elsewhere as `[[kafka-rpc-plumbing]]`. **RabbitMQ was fully removed 2026-09-19**
(commit-adjacent to `user`'s own Kafka migration) — the RMQ microservice listener
(`third_queue`), the hand-rolled `RabbitMQModule`/`RabbitMQProducer`/`RabbitMQConsumer` classes,
and `AppService`'s `health.check`/`auth.login.session` pub/sub subscriptions are all gone.
Nothing published to either routing key by the time this was removed (same dead-weight
situation `tutor-service` was in), and this dev environment doesn't run a RabbitMQ broker at
all — `docker-compose.yml` here still defines a `rabbitmq` service, but it's unused now (a
Kafka broker runs separately, outside this repo's compose file, at `localhost:9092`).

- **RPC**: All 4 features have a Kafka `@MessagePattern`/`@EventPattern` responder
  (`email`/`notification`/`upload`/`redis` `*.rpc.controller.ts`), reached by any of the other 3
  services' `KafkaProducer`. `RpcExceptionFilter` is applied globally to the Kafka microservice
  in `main.ts` (not per-controller despite older comments saying so). Every topic a responder
  hosts must be listed in `KAFKA_SERVER_TOPICS` (`src/features/kafka/kafka.constants.ts`) —
  `ensureKafkaTopics()` (`kafka.admin.ts`), called in `main.ts` before `NestFactory.create()`,
  pre-creates every topic in `ALL_KAFKA_TOPICS` since Kafka's broker-side auto-create is racy.
  `KAFKA_REQUEST_TOPICS` is currently empty — this repo only responds, it doesn't call out to
  other services yet (though `KafkaProducer.send()`/`.emit()` exist and are ready to use).
- **The generic `redis.get`/`redis.set`/`redis.del` topics are this repo's most-reused surface**:
  `user`'s `AuthService` already calls them for two things — reset-password token storage
  (`reset-password:<jti>`) and, as of a recent session, a fire-and-forget login-session record
  per successful login (`session:<loginAt ms-epoch>` → the raw refreshToken JWT, TTL = the
  refresh token's own lifetime). This is the *replacement* for the old
  `auth.login.session`-over-RabbitMQ flow CLAUDE.md still describes — the mechanism changed
  (Kafka request via a generic KV topic, not a dedicated pub/sub routing key) but the practical
  effect (`user` logins land a Redis-cached session here) is the same intent.
  See `../.claude/rules/architecture.md` for the RPC contract and the `add-rpc-endpoint` skill
  (one level up) for adding a new pattern.

## Key Files

- `src/main.ts` — Bootstrap, Kafka microservice setup, Swagger tags (stale, see conventions.md)
- `src/features/redis/redis.rpc.controller.ts` — The generic Kafka KV surface other services
  reuse most (see "Kafka RPC Plumbing" above)
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

`KAFKA_CLIENT_ID`/`KAFKA_BROKERS`/`KAFKA_GROUP_ID` (defaults `third-service`/`localhost:9092`/
`third-service`) replaced `RABBITMQ_URL`/`RABBITMQ_EXCHANGE`/`THIRD_QUEUE` — those RabbitMQ vars
are no longer read anywhere in `src/` (CLAUDE.md's table still lists them; stale as of the
2026-09-19 removal, see "Kafka RPC Plumbing" above). Otherwise see `CLAUDE.md`'s Environment
Variables table for the full list (Postgres, Redis, `RESEND_API_KEY`/`MAIL_FROM`/
`PASSWORD_RESET_URL_BASE`, `CLOUDFLARE_R2_*`, plus JWT verification vars shared with `user`).
Several OAuth-related vars (`GOOGLE_*`, `FACEBOOK_*`, `BACKEND_URL`) are read by shared
`@packages` code but not wired to any actual route in this repo.

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
- `security.md` — Security review agent (file-upload safety, Kafka payload trust)
- `test.md` — Test agent (Jest only)

## Rules

- `conventions.md` — What's specific to this repo (list-response `data` key, unused helpers,
  stale Swagger tags, unused `cloudinary` dep) — points to `../.claude/rules/shared-conventions.md`
  for the cross-service baseline
- `database.md` — **Read this before touching `schema.ts`** — most of it is vestigial
- `nestjs-feature-pattern.md` — The 3 real feature shapes + the Kafka RPC responder pattern

Cross-service rules (RPC contract, shared conventions) live one level up in `api/.claude/rules/`.

## Selective File Reading Guideline (IMPORTANT)

**Do NOT read entire source code.** Only read files necessary for the task — see `CLAUDE.md`'s
"IMPORTANT: Selective File Reading" section for the full breakdown.
