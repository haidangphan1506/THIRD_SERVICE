# Skill: Components & UI Patterns — Next Admin

## Cấu trúc component

**Lưu ý cực kỳ quan trọng (Executor Rule):** Luôn ưu tiên dùng component có sẵn trong `src/components/ui/source/`. Không tự tạo UI component mới trừ khi thật sự cần thiết. Nếu bắt buộc phải tạo component mới, cần user accept trước.

```
src/components/
├── admin/          # View-level components theo feature (UsersAdminView, …)
├── auth/           # LoginForm, …
├── common/         # Shared non-UI (ErrorBoundary, …)
├── layout/         # AdminShell, Sidebar, Header, PageContainer
└── ui/
    ├── source/     # Design system primitives (SourceButton, FieldLabel, …)
    ├── DataTable.tsx
    ├── Modal.tsx
    ├── Pagination.tsx
    ├── SearchInput.tsx
    ├── StatusBadge.tsx
    ├── PageContainer.tsx
    ├── PageHeader.tsx
    ├── FilterBar.tsx
    ├── ActionDropdown.tsx
    ├── ConfirmDialog.tsx
    ├── StatCard.tsx / StatsGrid.tsx
    └── TableSkeleton.tsx
```

## Bảng dữ liệu (pattern chuẩn)

```tsx
// components/admin/FooAdminView.tsx
"use client";
import { useDataTable } from "@/lib/hooks/useDataTable";
import { DataTable } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

export function FooAdminView() {
  const [draft, setDraft] = useState("");
  const table = useDataTable({
    fetchFn: (p) => fooService.list(queryStateToParams(p)),
  });

  return (
    <PageContainer>
      <PageHeader title="Foo" />
      <div className="flex gap-2 mb-4">
        <SearchInput
          value={draft}
          onChange={setDraft}
          onSearch={() => table.setSearch(draft)}
        />
      </div>
      {table.isLoading ? (
        <TableSkeleton />
      ) : (
        <>
          <DataTable columns={columns} data={table.data} />
          <Pagination {...table.pagination} onPageChange={table.setPage} />
        </>
      )}
    </PageContainer>
  );
}
```

## Modal CRUD

- Dùng `Modal` với `size="md"` (default) hoặc `"lg"` cho form nhiều field.
- State `isOpen` quản lý ở view-level, truyền xuống modal.
- Sau create/update thành công: `table.refresh()` + `onClose()`.
- Xác nhận xóa: dùng `ConfirmDialog` thay vì `window.confirm`.

## StatusBadge

```tsx
<StatusBadge status={user.status} /> // "active" | "inactive" | custom
```

## ActionDropdown

```tsx
<ActionDropdown
  actions={[
    { label: "Sửa", onClick: () => openEdit(row) },
    { label: "Xóa", onClick: () => openConfirm(row.id), variant: "danger" },
  ]}
/>
```

## Style conventions

- Tailwind + `cn()` từ `@/lib/utils`.
- Màu accent: **cyan-400 / cyan-500** — nhất quán với toàn admin.
- Icon: `lucide-react` (đã có trong deps).
- Không dùng inline style; không thêm CSS module mới trừ khi cần animation phức tạp.
- Radix UI primitives đã cài — dùng khi cần accessible dropdown/dialog/tooltip.

## Text & i18n

- Thêm string mới vào `src/config/text/` (file tương ứng feature hoặc `ui.ts`).
- Không hardcode chuỗi dài tiếng Nhật / tiếng Việt trực tiếp trong JSX.

## "use client" directive

- Chỉ thêm `"use client"` khi component dùng hook, event handler, hoặc browser API.
- Layout, page tĩnh không cần — để Next tự server-render.
