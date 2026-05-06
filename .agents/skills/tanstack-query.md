# Skill: TanStack Query (React Query v5)

## Setup

`QueryProvider` đã wrap toàn app tại `src/app/providers.tsx` — không cần thêm gì.

```ts
// src/lib/query/query-client.ts
defaultOptions: {
  queries: {
    staleTime: Infinity,                                    // cache không tự stale
    refetchOnWindowFocus: process.env.NODE_ENV === "production",
  },
}
```

`staleTime: Infinity` → data không tự refetch khi re-mount. Dùng `invalidateQueries` sau mutation để làm mới.

## useQuery — đọc dữ liệu

```ts
import { useQuery } from "@tanstack/react-query";
import { fooService } from "@/lib/services/foo.service";

const { data, isLoading, error, refetch } = useQuery({
  queryKey: ["foos", id],
  queryFn: () => fooService.getById(id),
  enabled: !!id, // chỉ chạy khi id có giá trị
});
```

### queryKey conventions

```ts
["foos"][("foos", { page, search, role })][("foos", id)][("users", "me")]; // list không filter // list có params // single item // current user
```

Dùng object params trong key để invalidate chính xác:

```ts
// Invalidate toàn bộ list foos (mọi params)
queryClient.invalidateQueries({ queryKey: ["foos"] });

// Invalidate chỉ item cụ thể
queryClient.invalidateQueries({ queryKey: ["foos", id] });
```

## useMutation — tạo / sửa / xóa (pattern trong modal)

Dùng `useMutation` trong modal CRUD. Không dùng `useState isLoading`.

```tsx
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fooService, type CreateFooPayload } from "@/lib/services/foo.service";
import {
  isValidationApiError,
  getFirstFieldMessages,
  getApiErrorMessage,
} from "@/lib/utils/api-validation-error";

export function CreateFooModal({ isOpen, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const createFoo = useMutation({
    mutationFn: (payload: CreateFooPayload) => fooService.create(payload),
  });

  // Reset state khi modal mở lại
  useEffect(() => {
    if (!isOpen) return;
    createFoo.reset();
    setName("");
    setFieldErrors({});
  }, [isOpen, createFoo.reset]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    createFoo.mutate(
      { name: name.trim() },
      {
        onSuccess: () => {
          toast.success("Tạo thành công");
          onCreated?.(); // callback để refresh table
          onClose();
        },
        onError: (err: unknown) => {
          if (isValidationApiError(err) && err.validation.items.length > 0) {
            setFieldErrors(getFirstFieldMessages(err.validation.items));
            return;
          }
          toast.error(getApiErrorMessage(err));
        },
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo mới">
      <form noValidate onSubmit={handleSubmit}>
        {/* fields */}
        <SourceButton type="submit" disabled={createFoo.isPending}>
          {createFoo.isPending ? "Đang lưu…" : "Lưu"}
        </SourceButton>
      </form>
    </Modal>
  );
}
```

### Điểm quan trọng

- `mutate()` nhận callback `onSuccess` / `onError` inline — không cần `try/catch`.
- `mutation.isPending` thay cho `useState isLoading`.
- `mutation.reset()` trong `useEffect` xóa error/data của lần submit trước.
- `onCreated?.()` gọi callback từ view cha để refresh table.

## Pattern đầy đủ: list + CRUD (custom hooks)

Tách mutation logic ra custom hooks khi cần dùng ở nhiều nơi:

```tsx
// hooks/useFoos.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fooService } from "@/lib/services/foo.service";
import type { TableQueryState } from "@/lib/types/query";
import { queryStateToParams } from "@/lib/types/query";

const FOO_KEY = "foos";

export function useFooList(query: TableQueryState) {
  return useQuery({
    queryKey: [FOO_KEY, query],
    queryFn: () => fooService.list(queryStateToParams(query)),
  });
}

export function useFooCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fooService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [FOO_KEY] }),
  });
}

export function useFooUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Foo> }) =>
      fooService.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: [FOO_KEY] });
      qc.invalidateQueries({ queryKey: [FOO_KEY, id] });
    },
  });
}

export function useFooDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fooService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [FOO_KEY] }),
  });
}
```

Dùng trong modal:

```tsx
const createFoo = useFooCreate();

createFoo.mutate(payload, {
  onSuccess: () => {
    toast.success("OK");
    onCreated?.();
    onClose();
  },
  onError: (err) => {
    /* xử lý lỗi */
  },
});
```

## Mutation inline vs custom hook

|                   | Inline trong modal                 | Custom hook             |
| ----------------- | ---------------------------------- | ----------------------- |
| Khi nào           | Modal chỉ dùng 1 nơi               | Mutation dùng nhiều nơi |
| Code              | `useMutation({ mutationFn: ... })` | `useFooCreate()`        |
| invalidateQueries | Gọi thủ công trong `onSuccess`     | Đã có sẵn trong hook    |

Inline đơn giản hơn cho modal CRUD thông thường. Custom hook khi cần tái sử dụng.

## useDataTable vs useQuery trực tiếp

| Dùng                 | Khi nào                                              |
| -------------------- | ---------------------------------------------------- |
| `useDataTable`       | Bảng có pagination + sort + search + filter          |
| `useQuery` trực tiếp | Detail page, dropdown options, data không phân trang |
| `useMutation`        | Mọi thao tác write (create / update / delete)        |

`useDataTable` nội bộ dùng `useQuery` — không wrap thêm `useQuery` bên ngoài cho cùng data.

## Optimistic update (tùy chọn)

```ts
useMutation({
  mutationFn: fooService.update,
  onMutate: async ({ id, data }) => {
    await queryClient.cancelQueries({ queryKey: [FOO_KEY, id] });
    const prev = queryClient.getQueryData([FOO_KEY, id]);
    queryClient.setQueryData([FOO_KEY, id], (old: Foo) => ({
      ...old,
      ...data,
    }));
    return { prev };
  },
  onError: (_err, { id }, ctx) => {
    queryClient.setQueryData([FOO_KEY, id], ctx?.prev);
  },
  onSettled: (_data, _err, { id }) => {
    queryClient.invalidateQueries({ queryKey: [FOO_KEY, id] });
  },
});
```

Chỉ dùng khi UX cần phản hồi tức thì (toggle status, reorder). Không dùng mặc định.

## Lỗi từ query

```ts
const { error } = useQuery({ ... });

// error là unknown trong v5 — cast qua helper:
import { getApiErrorMessage } from "@/lib/utils/api-validation-error";

if (error) return <ErrorState message={getApiErrorMessage(error)} />;
```

## Không làm

- Không tạo `new QueryClient()` trong component — dùng `useQueryClient()`.
- Không dùng `refetchInterval` trừ khi có yêu cầu polling rõ ràng.
- Không đặt `staleTime: 0` — sẽ refetch liên tục do config mặc định `Infinity`.
- Không gọi `queryClient.clear()` — xóa toàn bộ cache, dùng `invalidateQueries` thay thế.
- Không dùng `useState isLoading` khi có `mutation.isPending`.
