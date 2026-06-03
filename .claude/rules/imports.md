# Import rules

- Only `@packages/*` is aliased → `src/packages/*`.
- Feature files import shared code via `@packages/...`.
- Within `src/features/`, use relative imports for local modules.
- Never create new path aliases in tsconfig.json.
- Drizzle injection uses string token `'DRIZZLE'`, not a class token.
