# UI: Admin Edit Modal (管理者編集)

## Overview

A modal dialog for updating an existing administrator's name and email address.
Read-only admin metadata (registration date, status) is displayed for reference.

## Trigger

Opened when the user clicks the edit icon / "編集" button on an admin row in the list.

## Layout

```
┌──────────────────────────────────────┐
│ 管理者編集                         ✕ │
├──────────────────────────────────────┤
│                                      │
│ * 氏名                               │
│ ┌──────────────────────────────────┐ │
│ │ 山田 太郎                        │ │
│ └──────────────────────────────────┘ │
│                                      │
│ * メールアドレス                      │
│ ┌──────────────────────────────────┐ │
│ │ yamada@example.com               │ │
│ └──────────────────────────────────┘ │
│                                      │
│ 管理情報                             │
│  登録日:   2026/05/01                │
│  ステータス: アクティブ  (green)     │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 権限について: すべての管理者は   │ │
│ │ 管理システムへのフルアクセス権   │ │
│ │ を持ちます。                     │ │
│ └──────────────────────────────────┘ │
│                                      │
│          [キャンセル]  [更新]        │
└──────────────────────────────────────┘
```

## Fields

### Editable

| Field | Label | Type | Required | Pre-filled with |
|---|---|---|---|---|
| name | 氏名 | text | yes | current admin name |
| email | メールアドレス | email | yes | current admin email |

### Read-only (管理情報)

| Field | Label | Value example | Notes |
|---|---|---|---|
| createdAt | 登録日 | 2026/05/01 | Formatted as YYYY/MM/DD |
| status | ステータス | アクティブ | Green text when active |

## UI Elements

- **Title**: 管理者編集 (top-left)
- **Close button** (✕): top-right corner — dismisses modal without saving
- **Section header**: 管理情報 — separates editable fields from metadata
- **Info banner** (blue): 権限について: すべての管理者は管理システムへのフルアクセス権を持ちます。

## Status Badge Colors

| Status value | Display text | Color |
|---|---|---|
| active | アクティブ | green |
| inactive | 非アクティブ | gray |
| suspended | 停止中 | red |

## Actions

| Button | Style | Behavior |
|---|---|---|
| キャンセル | secondary / outline | Closes modal, discards changes |
| 更新 | primary / blue | Validates fields → PATCH `/admin/users/:id` → closes modal on success |

## API

- **Method**: `PATCH`
- **Endpoint**: `/admin/users/:id`
- **Request body**:
  ```json
  {
    "name": "山田 太郎",
    "email": "yamada@example.com"
  }
  ```
- **Success**: 200 OK → refresh admin list row, show success toast
- **Error**: display inline validation messages under the relevant field

## States

- **Default**: fields pre-filled with current admin data
- **Loading**: 更新 button disabled + spinner while request is in-flight
- **Error**: red border + error text under the failed field(s)
- **Unchanged**: 更新 button may be disabled if no fields were modified (optional UX)
