# Skill: Forms & Validation — Next Admin

## Primitives (`src/components/ui/source/`)

| Component          | Dùng khi                                                       |
| ------------------ | -------------------------------------------------------------- |
| `SourceTextInput`  | `<input>` text / email / password                              |
| `SourceSelect`     | `<select>`                                                     |
| `FieldLabel`       | Label + dấu `*` required                                       |
| `FieldError`       | Hiển thị lỗi field (ẩn khi `children` rỗng)                    |
| `SourceButton`     | Nút submit / cancel (variant: `primary`, `secondary`, `ghost`) |
| `SourceFormFooter` | Wrapper footer modal (flex, border-top)                        |

```tsx
import {
  SourceTextInput,
  SourceSelect,
  FieldLabel,
  FieldError,
  SourceButton,
  SourceFormFooter,
} from "@/components/ui/source";
```

## Pattern form trong Modal

```tsx
"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import {
  SourceTextInput,
  FieldLabel,
  FieldError,
  SourceButton,
  SourceFormFooter,
} from "@/components/ui/source";
import {
  isValidationApiError,
  getFirstFieldMessages,
  getApiErrorMessage,
} from "@/lib/utils/api-validation-error";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateFooModal({ isOpen, onClose, onSuccess }: Props) {
  const [values, setValues] = useState({ name: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setError(null);
    setIsLoading(true);
    try {
      await fooService.create(values);
      onSuccess();
      onClose();
    } catch (err) {
      if (isValidationApiError(err))
        setFieldErrors(getFirstFieldMessages(err.validation.items));
      else setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo mới" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <FieldLabel htmlFor="name" required>
            Tên
          </FieldLabel>
          <SourceTextInput
            id="name"
            value={values.name}
            onChange={set("name")}
            invalid={!!fieldErrors.name}
          />
          <FieldError>{fieldErrors.name}</FieldError>
        </div>
        <SourceFormFooter>
          <SourceButton
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Hủy
          </SourceButton>
          <SourceButton type="submit" disabled={isLoading}>
            {isLoading ? "Đang lưu…" : "Lưu"}
          </SourceButton>
        </SourceFormFooter>
      </form>
    </Modal>
  );
}
```

## react-hook-form (khi form phức tạp)

Dự án có `react-hook-form@7` — dùng khi nhiều field hoặc cần validation phức tạp phía client:

```ts
import { useForm } from "react-hook-form";

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<FormValues>();
```

Kết hợp với `SourceTextInput` qua `{...register("field")}` và `invalid={!!errors.field}`.

## Validation client-side

- Mirror rule Zod backend (độ dài, format) để UX tốt hơn.
- Không duplicate logic phức tạp — chỉ validate những gì cần thiết trước khi gọi API.
- Lỗi 422 từ server luôn được hiển thị per-field qua `getFirstFieldMessages`.

## UiForm (form đơn giản)

`UiForm` phù hợp cho form login / form ít field không cần validation phức tạp:

```tsx
<UiForm
  fields={[{ name: "email", type: "email", label: "Email", required: true }]}
  onSubmit={async (values) => {
    /* ... */
  }}
  isLoading={isLoading}
  errors={fieldErrors}
/>
```
