# UI: Admin Create Modal (管理者登録)

## Overview

A modal dialog for registering a new administrator account.

## Trigger

Opened when the user clicks the "Create new" / "新規作成" button on the admin list page.

## Layout

```
┌──────────────────────────────────────┐
│ 管理者登録                         ✕ │
├──────────────────────────────────────┤
│                                      │
│ * 氏名                               │
│ ┌──────────────────────────────────┐ │
│ │ 例: 山田 太郎                    │ │
│ └──────────────────────────────────┘ │
│                                      │
│ * メールアドレス                      │
│ ┌──────────────────────────────────┐ │
│ │ 例: yamada@example.com           │ │
│ └──────────────────────────────────┘ │
│                                      │
│ * 初期パスワード                      │
│ ┌──────────────────────────────────┐ │
│ │ 8文字以上のパスワード            │ │
│ └──────────────────────────────────┘ │
│ 管理者はログイン後にパスワードを変更できます │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 権限について: すべての管理者は   │ │
│ │ 管理システムへのフルアクセス権   │ │
│ │ を持ちます。                     │ │
│ └──────────────────────────────────┘ │
│                                      │
│          [キャンセル]  [登録]        │
└──────────────────────────────────────┘
```

## Fields

| Field | Label | Type | Required | Placeholder | Validation |
|---|---|---|---|---|---|
| name | 氏名 | text | yes | 例: 山田 太郎 | non-empty |
| email | メールアドレス | email | yes | 例: yamada@example.com | valid email format |
| password | 初期パスワード | password | yes | 8文字以上のパスワード | min 8 characters |

## UI Elements

- **Title**: 管理者登録 (top-left)
- **Close button** (✕): top-right corner — dismisses modal without saving
- **Helper text** (below password): 管理者はログイン後にパスワードを変更できます
- **Info banner** (blue): 権限について: すべての管理者は管理システムへのフルアクセス権を持ちます。

## Actions

| Button | Style | Behavior |
|---|---|---|
| キャンセル | secondary / outline | Closes modal, discards input |
| 登録 | primary / blue | Validates fields → POST `/admin/users` → closes modal on success |

## API

- **Method**: `POST`
- **Endpoint**: `/admin/users`
- **Request body**:
  ```json
  {
    "name": "山田 太郎",
    "email": "yamada@example.com",
    "password": "initialPassword123"
  }
  ```
- **Success**: 201 Created → refresh admin list, show success toast
- **Error**: display inline validation messages under the relevant field

## States

- **Default**: all fields empty
- **Loading**: 登録 button disabled + spinner while request is in-flight
- **Error**: red border + error text under the failed field(s)
