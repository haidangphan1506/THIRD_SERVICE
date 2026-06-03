# Seed Data Patterns

## Seed scripts

Seed scripts live in `scripts/` and run via Bun (not Drizzle):

```bash
bun run db:seed:user          # Single user
bun run db:seed:users-bulk    # Bulk users
```

## Seed script conventions

- Top-level `main()` with `.catch()` for error handling
- Duplicate the `resolveDatabaseUrl()` logic (same as `drizzle.config.ts`)
- Create own `postgres` client + Drizzle instance (not using NestJS DI)
- Clean up with `client.end({ timeout: 5 })` on success/exit

## Pattern

```ts
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/database/schema';

function resolveDatabaseUrl(): string {
  // Same logic as drizzle.config.ts
}

async function main(): Promise<void> {
  const url = resolveDatabaseUrl();
  const client = postgres(url);
  const db = drizzle(client, { schema });

  // seed logic...

  await client.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```
