import { z } from 'zod';

export const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required').max(4000, 'Message too long'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      }),
    )
    .optional()
    .default([]),
});
