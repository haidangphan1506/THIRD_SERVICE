import { z } from 'zod';

/** Shared date-range filter for report endpoints (values arrive as strings). */
export const reportRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const reportByCategorySchema = reportRangeSchema.extend({
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
});

export const reportTrendSchema = reportRangeSchema.extend({
  granularity: z.enum(['day', 'week', 'month']).optional().default('month'),
});
