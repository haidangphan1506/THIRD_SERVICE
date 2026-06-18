# API Reference — Wallets & Transactions

> Tất cả route bên dưới yêu cầu JWT access token hợp lệ (header `Authorization: Bearer <token>`), trừ khi đánh dấu `@Public()`. `userId` luôn lấy từ JWT payload (`@CurrentUser()`), **không** nhận từ request body.

## Response envelope (mọi route)

```json
{
  "statusCode": 200,
  "message": "...",
  "data": { ... },
  "timestamp": "2026-06-18T00:00:00.000Z",
  "method": "POST",
  "path": "/api/wallets"
}
```

Lỗi đi qua `HttpExceptionFilter`, message lấy từ `ERROR_MESSAGES` (`src/data/constants/messages.constant.ts`).

---

## Wallets — `/wallets`

### POST `/wallets` — tạo ví

**Body** (`createWalletSchema`):

| Field | Type | Required | Default | Ghi chú |
| --- | --- | --- | --- | --- |
| `name` | string | ✓ | — | 1–25 ký tự |
| `type` | `'CASH' \| 'BANK' \| 'E_WALLET' \| 'CREDIT'` | – | `CASH` | |
| `currency` | string | – | `VND` | đúng 3 ký tự |
| `categoriesId` | string[] (uuid) | – | `[]` | mỗi id **phải tồn tại** trong bảng `categories`, kiểm tra trong `WalletService.assertCategoriesExist` |
| `balance` | number | – | `0` | ≥ 0, coerce từ string |
| `note` | string | – | `''` | |
| `isDefault` | boolean | – | `true` | |
| `isActive` | boolean | – | `true` | |

```json
{
  "name": "Ví tiền mặt",
  "type": "CASH",
  "currency": "VND",
  "categoriesId": ["36837a9f-f7f2-41a0-b6f5-9d88fe938066"],
  "balance": 500000,
  "note": "",
  "isDefault": true,
  "isActive": true
}
```

**Lỗi:**
- `404 USER_ID_NOT_FOUND` / `USER_NOT_FOUND` — user trong token không hợp lệ/không tồn tại
- `409 WALLET_NAME_EXISTS` — trùng tên ví của cùng user
- `404 CATEGORIES_NOT_FOUND` — một trong `categoriesId` không tồn tại

**Success:** `201` — `SUCCESS_MESSAGES.WALLET_CREATED`, trả về wallet vừa tạo.

---

### PUT `/wallets/:id` — cập nhật ví

**Body** (`updateWalletSchema` = `createWalletSchema.partial()`): tất cả field ở trên đều optional, chỉ gửi field cần đổi.

Quy tắc giống create: nếu `categoriesId` được gửi, mọi id phải tồn tại (`404 CATEGORIES_NOT_FOUND`) trước khi update.

**Lỗi:** `404 USER_ID_NOT_FOUND/USER_NOT_FOUND/WALLET_NOT_EXISTS`, `404 CATEGORIES_NOT_FOUND`.

**Success:** `201` (hiện trả `201` thay vì `200`, theo `@HttpCode` trong controller) — `SUCCESS_MESSAGES.WALLET_CREATED`.

---

### GET `/wallets` — danh sách ví (có phân trang)

**Query** (`getWalletsQuerySchema`):

| Field | Type | Default |
| --- | --- | --- |
| `page` | number ≥1 | `1` |
| `limit` (alias `pageSize`) | number 1–100 | `10` |
| `search` | string | — |

**Success:** `200` — `WALLET_FETCHED`, data: `{ wallets: Wallet[], pagination: { total, page, limit, totalPages } }`.

---

### DELETE `/wallets/:id`

Xoá ví theo id, yêu cầu thuộc về user hiện tại.

**Lỗi:** `404 USER_ID_NOT_FOUND/USER_NOT_FOUND/WALLET_NOT_EXISTS`.
**Success:** `200` — `WALLET_DELETED`.

---

## Transactions — `/transactions`

### POST `/transactions` — tạo giao dịch

**Body** (`createTransactionSchema`):

| Field | Type | Required | Default | Ghi chú |
| --- | --- | --- | --- | --- |
| `name` | string | ✓ | — | |
| `walletId` | string (uuid) | ✓ | — | phải là ví **thuộc về user hiện tại** (kiểm tra qua `WalletService.getWalletByFieldService`) |
| `categoryId` | string (uuid) | ✓ | — | phải tồn tại trong `categories` |
| `amount` | number | ✓ | — | > 0 |
| `note` | string | – | — | |
| `type` | `'INCOME' \| 'EXPENSE'` | ✓ | — | |
| `status` | `'PENDING' \| 'COMPLETED' \| 'CANCELLED'` | – | `COMPLETED` | chỉ status `COMPLETED` mới cộng/trừ vào `wallet.balance` |

`userId` không nhận từ body — controller lấy từ `@CurrentUser()`.

```json
{
  "name": "Ăn trưa",
  "walletId": "5b1c...uuid",
  "categoryId": "36837a9f-...uuid",
  "amount": 50000,
  "note": "Cơm văn phòng",
  "type": "EXPENSE",
  "status": "COMPLETED"
}
```

Tạo transaction và cộng/trừ balance ví trong **cùng 1 DB transaction** (`TransactionRepository.createTransaction` → `applyBalanceDeltas`).

**Lỗi:** `404 USER_ID_NOT_FOUND/USER_NOT_FOUND`, `404 WALLET_NOT_EXISTS` (ví không tồn tại/không thuộc user), `404 CATEGORY_NOT_FOUND`.

**Success:** `201` — `TRANSACTION_CREATED`.

---

### PUT `/transactions/:id` — cập nhật giao dịch

**Body** (`updateTransactionSchema` = `createTransactionSchema.partial().omit({ userId: true })`): mọi field optional.

- Nếu đổi `walletId` → ví mới phải thuộc user hiện tại.
- Nếu đổi `categoryId` → category phải tồn tại.
- Balance được tính lại theo delta cũ/mới (`updateDeltas` trong `transaction.balance.ts`), xử lý cả trường hợp đổi ví, đổi amount, đổi type, đổi status.

**Lỗi:** `404 USER_ID_NOT_FOUND/USER_NOT_FOUND/TRANSACTION_NOT_FOUND/WALLET_NOT_EXISTS/CATEGORY_NOT_FOUND`.
**Success:** `200` — `TRANSACTION_UPDATED`.

---

### GET `/transactions` — danh sách (lọc + phân trang)

**Query** (`getTransactionsQuerySchema`):

| Field | Type | Default |
| --- | --- | --- |
| `page` | number | `1` |
| `limit` | number 1–100 | `10` |
| `search` | string | — (lọc theo `name` ilike) |
| `walletId` | uuid | — |
| `categoryId` | uuid | — |
| `type` | `'INCOME' \| 'EXPENSE'` | — |
| `status` | `'PENDING' \| 'COMPLETED' \| 'CANCELLED'` | — |
| `from` / `to` | date (coerce) | — | lọc theo `createdAt` |

**Success:** `200` — `TRANSACTION_FETCHED`, data: `{ data: Transaction[], total: number }`.

---

### GET `/transactions/:id`

Chỉ trả transaction thuộc về user hiện tại.

**Lỗi:** `404 TRANSACTION_NOT_FOUND`.
**Success:** `200` — `TRANSACTION_FETCHED`.

---

### DELETE `/transactions/:id`

Xoá transaction và **đảo ngược** hiệu ứng balance đã áp dụng trước đó (`deleteDeltas`).

**Lỗi:** `404 TRANSACTION_NOT_FOUND`.
**Success:** `200` — `TRANSACTION_DELETED`.

---

## Tham chiếu code

| Vùng | File |
| --- | --- |
| Wallet validation/DTO | `src/packages/entities/wallet/wallet.schema.ts`, `wallet.dto.ts` |
| Wallet logic | `src/features/wallet/wallet.service.ts`, `wallet.repository.ts` |
| Transaction validation/DTO | `src/packages/entities/transactions/transaction.schema.ts`, `transaction.dto.ts` |
| Transaction logic | `src/features/transaction/transaction.service.ts`, `transaction.repository.ts` |
| Balance math (pure, unit-tested) | `src/features/transaction/transaction.balance.ts` |
| Error/success messages | `src/data/constants/messages.constant.ts` |
