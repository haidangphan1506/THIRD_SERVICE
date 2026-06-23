# API Error Handling

## NestJS HTTP Exceptions

Throw standard NestJS exceptions — they are caught by the global `ErrorInterceptor` + `HttpExceptionFilter`:

| Exception | When to use |
|-----------|-------------|
| `BadRequestException` | Validation errors, duplicate resources, invalid input, unsupported query fields |
| `ConflictException` | Duplicate resource (e.g., wallet name, email, username) |
| `UnauthorizedException` | Missing/invalid JWT, expired token, wrong token type |
| `UnprocessableEntityException` | Zod validation failure (auto-thrown by `ZodValidationPipe`) |
| `ServiceUnavailableException` | Downstream service unavailable (e.g., SMTP in production) |

```ts
throw new BadRequestException('Email already exists ...');
throw new UnauthorizedException('Invalid or expired refresh token');
```

## UUID assertion pattern

Always validate UUID format before DB lookup to avoid confusing errors:

```ts
export const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (!id || !UUID_V4_REGEX.test(id)) {
  throw new NotFoundException(ERROR_MESSAGES.USER_ID_NOT_FOUND);
}
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
