# NestJS patterns

- Each feature = module + controller + service. Repository is optional.
- Always use `@Inject('DRIZZLE')` for DB access, never import Drizzle directly.
- New DTOs go in `src/packages/entities/{domain}/` as Zod schema + TS type files.
- Controllers use `ZodValidationPipe` on `@Body()` — never validate manually.
- Use `@Public()` to bypass global JWT guard on public endpoints.
- Use `@CurrentUser()` to extract user from JWT payload.
- Response message is set via `@ApiResponse({ statusCode, message })` on handlers.

## UUID + existence validation pattern (use consistently in all services)

```ts
if (!fieldId || !checkUuidValid({ data: fieldId })) {
  throw new BadRequestException('fieldId must be uuid ...');
}
const record = await this.userService.getUserByField({ field: 'id', value: fieldId });
if (Array.isArray(record) && record.length === 0) {
  throw new BadRequestException('Record not found ...');
}
```

- Use `checkUuidValid` from `@packages/helpers` for format check.
- Use `userService.getUserByField({ field: 'id', value: id })` to check user existence.
- Use the domain's own service (`getLessonByIdService`, etc.) to check other entity existence.
- For entities whose service `findById` requires extra params (e.g. `SessionService.findById` needs `tutorId`), inject the repository directly and call `repo.findById(id)` instead.
- Import the required module in the feature's `@Module({ imports: [...] })` to access its service.
