# Testing rules

- Write new unit tests as `*.spec.ts` co-located with source (Jest runner).
- E2E tests go in `test/` as `*.e2e-spec.ts` (Jest + Supertest).
- No DB fixtures exist. E2E tests only test the health endpoint currently.
- Use `bun run test` for Jest unit tests, `bun run test:unit` for Bun test runner.
- After writing code, run `bun run lint:check && bun run test` to verify.
