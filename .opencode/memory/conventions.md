---
description: Coding conventions, naming rules, and style guidelines for the backends NestJS API.
---

# Conventions

## Naming
- **Files**: NestJS convention — `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.repository.ts`
- **Classes**: PascalCase (`AuthService`, `JwtAuthGuard`)
- **Functions/variables**: camelCase
- **DTO/Schema files**: `{domain}.schema.ts`, `{domain}.dto.ts`

## Imports
- `@packages/*` → `src/packages/*` (only alias, do not create new ones)
- Relative imports within `src/features/` for local modules
- Use `@Inject('DRIZZLE')` for DB access, never import Drizzle directly

## Validation
- All request bodies validated with Zod v4 schemas via `ZodValidationPipe`
- Schemas in `src/packages/entities/{domain}/{domain}.schema.ts`
- DTOs are TypeScript types inferred from schemas: `z.infer<typeof schema>`

## Code Style
- Prettier: single quotes, trailing commas, semicolons, 100 print width
- ESLint: `no-explicit-any: off`, `prettier/prettier: off`
- `strictNullChecks: true`, `noImplicitAny: false`

## Decorator Order (controllers)
```
@Controller → @Public → @HttpCode → @ApiResponse → handler method
```

## Feature Pattern
```
src/features/{name}/
├── {name}.module.ts     — Module (imports, providers, controllers)
├── {name}.controller.ts — Route handlers (ZodValidationPipe on @Body())
├── {name}.service.ts    — Business logic
└── {name}.repository.ts — DB queries (optional)
```

## Entity Pattern
```
src/packages/entities/{domain}/
├── {domain}.schema.ts   — Zod v4 validation schema
├── {domain}.dto.ts      — TypeScript types
└── index.ts            — Re-exports
```
