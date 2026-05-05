# Rule: Project Overview

## Monorepo structure

Hai workspace độc lập, cùng máy:

| Repo      | Path               | Stack                                              |
| --------- | ------------------ | -------------------------------------------------- |
| Admin web | `E:\web-admin-ecs` | Next.js 15 App Router, React 19, TypeScript strict |
| REST API  | `E:\backends`      | NestJS 11, Drizzle ORM, Zod, PostgreSQL, Redis     |

API mặc định: `http://localhost:8888`. Frontend đọc từ `NEXT_PUBLIC_API_URL`.

## Ngôn ngữ & style

- TypeScript strict trên cả hai repo.
- Prettier: `singleQuote`, `trailingComma: all`, `printWidth: 100`, `semi: true`.
- Backend dùng single-quote; frontend dùng double-quote (Next.js default).

## Path aliases

| Repo          | Alias         | Trỏ đến          |
| ------------- | ------------- | ---------------- |
| web-admin-ecs | `@/*`         | `src/*`          |
| backends      | `@packages/*` | `src/packages/*` |

Không dùng đường dẫn tương đối dài (`../../..`) — luôn dùng alias.

## Lệnh hay dùng

```bash
# Frontend
cd web-admin-ecs && bun dev
cd web-admin-ecs && bun type-check
cd web-admin-ecs && bun build

# Backend
cd backends && bun start:dev
cd backends && bun run build
cd backends && bun db:generate
cd backends && bun db:migrate
cd backends && bun db:seed:user
```

## Không làm

- Không commit `.env` — dùng `.env.example` làm template.
- Không cài thêm dependency nặng mà không cần thiết.
- Không sửa cả hai repo cùng lúc trừ khi thay đổi contract API.
