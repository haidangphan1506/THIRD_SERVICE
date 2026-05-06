# Rule: Frontend (web-admin-ecs)

## Stack

Next.js 15 App Router · React 19 · TypeScript strict · Tailwind CSS · TanStack Query v5 · sonner (toast) · lucide-react · Radix UI

## Cấu trúc thư mục

```
src/
├── app/                    # App Router — page, layout, loading
│   ├── admin/              # Protected routes (layout dùng useAuth)
│   └── login/              # Public route
├── components/
│   ├── admin/<feature>/    # View-level components (FooAdminView, CreateFooModal…)
│   ├── auth/               # LoginForm
│   ├── layout/             # AdminHeader, Sidebar, UserMenu
│   └── ui/                 # Shared UI components
│       └── source/         # Design system primitives
├── config/
│   ├── navigation.ts       # Nav items + permissions
│   └── text/               # Tất cả string UI (auth, nav, ui, users…)
└── lib/
    ├── auth/               # AuthContext, cookies
    ├── hooks/              # useDataTable, useLogin, useAdminAuth…
    ├── query/              # QueryClient, QueryProvider
    ├── services/           # apiClient, auth.service, user.service…
    ├── types/              # api.ts, query.ts, filters.ts, index.ts
    └── utils/              # cn, api-validation-error, coerce-paginated…
```

## Component rules

- **QUAN TRỌNG:** Luôn ưu tiên dùng các component có sẵn. KHÔNG tự tạo UI component mới trừ khi thật sự cần thiết. Nếu tạo component mới, cần user accept trước!
- `"use client"` chỉ khi dùng hook, event handler, hoặc browser API.
- View-level component đặt tại `components/admin/<feature>/`.
- Không đặt logic fetch trong `app/` page — delegate xuống view component.
- Thêm route mới: tạo `app/admin/<feature>/page.tsx` + nav item trong `config/navigation.ts`.

## UI & style

- Màu accent: **cyan-400 / cyan-500** — nhất quán toàn admin.
- Utility: `cn()` từ `@/lib/utils` (tailwind-merge + clsx).
- Icon: `lucide-react` — không dùng thư viện icon khác.
- Không dùng inline style; không tạo CSS module mới trừ animation phức tạp.
- Radix UI đã cài — dùng khi cần accessible dropdown/dialog/tooltip.

## Form

- Input/select: dùng `SourceTextInput`, `SourceSelect` từ `@/components/ui/source`.
- Label/error: `FieldLabel` + `FieldError` — luôn đi cặp.
- Luôn thêm `aria-invalid` + `aria-describedby` trỏ đến `FieldError`.
- `noValidate` trên `<form>` — không dùng browser native validation.
- Xóa lỗi per-field trong `onChange` qua `clearField(key)` — không reset toàn bộ.
- Không hardcode string dài trong JSX — thêm vào `config/text/`.

## API calls

- Mọi request qua `apiClient` singleton (`lib/services/index.ts`).
- Tự gắn `Authorization: Bearer` từ localStorage.
- Mutation: dùng `useMutation` — không dùng `useState isLoading`.
- Reset modal state: `useEffect` trên `isOpen` + `mutation.reset()`.
- Lỗi 422: `isValidationApiError` → `getFirstFieldMessages` → per-field errors.
- Toast: `sonner` — `toast.success` / `toast.error`.

## Auth

- Token: localStorage (`accessToken`, `refreshToken`).
- Auth state: cookie `isAuthenticated` + `AuthContext` (`useAuth()`).
- Middleware (`src/middleware.ts`) redirect server-side dựa trên cookie.
- Không lưu access token trong cookie.

## Text / i18n

- Tất cả string UI trong `src/config/text/` — không hardcode trong component.
- File theo domain: `auth.ts`, `users.ts`, `nav.ts`, `ui.ts`, `status.ts`.
- Thêm key mới vào file tương ứng, export qua `index.ts`.

## Không làm

- Không dùng `getServerSideProps` / `getStaticProps` — App Router.
- Không hardcode `NEXT_PUBLIC_API_URL` trong code.
- Không phá shape `PaginatedResponse` / `User` mà không cập nhật cả backend.
- Không tạo `new QueryClient()` trong component — dùng `useQueryClient()`.
- Không dùng `window.confirm` — dùng `ConfirmDialog`.
