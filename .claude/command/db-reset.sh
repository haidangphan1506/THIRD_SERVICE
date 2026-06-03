#!/usr/bin/env bash
# Reset database: drop, recreate, migrate, seed
set -euo pipefail

echo "=== Dropping and recreating DB ==="
psql -h "${POSTGRES_HOST:-localhost}" -p "${POSTGRES_PORT:-5433}" -U "${POSTGRES_USER:-postgres}" -d postgres -c "DROP DATABASE IF EXISTS ${POSTGRES_DB:-backends_db};"
psql -h "${POSTGRES_HOST:-localhost}" -p "${POSTGRES_PORT:-5433}" -U "${POSTGRES_USER:-postgres}" -d postgres -c "CREATE DATABASE ${POSTGRES_DB:-backends_db};"

echo "=== Running migrations ==="
bun run db:migrate

echo "=== Seeding user ==="
bun run db:seed:user

echo "=== Done ==="
