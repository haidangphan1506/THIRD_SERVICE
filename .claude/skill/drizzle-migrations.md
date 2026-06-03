# Drizzle migrations

Use this skill when creating or modifying database schema.

## Steps

1. Edit `src/database/schema.ts`
2. Run `bun run db:generate` — creates migration file in `drizzle/`
3. Review the generated SQL in `drizzle/`
4. Run `bun run db:migrate` — applies to database
5. If entity files need updating, modify `src/packages/entities/{domain}/`

## Commands

```bash
bun run db:generate
bun run db:migrate
# Dev only, skip review:
bun run db:push
```
