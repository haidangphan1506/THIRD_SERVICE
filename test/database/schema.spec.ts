import { getTableConfig } from 'drizzle-orm/pg-core';
import {
  userRoleEnum,
  categoryTypeEnum,
  walletTypeEnum,
  transactionTypeEnum,
  transactionStatusEnum,
  users,
  categories,
  wallets,
  transactions,
} from 'src/database/schema';

describe('Database Schema — Enums', () => {
  it('userRoleEnum has correct values', () => {
    expect(userRoleEnum.enumValues).toEqual(['ADMIN', 'TUTOR', 'PARENT', 'STUDENT']);
  });

  it('categoryTypeEnum has correct values', () => {
    expect(categoryTypeEnum.enumValues).toEqual(['INCOME', 'EXPENSE']);
  });

  it('walletTypeEnum has correct values', () => {
    expect(walletTypeEnum.enumValues).toEqual(['CASH', 'BANK', 'E_WALLET', 'CREDIT']);
  });

  it('transactionTypeEnum has correct values', () => {
    expect(transactionTypeEnum.enumValues).toEqual(['INCOME', 'EXPENSE']);
  });

  it('transactionStatusEnum has correct values', () => {
    expect(transactionStatusEnum.enumValues).toEqual(['PENDING', 'COMPLETED', 'CANCELLED']);
  });
});

describe('Database Schema — users table', () => {
  it('has correct table name', () => {
    expect(getTableConfig(users).name).toBe('users');
  });

  it('has all required columns', () => {
    const cols = getTableConfig(users).columns.map((c) => c.name);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'email',
        'username',
        'first_name',
        'last_name',
        'password',
        'avatar',
        'phone',
        'is_active',
        'role',
        'created_at',
        'updated_at',
      ]),
    );
  });

  it('email column is unique and not null', () => {
    const emailCol = getTableConfig(users).columns.find((c) => c.name === 'email');
    expect(emailCol).toBeDefined();
    expect(emailCol!.isUnique).toBe(true);
    expect(emailCol!.notNull).toBe(true);
  });

  it('id column is primary key', () => {
    const idCol = getTableConfig(users).columns.find((c) => c.name === 'id');
    expect(idCol).toBeDefined();
    expect(idCol!.primary).toBe(true);
  });
});

describe('Database Schema — categories table', () => {
  it('has correct table name', () => {
    expect(getTableConfig(categories).name).toBe('categories');
  });

  it('has all required columns', () => {
    const cols = getTableConfig(categories).columns.map((c) => c.name);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'name',
        'type',
        'parent_id',
        'icon',
        'color',
        'created_at',
        'updated_at',
      ]),
    );
  });

  it('has unique index on name + type + parent_id', () => {
    const { indexes } = getTableConfig(categories);
    const configs = indexes.map((i: any) => i.config ?? i);
    const uniqueIdx = configs.find((c: any) => c.name === 'categories_name_type_parent_unique');
    expect(uniqueIdx).toBeDefined();
    expect(uniqueIdx.isUnique ?? uniqueIdx.unique).toBe(true);
  });

  it('parentId has a self-referential FK to categories.id with onDelete set null', () => {
    const { foreignKeys } = getTableConfig(categories);
    expect(foreignKeys.length).toBeGreaterThanOrEqual(1);
    const fk = foreignKeys[0];
    const ref = fk.reference();
    expect(ref.columns.map((c: any) => c.name)).toContain('parent_id');
    expect(ref.foreignColumns[0].name).toBe('id');
    expect(ref.foreignTable).toBe(categories);
    expect(fk.onDelete).toBe('set null');
  });
});

describe('Database Schema — wallets table', () => {
  it('has correct table name', () => {
    expect(getTableConfig(wallets).name).toBe('wallets');
  });

  it('has all required columns', () => {
    const cols = getTableConfig(wallets).columns.map((c) => c.name);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'user_id',
        'name',
        'type',
        'currency',
        'categories_id',
        'balance',
        'note',
        'is_default',
        'is_active',
        'created_at',
        'updated_at',
      ]),
    );
  });

  it('user_id column is not null', () => {
    const userIdCol = getTableConfig(wallets).columns.find((c) => c.name === 'user_id');
    expect(userIdCol).toBeDefined();
    expect(userIdCol!.notNull).toBe(true);
  });

  it('has unique index on user_id + name', () => {
    const { indexes } = getTableConfig(wallets);
    const configs = indexes.map((i: any) => i.config ?? i);
    const uniqueIdx = configs.find((c: any) => c.name === 'wallets_user_name_unique');
    expect(uniqueIdx).toBeDefined();
    expect(uniqueIdx.isUnique ?? uniqueIdx.unique).toBe(true);
  });

  it('userId FK references users.id with onDelete cascade', () => {
    const { foreignKeys } = getTableConfig(wallets);
    const fk = foreignKeys.find((f) =>
      f.reference().columns.some((c: any) => c.name === 'user_id'),
    );
    expect(fk).toBeDefined();
    const ref = fk!.reference();
    expect(ref.foreignTable).toBe(users);
    expect(ref.foreignColumns[0].name).toBe('id');
    expect(fk!.onDelete).toBe('cascade');
  });
});

describe('Database Schema — transactions table', () => {
  it('has correct table name', () => {
    expect(getTableConfig(transactions).name).toBe('transactions');
  });

  it('has all required columns', () => {
    const cols = getTableConfig(transactions).columns.map((c) => c.name);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'name',
        'user_id',
        'wallet_id',
        'category_id',
        'amount',
        'note',
        'type',
        'status',
        'created_at',
        'updated_at',
      ]),
    );
  });

  it('amount column is not null', () => {
    const amountCol = getTableConfig(transactions).columns.find((c) => c.name === 'amount');
    expect(amountCol).toBeDefined();
    expect(amountCol!.notNull).toBe(true);
  });

  it('has indexes on user_id, wallet_id, category_id, and created_at', () => {
    const { indexes } = getTableConfig(transactions);
    const names = indexes.map((i: any) => (i.config ?? i).name);
    expect(names).toEqual(
      expect.arrayContaining([
        'transactions_user_id_idx',
        'transactions_wallet_id_idx',
        'transactions_category_id_idx',
        'transactions_created_at_idx',
      ]),
    );
  });

  it('userId FK references users.id with onDelete cascade', () => {
    const { foreignKeys } = getTableConfig(transactions);
    const fk = foreignKeys.find((f) =>
      f.reference().columns.some((c: any) => c.name === 'user_id'),
    );
    expect(fk).toBeDefined();
    const ref = fk!.reference();
    expect(ref.foreignTable).toBe(users);
    expect(ref.foreignColumns[0].name).toBe('id');
    expect(fk!.onDelete).toBe('cascade');
  });

  it('walletId FK references wallets.id with onDelete cascade', () => {
    const { foreignKeys } = getTableConfig(transactions);
    const fk = foreignKeys.find((f) =>
      f.reference().columns.some((c: any) => c.name === 'wallet_id'),
    );
    expect(fk).toBeDefined();
    const ref = fk!.reference();
    expect(ref.foreignTable).toBe(wallets);
    expect(ref.foreignColumns[0].name).toBe('id');
    expect(fk!.onDelete).toBe('cascade');
  });

  it('categoryId FK references categories.id with onDelete cascade', () => {
    const { foreignKeys } = getTableConfig(transactions);
    const fk = foreignKeys.find((f) =>
      f.reference().columns.some((c: any) => c.name === 'category_id'),
    );
    expect(fk).toBeDefined();
    const ref = fk!.reference();
    expect(ref.foreignTable).toBe(categories);
    expect(ref.foreignColumns[0].name).toBe('id');
    expect(fk!.onDelete).toBe('cascade');
  });
});
