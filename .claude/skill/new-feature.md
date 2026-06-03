# New feature module

Use this skill when adding a new domain feature (e.g. budgets, goals, reports).

## Steps

1. Create feature folder: `src/features/{name}/`
   - `{name}.module.ts`
   - `{name}.controller.ts`
   - `{name}.service.ts`
   - `{name}.repository.ts` (optional)
2. Create entity folder: `src/packages/entities/{name}/
   - `{name}.schema.ts` (Zod v4)
   - `{name}.dto.ts` (TS types)
   - `index.ts` (re-exports)
3. If new table → edit `src/database/schema.ts`, generate + run migration
4. Register module in `src/app.module.ts` imports
5. Wire up endpoints with `@Public()` or `@CurrentUser()` as needed
