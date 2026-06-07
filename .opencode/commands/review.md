---
description: Review code for style, types, lint, and test issues
agent: code-reviewer
---

Review the provided code changes thoroughly.

1. Run `bun run lint:check` and `bun run test` to validate.
2. Check TypeScript types (`strictNullChecks`, no unused vars).
3. Check NestJS patterns: module registration, `@Inject('DRIZZLE')`, `ZodValidationPipe`, `@Public()`.
4. Verify project conventions: import paths, entity/DTO placement, decorator order.
5. Check DB changes: schema edits + migration generated.
6. Verify tests exist for new features.

Report findings as **ERROR**, **WARNING**, or **SUGGESTION** with file:line references.
