#!/usr/bin/env bash
# Full dev environment setup
set -euo pipefail

echo "=== Installing dependencies ==="
npm install

echo "=== Starting databases ==="
bun run compose:up

echo "=== Copying env file ==="
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env — edit JWT secrets before running"
fi

echo "=== Running migrations ==="
bun run db:migrate

echo "=== Setup complete ==="
echo "Run: bun run start:dev"
