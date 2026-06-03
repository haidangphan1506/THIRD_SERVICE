# Architecture

Single NestJS 11 app (not monorepo). Entry: `src/main.ts`.

## Module tree

```
AppModule
├── ConfigModule (global)
├── DatabaseModule  →  provides 'DRIZZLE' (drizzle-orm + postgres.js)
├── MailerModule
├── RedisModule
├── AuthModule  (auth.controller, auth.service - no repository)
├── UserModule  (user.controller, user.service - no repository)
├── CategoryModule  (controller, service, repository)
├── WalletModule    (controller, service, repository)
├── TransactionModule (controller, service, repository)
└── EmailModule
```

## Request flow

1. Request → `JwtAuthGuard` (global, via APP_GUARD)
2. If `@Public()` on handler → skip JWT
3. Controller validates body via `ZodValidationPipe`
4. Service → (optional Repository) → Drizzle ORM → PostgreSQL
5. `ResponseInterceptor` wraps response
6. Errors → `ErrorInterceptor` + `HttpExceptionFilter`

## Feature pattern

```
src/features/{name}/
├── {name}.module.ts
├── {name}.controller.ts
├── {name}.service.ts
└── {name}.repository.ts  (optional)
```

## Shared packages (`@packages/*`)

```
src/packages/
├── configs/        (jwt-sign.config.ts)
├── decorators/     (@Public, @ApiResponse, @CurrentUser)
├── entities/       (Zod schemas + DTOs per domain)
├── filters/        (HttpExceptionFilter)
├── guards/         (JwtAuthGuard, AdminRoleGuard)
├── helpers/        (hashing, JWT, query list)
├── interceptor/    (Response, Error, Logger)
├── interfaces/     (ApiResponseInterface, UserInterface)
├── pipes/          (ZodValidationPipe)
└── strategy/       (JwtUserStrategy)
```
