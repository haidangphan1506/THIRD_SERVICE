---
name: generate-entity
description: Scaffold the entities layer for a domain — Zod v4 schema (create + paginated query), inferred DTOs, and index barrel — under src/packages/entities/{domain}/. Use when asked to create/add DTOs, Zod schemas, or validation for a Postgres-backed feature in this NestJS infra/utility backend.
---

# Generate Entity (Zod schema + DTO)

Create `src/packages/entities/{domain}/` for a domain named `foo`, mirroring
`src/packages/entities/notification/` — the only entity domain in this repo. (`email` and
`uploads` have no Zod entities — `uploads` uses plain TS interfaces in `upload.interface.ts`
instead; don't create Zod schemas for a feature that doesn't validate a JSON body.)

## Inputs
- Domain name (singular, lowercase), e.g. `webhook-log`.
- Fields with validation (min/max/uuid/enum/url/regex/optional/nullable/default).

## Files

### `foo.schema.ts`
Zod v4. Export:
- Shared enums first, e.g. `export const fooTypeEnum = z.enum(['A', 'B']);` (mirrors the
  matching `pgEnum` value list in `schema.ts` — keep them in sync).
- `createFooSchema = z.object({ ... })` — one rule per field, friendly messages matching
  `notification.schema.ts`'s style (e.g. `z.string({ message: 'Title is required' })`). Optional
  FK-shaped ids: `.uuid('fooId must be uuid ...').optional().nullable()`.
- `getFoosQuerySchema = z.object({ ... })` — plain `z.coerce` pagination:
  ```ts
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).optional(),
  // + any filter fields (enum, isRead-style booleans via z.coerce.boolean().optional())
  ```
  Do NOT use `z.preprocess`.
- No `updateFooSchema` is required unless the feature actually has a general update route —
  `notification` only has narrow state-transition actions (`markAsRead`), not a general PATCH.

### `foo.dto.ts`
```ts
import { z } from 'zod';
import { createFooSchema, getFoosQuerySchema } from './foo.schema';

export type CreateFooDto = z.infer<typeof createFooSchema>;
export type GetFoosQueryDto = z.infer<typeof getFoosQuerySchema>;
```

### `index.ts`
```ts
export * from './foo.schema';
export * from './foo.dto';
```

## Rules
- Single quotes, trailing commas, 100-char width.
- The DB enum lives separately in `schema.ts` as `pgEnum` — keep the value lists in sync.
- Consumed by the controller via `new ZodValidationPipe<Dto>(schema)` — keep export names stable.
