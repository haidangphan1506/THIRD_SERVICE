---
description: Build a new feature module (schema → entities → module → tests)
agent: feature-builder
---

Build the requested feature following project conventions.

1. Start by reading `src/database/schema.ts`, `src/packages/entities/index.ts`, `src/app.module.ts`, `src/data/constants/messages.constant.ts`.
2. Pick closest existing feature (category/wallet/transaction) as template.
3. Generate all 7 layers: DB table → Zod schema → DTO → barrel export → messages → module/controller/service/repository → app.module registration.
4. Add tests in `test/` mirroring existing spec patterns.
5. Run `bun run lint:check && bun run test` after.
