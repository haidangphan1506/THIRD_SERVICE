/**
 * Seed default top-level categories. Usage:
 *   bun scripts/seed-categories.ts
 * Safe to re-run — existing (name, type, parentId) combinations are skipped.
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/database/schema';
import { categories } from '../src/database/schema';

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

const DEFAULT_CATEGORIES: { name: string; type: 'EXPENSE' | 'INCOME'; color: string }[] = [
  { name: 'Food', type: 'EXPENSE', color: '#F97316' },
  { name: 'Transport', type: 'EXPENSE', color: '#3B82F6' },
  { name: 'Shopping', type: 'EXPENSE', color: '#EC4899' },
  { name: 'Bills & Utilities', type: 'EXPENSE', color: '#EAB308' },
  { name: 'Housing', type: 'EXPENSE', color: '#8B5CF6' },
  { name: 'Entertainment', type: 'EXPENSE', color: '#06B6D4' },
  { name: 'Health', type: 'EXPENSE', color: '#EF4444' },
  { name: 'Education', type: 'EXPENSE', color: '#10B981' },
  { name: 'Other', type: 'EXPENSE', color: '#6B7280' },
  { name: 'Salary', type: 'INCOME', color: '#22C55E' },
  { name: 'Bonus', type: 'INCOME', color: '#84CC16' },
  { name: 'Investment', type: 'INCOME', color: '#14B8A6' },
  { name: 'Gift', type: 'INCOME', color: '#F59E0B' },
  { name: 'Other', type: 'INCOME', color: '#6B7280' },
];

async function main(): Promise<void> {
  const url = resolveDatabaseUrl();
  const client = postgres(url);
  const db = drizzle(client, { schema });

  const inserted = await db
    .insert(categories)
    .values(DEFAULT_CATEGORIES)
    .onConflictDoNothing({ target: [categories.name, categories.type, categories.parentId] })
    .returning({ name: categories.name, type: categories.type });

  const skipped = DEFAULT_CATEGORIES.length - inserted.length;
  console.log(`Inserted ${inserted.length} categor${inserted.length === 1 ? 'y' : 'ies'}; skipped ${skipped} (already exist).`);
  if (inserted.length > 0) {
    console.log(inserted.map((c) => `${c.name} (${c.type})`).join(', '));
  }

  await client.end({ timeout: 5 });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
