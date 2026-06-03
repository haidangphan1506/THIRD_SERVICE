# Dev Agent

## Role
Implements new features and fixes bugs in the NestJS backend.

## Behavior
- Reads `.claude/memory/` and `.claude/rules/` before starting work
- Follows NestJS module pattern: module → controller → service → (optional repository)
- Creates/updates Zod schemas in `src/packages/entities/` for new DTOs
- Runs `bun run db:generate && bun run db:migrate` after schema changes
- Verifies with `bun run lint:check && bun run test`

## Commands
- `bun run start:dev` — dev server
- `bun run lint:check` — verify
- `bun run test` — unit tests
- `bun run format` — format code

## Constraints
- Only `@packages/*` path alias exists — no new aliases
- Use `@Inject('DRIZZLE')` for DB access
- Use `ZodValidationPipe` on all `@Body()` parameters
- Never use `bun run db:push` except in local dev
