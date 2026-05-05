# Skill: Modal & Dialog

## Modal

```tsx
import { Modal } from "@/components/ui/Modal";

<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Tạo người dùng"
  size="md" // "sm" | "md" | "lg" | "xl"
>
  {/* nội dung */}
</Modal>;
```

Props:

| Prop        | Type                     | Default | Mô tả                                     |
| ----------- | ------------------------ | ------- | ----------------------------------------- |
| `isOpen`    | `boolean`                | —       | Bắt buộc                                  |
| `onClose`   | `() => void`             | —       | Bắt buộc                                  |
| `title`     | `string`                 | —       | Header title; bỏ qua nếu không cần header |
| `size`      | `"sm"\|"md"\|"lg"\|"xl"` | `"md"`  | max-width: sm=384 md=512 lg=672 xl=896    |
| `className` | `string`                 | —       | Thêm class vào panel                      |

Tự xử lý: Escape key đóng modal, click backdrop đóng, body scroll lock, animation fade+scale.

## Pattern CRUD modal chuẩn

```tsx
// FooAdminView.tsx
const [createOpen, setCreateOpen] = useState(false);
const [editTarget, setEditTarget] = useState<Foo | null>(null);
const [deleteTarget, setDeleteTarget] = useState<Foo | null>(null);

<CreateFooModal
  isOpen={createOpen}
  onClose={() => setCreateOpen(false)}
  onCreated={() => { table.refresh(); setCreateOpen(false); }}
/>

<EditFooModal
  isOpen={!!editTarget}
  target={editTarget}
  onClose={() => setEditTarget(null)}
  onUpdated={() => { table.refresh(); setEditTarget(null); }}
/>

<ConfirmDialog
  isOpen={!!deleteTarget}
  onClose={() => setDeleteTarget(null)}
  onConfirm={handleDelete}
  title="Xóa"
  description={`Xóa "${deleteTarget?.name}"?`}
  isLoading={deleteMutation.isPending}
/>
```

## Form trong Modal — pattern thực tế (useMutation)

Dùng `useMutation` thay vì `useState isLoading`. Reset state qua `useEffect` trên `isOpen`.

```tsx
// components/admin/foo/CreateFooModal.tsx
"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import {
  FieldError,
  FieldLabel,
  SourceButton,
  SourceFormFooter,
  SourceTextInput,
} from "@/components/ui/source";
import { UI_LABELS, FOO_PAGE_LABELS } from "@/config/text";
import { fooService, type CreateFooPayload } from "@/lib/services/foo.service";
import {
  getApiErrorMessage,
  getFirstFieldMessages,
  isValidationApiError,
} from "@/lib/utils/api-validation-error";

export interface CreateFooModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void; // callback sau khi tạo thành công
}

const FIELD_KEYS = ["name", "email"] as const; // các field có trong form

export function CreateFooModal({
  isOpen,
  onClose,
  onCreated,
}: CreateFooModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const createFoo = useMutation({
    mutationFn: (payload: CreateFooPayload) => fooService.create(payload),
  });

  // Reset toàn bộ state khi modal mở lại
  useEffect(() => {
    if (!isOpen) return;
    createFoo.reset();
    setName("");
    setEmail("");
    setFieldErrors({});
  }, [isOpen, createFoo.reset]);

  // Xóa lỗi của field khi user bắt đầu gõ
  const clearField = (key: string) => {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    createFoo.mutate(
      { name: name.trim(), email: email.trim() },
      {
        onSuccess: () => {
          toast.success(FOO_PAGE_LABELS.createSuccess);
          onCreated?.();
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={FOO_PAGE_LABELS.newFoo}
      size="md"
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FieldLabel htmlFor="create-foo-name" required>
            {FOO_PAGE_LABELS.name}
          </FieldLabel>
          <SourceTextInput
            id="create-foo-name"
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearField("name");
            }}
            spellCheck={false}
            invalid={Boolean(fieldErrors.name)}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "err-create-name" : undefined}
          />
          <FieldError id="err-create-name">{fieldErrors.name}</FieldError>
        </div>

        {/* Lỗi 422 từ backend không khớp field nào trong form */}
        {Object.entries(fieldErrors)
          .filter(
            ([k]) => !FIELD_KEYS.includes(k as (typeof FIELD_KEYS)[number]),
          )
          .map(([k, msg]) => (
            <p key={k} className="text-sm text-red-600" role="alert">
              <span className="font-medium">{k}</span>: {msg}
            </p>
          ))}

        <SourceFormFooter>
          <SourceButton
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={createFoo.isPending}
          >
            {UI_LABELS.cancel}
          </SourceButton>
          <SourceButton
            type="submit"
            variant="primary"
            disabled={createFoo.isPending}
          >
            {createFoo.isPending
              ? UI_LABELS.processing
              : FOO_PAGE_LABELS.createFoo}
          </SourceButton>
        </SourceFormFooter>
      </form>
    </Modal>
  );
}
```

## Điểm khác biệt so với pattern useState isLoading

|                     | `useState isLoading`       | `useMutation` (chuẩn)                          |
| ------------------- | -------------------------- | ---------------------------------------------- |
| Loading state       | `setIsLoading(true/false)` | `mutation.isPending`                           |
| Reset khi mở lại    | trong `handleClose`        | `useEffect` trên `isOpen` + `mutation.reset()` |
| onSuccess / onError | trong `try/catch`          | callback của `mutate()`                        |
| Toast               | thủ công                   | trong `onSuccess` / `onError`                  |

## Layout label bên trái (FormFieldRow)

Khi form cần label cố định bên trái, dùng `FormFieldRow` (xem `ui-form-input.md`):

```tsx
<FormFieldRow
  labelFor="create-foo-name"
  label={FOO_PAGE_LABELS.name}
  required
  errorId="err-create-name"
  fieldError={fieldErrors.name}
>
  <SourceTextInput
    id="create-foo-name"
    value={name}
    onChange={(e) => {
      setName(e.target.value);
      clearField("name");
    }}
    invalid={Boolean(fieldErrors.name)}
    aria-invalid={Boolean(fieldErrors.name)}
    aria-describedby={fieldErrors.name ? "err-create-name" : undefined}
  />
</FormFieldRow>
```

## ConfirmDialog

Dùng cho xóa / hành động không thể hoàn tác. Không dùng `window.confirm`.

```tsx
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

<ConfirmDialog
  isOpen={!!deleteTarget}
  onClose={() => setDeleteTarget(null)}
  onConfirm={handleDelete}
  title="Xóa người dùng"
  description="Hành động này không thể hoàn tác."
  confirmText="Xóa"
  cancelText={UI_LABELS.cancel}
  variant="danger" // "danger" | "warning" | "default"
  isLoading={deleteMutation.isPending}
/>;
```

## Lưu ý

- `useEffect` reset state khi `isOpen` thay đổi — không reset trong `onClose`.
- `mutation.reset()` xóa trạng thái error/data của mutation trước đó.
- `noValidate` trên `<form>` để tắt browser validation.
- Không lồng `Modal` trong `Modal` — dùng `ConfirmDialog` cho confirm phụ.
- `onCreated` là optional callback — view cha dùng để refresh table.
