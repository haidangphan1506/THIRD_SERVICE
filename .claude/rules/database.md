# Rule: Database & migrations

- **Never hand-edit anything under `drizzle/`** — those SQL files and `meta/` are generated.
  (A PreToolUse hook blocks this.) Change the schema in `src/database/schema.ts` instead.
- After editing `src/database/schema.ts`, run `bun run db:generate` to emit a migration,
  then tell the user to run `bun run db:migrate` (or `bun run db:push` for dev). Do not run
  destructive DB commands automatically.
- All tables use UUID primary keys (`.defaultRandom()`), snake_case column names mapped from
  camelCase TS properties, and `created_at` / `updated_at` timestamps.
- Declare enums as `pgEnum('name', [...])` at the top of `schema.ts` before the tables use them.
