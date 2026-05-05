# Skill: UI admin Next (`web-admin-ecs`)

## Thành phần tái sử dụng

- **Layout:** `PageContainer`, `PageHeader`, sidebar/header trong `src/components/layout/`.
- **Bảng:** `DataTable`, `Pagination`, `SearchInput`, `StatusBadge`, loading/error/retry theo pattern `UsersAdminView`.
- **Modal:** `Modal` + form; validation có thể mirror Zod backend (message rõ ràng).

## Style

- Tailwind + `cn()`; màu accent admin thường cyan — giữ nhất quán với màn có sẵn.
- Icon: `lucide-react`.

## Text & i18n

- Nhãn màn user và chung: `src/config/text/users.ts`, `ui.ts`, `nav.ts` — thêm key mới thay vì scatter string.
