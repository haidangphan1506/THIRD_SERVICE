import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  pgEnum,
  uniqueIndex,
  index,
  type AnyPgColumn,
  numeric,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN', 'MODERATOR', 'TUTOR']);
export const categoryTypeEnum = pgEnum('category_type', ['INCOME', 'EXPENSE']);
export const walletTypeEnum = pgEnum('wallet_type', ['CASH', 'BANK', 'E_WALLET', 'CREDIT']);
export const transactionTypeEnum = pgEnum('transaction_type', ['INCOME', 'EXPENSE']);
export const transactionStatusEnum = pgEnum('transaction_status', [
  'PENDING',
  'COMPLETED',
  'CANCELLED',
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  userCode: varchar('userCode', { length: 6 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  password: text('password').notNull(),
  avatar: text('avatar'),
  phone: varchar('phone', { length: 20 }),
  isActive: boolean('is_active').default(true),
  role: userRoleEnum('role').default('USER'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    type: categoryTypeEnum('type').notNull(),
    parentId: uuid('parent_id').references((): AnyPgColumn => categories.id, {
      onDelete: 'set null',
    }),
    icon: varchar('icon', { length: 50 }),
    color: varchar('color', { length: 7 }).default('#FFFFFF'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('categories_name_type_parent_unique').on(table.name, table.type, table.parentId),
  ],
);

export const wallets = pgTable(
  'wallets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
      }),
    name: varchar('name', { length: 100 }).notNull(),
    type: walletTypeEnum('type').notNull().default('CASH'),
    currency: varchar('currency', { length: 3 }).notNull().default('VND'),
    categoriesId: uuid('categories_id').array().notNull().default([]),
    balance: numeric('balance', { precision: 14, scale: 2 }).notNull().default('0'),
    note: text('note'),
    isDefault: boolean('is_default').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('wallets_user_name_unique').on(table.userId, table.name)],
);

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
      }),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id, {
        onDelete: 'cascade',
      }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, {
        onDelete: 'cascade',
      }),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    note: text('note'),
    type: transactionTypeEnum('type').notNull(),
    status: transactionStatusEnum('status').notNull().default('COMPLETED'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('transactions_user_id_idx').on(table.userId),
    index('transactions_wallet_id_idx').on(table.walletId),
    index('transactions_category_id_idx').on(table.categoryId),
    index('transactions_created_at_idx').on(table.createdAt),
  ],
);
