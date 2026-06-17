/**
 * Create a single wallet for an existing user. Usage:
 *   SEED_WALLET_EMAIL=user@example.com bun scripts/seed-wallet.ts
 * Optional:
 *   SEED_WALLET_NAME (default 'Cash')
 *   SEED_WALLET_TYPE (CASH | BANK | E_WALLET | CREDIT, default CASH)
 *   SEED_WALLET_CURRENCY (default VND)
 *   SEED_WALLET_BALANCE (default 0)
 *   SEED_WALLET_IS_DEFAULT (default true)
 */
import 'dotenv/config';
import { and, eq, ilike } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/database/schema';
import { users, wallets } from '../src/database/schema';

function resolveDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    return databaseUrl;
  }

  const host = process.env.POSTGRES_HOST?.trim() || 'localhost';
  const port = process.env.POSTGRES_PORT?.trim() || '5433';
  const db = process.env.POSTGRES_DB?.trim() || 'backends_db';
  const user = process.env.POSTGRES_USER?.trim() || 'postgres';
  const password = process.env.POSTGRES_PASSWORD?.trim() || 'postgres';

  const url = new URL(`postgres://${host}:${port}/${db}`);
  url.username = user;
  url.password = password;
  return url.toString();
}

const WALLET_TYPES = ['CASH', 'BANK', 'E_WALLET', 'CREDIT'] as const;

async function main(): Promise<void> {
  const email = process.env.SEED_WALLET_EMAIL?.trim();
  if (!email) {
    console.error('Set SEED_WALLET_EMAIL to the target user email.');
    process.exit(1);
  }

  const name = process.env.SEED_WALLET_NAME?.trim() || 'Cash';
  const type = (process.env.SEED_WALLET_TYPE?.trim() || 'CASH') as (typeof WALLET_TYPES)[number];
  if (!WALLET_TYPES.includes(type)) {
    console.error(`SEED_WALLET_TYPE must be one of: ${WALLET_TYPES.join(', ')}`);
    process.exit(1);
  }
  const currency = process.env.SEED_WALLET_CURRENCY?.trim() || 'VND';
  const balance = process.env.SEED_WALLET_BALANCE?.trim() || '0';
  const isDefault = (process.env.SEED_WALLET_IS_DEFAULT?.trim() ?? 'true') === 'true';

  const url = resolveDatabaseUrl();
  const client = postgres(url);
  const db = drizzle(client, { schema });

  const [user] = await db.select({ id: users.id }).from(users).where(ilike(users.email, email)).limit(1);
  if (!user) {
    console.error('No user found with email:', email);
    await client.end({ timeout: 5 });
    process.exit(1);
  }

  const [existing] = await db
    .select({ id: wallets.id })
    .from(wallets)
    .where(and(eq(wallets.userId, user.id), eq(wallets.name, name)))
    .limit(1);
  if (existing) {
    console.log(`Wallet "${name}" already exists for ${email}; nothing to insert.`);
    await client.end({ timeout: 5 });
    return;
  }

  const [wallet] = await db
    .insert(wallets)
    .values({
      userId: user.id,
      name,
      type,
      currency,
      balance,
      isDefault,
    })
    .returning();

  console.log(`Created wallet "${wallet.name}" (${wallet.type}, ${wallet.currency} ${wallet.balance}) for ${email}.`);
  await client.end({ timeout: 5 });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
