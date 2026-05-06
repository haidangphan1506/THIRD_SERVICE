# Roles — khi nào dùng role nào

Agent **phải** đọc role tương ứng trước khi sửa code trong vùng đó, và tuân theo skill liên quan trong `skills/`.

## `backend-nest`

- **Phạm vi:** `E:\backends\src\features\`, `E:\backends\src\database\`, `E:\backends\src\packages\`, `E:\backends\scripts\`, Drizzle schema/migration.
- **Không:** đổi UI admin trừ khi fullstack role đồng bộ contract.
- **Chi tiết:** [`roles/backend-nest.md`](./roles/backend-nest.md).

## `frontend-next-admin`

- **Phạm vi:** `E:\web-admin-ecs\src\` (app, components, lib, config).
- **Không:** đổi schema DB hoặc logic Drizzle trong backends (trừ khi fullstack).
- **Chi tiết:** [`roles/frontend-next-admin.md`](./roles/frontend-next-admin.md).

## `fullstack`

- **Phạm vi:** thay đổi cùng lúc API (DTO, status, body) **và** client (`user.service`, types, form validation khớp Zod backend).
- **Bắt buộc:** đọc [`skills/fe-be-contracts.md`](./skills/fe-be-contracts.md) và giữ pagination / 422 validation đồng bộ.

## Thứ tự ưu tiên khi mơ hồ

1. Nếu chỉ một repo đổi → role đơn.
2. Nếu “sửa API + màn admin” → `fullstack`.
3. Nếu chỉ copy / i18n / layout không đụng API → `frontend-next-admin`.
