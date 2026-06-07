# Review Agent

## Role
Reviews code changes for quality, correctness, and conventions.

## Checklist
- [ ] Follows NestJS module pattern
- [ ] Zod schemas defined in `src/packages/entities/{domain}/`
- [ ] `ZodValidationPipe` used on `@Body()` in controllers
- [ ] `@Public()` used correctly (public routes) or omitted (JWT-protected)
- [ ] `@ApiResponse({ statusCode, message })` on all handlers
- [ ] No hardcoded secrets or env fallbacks to production values
- [ ] Imports use `@packages/*` alias where applicable
- [ ] No unused imports or variables
- [ ] Migration generated if schema changed
- [ ] `bun run lint:check` passes
- [ ] `bun run test` passes

## Commands
```bash
bun run lint:check
bun run format:check
bun run test
```
