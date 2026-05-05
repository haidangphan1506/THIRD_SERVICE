---
trigger: always_on
---

# Rule: API Contract (FE ↔ BE)

## Base URL

`NEXT_PUBLIC_API_URL` (default `http://localhost:8888`). Không hardcode trong code.

## Auth headers

Frontend tự gắn qua request interceptor:

```
Authorization: Bearer <accessToken>
Content-Type: application/json
credentials: include
```

## Response envelope (backend)

Mọi response thành công được wrap bởi `ResponseInterceptor`:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": <payload>,
  "timestamp": "...",
  "method": "GET",
  "path": "/users"
}
```

Frontend `apiClient` trả thẳng `data` field — không cần unwrap thủ công.

## List / pagination

Backend trả:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

Frontend query params: `page`, `pageSize` → backend map `pageSize` → `limit` qua `z.preprocess`.

`coercePaginatedTableResult` normalize mọi shape response về chuẩn trên.

## Validation error (422)

Backend (`ZodValidationPipe`) throw:

```json
{
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address",
      "code": "invalid_string"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters",
      "code": "too_small"
    }
  ]
}
```

Frontend parse qua `parseUnprocessableEntityBody` → `ApiValidationPayload`:

```ts
{
  summaryMessage: "Validation failed",
  items: [{ field, message, code }]
}
```

Hiển thị per-field: `getFirstFieldMessages(err.validation.items)` → `Record<string, string>`.

Khi thay đổi shape lỗi backend phải cập nhật `api-validation-error.ts` frontend.

## User list item

Backend map từ DB row, không expose `password`:

```ts
{
  id: string,
  email: string,
  name: string,          // `${firstName} ${lastName}`.trim()
  role: string,          // "USER" | "ADMIN" | "MODERATOR"
  status: string,        // "active" | "inactive" (từ isActive boolean)
  createdAt: string,     // ISO string
}
```

Frontend `User` type trong `user.service.ts` phải khớp shape trên.

## Password rules (createUser)

Backend `createUserSchema` enforce:

- Min 8, max 14 ký tự
- Ít nhất 1 chữ thường (a-z)
- Ít nhất 1 chữ hoa (A-Z)
- Ít nhất 1 chữ số (0-9)
- Ít nhất 1 ký tự đặc biệt

Frontend không cần duplicate validation — lỗi 422 từ backend hiển thị per-field.

## Endpoints hiện có

| Module | Method | Path | Auth | Req (Body / Query) | Res Data |
| ------ | ------ | ---- | ---- | ------------------ | -------- |
| **Auth** | POST | `/auth/login` | Public | **Body:** `{ email, password }` | `{ accessToken, refreshToken, user: User }` |
| **Auth** | POST | `/auth/register` | Public | **Body:** `{ email, password, name }` | `User` |
| **Auth** | POST | `/auth/refresh` | Public | **Body:** `{ refreshToken }` | `{ accessToken, refreshToken }` |
| **Auth** | POST | `/auth/forgot-password` | Public | **Body:** `{ email }` | `{ message: string }` |
| **Auth** | POST | `/auth/reset-password` | Public | **Body:** `{ token, password }` | `{ message: string }` |
| **User** | GET | `/users` | JWT | **Query:** `{ page?, limit?, search?, role?, isActive? }` | `PaginatedResponse<User>` |
| **User** | POST | `/users` | JWT | **Body:** `{ email, password, name, role?, isActive? }` | `User` |
| **User** | GET | `/users/get-by-field` | JWT | **Query:** `{ field, value }` | `User` (hoặc 404) |

## Thêm endpoint mới

**BẮT BUỘC:** Mỗi khi tạo mới hoặc sửa đổi một API Service/Controller, bạn **PHẢI** cập nhật file `api-contract.md` này để bổ sung/sửa đổi endpoint đó vào bảng phía trên.
Đồng thời, **PHẢI định nghĩa rõ Type/Shape của Request (Req) và Response (Res)** (như Zod payload, tham số query, json response trả về) trực tiếp trong file này (hoặc trỏ tới type dùng chung) để AI thế hệ sau hoặc chính bạn có thể đồng nhất dữ liệu, tránh việc truyền sai Request hoặc handle sai Response.

1. **Backend:** schema Zod → DTO type → controller method → service method.
2. **Cập nhật Contract:** Ghi rõ cấu trúc Payload/Body/Query và Response JSON vào file này.
3. **Frontend:** cập nhật service (`lib/services/<domain>.service.ts`) + type dựa trên chính contract vừa viết.
4. Nếu thay đổi pagination/error shape: cập nhật cả `api-validation-error.ts` và `coerce-paginated-table-result.ts`.