---
description: Quick reference for all developer commands.
---

# Commands Reference

## Dev Server
| Command | What |
|---------|------|
| `bun run start:dev` | Dev server with --watch on :8888 |
| `bun run start:debug` | Dev + debug + watch |
| `bun run build` | `nest build` → dist/ |
| `bun run start:prod` | Run compiled JS via tsconfig-paths |

## Lint & Format
| Command | What |
|---------|------|
| `bun run lint` | ESLint + fix (type-checked, slow first run) |
| `bun run lint:check` | ESLint no fix |
| `bun run format` | Prettier write |
| `bun run format:check` | Prettier check |

Run format separately — ESLint does NOT check Prettier.

## Testing
| Command | Runner | What |
|---------|--------|------|
| `bun run test` | Jest | Unit tests (`src/**/*.spec.ts`) |
| `bun run test:unit` | Bun test | Bun runner on `test/` (confusing name) |
| `bun run test:e2e` | Jest | E2E tests (`test/*.e2e-spec.ts`) |
| `bun run test:cov` | c8 + Bun test | Coverage report |
| `bun run test:ci` | c8 + Bun test | Coverage with lcov |

## Database
| Command | What |
|---------|------|
| `bun run db:generate` | Generate migration from schema |
| `bun run db:migrate` | Apply pending migrations |
| `bun run db:push` | Push schema directly (dev only) |
| `bun run db:studio` | Open Drizzle Studio |
| `bun run db:seed:user` | Seed single user (Bun script) |
| `bun run db:seed:users-bulk` | Bulk seed users (Bun script) |

## Docker
| Command | What |
|---------|------|
| `bun run compose:up` | docker compose up -d (Postgres + Redis) |
| `bun run compose:down` | docker compose down |
| `bun run podman:up` | podman compose up -d |
| `bun run podman:down` | podman compose down |
| `bun run podman:logs` | podman compose logs -f postgres |
