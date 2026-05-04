/**
 * One-off user seed. Usage:
 *   SEED_EMAIL=you@example.com SEED_PASSWORD='your-pass' bun scripts/seed-user.ts
 * Optional: SEED_FIRST_NAME, SEED_LAST_NAME (default User / Account)
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { eq, ilike } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/database/schema';
import { users } from '../src/database/schema';
import { hashData } from '../src/packages/helpers/hashingData.helper';

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

async function main(): Promise<void> {
  const email = process.env.SEED_EMAIL?.trim();
  const password = process.env.SEED_PASSWORD ?? '';
  const firstName = process.env.SEED_FIRST_NAME?.trim() || 'User';
  const lastName = process.env.SEED_LAST_NAME?.trim() || 'Account';

  if (!email || password.length < 6) {
    console.error('Set SEED_EMAIL and SEED_PASSWORD (min 6 characters).');
    process.exit(1);
  }

  const url = resolveDatabaseUrl();
  const client = postgres(url);
  const db = drizzle(client, { schema });

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(ilike(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    console.log('User already exists:', email);
    await client.end({ timeout: 5 });
    return;
  }

  const username = email.split('@')[0] ?? 'user';
  const usernameTaken = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (usernameTaken.length > 0) {
    console.error('Username already taken:', username);
    process.exit(1);
  }

  const hashedPassword = await hashData(password);
  const id = randomUUID();
  await db.insert(users).values({
    id,
    email,
    username,
    firstName,
    lastName,
    password: hashedPassword,
  });

  console.log('Created user:', email, '(username:', username + ')');
  await client.end({ timeout: 5 });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
