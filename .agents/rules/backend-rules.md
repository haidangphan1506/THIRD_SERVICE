# Rule: Backend (backends)

## Stack

NestJS 11 · Drizzle ORM · PostgreSQL (`postgres` driver) · Zod v4 · Redis (ioredis) · JWT (access + refresh) · bcrypt · nodemailer

## Cấu trúc thư mục

```
src/
├── database/
│   ├── schema.ts           # Drizzle pgTable definitions
│   └── database.module.ts  # Inject token DRIZZLE
├── features/               # Domain modules
│   ├── auth/               # controller + service + module
│   ├── user/
│   ├── wallet/
│   ├── email/
│   ├── redis/
│   └── transaction/
└── packages/               # Shared, không phụ thuộc route cụ thể
    ├── entities/           # Zod schema + DTO types (theo domain)
    ├── pipes/              # ZodValidationPipe
    ├── decorators/         # @ApiResponse, @Public, @User
    ├── guards/             # JwtAuthGuard (global)
    ├── helpers/            # hashData, signAccessToken, signRefreshToken
    ├── configs/            # JWT config
    ├── interceptor/        # ResponseInterceptor, ErrorInterceptor, LoggerInterceptor
    ├── filters/            # HttpExceptionFilter
    ├── interfaces/         # ApiResponseInterface, JwtPayload
    └── strategy/           # JwtUserStrategy
```

## Module pattern

**Lưu ý:** Khi tạo thêm API service/controller mới, **bắt buộc** phải cập nhật thêm vào file `rules/api-contract.md` và bổ sung type của Req/Res vào đó để đồng bộ Frontend.

Mỗi feature = `<name>.module.ts` + `<name>.controller.ts` + `<name>.service.ts`.

```ts
// features/foo/foo.module.ts
@Module({
  imports: [DatabaseModule],
  controllers: [FooController],
  providers: [FooService],
  exports: [FooService],
})
export class FooModule {}
```

Luôn import các files, folders từ packages vào module chính ở inject `@packages` (không import sâu dạng `@packages/decorator/*`, ...). Tuyệt đối không dùng đường dẫn tương đối `../../packages`.

## Validation (Zod)

Schema trong `src/packages/entities/<domain>/`:

```ts
// packages/entities/foo/foo.schema.ts
export const createFooSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email(),
});

// packages/entities/foo/foo.dto.ts
export type CreateFooDto = z.infer<typeof createFooSchema>;
```

Áp dụng trên controller:

```ts
@Post()
async createFoo(
  @Body(new ZodValidationPipe(createFooSchema))
  dto: CreateFooDto,
) { ... }

@Get()
async getFoos(
  @Query(new ZodValidationPipe(getFoosQuerySchema))
  query: GetFoosQueryDto,
) { ... }
```

`ZodValidationPipe` throw `UnprocessableEntityException` (422) với body:

```json
{
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address",
      "code": "invalid_string"
    }
  ]
}
```

## Database (Drizzle)

Schema trong `src/database/schema.ts`:

```ts
export const foos = pgTable("foos", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

Inject trong service:

```ts
constructor(
  @Inject(DRIZZLE)
  private readonly db: ReturnType<typeof drizzle>,
) {}
```

Query pattern:

```ts
// Select với filter
const rows = await this.db.select().from(foos).where(eq(foos.id, id));

// Insert + returning
const [created] = await this.db
  .insert(foos)
  .values({ id: randomUUID(), name })
  .returning();

// Update
await this.db.update(foos).set({ name }).where(eq(foos.id, id)).returning();

// Count
const [{ total }] = await this.db
  .select({ total: count() })
  .from(foos)
  .where(whereClause);
```

Sau khi thêm bảng mới: `bun db:generate` → `bun db:migrate`.

## Auth & Guards

- `JwtAuthGuard` là global guard (đăng ký trong `AppModule` qua `APP_GUARD`).
- Route public: dùng decorator `@Public()`.
- JWT payload: `{ sub: userId, email, typ: 'access' | 'refresh' }`.
- Access token: `JWT_ACCESS_SECRET`, refresh token: `JWT_REFRESH_SECRET`.

```ts
@Controller('auth')
export class AuthController {
  @Post('login')
  @Public()                    // bỏ qua JwtAuthGuard
  @HttpCode(StatusCodes.OK)
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Login successful' })
  async login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto) { ... }
}
```

## Response format

`ResponseInterceptor` wrap tất cả response thành:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "timestamp": "2026-01-01T00:00:00.000Z",
  "method": "GET",
  "path": "/users"
}
```

Dùng `@ApiResponse({ statusCode, message })` để set message tùy chỉnh.

Không tự tạo envelope `{ success, data }` trong service — interceptor đã làm.

## Error handling

- Nghiệp vụ: `BadRequestException`, `NotFoundException`, `UnauthorizedException`.
- Validation: để `ZodValidationPipe` throw `UnprocessableEntityException` (422).
- Không throw `RpcException` trừ khi dùng microservices.
- `HttpExceptionFilter` format lỗi thành `{ success: false, statusCode, message, path, timestamp }`.

## List / pagination response

```ts
return {
  data: rows.map((row) => ({ ...mapped })),
  pagination: {
    page,
    pageSize: limit, // limit từ query, pageSize cho FE
    total,
    totalPages,
  },
};
```

Query schema dùng `z.preprocess` để map `pageSize` → `limit`:

```ts
export const getFoosQuerySchema = z.preprocess(
  (val) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const o = val as Record<string, unknown>;
      if (o.pageSize != null && o.limit == null)
        return { ...o, limit: o.pageSize };
    }
    return val;
  },
  z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().min(1).optional(),
  }),
);
```

## Không làm

- Không import từ `features/` trong `packages/` — packages không phụ thuộc features.
- Không expose `password` trong response list/detail.
- Không dùng `../../packages` từ features — dùng `@packages/...`.
- Không refactor toàn module khi chỉ fix bug nhỏ.
- Không thêm `@nestjs/microservices` trừ khi có yêu cầu rõ ràng.
