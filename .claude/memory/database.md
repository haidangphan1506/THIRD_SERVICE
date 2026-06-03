# Database

- **Drizzle ORM** with `postgres.js` driver
- Single schema file: `src/database/schema.ts`
- Injection token string: `'DRIZZLE'`
- All modules can inject `@Inject('DRIZZLE')`

## Tables

| Table | PK | Key columns |
|---|---|---|
| `users` | `uuid` | email (unique), username (unique), password, role (enum), isActive |
| `categories` | `uuid` | name, type (INCOME/EXPENSE), parentId (self-ref), icon, color |
| `wallets` | `uuid` | userId (FK users), name, type, currency, balance, isDefault |
| `transactions` | `uuid` | userId (FK), walletId (FK), categoryId (FK), amount, type, status |

## Enums

- `user_role`: USER, ADMIN, MODERATOR
- `category_type`: INCOME, EXPENSE
- `wallet_type`: CASH, BANK, E_WALLET, CREDIT
- `transaction_type`: INCOME, EXPENSE
- `transaction_status`: PENDING, COMPLETED, CANCELLED

## Migrations

```bash
# After editing schema.ts
bun run db:generate   # Output to drizzle/
bun run db:migrate    # Apply
bun run db:push       # Dev only, skip review
```

## DB URL resolution

`DATABASE_URL` → if empty, built from `POSTGRES_HOST/PORT/DB/USER/PASSWORD` vars.
