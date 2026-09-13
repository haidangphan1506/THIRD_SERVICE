---
name: generate-repository
description: Scaffold the repository layer (src/features/{name}/{name}.repository.ts) — Drizzle DB access with DRIZZLE injection, CRUD + paginated list using inline and()/eq()/ilike() conditions. Use when asked to create/add a repository or data-access layer for a Postgres-backed feature in this NestJS infra/utility backend.
---

# Generate Repository

Create `src/features/foo/foo.repository.ts`, mirroring `notification.repository.ts` — the only
repository in this repo.

## Prerequisites
- The Drizzle table (e.g. `foos`) exists in `src/database/schema.ts`. Don't confuse this with
  the large set of vestigial (unused) education-domain tables already in that file — see
  `.claude/rules/database.md`.
- The DTOs exist under `@packages/entities/foo` (see `generate-entity`).

## Shape
```ts
import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { foos } from '../../database/schema';
import type { CreateFooDto, GetFoosQueryDto } from '@packages/entities/foo';

@Injectable()
export class FooRepository {
  constructor(@Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>) {}
  // create, findAll, findById, update-ish state-transition methods, delete
}
```

## Methods (copy exact shapes from notification.repository.ts)

- `create(data)` → `.insert(foos).values({...}).returning()`, return the first row (`[row] =
  await ...`). Map each DTO field explicitly, using `?? undefined` for optional fields Drizzle
  should omit rather than insert as `null` unless `null` is actually wanted.
- `findAll(userId, query)` → build conditions as a plain `SQL[]` array (NOT
  `buildListWhereClause` — that helper isn't used in this repo):
  ```ts
  const conditions: SQL[] = [or(eq(foos.userId, userId), eq(foos.senderId, userId))!];
  if (search) conditions.push(ilike(foos.title, `%${search}%`));
  if (type) conditions.push(eq(foos.type, type));
  const where = and(...conditions);
  ```
  Then one `count()` query for the total, one paged `.select().from(foos).where(where)
  .orderBy(desc(foos.createdAt)).limit(limit).offset(offset)` query. Return
  `{ data: rows, pagination: { total, page, limit, totalPages } }` — the key is **`data`**, not
  the resource name (this repo's own convention — differs from `tutor-service`/`user`).
- `findById(id)` → `.select().from(foos).where(eq(foos.id, id))`, return the row or `null`
  (destructure `const [row] = ...; return row ?? null;`).
- `delete(id)` → `.delete(foos).where(eq(foos.id, id)).returning()`, return a boolean (`!!row`).
- Any state-transition update (like `markAsRead`) → `.update(foos).set({...}).where(eq(foos.id,
  id)).returning()`, return the row or `null`.

## Rules
- Build conditions as an explicit `SQL[]` and `and(...conditions)` — don't reach for
  `buildListWhereClause`, it's unused in this repo (see `.claude/rules/conventions.md`).
- Map camelCase DTO fields to columns explicitly on insert.
- No parent/child ownership joins here — there's no `class`/`schedule`-style hierarchy in this
  repo's own tables.
