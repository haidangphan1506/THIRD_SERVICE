import { z } from 'zod';
import { createTuitionSchema, getTuitionsQuerySchema } from './tuition.schema';

export type CreateTuitionDto = z.infer<typeof createTuitionSchema>;
export type UpdateTuitionDto = Partial<z.infer<typeof createTuitionSchema>>;
export type GetTuitionsQueryDto = z.infer<typeof getTuitionsQuerySchema>;

export type TuitionSummaryDto = {
  totalPaid: number;
  totalUnpaid: number;
  totalOverdue: number;
  totalRevenue: number;
};
