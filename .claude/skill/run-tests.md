# Run tests

Use this skill to run the correct test suite.

## Which runner?

| Situation | Command |
|---|---|
| Unit tests (existing `*.spec.ts`) | `bun run test` (Jest) |
| New unit test files | Write as `*.spec.ts`, use Jest |
| Alternative unit runner | `bun run test:unit` (Bun test) |
| E2E tests | `bun run test:e2e` (Jest + Supertest) |
| Coverage | `bun run test:cov` (c8 + Bun) |
| Single file | `npx jest --testPathPattern="auth.service.spec"` |
| Watch mode | `bun run test:watch` |

## Notes

- Jest config is inline in `package.json` (rootDir: `src`)
- E2E config: `test/jest-e2e.json`
- No test DB fixtures exist yet
