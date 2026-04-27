import { pgTable, uuid, text, varchar, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN', 'MODERATOR']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
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
