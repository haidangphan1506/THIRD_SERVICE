---
name: nest-backend-workflow
description: Quy trình và checklist khi thêm/sửa API Nest trong repo backends (features + packages + DB).
---

# Nest backend — workflow

## Khi thêm endpoint mới

1. **Entity / Zod**: thêm hoặc mở rộng schema trong `src/packages/entities/<domain>/`.
2. **Service** (`src/features/.../...service.ts`): logic + Drizzle; import `@packages/*`.
3. **Controller**: route + `ZodValidationPipe`; `@ApiResponse` nếu cần message cho `ResponseInterceptor`.
4. **Module**: đăng ký provider/controller nếu file mới.
5. **Chạy** `bun run build` (hoặc `nest build`) trước khi coi xong.

## Auth & JWT

- Login / token: `AuthModule`, `AuthService`, `@packages/configs/jwt-sign.config`, helpers JWT trong `@packages/helpers`.

## Lỗi & logging

- `ErrorInterceptor`: HTTP, dùng `throwError` + `HttpException` cho lỗi không phải `HttpException`.
- `LoggerInterceptor` / filter: giữ format hiện có; không nuốt exception làm mất status.

## Script ngoài HTTP

- Seed / one-off: `scripts/*.ts` với `dotenv`, `postgres` + `drizzle` — tái dùng `hashData` nếu tạo user.

## Không làm

- Không thêm dependency mới không cần thiết.
- Không đổi contract pagination/422 mà không cập nhật client admin (nếu có trong workspace).
