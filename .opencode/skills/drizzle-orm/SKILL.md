---
name: drizzle-orm
description: Use when writing Drizzle ORM queries, modifying database schema, generating or applying migrations, or seeding data in the backends NestJS API.
---

# Drizzle ORM Patterns

## Schema

Single schema file: `src/database/schema.ts`. All tables, enums, and relations defined here.

```ts
import { pgTable, uuid, text, varchar, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN', 'MODERATOR']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  isActive: boolean('is_active').default(true),
  role: userRoleEnum('role').default('USER'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

## Injection

```ts
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../../database/database.module';
import { drizzle } from 'drizzle-orm/postgres-js';

@Injectable()
export class MyRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}
}
```

## Common query patterns

### Insert + returning
```ts
const [row] = await this.db.insert(table).values({ ... }).returning();
```

### Select with where
```ts
const rows = await this.db.select().from(table).where(eq(table.id, id));
```

### Select with join
```ts
const rows = await this.db.select({ ... })
  .from(tableA)
  .innerJoin(tableB, eq(tableA.fk, tableB.id))
  .where(eq(tableA.userId, id));
```

### Update + returning
```ts
const [row] = await this.db.update(table).set({ ... }).where(eq(table.id, id)).returning();
```

### Delete + returning
```ts
const [row] = await this.db.delete(table).where(eq(table.id, id)).returning();
```

### Count
```ts
const [row] = await this.db.select({ total: count() }).from(table).where(...);
```

### Pagination with search + filters
```ts
const whereClause = buildListWhereClause({ search, searchableColumns, filters, filterColumns });
const [totalRow] = await this.db.select({ total: count() }).from(table).where(whereClause);
const rows = await this.db.select().from(table).where(whereClause).limit(limit).offset(offset);
```

## Query helpers

Reuse `buildListWhereClause` from `@packages/helpers` for consistent search/filter:
- `search`: OR across configured columns via ILIKE
- `filters`: AND exact-match conditions (EQ)

Import: `import { buildListWhereClause } from '@packages/helpers';`

## Enums (PG)

Defined as `pgEnum` in schema. Values referenced as string literals in TypeScript:
```ts
export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN', 'MODERATOR']);
// Usage: users.role = 'ADMIN'
```

## Transactions

Use Drizzle's transaction API for multi-step operations:
```ts
await this.db.transaction(async (tx) => {
  await tx.insert(...);
  await tx.update(...);
});
```

## Migration workflow

```bash
bun run db:generate   # After schema changes → creates SQL in drizzle/
bun run db:migrate    # Apply to DB
bun run db:push       # Dev only — skips migration review
```
