# Skill: Cấu trúc `packages` trong Nest (`backends`)

## Alias

- `tsconfig.json`: `"@packages/*": ["src/packages/*"]`.
- **Quy tắc Import:** Luôn import các files, folders từ packages vào module chính ở inject `@packages` (không import sâu vào các file cụ thể dạng `@packages/decorator/*, ...`).

## Gói nội dung

| Thư mục | Vai trò |
|---------|---------|
| `entities/` | Zod schema + type infer; export qua `index.ts` theo domain |
| `pipes/` | `ZodValidationPipe` |
| `decorators/` | Ví dụ `@ApiResponse`, metadata cho `ResponseInterceptor` |
| `helpers/` | `hashData`, JWT helpers, … |
| `configs/` | JWT options, env-driven |
| `interceptor/` | Response wrap, logging, error (HTTP, không RPC) |
| `filters/` | `HttpExceptionFilter` |

## Feature vs package

- **Feature** = route + service + module theo domain.
- **Package** = không phụ thuộc HTTP route cụ thể; tái sử dụng và import từ features.
