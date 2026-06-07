# UI: Admin Delete Confirmation Dialog (削除の確認)

## Overview

A compact confirmation dialog that asks the user to confirm permanent deletion of an
administrator account. Designed to prevent accidental deletes — the action cannot be undone.

## Trigger

Opened when the user clicks the delete icon / "削除" button on an admin row in the list.

## Layout

```
┌────────────────────────────────┐
│ 削除の確認                     │
├────────────────────────────────┤
│                                │
│  「山田 太郎」を削除しますか？ │
│  この操作は取り消せません。    │
│                                │
│     [キャンセル]  [削除する]   │
└────────────────────────────────┘
```

## UI Elements

- **Title**: 削除の確認
- **Body text (line 1)**: 「{adminName}」を削除しますか？  
  — The target admin's name is interpolated in Japanese quotation marks 「」.
- **Body text (line 2)**: この操作は取り消せません。  
  — Warning that the action is irreversible.
- **No close (✕) button** — user must explicitly choose キャンセル or 削除する.

## Actions

| Button | Style | Behavior |
|---|---|---|
| キャンセル | secondary / outline | Closes dialog, no changes made |
| 削除する | destructive / red | Calls DELETE endpoint → closes dialog on success |

## API

- **Method**: `DELETE`
- **Endpoint**: `/admin/users/:id`
- **Request body**: none
- **Success**: 200 OK → remove row from admin list, show success toast
- **Error**: close dialog, show error toast with message

## States

- **Default**: dialog open, both buttons enabled
- **Loading**: 削除する button disabled + spinner while request is in-flight
- **Error**: dialog closes, error toast appears (do not leave dialog open on error)

## UX Guidelines

- The 削除する button uses a red / destructive color to signal danger.
- キャンセル is positioned to the left so the natural reading order surfaces the safe option first.
- Dialog should be centered on screen with a dark overlay backdrop.
- Pressing `Escape` key triggers the same behavior as キャンセル.
- Do not auto-focus the 削除する button — default focus goes to キャンセル to avoid accidental deletion.
