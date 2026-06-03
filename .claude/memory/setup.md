# Setup

## Prerequisites

- **Bun** (runtime)
- **Docker** or **Podman** (for Postgres + Redis)
- **Node.js** (for npm — lockfile is npm's)

## First-time setup

```bash
# Install dependencies (npm, not bun install)
npm install

# Start databases
bun run compose:up

# Copy and configure env
cp .env.example .env
# Edit JWT_ACCESS_SECRET and JWT_REFRESH_SECRET (UUID v4)

# Apply migrations
bun run db:migrate

# Start dev server
bun run start:dev
# -> http://localhost:8888
```

## Environment

- Postgres on host port `5433` (not 5432)
- Redis on host port `6380` (not 6379)
- `.env` is gitignored — always use `.env.example` as template

## Quick verification

```bash
curl http://localhost:8888/  # Should return Hello World!
```
