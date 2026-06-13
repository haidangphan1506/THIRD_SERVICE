import { z } from 'zod';

export const transactionTypeEnum = z.enum(['DEBIT', 'CREDIT']);
export const transactionStatusEnum = z.enum(['PENDING', 'COMPLETED', 'CANCELLED']);

export const createTransactionSchema = z.object({
  name: z.string({ message: 'Name is required' }).min(1, { message: 'Name is required' }),
  userId: z
    .string({ message: 'User ID is required' })
    .uuid({ message: 'User ID is invalid' })
    .optional(),
  walletId: z
    .string({ message: 'Wallet ID is required' })
    .uuid({ message: 'Wallet ID is invalid' }),
  categoryId: z
    .string({ message: 'Category ID is required' })
    .uuid({ message: 'Category ID is invalid' }),
  amount: z.number({ message: 'Amount is required' }).positive({ message: 'Amount is required' }),
  note: z.string({ message: 'Note is required' }).optional(),
  type: z.enum(['INCOME', 'EXPENSE'], { message: 'Type is required' }),
  status: z
    .enum(['PENDING', 'COMPLETED', 'CANCELLED'], { message: 'Status is required' })
    .default('COMPLETED')
    .optional(),
});

// Partial schema for PUT /transactions/:id (userId is taken from the JWT, never the body)
export const updateTransactionSchema = createTransactionSchema.partial().omit({ userId: true });

// Query schema for GET /transactions (filters + pagination). Values arrive as strings.
export const getTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  search: z.string().trim().min(1).optional(),
  walletId: z.string().uuid({ message: 'Wallet ID is invalid' }).optional(),
  categoryId: z.string().uuid({ message: 'Category ID is invalid' }).optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
