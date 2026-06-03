#!/usr/bin/env bash
# Full DB cycle: generate → migrate
set -euo pipefail

bun run db:generate
bun run db:migrate
