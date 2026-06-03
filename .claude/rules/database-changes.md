# Database change rules

1. Edit `src/database/schema.ts` only (single schema file).
2. Run `bun run db:generate` to produce migration in `drizzle/`.
3. Run `bun run db:migrate` to apply it.
4. Never use `bun run db:push` except in local dev — it skips review.
5. New tables need a corresponding feature module + entity files in `src/packages/entities/`.
