# `.agents` (backends)

## Trong repo này (`backends`)

- **Cursor Rules:** [`.cursor/rules/`](../.cursor/rules/) — quy tắc Nest, Drizzle, Zod (theo file/glob).
- **Cursor Skills:** [`.cursor/skills/`](../.cursor/skills/) — workflow backend + Drizzle.
- **Root:** [`../AGENTS.md`](../AGENTS.md) — mục lục nhanh.

## Monorepo (admin + API)

Tài liệu tổng thể khi có repo admin cạnh đây:

**`../web-admin-ecs/.agents/`**

- [`README.md`](../../web-admin-ecs/.agents/README.md) — mục lục  
- [`PROJECT.md`](../../web-admin-ecs/.agents/PROJECT.md) — kiến trúc cả hai repo  
- [`roles/backend-nest.md`](../../web-admin-ecs/.agents/roles/backend-nest.md) — role backend (bổ sung cho rules/skills trên)  
- [`skills/nest-packages.md`](../../web-admin-ecs/.agents/skills/nest-packages.md) — alias `@packages`

Nếu workspace không có `web-admin-ecs` cạnh `backends`, dùng **`.cursor/rules`** + **`.cursor/skills`** trong repo này là đủ cho AI chỉ làm API.
