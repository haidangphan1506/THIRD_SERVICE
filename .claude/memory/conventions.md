# Conventions

## Imports

```ts
// Path alias (tsconfig paths) — only @packages/*:
import { Public } from '@packages/decorators';

// Relative imports within features:
import { DRIZZLE } from '../../database/database.module';
import { users } from '../../database/schema';
```

- Do not create new path aliases.
- `src/features/...` used in imports (not aliased).

## Code style

- Prettier: single quotes, trailing commas, semicolons, 100 print width
- `@typescript-eslint/no-explicit-any: off` — `any` is allowed
- `noImplicitAny: false` in tsconfig
- ESLint type-checks via `projectService: true`

## Decorator order (controllers)

```
@Controller → @Public → @HttpCode → @ApiResponse → handler method
```

## Entity / DTO pattern

```
src/packages/entities/{domain}/
├── {domain}.schema.ts  — Zod v4 validation schema
├── {domain}.dto.ts     — TypeScript types (inferred from schema)
└── index.ts            — Re-exports
```

## Validation

All request bodies use `ZodValidationPipe` with a Zod v4 schema:

```ts
@Body(new ZodValidationPipe<LoginDto>(loginSchema))
loginDto: LoginDto,
```

## Repository pattern

Use a repository class when DB queries are non-trivial. Inject `'DRIZZLE'` via `@Inject()`.

Features WITH repository: `category`, `wallet`, `transaction`
Features WITHOUT repository: `auth`, `user`
