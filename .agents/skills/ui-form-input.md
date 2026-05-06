# Skill: Form Input & Selector

## Import

```ts
import {
  SourceTextInput,
  SourceSelect,
  FieldLabel,
  FieldError,
  SourceButton,
  SourceFormFooter,
} from "@/components/ui/source";
```

## SourceTextInput

Wrapper `<input>` với style admin chuẩn. Prop `invalid` chuyển border/ring sang đỏ.

```tsx
<SourceTextInput
  id="create-user-email"
  name="email"
  type="text"
  inputMode="email"
  value={email}
  onChange={(e) => {
    setEmail(e.target.value);
    clearField("email"); // xóa lỗi ngay khi user gõ
  }}
  autoComplete="email"
  spellCheck={false}
  invalid={Boolean(fieldErrors.email)}
  aria-invalid={Boolean(fieldErrors.email)}
  aria-describedby={fieldErrors.email ? "err-email" : undefined}
/>
```

Props: tất cả `React.InputHTMLAttributes<HTMLInputElement>` + `invalid?: boolean`.

Hỗ trợ `type`: `text` | `email` | `password` | `number` | `date` | `tel`.

Luôn thêm `aria-invalid` + `aria-describedby` trỏ đến `id` của `FieldError` khi có lỗi.

## SourceSelect

Wrapper `<select>` cùng style với `SourceTextInput`.

```tsx
<SourceSelect
  id="role"
  value={role}
  onChange={(e) => {
    setRole(e.target.value);
    clearField("role");
  }}
  invalid={Boolean(fieldErrors.role)}
  aria-invalid={Boolean(fieldErrors.role)}
  aria-describedby={fieldErrors.role ? "err-role" : undefined}
>
  <option value="">-- Chọn vai trò --</option>
  <option value="admin">Admin</option>
  <option value="agent">Agent</option>
</SourceSelect>
```

Props: tất cả `React.SelectHTMLAttributes<HTMLSelectElement>` + `invalid?: boolean`.

## FieldLabel + FieldError

Luôn dùng cặp này bao quanh mỗi field. `id` trên `FieldError` phải khớp `aria-describedby` trên input:

```tsx
<FieldLabel htmlFor="create-user-email" required>Email</FieldLabel>
<SourceTextInput
  id="create-user-email"
  ...
  aria-describedby={fieldErrors.email ? "err-email" : undefined}
/>
<FieldError id="err-email">{fieldErrors.email}</FieldError>
```

- `FieldLabel`: render `<label>` + dấu `*` đỏ khi `required`.
- `FieldError`: render `<p role="alert">` — tự ẩn khi `children` là `null` / `""`.

## Layout field: label bên trái (FormFieldRow)

Khi form trong modal cần label cố định bên trái và input bên phải, dùng helper `FormFieldRow`:

```tsx
/** Label + control on one row; error text below the control, aligned with the input. */
function FormFieldRow({
  labelFor,
  label,
  required,
  errorId,
  fieldError,
  children,
}: {
  labelFor: string;
  label: React.ReactNode;
  required?: boolean;
  errorId: string;
  fieldError?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-[8.5rem] shrink-0 pt-2.5 [&_label]:mb-0">
        <FieldLabel htmlFor={labelFor} required={required}>
          {label}
        </FieldLabel>
      </div>
      <div className="min-w-0 flex-1 flex flex-col gap-1.5">
        {children}
        <div className="[&_p]:mt-0">
          <FieldError id={errorId}>{fieldError}</FieldError>
        </div>
      </div>
    </div>
  );
}
```

Dùng:

```tsx
<FormFieldRow
  labelFor="create-user-email"
  label={USER_PAGE_LABELS.email}
  required
  errorId="err-create-email"
  fieldError={fieldErrors.email}
>
  <SourceTextInput
    id="create-user-email"
    type="text"
    inputMode="email"
    value={email}
    onChange={(e) => {
      setEmail(e.target.value);
      clearField("email");
    }}
    invalid={Boolean(fieldErrors.email)}
    aria-invalid={Boolean(fieldErrors.email)}
    aria-describedby={fieldErrors.email ? "err-create-email" : undefined}
  />
</FormFieldRow>
```

## clearField — xóa lỗi per-field khi user gõ

```ts
const clearField = (key: string) => {
  setFieldErrors((prev) => {
    if (!(key in prev)) return prev; // tránh re-render thừa
    const next = { ...prev };
    delete next[key];
    return next;
  });
};
```

Gọi `clearField(key)` trong `onChange` của mỗi input — không xóa toàn bộ `fieldErrors`.

## Lỗi field không xác định (unknown fields từ backend)

Hiển thị các lỗi 422 mà không khớp field nào trong form:

```tsx
const FIELD_KEYS = ["email", "lastName", "firstName", "password"] as const;

{
  Object.entries(fieldErrors)
    .filter(([k]) => !FIELD_KEYS.includes(k as (typeof FIELD_KEYS)[number]))
    .map(([k, msg]) => (
      <div key={k} className="flex gap-3 items-start">
        <div className="w-[8.5rem] shrink-0" aria-hidden />
        <p className="min-w-0 flex-1 text-sm text-red-600" role="alert">
          <span className="font-medium">{k}</span>: {msg}
        </p>
      </div>
    ));
}
```

## SourceButton

```tsx
// Submit — dùng isPending từ useMutation
<SourceButton type="submit" variant="primary" disabled={mutation.isPending}>
  {mutation.isPending ? UI_LABELS.processing : USER_PAGE_LABELS.createUser}
</SourceButton>

// Cancel
<SourceButton type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
  {UI_LABELS.cancel}
</SourceButton>
```

Variants: `primary` (cyan, default) | `secondary` (white border) | `ghost` (text only).

Luôn đặt `type="button"` trên nút cancel để tránh submit form.

## SourceFormFooter

```tsx
<SourceFormFooter>
  <SourceButton
    type="button"
    variant="secondary"
    onClick={onClose}
    disabled={mutation.isPending}
  >
    {UI_LABELS.cancel}
  </SourceButton>
  <SourceButton type="submit" variant="primary" disabled={mutation.isPending}>
    {mutation.isPending ? UI_LABELS.processing : UI_LABELS.save}
  </SourceButton>
</SourceFormFooter>
```

## Toggle (checkbox dạng switch)

```tsx
import { Toggle } from "@/components/ui/Toggle";

<Toggle
  checked={isActive}
  onChange={(checked) => setIsActive(checked)}
  disabled={mutation.isPending}
  size="md" // "sm" | "md"
/>;
```

## FilterBar / SearchFilter

```tsx
import { FilterBar } from "@/components/ui/FilterBar";
import type { TableFilter } from "@/lib/types/filters";

const filters: TableFilter[] = [
  {
    key: "role",
    label: "Vai trò",
    type: "select",
    options: [{ value: "admin", label: "Admin" }],
  },
];

<FilterBar filters={filters} onFilter={(v) => table.setFilters(v)} />;
```

`SearchFilter` kết hợp search + filter trong một block:

```tsx
import { SearchFilter } from "@/components/ui/SearchFilter";

<SearchFilter
  search={draft}
  onSearchChange={setDraft}
  filters={filters}
  onFilter={(f) => table.setFilters(f)}
/>;
```

## UiForm (form config-driven, dùng cho login)

```tsx
import { UiForm, type FormFieldConfig } from "@/components/ui/UiForm";

const fields: FormFieldConfig[] = [
  { name: "email", type: "email", label: "Email", required: true },
  { name: "password", type: "password", label: "Mật khẩu", required: true },
];

<UiForm
  fields={fields}
  errors={fieldErrors}
  isLoading={isLoading}
  submitText="Đăng nhập"
  onSubmit={async (values) => {
    /* ... */
  }}
/>;
```

Dùng `UiForm` cho form đơn giản (login). Dùng `FormFieldRow` + primitives cho form CRUD trong modal.

## Quy tắc chung

- Không dùng `required` HTML native — validation qua Zod backend (422).
- Luôn thêm `aria-invalid` + `aria-describedby` trỏ đến `FieldError`.
- Gọi `clearField(key)` trong `onChange` — không reset toàn bộ errors.
- Dùng `noValidate` trên `<form>` để tắt browser validation.
- Text labels lấy từ `src/config/text/` — không hardcode string dài trong JSX.
