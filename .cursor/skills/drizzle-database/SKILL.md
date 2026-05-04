---
name: drizzle-database
description: Schema Drizzle, DatabaseModule, pattern truy vấn và seed trong repo backends.
---

# Drizzle database — skill

## File trung tâm

- **`src/database/schema.ts`**: định nghĩa `pgTable`, enum, default, unique.
- **`src/database/database.module.ts`**: `DrizzlePostgresModule` / factory tạo `drizzle(client, { schema })`, export **`DRIZZLE`**.

## Trong service

```text
constructor(@Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>) {}
```

- Truy vấn: `this.db.select().from(users).where(...)`; insert/update/returning theo pattern hiện có trong `UserService`.

## Migration & tooling

- `drizzle.config.ts` ở root repo; script: `db:generate`, `db:migrate`, `db:push`, `db:studio`.

## Seed

- **`scripts/seed-user.ts`**, **`scripts/seed-users-bulk.ts`**: resolve URL DB giống nhau; insert qua Drizzle + `hashData` cho password.

## An toàn

- Tránh log password; không `select()` toàn bộ user rồi trả client — chỉ field cần thiết.
