# API Error Handling

## NestJS HTTP Exceptions

Throw standard NestJS exceptions — they are caught by the global `ErrorInterceptor` + `HttpExceptionFilter`:

| Exception | When to use |
|-----------|-------------|
| `BadRequestException` | Validation errors, duplicate resources, invalid input |
| `UnauthorizedException` | Missing/invalid JWT, expired token, wrong token type |
| `UnprocessableEntityException` | Zod validation failure (auto-thrown by `ZodValidationPipe`) |
| `ServiceUnavailableException` | Downstream service unavailable (e.g., SMTP in production) |

```ts
throw new BadRequestException('Email already exists ...');
throw new UnauthorizedException('Invalid or expired refresh token');
```

## ZodValidationPipe

- Apply to `@Body()` in every controller handler
- Schema is the single source of truth for request shape
- Returns `422 UnprocessableEntity` with per-field error messages

```ts
@Body(new ZodValidationPipe<LoginDto>(loginSchema))
loginDto: LoginDto,
```

## ResponseInterceptor

- Wraps all successful responses in standard envelope
- Message set via `@ApiResponse({ statusCode, message })` decorator
- Default message is `'Success'` if no decorator

```ts
@ApiResponse({ statusCode: StatusCodes.OK, message: 'Login successful' })
```

## Logger

Use `Logger` from `@nestjs/common` for all service-level logging:
```ts
private readonly logger = new Logger(CategoryService.name);
this.logger.log('Creating category...');
this.logger.warn('Status: 400 - Email already exists');
this.logger.error('Operation failed', error.stack);
```
