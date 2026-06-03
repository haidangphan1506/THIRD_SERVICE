#!/usr/bin/env bash
# Run lint check + tests
set -euo pipefail

echo "=== Lint check ==="
bun run lint:check

echo "=== Format check ==="
bun run format:check

echo "=== Unit tests ==="
bun run test

echo "=== All checks passed ==="
