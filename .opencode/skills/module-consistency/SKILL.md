---
name: module-consistency
description: Use when creating or updating any feature module file to ensure controller, service, repository, schema, DTO, and module registration are all updated together.
---

# Module Consistency

Always keep these files in sync when working on a feature module:

## Files to update together

| Layer | File | Action |
|---|---|---|
| Schema | `src/database/schema.ts` | Add/update table, enums, relations |
| Schema (Zod) | `src/packages/entities/{domain}/{domain}.schema.ts` | Add/update validation schemas |
| DTO | `src/packages/entities/{domain}/{domain}.dto.ts` | Add/update DTO types |
| Repository | `src/features/{domain}/{domain}.repository.ts` | Add/update DB queries |
| Service | `src/features/{domain}/{domain}.service.ts` | Add/update business logic |
| Controller | `src/features/{domain}/{domain}.controller.ts` | Add/update endpoints |
| Module | `src/features/{domain}/{domain}.module.ts` | Register provider, import module |

## Rules

1. **Controller → Service**: Every controller method must call a corresponding service method. Never call repository directly from controller.
2. **Service → Repository**: Service must delegate DB operations to repository.
3. **DTO → Schema**: DTO types must match Zod validation schemas.
4. **Module registration**: After adding new controller/service/repository, register them in the module file.
5. **Global registration**: If the module is new, register it in `app.module.ts`.
6. **Method rename**: When renaming a method, update all layers. Example: `addRow` → `createLesson` must update controller, service, repository.
7. **No orphan endpoints**: Every route in controller must have a matching service method.

## Verification

After changes, run to catch mismatches:

```bash
bun run lint:check
```

Check that:
- Controller method names match service method names
- Service method names match repository method names
- Module imports are correct
