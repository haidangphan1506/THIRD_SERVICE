# Fix lint errors

Use this skill when ESLint reports type-checked errors.

## Notes

- ESLint uses `recommendedTypeChecked` with `projectService: true`
- First run is slow — it type-checks all referenced .ts files
- `@typescript-eslint/no-explicit-any: off` — `any` is allowed
- `@typescript-eslint/no-unsafe-argument` and `no-floating-promises` are `warn` only
- `prettier/prettier: off` — formatting is NOT a lint error

## Commands

```bash
bun run lint:check    # See all errors without auto-fix
bun run lint          # Auto-fix what it can
bun run format        # Fix formatting separately
```
