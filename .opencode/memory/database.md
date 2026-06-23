---
description: Database schema, tables, enums, and migration workflow.
---

# Database

## ORM
- **Drizzle ORM** with `postgres.js` driver
- Single schema file: `src/database/schema.ts`
- Injection token: `'DRIZZLE'` (string token, inject with `@Inject('DRIZZLE')`)

## Tables

| Table | PK | Key columns |
|-------|----|-------------|
| `users` | `uuid` | email (unique), username (unique), password, firstName, lastName, role (enum), isActive |
| `categories` | `uuid` | name, type (INCOME/EXPENSE), parentId (self-ref FK), icon, color |
| `wallets` | `uuid` | userId (FK→users), name, type, currency, balance, isDefault |
| `transactions` | `uuid` | userId (FK), walletId (FK), categoryId (FK), amount, type, status |

## Enums

| Enum | Values |
|------|--------|
| `user_role` | STUDENT, ADMIN, TUTOR, PARENT |
| `category_type` | INCOME, EXPENSE |
| `wallet_type` | CASH, BANK, E_WALLET, CREDIT |
| `transaction_type` | INCOME, EXPENSE |
| `transaction_status` | PENDING, COMPLETED, CANCELLED |

## Migration Workflow

```bash
# After editing src/database/schema.ts:
bun run db:generate   # Creates SQL in drizzle/
bun run db:migrate    # Applies to database
bun run db:push       # Dev only — skips migration review
```

## DB URL Resolution
- `DATABASE_URL` env var used if set
- Otherwise built from: `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- Default ports: DB on 5433 (host), Redis on 6380
