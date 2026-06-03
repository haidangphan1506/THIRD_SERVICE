---
description: Develop features, fix bugs, refactor code, or make edits
agent: dev
---

Develop the requested feature or fix according to the project conventions in AGENTS.md and the agent instructions.

1. Understand the request and explore relevant code (features, entities, schema).
2. Implement following NestJS patterns: module + controller + service + (optional repository).
3. Add Zod schemas + DTOs in `src/packages/entities/{domain}/`.
4. Register new modules in `src/app.module.ts`.
5. For DB changes: edit `src/database/schema.ts` → `bun run db:generate` → `bun run db:migrate`.
6. Run `bun run lint:check && bun run test` after changes.
7. Run `bun run format` separately (ESLint doesn't format).

Use `@packages/*` import alias for shared code; relative imports within features.
