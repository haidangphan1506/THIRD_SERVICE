import {
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionsQuerySchema,
} from './transaction.schema';
import { z } from 'zod';

export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionDto = z.infer<typeof updateTransactionSchema>;
export type GetTransactionsQueryDto = z.infer<typeof getTransactionsQuerySchema>;
