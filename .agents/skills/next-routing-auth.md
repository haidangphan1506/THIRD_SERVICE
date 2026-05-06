# Skill: Routing & Auth — Next Admin

## App Router layout

```
src/app/
├── layout.tsx          # Root layout (providers, fonts)
├── providers.tsx       # QueryClientProvider, ThemeProvider, …
├── page.tsx            # Redirect → /admin hoặc /login
├── login/              # Public route
└── admin/
    ├── layout.tsx      # Admin shell (sidebar, header) — bảo vệ bằng useAdminAuth
    ├── page.tsx        # Dashboard
    ├── users/
    ├── roles/
    ├── coupons/
    └── …
```

## Bảo vệ route admin

`useAdminAuth` đọc cookie `isAuthenticated` — dùng trong `admin/layout.tsx`:

```tsx
"use client";
import { useAdminAuth } from "@/lib/hooks/useAdminAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, mounted } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) router.replace("/login");
  }, [mounted, isLoading, isAuthenticated, router]);

  if (!mounted || isLoading) return <PageLoader />;
  if (!isAuthenticated) return null;

  return <AdminShell>{children}</AdminShell>;
}
```

## Login flow

1. `useLogin` gọi `authService.login` → nhận `{ accessToken, refreshToken, user }`.
2. Lưu token: `setAccessToken`, `setRefreshToken` (localStorage).
3. Set cookie auth: `useAdminAuth().login(email, role)`.
4. Redirect `router.push("/admin")`.

## Middleware (`src/middleware.ts`)

Kiểm tra cookie `isAuthenticated` — redirect server-side trước khi render:

```ts
// Đọc middleware.ts trước khi thêm route mới để không phá matcher
```

## Thêm route admin mới

1. Tạo `src/app/admin/<feature>/page.tsx` (và `loading.tsx` nếu cần).
2. Thêm nav item vào `src/config/navigation.ts`.
3. Tạo view component tại `src/components/admin/<Feature>AdminView.tsx`.
4. Tạo service tại `src/lib/services/<feature>.service.ts`.

## Không làm

- Không dùng `getServerSideProps` / `getStaticProps` — đây là App Router.
- Không hardcode path `/admin` trong component — dùng `navigation.ts`.
- Không lưu token trong cookie (chỉ `isAuthenticated` flag trong cookie, token trong localStorage).
