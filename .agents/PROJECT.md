# Tài liệu dự án (tóm tắt kỹ thuật)

## Tổng quan

| Thành phần | Đường dẫn | Stack |
|------------|-----------|--------|
| Admin web | `E:\web-admin-ecs` | Next.js (App Router), React 19, Tailwind, Radix, TanStack Query, `NEXT_PUBLIC_API_URL` |
| REST API | `E:\backends` | NestJS 11, Drizzle ORM + `postgres`, Zod + `ZodValidationPipe`, JWT auth |

API mặc định lắng nghe **`PORT` hoặc 8888** (`backends/src/main.ts`). CORS bật `origin: true`, `credentials: true`.

## Frontend (`web-admin-ecs`)

- **`src/app/`** — App Router: `login`, `admin/*` (users, roles, coupons, …).
- **`src/lib/services/`** — `apiClient` (Bearer từ localStorage), `user.service`, `auth.service`.
- **`src/lib/hooks/`** — `useDataTable`, `useLogin`, `useAdminAuth`, …
- **`src/config/text/`** — copy UI (ưu tiên thêm string ở đây thay vì hardcode dài trong component).
- **`src/components/ui/source/`** — `SourceButton` và form primitives (design nhất quán admin).

Response list: client chuẩn hóa qua `coercePaginatedTableResult` — backend nên trả `{ data, pagination: { page, pageSize, total, totalPages } }`.

## Backend (`backends`)

- **`src/features/*`** — domain theo module Nest (`auth`, `user`, `wallet`, `email`, `transaction`). Import shared code qua alias **`@packages/*`** → `src/packages/*`.
- **`src/packages/`** — entities (Zod), pipes, decorators, helpers, configs, interceptors, filters.
- **`src/database/`** — `schema.ts` (Drizzle `pgTable`), `database.module.ts` (inject `DRIZZLE`).
- **Scripts:** `scripts/seed-user.ts`, `scripts/seed-users-bulk.ts`; env `DATABASE_URL` hoặc `POSTGRES_*`.

## Biến môi trường (tham chiếu)

| Repo | Biến |
|------|------|
| web-admin-ecs | `NEXT_PUBLIC_API_URL` (mặc định thường `http://localhost:8888`) |
| backends | `PORT`, `DATABASE_URL` / `POSTGRES_*`, JWT / config trong `packages/configs` |

## Lệnh hay dùng

```bash
# Admin
cd web-admin-ecs && bun dev

# API
cd backends && bun start:dev
cd backends && bun run build
```
