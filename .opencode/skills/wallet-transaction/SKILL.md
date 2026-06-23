---
name: wallet-transaction
description: Use when working with wallet or transaction modules — CRUD, balance math, DTO/schema patterns, and error handling.
---

# Wallet & Transaction Patterns

## Data flow

```
Controller (Zod schema validates body/query)
  → Service (business logic, user/wallet/category assertions)
  → Repository (Drizzle queries)
  → DB + balance update in same transaction
```

## DTO/Schema pattern

Schemas in `src/packages/entities/{domain}/{domain}.schema.ts`, types in `*.dto.ts`:

```ts
// schema.ts — Zod validation
export const createTransactionSchema = z.object({
  name: z.string().min(1),
  walletId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amount: z.number().positive(),
  note: z.string().optional(),
  type: z.enum(['INCOME', 'EXPENSE']),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).default('COMPLETED').optional(),
});

// Partial for updates
export const updateTransactionSchema = createTransactionSchema.partial().omit({ userId: true });

// Query with string coercion
export const getTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  search: z.string().trim().min(1).optional(),
  walletId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
```

```ts
// dto.ts — inferred TS types
export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionDto = z.infer<typeof updateTransactionSchema>;
export type GetTransactionsQueryDto = z.infer<typeof getTransactionsQuerySchema>;
```

Wallet alias support: `pageSize` is aliased to `limit` via `z.preprocess` in `getWalletsQuerySchema`.

## Error & success messages

Import from `src/data/constants`:

```ts
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from 'src/data/constants';

throw new NotFoundException(ERROR_MESSAGES.WALLET_NOT_EXISTS);
throw new ConflictException(ERROR_MESSAGES.WALLET_NAME_EXISTS);
```

## Service assertion pattern

```ts
private async assertUserExists(userId: string) {
  if (!userId || !UUID_V4_REGEX.test(userId)) {
    throw new NotFoundException(ERROR_MESSAGES.USER_ID_NOT_FOUND);
  }
  const userData = await this.userService.getUserByField({ field: 'id', value: userId });
  if (!userData || (Array.isArray(userData) && userData.length === 0)) {
    throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
  }
}
```

Always validate UUID before DB lookup using `UUID_V4_REGEX`.

## Balance math (`transaction.balance.ts`)

Pure functions, no DB dependency — easily unit-testable:

```ts
balanceEffect(type, amount, status): number   // ±amount or 0
createDeltas(next): { walletId, delta }[]     // deltas for new transaction
updateDeltas(prev, next): { walletId, delta }[] // deltas for edit (handles wallet change, amount, type, status)
deleteDeltas(prev): { walletId, delta }[]     // reverse deltas for delete
```

- Only `COMPLETED` status affects balance: INCOME adds (+), EXPENSE subtracts (-).
- Apply deltas in a DB transaction (`this.db.transaction(...)`) with wallet update.

## Repository Drizzle patterns

```ts
@Injectable()
export class TransactionRepository {
  constructor(@Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>) {}

  async create(userId: string, data: CreateTransactionDto) {
    return await this.db.transaction(async (tx) => {
      const [txn] = await tx.insert(transactions).values({ ...data, userId }).returning();
      const deltas = createDeltas({ ...txn, amount: Number(txn.amount) });
      for (const d of deltas) {
        await tx.update(wallets).set({ balance: sql`${wallets.balance} + ${d.delta}` }).where(eq(wallets.id, d.walletId));
      }
      return txn;
    });
  }
}
```

Use `sql` template literal for arithmetic on `numeric` columns:
```ts
sql`${wallets.balance} + ${d.delta}`
```

## Wallet unique constraint

Unique index `(userId, name)` — check with `ConflictException` before insert.
