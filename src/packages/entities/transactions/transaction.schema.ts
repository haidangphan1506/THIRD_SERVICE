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
