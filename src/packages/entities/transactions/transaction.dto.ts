import { createTransactionSchema } from './transaction.schema';
import { z } from 'zod';

export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionDto = Partial<CreateTransactionDto>;
