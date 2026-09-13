---
name: generate-db-table
description: Add a Drizzle table (and any pgEnum) to src/database/schema.ts for a new domain owned by this service, then generate the migration. Use when asked to create/add a database table, schema, column, or enum in this NestJS infra/utility backend.
---

# Generate Drizzle Table

Add a `pgTable` (and needed `pgEnum`s) to `src/database/schema.ts`, following the style of the
`notifications` table (this repo's only real, actively-queried table alongside `users`).

**Before adding a table, read `.claude/rules/database.md`** — `schema.ts` already contains a
large set of vestigial education-domain tables (`classes`, `sessions`, `curriculums`, etc.)
copied from `tutor-service` that this repo doesn't actually query. Don't use those as your style
reference and don't assume a table existing in this file means this repo owns that domain.

## Inputs
- Table name (plural, snake_case), e.g. `webhook_logs`.
- Columns with types, nullability, defaults, foreign keys, and any enum values.

## Conventions
- UUID primary key: `id: uuid('id').defaultRandom().primaryKey()`.
- Enums declared at top of file: `export const fooStatusEnum = pgEnum('foo_status', ['A', 'B']);`
  then used as `.status: fooStatusEnum('status').notNull()`.
- Foreign keys: `userId: uuid('user_id').references(() => users.id, { onDelete: '...' })`
  (see `notifications.userId`/`senderId`/`classId`/`studentId` for the optional-FK style —
  `.references(...)` without `.notNull()` when the relation is optional).
- Timestamps:
  ```ts
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
  ```
- Map camelCase TS property → snake_case column name.

## After editing schema.ts
1. Run `bun run db:generate` to emit the migration SQL into `drizzle/`.
2. Tell the user to run `bun run db:migrate` (or `bun run db:push` for dev) to apply it.
3. Do NOT hand-edit files in `drizzle/` — they are generated.
