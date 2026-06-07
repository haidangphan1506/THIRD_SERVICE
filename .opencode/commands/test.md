---
description: Write or fix unit tests, run test suites
agent: test
---

Write or fix unit tests for the given code following the project conventions.

1. Place unit tests co-located with source as `*.spec.ts` (Jest).
2. Use `@nestjs/testing` `Test.createTestingModule` for module isolation.
3. Mock `'DRIZZLE'` provider with `useValue` when testing services.
4. Run `bun run test` after writing/editing tests.
5. Run `bun run test:cov` to check coverage if requested.
6. Report coverage and any failures.

Cover: happy paths, edge cases, error states.
