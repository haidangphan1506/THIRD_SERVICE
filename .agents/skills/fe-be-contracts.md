# Skill: Hợp đồng FE ↔ BE

## List / pagination

**Client:** `PaginatedResponse<T>` — `data: T[]`, `pagination: { page, pageSize, total, totalPages }`.

**Backend:** Trả đúng cấu trúc trên (không chỉ mảng `data`). `useDataTable` + `coercePaginatedTableResult` có fallback nhưng nên trả đủ `pagination.total`.

## Query params

- `page`, `pageSize` (frontend) → backend map sang `limit` nếu schema có preprocess (users).
- `search` chỉ gửi khi có giá trị (sau trim).

## Auth

- Bearer token header từ `apiClient` interceptors; backend JWT theo `AuthModule` / `packages/configs`.

## Lỗi 422

- Backend: `ZodValidationPipe` → body có `errors` array (field + message).
- Frontend: `parseUnprocessableEntityBody` / `api-validation-error.ts` — khi đổi shape lỗi phải cập nhật cả hai phía.

## User list item (admin)

- FE `User`: `id`, `email`, `name`, `role`, `status` (`active` | `inactive`), `createdAt` (ISO string).
- BE map từ row DB: không expose `password`.
