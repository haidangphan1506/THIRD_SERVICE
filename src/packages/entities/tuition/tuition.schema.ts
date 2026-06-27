import { z } from 'zod';

export const tuitionStatusEnum = z.enum(['PAID', 'UNPAID', 'OVERDUE']);

export const createTuitionSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  studentId: z.string().uuid('Invalid student ID'),
  amount: z.coerce.number({ message: 'Amount is required' }).min(0, 'Amount must be positive'),
  dueDate: z.coerce.date().optional(),
  paidDate: z.coerce.date().optional(),
  status: tuitionStatusEnum.default('UNPAID').optional(),
  note: z.string().optional(),
});

export const updateTuitionSchema = createTuitionSchema
  .partial()
  .omit({ classId: true, studentId: true });

export const getTuitionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  classId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  status: tuitionStatusEnum.optional(),
});
