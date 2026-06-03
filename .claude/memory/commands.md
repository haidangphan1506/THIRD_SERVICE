# Commands reference

## Dev server

| Command | What |
|---|---|
| `bun run start:dev` | Dev with --watch on :8888 |
| `bun run start:debug` | Dev + debug + watch |
| `bun run build` | Production build |
| `bun run start:prod` | Run compiled JS |

## Lint & Format

| Command | What |
|---|---|
| `bun run lint` | ESLint + fix (type-checked, slow first run) |
| `bun run lint:check` | ESLint no fix |
| `bun run format` | Prettier write |
| `bun run format:check` | Prettier check |

Run `format` separately — ESLint does NOT check Prettier.

## Testing

| Command | Runner | What |
|---|---|---|
| `bun run test` | Jest | Unit tests (src/**/*.spec.ts) |
| `bun run test:unit` | Bun test | Alternative unit runner |
| `bun run test:e2e` | Jest | E2E tests (test/*.e2e-spec.ts) |
| `bun run test:cov` | c8 + Bun test | Coverage report |
| `bun run test:watch` | Jest | Watch mode |

## Database

| Command | What |
|---|---|
| `bun run db:generate` | Generate migration from schema |
| `bun run db:migrate` | Apply pending migrations |
| `bun run db:push` | Push schema directly (dev only) |
| `bun run db:studio` | Drizzle Studio |
| `bun run db:seed:user` | Seed single user |
| `bun run db:seed:users-bulk` | Bulk seed users |

## Docker

| Command | What |
|---|---|
| `bun run compose:up` | docker compose up -d |
| `bun run compose:down` | docker compose down |
| `bun run podman:up` | podman compose up -d |
| `bun run podman:down` | podman compose down |
| `bun run podman:logs` | podman compose logs -f postgres |
