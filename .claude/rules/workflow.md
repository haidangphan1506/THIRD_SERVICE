# Workflow rules

1. Read `.claude/memory/` files first to understand project context.
2. Check `.env.example` before creating or modifying env vars.
3. Verify with `bun run lint:check` and relevant tests after making changes.
4. Run `bun run format` separately — ESLint doesn't check formatting.
5. Commit directly — no branch/PR conventions exist.
