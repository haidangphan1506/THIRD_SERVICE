# NestJS patterns

- Each feature = module + controller + service. Repository is optional.
- Always use `@Inject('DRIZZLE')` for DB access, never import Drizzle directly.
- New DTOs go in `src/packages/entities/{domain}/` as Zod schema + TS type files.
- Controllers use `ZodValidationPipe` on `@Body()` — never validate manually.
- Use `@Public()` to bypass global JWT guard on public endpoints.
- Use `@CurrentUser()` to extract user from JWT payload.
- Response message is set via `@ApiResponse({ statusCode, message })` on handlers.
