#!/usr/bin/env bash
# Quick test a single file
set -euo pipefail

if [ $# -eq 0 ]; then
  echo "Usage: quick-test.sh <pattern>"
  echo "Example: quick-test.sh auth.service"
  exit 1
fi

npx jest --testPathPattern="$1"
