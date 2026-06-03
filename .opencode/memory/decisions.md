---
description: Log of key technical decisions and their rationale.
---

# Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06 | Single Drizzle schema file (`schema.ts`) | Simpler than splitting across features; all relationships visible in one place |
| 2026-06 | String token `'DRIZZLE'` over class token | Avoids circular deps, cleaner NestJS provider registration |
| 2026-06 | Global JWT guard via `APP_GUARD` | Security by default — opt out with `@Public()` instead of opt in |
| 2026-06 | Repository pattern optional | Keep simple CRUD in services; extract repository only when query logic grows |
| 2026-06 | Zod v4 over class-validator | TypeScript-first, no decorators, better type inference, lighter |
| 2026-06 | `@packages/*` single alias | Avoids alias proliferation; one clear boundary between shared and feature code |
| 2026-06 | Dual lockfile (bun.lock + package-lock.json) | Bun for runtime, npm for CI compatibility |
| 2026-06 | Postgres 5433 / Redis 6380 ports | Avoids conflict with local services on default ports |
