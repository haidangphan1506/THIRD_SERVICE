# Skill: Data Fetching & State — Next Admin

## apiClient

- Singleton tại `src/lib/services/index.ts` — import `{ apiClient }`.
- Tự gắn `Authorization: Bearer <accessToken>` từ `localStorage` qua request interceptor.
- Response interceptor throw `Error("UNAUTHORIZED")` khi 401 — hook/page bắt và redirect `/login`.
- Timeout 15 s; 204 trả `undefined`.

## Service pattern

```ts
// src/lib/services/foo.service.ts
import { apiClient } from "@/lib/services";
import type { ApiResponse, PaginatedResponse } from "@/lib/types/api";

export const fooService = {
  list: (params?: Record<string, any>) =>
    apiClient.get<PaginatedResponse<Foo>>("/foos", params),
  getById: (id: string) => apiClient.get<ApiResponse<Foo>>(`/foos/${id}`),
  create: (data: CreateFooPayload) =>
    apiClient.post<ApiResponse<Foo>>("/foos", data),
  update: (id: string, data: Partial<Foo>) =>
    apiClient.patch<ApiResponse<Foo>>(`/foos/${id}`, data),
  delete: (id: string) => apiClient.delete<ApiResponse<void>>(`/foos/${id}`),
};
```

## useDataTable

```ts
const table = useDataTable({
  fetchFn: (params) => fooService.list(queryStateToParams(params)),
  initialState: { pageSize: 10 },
});
// table.data, table.pagination, table.isLoading, table.error
// table.setSearch, table.setPage, table.setFilters, table.refresh
```

- `queryStateToParams` từ `@/lib/types/query` — chuyển `TableQueryState` → URL params.
- `coercePaginatedTableResult` tự normalize response (unwrap envelope, fallback total).
- `staleTime` mặc định 10 s — không cần `refetchOnWindowFocus` thủ công.

## Draft search (chỉ gọi API khi submit)

```ts
const [draft, setDraft] = useState("");
// input: value={draft} onChange={e => setDraft(e.target.value)}
// button: onClick={() => table.setSearch(draft)}
```

Không gọi `table.setSearch` trực tiếp trong `onChange` — tránh gọi API mỗi keystroke.

## TanStack Query ngoài useDataTable

```ts
const { data, isLoading } = useQuery({
  queryKey: ["foo", id],
  queryFn: () => fooService.getById(id),
  enabled: !!id,
});
```

- Wrap app trong `<QueryClientProvider>` (đã có tại `src/app/providers.tsx`).
- Mutation: `useMutation` + `onSuccess: () => queryClient.invalidateQueries(...)`.

## Lỗi API

```ts
import {
  isValidationApiError,
  getFirstFieldMessages,
  getApiErrorMessage,
} from "@/lib/utils/api-validation-error";

try {
  await fooService.create(payload);
} catch (err) {
  if (isValidationApiError(err)) {
    setFieldErrors(getFirstFieldMessages(err.validation.items));
  } else {
    setError(getApiErrorMessage(err));
  }
}
```
