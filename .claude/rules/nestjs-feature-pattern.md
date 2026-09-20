# Rule: NestJS feature pattern (third-service)

There is **no single canonical reference feature** here — unlike `tutor-service`/`user`, this
repo has no `class`-style domain-CRUD feature. It has three genuinely different shapes; pick
whichever matches what you're building. (If you're about to scaffold a `class`/`schedule`-style
child-of-parent feature, stop — that pattern belongs in `tutor-service`, not here.)

## Shape 1 — full layered feature (`notification` is the only example)

`{name}.controller.ts` → `{name}.service.ts` → `{name}.repository.ts`, plus `{name}.module.ts`.
Use this when the feature owns a Postgres table.

- Controller: `@ApiTags`/`@ApiBearerAuth`, routes guarded by the global `JwtAuthGuard` (no
  `@Public()` on `notification`'s routes). Validates body/query with
  `new ZodValidationPipe<Dto>(schema)`, reads `@CurrentUser() user: JwtGuardUser`.
- Service: validates FK-shaped ids with `checkUuidValid` (see `createNotificationService`
  checking `senderId`/`classId`/`studentId`) and throws `BadRequestException`/`NotFoundException`
  — there is **no ownership check** (`row.tutorId !== userId`) pattern here, because
  notifications aren't owned by a single actor the way a `class` row is owned by a tutor. Also
  exposes an internal fire-and-forget method (`createInternal`) meant to be called from other
  in-process code without the validation/exception path — currently unused (nothing in this repo
  calls it yet; it's there for a future same-process caller, not a cross-repo one — a cross-repo
  caller would go through the RPC contract in `../.claude/rules/architecture.md` instead).
- Repository: plain `and()`/`eq()`/`ilike()`/`or()` conditions built inline (NOT
  `buildListWhereClause` — that helper isn't used in this repo). List method returns
  `{ data, pagination: { total, page, limit, totalPages } }` — note the key is `data`, not the
  resource name (`notifications`); this differs from `tutor-service`/`user`'s convention of
  naming the list key after the resource. Match this repo's own existing shape (`data`) for any
  new list endpoint here rather than importing the other convention.
- Module: `providers: [FooService, FooRepository]`, `exports: [FooService]`.

## Shape 2 — stateless service, no repository (`email`)

`{name}.controller.ts` → `{name}.service.ts` + `{name}.module.ts`. No repository, no Zod
entities under `src/packages/entities/` — the service wraps an external API (Resend) directly
and its methods take plain TS object params, not Zod-validated DTOs. `EmailController` currently
exposes only a `@Public()` test route; real send methods (`sendForgotPasswordMail`) are called
from service code, not routed through HTTP.

## Shape 3 — provider/interface, no repository, no entities (`uploads`)

`{name}.controller.ts` → `{name}.service.ts`, plus a `{name}.provider.ts` (an injectable
`Provider` token like `S3_CLIENT` built with a `useFactory`) and a `{name}.interface.ts` (plain
TS interfaces, not Zod). Use this shape for a feature that's a thin wrapper around one external
SDK client (S3-compatible storage, a payment SDK, etc.) with no request-body validation beyond
what `@nestjs/platform-express`'s `FileInterceptor`/Multer already does.

## Infra modules (`kafka`, `redis`)

Same as every other service: `@Global()` module, no repository, no controller (normally),
exported so any feature can inject it directly.

- `redis` — one `RedisService` owning the `ioredis` connection lifecycle
  (`OnModuleDestroy`), plus `RedisController` (HTTP, `GET /redis?key=`) and
  `RedisRpcController` (`@MessagePattern('redis.get'|'redis.set')` +
  `@EventPattern('redis.del')`) — both call the same unmodified `RedisService`.
- `kafka` — `KafkaModule` registers one `ClientKafka` (`Transport.KAFKA`) and exports
  `KafkaProducer`/`KafkaConsumer`. **RabbitMQ was fully removed 2026-09-19** (RMQ microservice
  listener, `third_queue`, and the old `RabbitMQModule`/`RabbitMQProducer`/`RabbitMQConsumer`
  pub/sub classes are all gone) — every `@MessagePattern`/`@EventPattern` in this service is
  reachable over Kafka only now. See `[[kafka-rpc-plumbing]]` memory.

## Hosting a Kafka RPC responder (the real, working example)

Every feature that used to have an RMQ `@MessagePattern` responder now has the same handler
reachable over Kafka instead — no code shape changed, only the transport. See
`RedisRpcController` (`src/features/redis/redis.rpc.controller.ts`): plain
`@MessagePattern('redis.get')`/`@MessagePattern('redis.set')`/`@EventPattern('redis.del')`
handlers delegating to `RedisService`, `@UseFilters(RpcExceptionFilter)` is applied globally to
the Kafka microservice in `main.ts` (not per-controller). Every topic a `*.rpc.controller.ts`
here hosts **must** also be listed in `KAFKA_SERVER_TOPICS`
(`src/features/kafka/kafka.constants.ts`) — `ensureKafkaTopics()` (`main.ts`, before
`NestFactory.create()`) pre-creates every topic in `ALL_KAFKA_TOPICS` on the broker, and
`ServerKafka` only binds listeners for topics it knows about at `startAllMicroservices()`.
`redis.get`/`redis.set`/`redis.del` are **generic KV topics** other services already reuse for
their own needs (e.g. `user`'s `AuthService` stores reset-password tokens and, as of a recent
session, a login-session record keyed by login timestamp — see `[[kafka-rpc-plumbing]]` memory)
— don't assume a payload arriving on these topics is about this repo's own domain.

If a feature here ever needs to **call out** to another service (not just respond), inject
`KafkaProducer` (exported globally by `KafkaModule`, no import needed) and use
`.send(topic, payload)` (request-reply, register the topic in `KAFKA_REQUEST_TOPICS` too) or
`.emit(topic, payload)` (fire-and-forget, for an `@EventPattern` topic on the other side).
`KAFKA_REQUEST_TOPICS` is empty today — this repo currently only responds, it doesn't call out.

## General

- **Error messages**: `ERROR_MESSAGES` constants from `src/data/constants/error.constant.ts`
  (see `NotificationService` using `ERROR_MESSAGES.NOTIFICATION_NOT_FOUND` etc.) — never
  hardcode strings in exceptions.
- **Register** every new module in `src/app.module.ts` `imports: [...]`.
- **Route names are plural** where the feature is resource-shaped (`@Controller('notifications')`);
  `upload`/`emails` don't follow a resource-plural convention since they aren't CRUD resources.
